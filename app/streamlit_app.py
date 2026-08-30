"""
streamlit_app.py
-----------------
Interface web (Option A du cahier des charges) pour l'IA de reconnaissance
d'écriture manuscrite.

Lancement :
    streamlit run streamlit_app.py

Fonctionnalités couvertes :
    F1 - Capture : prise de photo en direct + import de fichier
    F2 - Prétraitement intelligent (automatique, via ocr_core)
    F3 - OCR manuscrit (français + anglais, via EasyOCR)
    F4 - Correction et validation (image à gauche, texte modifiable à droite)
"""

import numpy as np
from PIL import Image

import streamlit as st
from ocr_core import LecteurManuscrit, pretraiter_image

st.set_page_config(
    page_title="OCR Manuscrit vers Excel",
    page_icon="📝",
    layout="wide",
)


# ----------------------------------------------------------------------------
# Chargement du modèle IA (mis en cache pour ne pas le recharger à chaque clic)
# ----------------------------------------------------------------------------
@st.cache_resource(show_spinner=False)
def charger_lecteur(langues: tuple[str, ...]) -> LecteurManuscrit:
    return LecteurManuscrit(langues=list(langues))


# ----------------------------------------------------------------------------
# En-tête
# ----------------------------------------------------------------------------
st.title("📝 OCR Manuscrit → Texte")
st.caption(
    "Capturez une image d'écriture manuscrite : l'intelligence artificielle "
    "la lit et la transforme automatiquement en texte."
)

with st.sidebar:
    st.header("Paramètres")
    langue_fr = st.checkbox("Français", value=True)
    langue_en = st.checkbox("Anglais", value=True)
    appliquer_pretraitement = st.checkbox(
        "Nettoyer automatiquement l'image avant lecture", value=True,
        help="Redressement, suppression des ombres et du bruit (recommandé)."
    )
    st.markdown("---")
    st.caption(
        "Le premier chargement du modèle d'IA peut prendre quelques dizaines "
        "de secondes ; les analyses suivantes seront rapides."
    )

langues_choisies = tuple(l for l, actif in [("fr", langue_fr), ("en", langue_en)] if actif)
if not langues_choisies:
    st.warning("Sélectionnez au moins une langue dans le menu de gauche.")
    st.stop()


# ----------------------------------------------------------------------------
# F1 - Capture : photo en direct ou import de fichier
# ----------------------------------------------------------------------------
onglet_import, onglet_camera = st.tabs(["📁 Importer une image", "📷 Prendre une photo"])

image_source = None
with onglet_import:
    fichier = st.file_uploader(
        "Choisissez une image (JPG, PNG)", type=["jpg", "jpeg", "png"]
    )
    if fichier is not None:
        image_source = Image.open(fichier).convert("RGB")

with onglet_camera:
    photo = st.camera_input("Prenez une photo de votre document manuscrit")
    if photo is not None:
        image_source = Image.open(photo).convert("RGB")


# ----------------------------------------------------------------------------
# Traitement + F4 : affichage image / texte côte à côte, texte éditable
# ----------------------------------------------------------------------------
if image_source is not None:

    image_array = np.array(image_source)[:, :, ::-1]  # RGB -> BGR pour OpenCV

    with st.spinner("Chargement du modèle d'IA..."):
        lecteur = charger_lecteur(langues_choisies)

    with st.spinner("Analyse de l'écriture manuscrite en cours..."):
        resultat = lecteur.lire_depuis_tableau(image_array, appliquer_pretraitement)

    texte_complet = resultat.texte_complet
    confiance_moyenne = resultat.confiance_moyenne

    colonne_image, colonne_texte = st.columns(2)

    with colonne_image:
        st.subheader("Image (après nettoyage automatique)")
        st.image(
            resultat.image_pretraitee,
            use_container_width=True,
            channels="GRAY" if appliquer_pretraitement else "BGR",
        )

    with colonne_texte:
        st.subheader("Texte reconnu par l'IA")
        st.caption(f"Confiance moyenne de la lecture : {confiance_moyenne * 100:.1f}%")
        texte_corrige = st.text_area(
            "Vérifiez et corrigez le texte si nécessaire avant export :",
            value=texte_complet,
            height=350,
        )

    import pandas as pd
    from io import BytesIO

    st.success(
        "Texte prêt. L'IA a également analysé la structure spatiale du document pour l'export en tableau !"
    )
    
    # ----------------------------------------------------------------------------
    # RECONSTRUCTION DU TABLEAU ET APERCU
    # ----------------------------------------------------------------------------
    matrice = resultat.reconstruire_tableau()
    if not matrice:
        matrice = [[ligne.texte] for ligne in resultat.lignes]
    
    colonnes = [f"Colonne {i+1}" for i in range(len(matrice[0]))] if matrice else []
    df = pd.DataFrame(matrice, columns=colonnes)
    
    with st.expander("👀 Voir l'aperçu du tableau détecté (avant export)"):
        st.dataframe(df, use_container_width=True)

    col_btn1, col_btn2, col_btn3 = st.columns(3)

    with col_btn1:
        st.download_button(
            label="📄 Exporter en Texte (.txt)",
            data=texte_corrige,
            file_name="texte_reconnu.txt",
            mime="text/plain",
            use_container_width=True
        )

    with col_btn2:
        # Création d'un fichier Excel en mémoire
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Donnees_Structurees')
        
        st.download_button(
            label="📊 Exporter en Excel (.xlsx)",
            data=buffer.getvalue(),
            file_name="tableau_reconnu.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True
        )
        
    with col_btn3:
        # Création du CSV
        csv_data = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📑 Exporter en CSV (.csv)",
            data=csv_data,
            file_name="tableau_reconnu.csv",
            mime="text/csv",
            use_container_width=True
        )

else:
    st.info("Importez une image ou prenez une photo pour lancer la reconnaissance.")
