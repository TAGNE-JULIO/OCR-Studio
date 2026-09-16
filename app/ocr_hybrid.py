"""
ocr_hybrid.py
--------------
Moteur OCR Hybride de derniere generation :
1. Google Cloud Vision pour la detection spatiale brute (optionnel)
2. OpenAI GPT-4o Vision pour la transcription parfaite contextuelle

Gere : texte, tableaux, formules mathematiques, graphiques.
Sortie : Markdown enrichi (tables Markdown + LaTeX pour les maths)
"""

import os
import base64
from typing import List
from dataclasses import dataclass, field
import numpy as np
import cv2

try:
    from image_processing import pretraiter_image
except ImportError:
    pretraiter_image = None

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

try:
    from google.cloud import vision
except ImportError:
    vision = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


# ============================================================
# STRUCTURES DE DONNEES (compatible avec ocr_core.py)
# ============================================================

@dataclass
class LigneReconnue:
    texte: str
    confiance: float
    boite: list = field(default_factory=list)


@dataclass
class ResultatOCR:
    lignes: List[LigneReconnue]
    image_pretraitee: np.ndarray

    @property
    def texte_complet(self) -> str:
        return "\n".join(ligne.texte for ligne in self.lignes)

    @property
    def confiance_moyenne(self) -> float:
        if not self.lignes:
            return 0.0
        return sum(l.confiance for l in self.lignes) / len(self.lignes)

    def reconstruire_tableau(self, tolerance_y: int = 25, tolerance_x: int = 60) -> List[List[str]]:
        # En mode hybride, le tableau est deja inclus dans le Markdown du texte_complet
        return []


# ============================================================
# MEGA-PROMPT EXPERT (tableaux + maths + graphiques)
# ============================================================

SYSTEM_PROMPT_EXPERT = (
    "You are an expert OCR engine with human-level understanding of all document types "
    "(handwritten, printed, mixed). You transcribe faithfully and perfectly. Follow these rules:\n\n"

    "## 1. PLAIN TEXT\n"
    "Transcribe exactly as written. Preserve paragraphs, line breaks, punctuation, and language "
    "(detect French, English, or any other language automatically).\n\n"

    "## 2. TABLES\n"
    "If you see a table (even handwritten), convert it to Markdown table format:\n"
    "| Header 1 | Header 2 | Header 3 |\n"
    "|----------|----------|----------|\n"
    "| value    | value    | value    |\n"
    "Align columns correctly. Preserve all cells (even empty ones with a space).\n\n"

    "## 3. MATHEMATICAL FORMULAS\n"
    "Use LaTeX notation:\n"
    "- Inline formula: $E = mc^2$\n"
    "- Block/display formula: $$\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)$$\n"
    "Transcribe EXACTLY: superscripts, subscripts, fractions (\\frac{}{}), "
    "square roots (\\sqrt{}), Greek letters, integrals, summations, matrices, etc.\n\n"

    "## 4. GRAPHS AND DIAGRAMS\n"
    "For any chart or diagram:\n"
    "- Label its type: [GRAPHIQUE: Courbe / Histogramme / Diagramme / Schema]\n"
    "- Describe axes and legend\n"
    "- List key data points or values visible in the graph\n"
    "- If it's a flowchart or conceptual diagram, describe the logic/structure\n\n"

    "## ABSOLUTE RULES\n"
    "1. Return ONLY the transcribed content. NO explanations, NO commentary, NO meta-text.\n"
    "2. Preserve the natural reading order of the document.\n"
    "3. When the document mixes text, tables, and formulas, transcribe them in their order of appearance.\n"
    "4. NEVER refuse to transcribe. If handwriting is unclear, do your best and transcribe anyway.\n"
    "5. For very light or hard-to-read text, infer from context but stay faithful to the image."
)


# ============================================================
# MOTEUR HYBRIDE
# ============================================================

class HybrideOCR:
    """
    Moteur OCR Hybride :
    - Si GOOGLE_APPLICATION_CREDENTIALS est defini  -> Phase 1 : Google Vision
    - Si OPENAI_API_KEY est defini                  -> Phase 2 : GPT-4o Vision (correction + enrichissement)
    - Fallback automatique si une cle manque
    """

    def __init__(self):
        self.google_client = None
        self.openai_client = None

        # --- Google Cloud Vision ---
        creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
        if creds_path and os.path.exists(creds_path) and vision is not None:
            try:
                self.google_client = vision.ImageAnnotatorClient()
                print("[HybrideOCR] Google Cloud Vision : OK")
            except Exception as e:
                print(f"[HybrideOCR] Google Cloud Vision non disponible : {e}")

        # --- OpenAI ---
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if api_key.startswith("sk-") and OpenAI is not None:
            try:
                self.openai_client = OpenAI(api_key=api_key)
                print("[HybrideOCR] OpenAI GPT-4o : OK")
            except Exception as e:
                print(f"[HybrideOCR] OpenAI non disponible : {e}")

    def est_configure(self) -> bool:
        """Retourne True si au moins un moteur IA est disponible."""
        return self.google_client is not None or self.openai_client is not None

    # ------------------------------------------------------------------ #
    #  ETAPE 1 : Google Vision (texte brut + layout)                      #
    # ------------------------------------------------------------------ #
    def _google_ocr(self, image_bytes: bytes) -> str:
        if not self.google_client:
            return ""
        img = vision.Image(content=image_bytes)
        response = self.google_client.document_text_detection(image=img)
        if response.error.message:
            print(f"[Google Vision] Erreur : {response.error.message}")
            return ""
        return response.full_text_annotation.text or ""

    # ------------------------------------------------------------------ #
    #  ETAPE 2 : OpenAI GPT-4o Vision (transcription parfaite)           #
    # ------------------------------------------------------------------ #
    def _openai_transcribe(self, image_b64: str, texte_brouillon: str) -> str:
        if not self.openai_client:
            return texte_brouillon

        if texte_brouillon.strip():
            user_msg = (
                "Here is a preliminary OCR draft extracted automatically:\n\n"
                + texte_brouillon
                + "\n\nUse this draft as a guide, but always trust the image as the source of truth. "
                "Correct all errors, reconstruct tables in Markdown, render math in LaTeX. "
                "Return ONLY the perfect final text."
            )
        else:
            user_msg = (
                "Transcribe this document image completely and perfectly. "
                "Detect and handle text, tables (Markdown), mathematical formulas (LaTeX), "
                "and graphs/diagrams. Return ONLY the transcribed content."
            )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_EXPERT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_msg},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_b64}",
                                    "detail": "high"   # Resolution max pour les formules et tableaux
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4096,
                temperature=0.0
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[HybrideOCR] OpenAI indisponible ({e}). Bascule vers moteur de secours local...")
            return texte_brouillon

    # ------------------------------------------------------------------ #
    #  MOTEUR DE SECOURS LOCAL (EasyOCR + Correction Lexicale)          #
    # ------------------------------------------------------------------ #
    def _get_local_engine(self):
        if not hasattr(self, '_local_engine') or self._local_engine is None:
            try:
                from ocr_core import LecteurManuscrit
                self._local_engine = LecteurManuscrit(langues=["fr", "en"])
            except Exception as e:
                print(f"[HybrideOCR] Erreur initialisation moteur local : {e}")
                self._local_engine = None
        return self._local_engine

    # ------------------------------------------------------------------ #
    #  PIPELINE PRINCIPAL                                                  #
    # ------------------------------------------------------------------ #
    def _pipeline(self, image_cv2: np.ndarray, appliquer_pretraitement: bool = False) -> ResultatOCR:
        # Appliquer le pretraitement de grade militaire si demande
        image_to_process = image_cv2
        if appliquer_pretraitement and pretraiter_image is not None:
            try:
                image_to_process = pretraiter_image(image_cv2)
            except Exception as e:
                print(f"[HybrideOCR] Erreur pretraitement : {e}")
                image_to_process = image_cv2
            
        # Encoder l'image
        _, encoded = cv2.imencode('.jpg', image_to_process, [cv2.IMWRITE_JPEG_QUALITY, 95])
        image_bytes = encoded.tobytes()
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        # Phase 1 : Google Vision (brouillon structurel)
        texte_brut = self._google_ocr(image_bytes)

        # Phase 2 : GPT-4o (transcription parfaite + tableaux + maths)
        texte_final = self._openai_transcribe(image_b64, texte_brut)

        # Si GPT-4o et Google Vision n'ont rien donne, basculer sur le moteur local Open Source
        if not texte_final.strip():
            local_engine = self._get_local_engine()
            if local_engine:
                print("[HybrideOCR] Execution avec le moteur Open Source local...")
                return local_engine.lire_depuis_tableau(image_to_process, appliquer_pretraitement=appliquer_pretraitement)

        # Convertir en LigneReconnue
        lignes: List[LigneReconnue] = []
        if texte_final:
            for ligne_txt in texte_final.split('\n'):
                # Conserver les lignes vides pour preserver la mise en page Markdown
                lignes.append(LigneReconnue(
                    texte=ligne_txt,
                    confiance=0.99,
                    boite=[[0, 0], [10, 0], [10, 10], [0, 10]]
                ))

        return ResultatOCR(lignes=lignes, image_pretraitee=image_cv2)

    def lire(self, chemin_image: str, appliquer_pretraitement: bool = False) -> ResultatOCR:
        image_cv2 = cv2.imread(chemin_image)
        if image_cv2 is None:
            raise FileNotFoundError(f"Impossible de lire l'image : {chemin_image}")
        return self._pipeline(image_cv2, appliquer_pretraitement)

    def lire_depuis_tableau(self, image: np.ndarray, appliquer_pretraitement: bool = False) -> ResultatOCR:
        return self._pipeline(image, appliquer_pretraitement)
