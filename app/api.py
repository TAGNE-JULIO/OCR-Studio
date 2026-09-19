"""
api.py — Serveur FastAPI OCR Studio
Moteur : HybrideOCR (OpenAI GPT-4o Vision) en priorite, EasyOCR en secours.
"""

import os
import sys
import io
import cv2
import numpy as np

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
        print("[API] Initialisation du moteur OCR Hybride...")
        moteur = HybrideOCR()
        if moteur.est_configure():
            print("[API] Moteur HYBRIDE actif (OpenAI GPT-4o Vision).")
            _lecteur = moteur
        else:
            # Fallback EasyOCR si OpenAI non configure
            print("[API] Cle OpenAI manquante. Chargement EasyOCR local...")
            try:
                try:
                    import torch
                    torch.set_num_threads(os.cpu_count() or 4)
                except Exception:
                    pass
                from ocr_core import LecteurManuscrit
                _lecteur = LecteurManuscrit(langues=["fr", "en"])
                print("[API] EasyOCR pret.")
            except Exception as e:
                print(f"[API] Impossible de charger le moteur local EasyOCR: {e}")
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
    return {"status": "ok", "engine": "hybrid-gpt4o"}


@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    pretraitement: bool = Form(True)
):
    lecteur = get_lecteur()

    # Lire les bytes
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return {"success": False, "error": "Impossible de decoder l'image."}

    h, w = image.shape[:2]

    # Lancer l'OCR
    resultat = lecteur.lire_depuis_tableau(image, appliquer_pretraitement=pretraitement)

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
