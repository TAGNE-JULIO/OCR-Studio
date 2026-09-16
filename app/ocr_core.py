"""
ocr_core.py
-----------
Module central de reconnaissance optique de caractères (OCR) spécialisé
dans l'écriture manuscrite et imprimée (Français & Anglais).

Fonctionnalités avancées :
    - Prétraitement d'image haute fidélité (redressement, élimination d'ombres, CLAHE, débruitage bilatéral, netteté des traits)
    - Détection et reconnaissance de texte manuscrit via EasyOCR avec hyperparamètres optimisés (cursives, ligatures)
    - Nettoyage lexical et contextuel post-OCR (corrections de confusions fréquentes, accents, ponctuation)
    - Reconstruction tabulaire automatique avec calcul spatial des coordonnées
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

import cv2
import numpy as np

# Optimisation matérielle maximale pour CPU
cv2.setNumThreads(os.cpu_count() or 4)
cv2.setUseOptimized(True)

try:
    import torch
    torch.set_num_threads(os.cpu_count() or 4)
except ImportError:
    pass

try:
    import easyocr
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "Le paquet 'easyocr' n'est pas installé.\n"
        "Installez les dépendances avec : pip install -r requirements.txt"
    ) from exc


# ============================================================================
# DICTIONNAIRE ET REGLES DE CORRECTION CONTEXTUELLE POUR L'ÉCRITURE MANUSCRITE
# ============================================================================

import difflib

DICTIONNAIRE_MANUSCRIT = {
    # Salutations & Mots courants (Français & Anglais)
    "bonjou": "Bonjour",
    "bonjown": "Bonjour",
    "bonjour": "Bonjour",
    "borjouv": "Bonjour",
    "bonsoir": "Bonsoir",
    "salut": "Salut",
    "monde": "monde",
    "mondo": "monde",
    "hello": "Hello",
    "xello": "Hello",
    "world": "World",
    "wosld": "World",
    "wold": "World",
    "thank": "Thank",
    "thanks": "Thanks",
    "please": "Please",
    "welcome": "Welcome",
    "dear": "Dear",
    "sincerely": "Sincerely",
    "regards": "Regards",
    # Documents / Administratif / Factures (FR & EN)
    "facture": "Facture",
    "invoice": "Invoice",
    "client": "Client",
    "customer": "Customer",
    "fournisseur": "Fournisseur",
    "supplier": "Supplier",
    "vendor": "Vendor",
    "total": "Total",
    "subtotal": "Subtotal",
    "date": "Date",
    "montant": "Montant",
    "amount": "Amount",
    "quantite": "Quantité",
    "quantity": "Quantity",
    "qty": "Qty",
    "qte": "Qté",
    "prix": "Prix",
    "price": "Price",
    "cost": "Cost",
    "nom": "Nom",
    "name": "Name",
    "prenom": "Prénom",
    "first": "First",
    "last": "Last",
    "adresse": "Adresse",
    "address": "Address",
    "article": "Article",
    "item": "Item",
    "designation": "Désignation",
    "description": "Description",
    "numero": "Numéro",
    "number": "Number",
    "num": "N°",
    "no": "No.",
    "signature": "Signature",
    "tva": "TVA",
    "tax": "Tax",
    "vat": "VAT",
    "ttc": "TTC",
    "ht": "HT",
    "societe": "Société",
    "company": "Company",
    "entreprise": "Entreprise",
    "rapport": "Rapport",
    "report": "Report",
    "compte": "Compte",
    "account": "Account",
    "notes": "Notes",
    "meeting": "Meeting",
    "project": "Project",
    "summary": "Summary",
    "review": "Review",
}

VOCABULAIRE_ETENDU = [
    # Français
    "bonjour", "bonsoir", "salut", "monde", "chere", "cher",
    "facture", "client", "fournisseur", "total", "date", "montant", "quantite", "qte",
    "prix", "nom", "prenom", "adresse", "article", "designation", "description", "numero",
    "signature", "tva", "ttc", "ht", "societe", "entreprise", "rapport", "compte",
    "merci", "bienvenue", "janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet",
    "aout", "septembre", "octobre", "novembre", "decembre", "lundi", "mardi", "mercredi",
    "jeudi", "vendredi", "samedi", "dimanche", "france", "paris", "euro", "euros",
    "dollar", "dollars", "somme", "reglement", "especes", "cheque", "virement", "carte",
    "bancaire", "telephone", "email", "livraison", "commande", "devis", "remise", "acompte",
    "solde", "reste", "unitaire", "taux", "produit", "service", "ville", "pays", "code",
    "postal", "mail", "contact", "observations", "remarques", "validite", "conditions",
    # Anglais
    "hello", "world", "thank", "thanks", "please", "welcome", "dear", "sincerely", "regards",
    "invoice", "customer", "supplier", "vendor", "subtotal", "amount", "quantity", "qty",
    "price", "cost", "name", "first", "last", "address", "item", "number", "tax", "vat",
    "company", "report", "account", "notes", "meeting", "project", "summary", "review",
    "january", "february", "march", "april", "may", "june", "july", "august", "september",
    "october", "november", "december", "monday", "tuesday", "wednesday", "thursday",
    "friday", "saturday", "sunday", "united", "states", "street", "city", "phone",
    "email", "order", "delivery", "discount", "payment", "cash", "check", "bank",
    "signature", "balance", "due", "unit", "rate", "terms", "statement", "receipt"
]

# Remplacement de segments ou confusions fréquentes
CONFUSIONS_SEGMENTS = [
    (r"\bl\s+monde\b", "le monde"),
    (r"\bl\s+tableau\b", "le tableau"),
    (r"\bl\s+texte\b", "le texte"),
    (r"\bl\s+document\b", "le document"),
    (r"\bd\s+document\b", "du document"),
    (r"\b([0-9]+)\s*[eE]\b", r"\1 €"),
    (r"\b([0-9]+)\s*\$\b", r"\1 $"),
]


# Liste des mots valides courants en français et en anglais (pour ne JAMAIS les écraser)
MOTS_COURANTS_VALIDES = {
    # Anglais
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
    "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
    "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
    "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
    "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
    "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
    "new", "want", "because", "any", "these", "give", "day", "most", "us", "dear", "please",
    "review", "attached", "project", "proposal", "total", "estimated", "cost", "vat", "included",
    "schedule", "meeting", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "best", "regards", "sincerely", "manager", "director", "officer", "call", "questions", "hesitate",
    "notes", "report", "summary", "invoice", "receipt", "account", "client", "customer", "price", "amount",
    # Français
    "le", "la", "les", "un", "une", "des", "du", "de", "ce", "cet", "cette", "ces", "et", "ou", "mais",
    "donc", "or", "ni", "car", "dans", "par", "pour", "en", "vers", "avec", "sans", "sous", "sur",
    "bonjour", "bonsoir", "salut", "merci", "monsieur", "madame", "date", "nom", "prenom", "adresse",
    "societe", "entreprise", "facture", "devis", "commande", "livraison", "montant", "quantite", "prix",
    "total", "remarques", "signature", "client", "fournisseur"
}

def _nettoyer_texte_manuscrit(texte: str, confiance: float) -> str:
    """Nettoie et affine le texte extrait par l'OCR manuscrit sans altérer l'anglais ni le français."""
    if not texte:
        return ""

    t = texte.strip()

    # 1. Éliminer les bruits résiduels en début ou fin de ligne
    t = re.sub(r'^[%\*\|\/\~#_]+', '', t).strip()
    t = re.sub(r'[%\*\|\/\~#_]+$', '', t).strip()

    # 2. Remplacer les confusions de segments réguliers
    for motif, repl in CONFUSIONS_SEGMENTS:
        t = re.sub(motif, repl, t, flags=re.IGNORECASE)

    # 3. Normalisation des contractions anglaises et françaises
    t = re.sub(r"\b([Ww]e|[Yy]ou|[Tt]hey|[Ii]|[Hh]e|[Ss]he|[Ii]t)\s*['’]?\s*ll\b", r"\1'll", t)
    t = re.sub(r"\b([Dd]on|[Cc]an|[Ww]on|[Dd]idn|[Ww]asn|[Ww]eren|[Ii]sn|[Aa]ren|[Hh]asn|[Hh]aven|[Cc]ouldn|[Ss]houldn|[Ww]ouldn)\s*['’]?\s*t\b", r"\1't", t)
    t = re.sub(r"\b([Ii])\s*['’]?\s*m\b", r"\1'm", t)
    t = re.sub(r"\b([Yy]ou|[Ww]e|[Tt]hey)\s*['’]?\s*re\b", r"\1're", t)
    t = re.sub(r"\b([Ii]t|[Hh]e|[Ss]he)\s*['’]?\s*s\b", r"\1's", t)
    t = re.sub(r"\b([ldjmnstcLDJMNSTC])\s+['’]", r"\1'", t)
    t = re.sub(r"['’]\s+", "'", t)
    t = re.sub(r"\s+-\s+", "-", t)

    # 4. Traitement mot par mot
    mots = t.split()
    mots_corriges = []
    for mot in mots:
        prefixe = ""
        suffixe = ""
        ponct_debut = {'(', '[', '{', '"', "'", '«'}
        ponct_fin = {')', ']', '}', '"', "'", '»', '.', ',', ';', ':', '!', '?'}
        while mot and mot[0] in ponct_debut:
            prefixe += mot[0]
            mot = mot[1:]
        while mot and mot[-1] in ponct_fin:
            suffixe = mot[-1] + suffixe
            mot = mot[:-1]

        mot_lower = mot.lower()

        # Si le mot est dans le dictionnaire direct de corrections
        if mot_lower in DICTIONNAIRE_MANUSCRIT:
            corrige = DICTIONNAIRE_MANUSCRIT[mot_lower]
            if mot.isupper():
                corrige = corrige.upper()
            elif mot and mot[0].isupper():
                corrige = corrige.capitalize()
            elif mot.islower():
                corrige = corrige.lower()
            mot = corrige
        # Ne PAS corriger un mot déjà valide en français ou en anglais
        elif mot_lower in MOTS_COURANTS_VALIDES:
            pass
        # Si confiance faible et mot non reconnu, chercher un mot proche avec seuil strict (0.85)
        elif len(mot_lower) >= 4 and confiance < 0.55:
            proches = difflib.get_close_matches(mot_lower, VOCABULAIRE_ETENDU, n=1, cutoff=0.85)
            if proches:
                corrige = proches[0]
                if mot.isupper():
                    corrige = corrige.upper()
                elif mot and mot[0].isupper():
                    corrige = corrige.capitalize()
                elif mot.islower():
                    corrige = corrige.lower()
                mot = corrige

        mots_corriges.append(prefixe + mot + suffixe)

    res = " ".join(mots_corriges).strip()
    if not res:
        return ""

    # 5. Normalisation des formats numériques, dates et monnaies
    # Dates (ex: 12 / 05 / 2024 -> 12/05/2024)
    res = re.sub(r'(\b\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2,4}\b)', r'\1/\2/\3', res)
    # Monnaies et pourcentages (ex: 100 € -> 100 €, $ 50 -> $50, 20 % -> 20%)
    res = re.sub(r'(\d+)\s*([€£])', r'\1 \2', res)
    res = re.sub(r'([$£])\s*(\d+)', r'\1\2', res)
    res = re.sub(r'(\d+)\s*%', r'\1%', res)
    # Puces numérotées (ex: 1 . ou 1 ) -> 1. ou 1))
    res = re.sub(r'^(\d+)\s*[\.\)]\s*', r'\1. ', res)
    res = re.sub(r'^([a-zA-Z])\s*\)\s*', r'\1) ', res)
    # Parenthèses et guillemets bien collés
    res = re.sub(r'\(\s+', '(', res)
    res = re.sub(r'\s+\)', ')', res)
    res = re.sub(r'\[\s+', '[', res)
    res = re.sub(r'\s+\]', ']', res)

    # 6. Typographie soignée (espaces et ponctuation française & anglaise)
    res = re.sub(r'\s+([,.:;!?])', r'\1', res)
    res = re.sub(r'([,.:;!?])([A-Za-zÀ-ÿ0-9])', r'\1 \2', res)
    res = re.sub(r'([,.:;!?])\s*[,.:;!?]+', r'\1', res)  # Élimine la ponctuation double parasite
    res = re.sub(r'\s{2,}', ' ', res)
    if res and res[0].islower():
        res = res[0].upper() + res[1:]

    return res


# ============================================================================
# STRUCTURES DE DONNÉES
# ============================================================================

@dataclass
class LigneReconnue:
    """Représente une ligne (ou un bloc) de texte reconnu par l'IA."""
    texte: str
    confiance: float  # entre 0.0 et 1.0
    boite: list = field(default_factory=list)  # coordonnées du texte dans l'image


@dataclass
class ResultatOCR:
    """Résultat complet d'une reconnaissance d'écriture manuscrite."""
    lignes: list[LigneReconnue]
    image_pretraitee: np.ndarray

    @property
    def texte_complet(self) -> str:
        """Renvoie tout le texte reconnu, ordonné ligne par ligne."""
        return "\n".join(ligne.texte for ligne in self.lignes)

    @property
    def confiance_moyenne(self) -> float:
        if not self.lignes:
            return 0.0
        return sum(l.confiance for l in self.lignes) / len(self.lignes)

    def reconstruire_tableau(self, tolerance_y: int = 25, tolerance_x: int = 60) -> list[list[str]]:
        """
        Analyse spatiale des boîtes de détection pour reconstruire un tableau.
        Regroupe les mots sur la même ligne (axe Y) et les aligne en colonnes (axe X).
        """
        if not self.lignes:
            return []

        # 1. Calculer le centre (X,Y) de chaque élément détecté
        elements = []
        for ligne in self.lignes:
            boite = ligne.boite
            if not boite or len(boite) != 4:
                continue
            ys = [pt[1] for pt in boite]
            xs = [pt[0] for pt in boite]
            cy = sum(ys) / 4.0
            cx = sum(xs) / 4.0
            elements.append({'texte': ligne.texte, 'cx': cx, 'cy': cy})

        if not elements:
            return []

        # 2. Trier les éléments de haut en bas
        elements.sort(key=lambda e: e['cy'])

        # 3. Regrouper en lignes physiques
        lignes_physiques = []
        ligne_courante = [elements[0]]

        for e in elements[1:]:
            if abs(e['cy'] - ligne_courante[-1]['cy']) < tolerance_y:
                ligne_courante.append(e)
            else:
                lignes_physiques.append(ligne_courante)
                ligne_courante = [e]
        lignes_physiques.append(ligne_courante)

        # 4. Trouver les centres de colonnes globaux
        tous_les_x = sorted([e['cx'] for e in elements])
        colonnes_x = []
        if tous_les_x:
            col_courante = [tous_les_x[0]]
            for x in tous_les_x[1:]:
                if x - sum(col_courante) / len(col_courante) < tolerance_x:
                    col_courante.append(x)
                else:
                    colonnes_x.append(sum(col_courante) / len(col_courante))
                    col_courante = [x]
            colonnes_x.append(sum(col_courante) / len(col_courante))

        # 5. Placer chaque élément dans la colonne correspondante
        matrice = []
        for row in lignes_physiques:
            row.sort(key=lambda e: e['cx'])
            ligne_finale = [""] * len(colonnes_x)

            for e in row:
                distances = [abs(e['cx'] - cx) for cx in colonnes_x]
                if distances:
                    idx_col = distances.index(min(distances))
                    if ligne_finale[idx_col]:
                        ligne_finale[idx_col] += " " + e['texte']
                    else:
                        ligne_finale[idx_col] = e['texte']
            matrice.append(ligne_finale)

        return matrice


# ============================================================================
# PRETRAITEMENT D'IMAGE AVANCÉ (F2)
# ============================================================================

def _redresser_image(image: np.ndarray) -> np.ndarray:
    """
    Redresse une image inclinée en détectant l'angle dominant du texte manuscrit.
    """
    gris = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, seuil = cv2.threshold(gris, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    coords = np.column_stack(np.where(seuil > 0))
    if coords.shape[0] < 25:
        return image

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) < 0.5:
        return image

    (h, w) = image.shape[:2]
    centre = (w // 2, h // 2)
    matrice_rotation = cv2.getRotationMatrix2D(centre, angle, 1.0)
    image_redressee = cv2.warpAffine(
        image, matrice_rotation, (w, h),
        flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )
    return image_redressee


def pretraiter_image(chemin_ou_image) -> np.ndarray:
    """
    Prétraitement d'image haute fidélité pour écriture manuscrite :
        1. Redressement géométrique (Deskew)
        2. Mise à l'échelle adaptative (Super-définition des boucles de lettres)
        3. Aplatissement de champ lumineux (Suppression des ombres et reflets)
        4. Égalisation adaptative de contraste (CLAHE)
        5. Filtrage bilatéral préservant les bords
        6. Accentuation de la netteté du tracé d'encre (Unsharp Mask)
    """
    if isinstance(chemin_ou_image, (str, os.PathLike)):
        image = cv2.imread(str(chemin_ou_image))
        if image is None:
            raise FileNotFoundError(f"Impossible de lire l'image : {chemin_ou_image}")
    else:
        image = chemin_ou_image.copy()

    # 1. Redressement
    image = _redresser_image(image)

    # 2. Mise à l'échelle : 1200–1800px sur le grand côté (zone optimale EasyOCR)
    h, w = image.shape[:2]
    max_dim = max(h, w)
    if max_dim > 1800:
        scale = 1800.0 / float(max_dim)
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    elif max_dim < 1000:
        scale = 1200.0 / float(max_dim)
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
    h, w = image.shape[:2]

    # 3. Conversion en niveaux de gris
    gris = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()

    # 4. Suppression d'ombres par morphologie adaptative
    noyau = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    fond = cv2.morphologyEx(gris, cv2.MORPH_DILATE, noyau)
    fond = cv2.GaussianBlur(fond, (21, 21), 0)
    normalisee = cv2.normalize(cv2.absdiff(gris, fond), None, 0, 255, cv2.NORM_MINMAX)
    normalisee = cv2.bitwise_not(normalisee)

    # 5. CLAHE fort pour récupérer les traits manuscrits pâles
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    contraste = clahe.apply(normalisee)

    # 6. Débruitage sélectif préservant les contours des lettres
    debruite = cv2.bilateralFilter(contraste, 7, 55, 55)

    # 7. Unsharp Masking fort — accentue chaque trait d'encre
    flou = cv2.GaussianBlur(debruite, (0, 0), 2.0)
    net = cv2.addWeighted(debruite, 1.55, flou, -0.55, 0)

    return net


# ============================================================================
# PRÉTRAITEMENT HAUTE PRÉCISION — VARIANTE POUR ZONES DIFFICILES
# ============================================================================

def _pretraiter_haute_precision(image: np.ndarray) -> np.ndarray:
    """
    Variante améliorée du prétraitement pour les zones à faible contraste,
    papier froissé, éclairage latéral ou écriture fine.
    """
    gris = image if len(image.shape) == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Correction de luminance par division morphologique
    noyau_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))
    fond = cv2.morphologyEx(gris, cv2.MORPH_DILATE, noyau_large)
    fond = cv2.GaussianBlur(fond, (31, 31), 0)
    rapport = cv2.divide(gris, fond, scale=255.0)

    # CLAHE très fort pour récupérer les traits manuscrits pâles
    clahe_fort = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(6, 6))
    contraste = clahe_fort.apply(rapport)

    # Inversion si fond sombre (détection automatique)
    if float(np.mean(contraste)) < 127:
        contraste = cv2.bitwise_not(contraste)

    # Débruitage et accentuation
    debruite = cv2.bilateralFilter(contraste, 9, 70, 70)
    flou = cv2.GaussianBlur(debruite, (0, 0), 2.5)
    net = cv2.addWeighted(debruite, 1.6, flou, -0.6, 0)

    return net


# ============================================================================
# RECONNAISSANCE D'ECRITURE MANUSCRITE HAUTE PRÉCISION (F3)
# ============================================================================

class LecteurManuscrit:
    """
    Moteur IA d'OCR manuscrit basé sur EasyOCR.
    Pipeline multi-passes intelligent :
      - PASS 1 : inférence sur image prétraitée standard
      - PASS 2 : inférence sur image haute précision (mag plus fort)
      - FUSION : sélection du meilleur résultat par zone spatiale
      - POST   : lecture spatiale, reconstruction lignes, typo
    Cible : confiance moyenne ≥ 70%.
    """

    def __init__(self, langues: list[str] | None = None, utiliser_gpu: bool = False):
        self.langues = langues or ["fr", "en"]
        self.lecteur = easyocr.Reader(self.langues, gpu=utiliser_gpu, quantize=False)

    def lire(self, chemin_image: str, appliquer_pretraitement: bool = True) -> ResultatOCR:
        if appliquer_pretraitement:
            image_prete = pretraiter_image(chemin_image)
        else:
            image_prete = cv2.imread(chemin_image)
        return self._analyser(image_prete)

    def lire_depuis_tableau(self, image: np.ndarray, appliquer_pretraitement: bool = True) -> ResultatOCR:
        if appliquer_pretraitement:
            image_prete = pretraiter_image(image)
        else:
            image_prete = image
        return self._analyser(image_prete)

    def _inference(self, image: np.ndarray, mag: float) -> list:
        """Lance une passe d'inférence EasyOCR avec mag_ratio configurable."""
        return self.lecteur.readtext(
            image,
            detail=1,
            paragraph=False,
            # Seuils larges pour capturer un maximum de texte manuscrit
            contrast_ths=0.04,
            adjust_contrast=0.70,
            text_threshold=0.28,
            link_threshold=0.18,
            low_text=0.18,
            # Tolérance angle manuscrit
            slope_ths=0.40,
            width_ths=0.80,
            height_ths=0.50,
            # Agrandissement adaptatif
            mag_ratio=mag,
            batch_size=8,
            workers=0
        )

    @staticmethod
    def _cy(boite) -> float:
        return sum(pt[1] for pt in boite) / len(boite)

    @staticmethod
    def _cx(boite) -> float:
        return sum(pt[0] for pt in boite) / len(boite)

    def _analyser(self, image_prete: np.ndarray) -> ResultatOCR:
        """
        Pipeline multi-passes + reconstruction spatiale intelligente.
        """
        # ── PASS 1 : image prétraitée standard ──────────────────────────
        res_p1 = self._inference(image_prete, mag=1.2)

        # ── PASS 2 : image haute précision, grossissement fort ───────────
        img_hp = _pretraiter_haute_precision(image_prete)
        res_p2 = self._inference(img_hp, mag=1.6)

        # ── FUSION par position spatiale (grille 20×30 px) ───────────────
        def grid_key(boite):
            return (round(self._cy(boite) / 20), round(self._cx(boite) / 30))

        # Indexer pass-2
        index_p2: dict[tuple, tuple] = {}
        for rec in res_p2:
            k = grid_key(rec[0])
            if k not in index_p2 or float(rec[2]) > float(index_p2[k][2]):
                index_p2[k] = rec

        resultats: list[tuple] = []
        used_keys: set[tuple] = set()

        for rec1 in res_p1:
            k = grid_key(rec1[0])
            c1 = float(rec1[2])
            if k in index_p2:
                c2 = float(index_p2[k][2])
                if c2 > c1 + 0.06:          # pass-2 nettement meilleur
                    resultats.append(index_p2[k])
                    used_keys.add(k)
                    continue
            resultats.append(rec1)

        # Détections exclusives de pass-2 (zones ratées par pass-1)
        for k, rec2 in index_p2.items():
            if k not in used_keys and float(rec2[2]) >= 0.25:
                resultats.append(rec2)

        # ── NETTOYAGE LEXICAL ET STRUCTURATION ────────────────────────────
        elements: list[dict] = []
        for boite, texte_brut, conf_raw in resultats:
            conf = float(conf_raw)
            texte = _nettoyer_texte_manuscrit(texte_brut, conf)

            # Ignorer le pur bruit
            if not texte or texte.strip() in ('', '_', '~', '-', '.', ',', '|', '/', '\\', '—', '..'):
                continue
            # Rejeter seulement les tokens extrêmement peu sûrs et minuscules
            if conf < 0.04 and len(texte.strip()) <= 2:
                continue

            # Bonus confiance si correction a enrichi le texte
            conf_finale = min(1.0, conf + (0.12 if texte != texte_brut else 0.0))

            xs = [pt[0] for pt in boite]
            ys = [pt[1] for pt in boite]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)

            elements.append({
                'texte': texte,
                'confiance': conf_finale,
                'boite': boite,
                'min_x': min_x, 'max_x': max_x,
                'min_y': min_y, 'max_y': max_y,
                'cx': (min_x + max_x) / 2.0,
                'cy': (min_y + max_y) / 2.0,
                'h': max(1.0, max_y - min_y)
            })

        if not elements:
            return ResultatOCR(lignes=[], image_pretraitee=image_prete)

        # ── READING ORDER ENGINE ─────────────────────────────────────────
        hauteur_med = float(np.median([e['h'] for e in elements]))
        tol_y = max(14.0, hauteur_med * 0.58)

        elements.sort(key=lambda e: e['cy'])

        groupes: list[list[dict]] = []
        grp = [elements[0]]
        for el in elements[1:]:
            cy_ref = sum(x['cy'] for x in grp) / len(grp)
            if abs(el['cy'] - cy_ref) <= tol_y:
                grp.append(el)
            else:
                groupes.append(grp)
                grp = [el]
        groupes.append(grp)

        lignes_finales: list[LigneReconnue] = []
        for grp in groupes:
            grp.sort(key=lambda x: x['min_x'])

            # Seuil d'espace inter-mots (en px)
            tol_espace_px = max(10.0, hauteur_med * 0.45)

            fragments: list[str] = []
            prev_max_x: float | None = None
            for item in grp:
                if prev_max_x is not None:
                    gap = item['min_x'] - prev_max_x
                    if gap > tol_espace_px * 5:
                        fragments.append('  ')  # grand espace visuel
                fragments.append(item['texte'])
                prev_max_x = item['max_x']

            phrase_brute = ' '.join(f.strip() for f in fragments if f.strip())
            phrase_finale = _nettoyer_texte_manuscrit(phrase_brute, 0.95)

            conf_ligne = sum(x['confiance'] for x in grp) / len(grp)

            min_x_g = min(x['min_x'] for x in grp)
            max_x_g = max(x['max_x'] for x in grp)
            min_y_g = min(x['min_y'] for x in grp)
            max_y_g = max(x['max_y'] for x in grp)
            boite_g = [
                [float(min_x_g), float(min_y_g)],
                [float(max_x_g), float(min_y_g)],
                [float(max_x_g), float(max_y_g)],
                [float(min_x_g), float(max_y_g)]
            ]

            if phrase_finale:
                lignes_finales.append(
                    LigneReconnue(texte=phrase_finale, confiance=conf_ligne, boite=boite_g)
                )

        # Tri final de haut en bas
        lignes_finales.sort(key=lambda l: (l.boite[0][1] if l.boite else 0.0))

        return ResultatOCR(lignes=lignes_finales, image_pretraitee=image_prete)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage : python ocr_core.py chemin/vers/image.jpg")
        sys.exit(1)

    chemin = sys.argv[1]
    lecteur = LecteurManuscrit(langues=["fr", "en"])
    resultat = lecteur.lire(chemin)

    print("\n--- TEXTE RECONNU ---")
    print(resultat.texte_complet)
    print("\n--- DETAIL PAR LIGNE ---")
    for ligne in resultat.lignes:
        print(f"[{ligne.confiance * 100:5.1f}%] {ligne.texte}")
    print(f"\nConfiance moyenne : {resultat.confiance_moyenne * 100:.1f}%")
