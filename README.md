# 🖋️ OCR Studio — Vision IA & Reconnaissance d'Écriture Manuscrite

Application professionnelle et moderne de reconnaissance optique de caractères (OCR) spécialisée dans la lecture, la transcription et la mise en page de documents et textes manuscrits (Français & Anglais).

---

## 🚀 Fonctionnalités Clés

- 🧠 **Cœur IA Puissant** : Détection et reconnaissance d'écriture manuscrite (EasyOCR + Prétraitement d'image OpenCV : réduction d'ombres, CLAHE, redressement / deskewing, filtrage bilatéral).
- 📄 **Vue Document Word / Traitement de Texte** : Feuille A4 virtuelle avec mise en page soignée, typographie élégante, modification directe et formatage automatique de la ponctuation et des majuscules.
- 📱 **Interface Responsive & Mobile First** : Accès direct à la galerie photo, prise de vue par caméra en direct (WebRTC) avec viseur de cadrage et menu tiroir (Drawer) fluide.
- 📊 **Reconstruction Spatiale de Tableaux** : Regroupement spatial des cellules et détection de tableaux manuscrits.
- 💾 **Multi-Exports Professionnels** :
  - **Microsoft Word (.DOC)** avec mise en page préservée
  - **Excel (.XLSX)** et **CSV** pour les données structurées
  - **Texte brut (.TXT)** et copie rapide dans le presse-papier

---

## 🛠️ Architecture du Projet

```
ocr_project/
├── app/
│   ├── ocr_core.py        <- Algorithmes IA, prétraitement OpenCV, dictionnaires & fuzzy matching
│   ├── api.py             <- API REST FastAPI haute performance (port 8000)
│   ├── ocr_cli.py         <- Outil en ligne de commande
│   └── streamlit_app.py   <- Interface alternative Streamlit
├── next-frontend/         <- Application Web Next.js 16 (React, Tailwind CSS, Lucide icons)
├── requirements.txt       <- Dépendances Python
└── README.md
```

---

## 💻 Installation & Démarrage

### 1. Prérequis
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend (FastAPI + PyTorch / EasyOCR)
```bash
# Installation des dépendances Python
pip install -r requirements.txt

# Lancement du serveur d'IA
cd app
python api.py
```
> L'API démarrera sur `http://localhost:8000`.

### 3. Frontend (Next.js)
```bash
cd next-frontend
npm install
npm run dev -- -p 3005
```
> L'application sera donc accessible sur `http://localhost:3005`.

---

## 👥 Auteur
Développé avec passion par [TAGNE-JULIO](https://github.com/TAGNE-JULIO).
