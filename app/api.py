import os
import sys
import io
import cv2
import numpy as np

# Fix encodage Windows (cp1252 ne supporte pas les caractères Unicode des barres de progression EasyOCR)
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from ocr_core import LecteurManuscrit

app = FastAPI(title="OCR Manuscrit API Professionnelle")

origins=os.getenv("CORS_ORIGINS" , "https://orc-api.onrender.com")
# Permettre à Next.js (port 3000) de communiquer avec l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lecteur global (singleton) chargé de manière asynchrone / paresseuse
lecteur = None

def get_lecteur():
    global lecteur
    if lecteur is None:
        print("Chargement du modèle d'Intelligence Artificielle... (Patientez quelques instants)")
        lecteur = LecteurManuscrit(langues=["fr", "en"])
        print("Modèle prêt.")
    return lecteur

@app.get("/", response_class=HTMLResponse)
async def get_index():
    # Sert le fichier index.html comme interface principale
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()
    return "Fichier index.html introuvable. Placez-le dans le dossier app/."

@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    pretraitement: bool = Form(True)
):
    current_lecteur = get_lecteur()
    
    # 1. Lire les bytes du fichier uploadé
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 2. Récupérer les dimensions pour la synchronisation Image/Texte dans l'interface web
    h, w = image.shape[:2]
    
    # 3. Lancer l'IA OCR
    resultat = current_lecteur.lire_depuis_tableau(image, appliquer_pretraitement=pretraitement)
    
    # 4. Reconstruire le tableau (Analyse spatiale)
    matrice = resultat.reconstruire_tableau()
    
    # 5. Préparer les données pour le Frontend (JSON)
    lignes_json = []
    for i, ligne in enumerate(resultat.lignes):
        lignes_json.append({
            "id": i,
            "texte": ligne.texte,
            "confiance": float(ligne.confiance),
            # Conversion des points numpy/int en float standard pour JSON
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
    # Point d'entrée pour lancer le serveur API complet
    print("Démarrage du serveur web sur http://localhost:8000")
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
