"""
api.py — Serveur FastAPI OCR Studio
Moteur : HybrideOCR (OpenAI GPT-4o Vision) en priorite, EasyOCR en secours.
"""

import os
import sys
import io
import cv2
import numpy as np
import time
import hashlib
from functools import lru_cache

# Configurable maximum dimension for resizing (default 1024px)
MAX_DIM = int(os.getenv("OCR_MAX_DIM", "1024"))

# Fix encodage Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# OpenCV multithread
cv2.setNumThreads(os.cpu_count() or 4)
# Ajouter le dossier courant au PYTHONPATH pour les imports internes
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from ocr_hybrid import HybrideOCR

app = FastAPI(title="OCR Studio — Moteur IA Hybride")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton moteur
_lecteur = None

def get_lecteur():
    global _lecteur
    if _lecteur is None:
        openai_key = os.environ.get("OPENAI_API_KEY", "")
        print(f"[API] OPENAI_API_KEY presente: {bool(openai_key.startswith('sk-'))}")
        print(f"[API] GOOGLE_APPLICATION_CREDENTIALS: {os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '(absent)')}")

        moteur = HybrideOCR()
        if moteur.est_configure():
            print("[API] Moteur HYBRIDE actif (OpenAI GPT-4o Vision).")
            _lecteur = moteur
        else:
            # Sur Vercel Serverless, EasyOCR/PyTorch est impossible a charger.
            # On garde le moteur hybride non configure — il retournera une erreur claire.
            print("[API] AVERTISSEMENT: OPENAI_API_KEY absente ou invalide. Aucun moteur IA disponible.")
            _lecteur = moteur
    return _lecteur


@app.get("/", response_class=HTMLResponse)
async def get_index():
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()
    return "OCR Studio API — frontend sur http://localhost:3005"


@app.get("/health")
async def health():
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    return {
        "status": "ok",
        "engine": "hybrid-gpt4o",
        "openai_configured": openai_key.startswith("sk-"),
        "google_configured": bool(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", ""))
    }


@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    pretraitement: bool = Form(True)
):
    # Verifier la configuration avant tout traitement
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    if not openai_key.startswith("sk-"):
        print("[API] ERREUR: OPENAI_API_KEY non configuree dans les variables d'environnement Vercel.")
        return {
            "success": False,
            "error": (
                "Le moteur OCR n'est pas configure. "
                "Veuillez ajouter OPENAI_API_KEY dans les variables d'environnement "
                "du projet backend sur Vercel (Settings > Environment Variables)."
            )
        }

    lecteur = get_lecteur()

    # Lire les bytes
    contents = await file.read()
    print(f"[API] Image recue: {len(contents)} octets, fichier: {file.filename}")

    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return {"success": False, "error": "Impossible de decoder l'image. Format non supporte."}

    h, w = image.shape[:2]
    print(f"[API] Image decodee: {w}x{h} px")

    # Lancer l'OCR
    try:
        resultat = lecteur.lire_depuis_tableau(image, appliquer_pretraitement=pretraitement)
    except Exception as e:
        print(f"[API] ERREUR OCR: {e}")
        return {"success": False, "error": f"Erreur lors de l'analyse OCR: {str(e)}"}

    texte = resultat.texte_complet.strip()
    print(f"[API] Texte extrait: {len(texte)} caracteres. Debut: '{texte[:80]}'")

    # Retourner une erreur explicite si le texte est vide
    if not texte:
        return {
            "success": False,
            "error": (
                "Aucun texte detecte dans l'image. "
                "Verifiez que OPENAI_API_KEY est valide dans Vercel "
                "et que l'image contient du texte lisible."
            )
        }

    # Reconstruire tableau
    matrice = resultat.reconstruire_tableau()

    # Preparer JSON
    lignes_json = []
    for i, ligne in enumerate(resultat.lignes):
        lignes_json.append({
            "id": i,
            "texte": ligne.texte,
            "confiance": float(ligne.confiance),
            "boite": [[float(pt[0]), float(pt[1])] for pt in ligne.boite] if ligne.boite else None
        })

    return {
        "success": True,
        "image_width": w,
        "image_height": h,
        "texte_complet": resultat.texte_complet,
        "confiance_moyenne": float(resultat.confiance_moyenne),
        "lignes": lignes_json,
        "matrice": matrice
    }


if __name__ == "__main__":
    print("=" * 60)
    print("  OCR STUDIO — Serveur API")
    print("  http://localhost:8000")
    print("=" * 60)
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)
