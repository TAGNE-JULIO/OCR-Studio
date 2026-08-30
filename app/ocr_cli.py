"""
ocr_cli.py
----------
Script de base en ligne de commande.

Usage :
    python ocr_cli.py chemin/vers/image.jpg
    python ocr_cli.py chemin/vers/image.jpg --sortie resultat.txt
    python ocr_cli.py chemin/vers/image.jpg --sans-pretraitement

Ce script :
    1. Prend une image d'écriture manuscrite en entrée
    2. La fait analyser par l'IA (module ocr_core)
    3. Affiche le texte reconnu dans le terminal
    4. Peut aussi l'enregistrer dans un fichier .txt
"""

import argparse
import sys
from pathlib import Path

from ocr_core import LecteurManuscrit


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Transforme une image d'écriture manuscrite en texte grâce à l'IA."
    )
    parser.add_argument("image", type=str, help="Chemin vers l'image à analyser (JPG, PNG)")
    parser.add_argument(
        "--sortie", type=str, default=None,
        help="Chemin d'un fichier .txt où enregistrer le résultat (optionnel)"
    )
    parser.add_argument(
        "--langues", type=str, default="fr,en",
        help="Langues à reconnaître, séparées par des virgules (défaut : fr,en)"
    )
    parser.add_argument(
        "--sans-pretraitement", action="store_true",
        help="Désactive le nettoyage automatique de l'image avant lecture"
    )
    args = parser.parse_args()

    chemin_image = Path(args.image)
    if not chemin_image.exists():
        print(f"Erreur : le fichier '{chemin_image}' n'existe pas.", file=sys.stderr)
        sys.exit(1)

    langues = [l.strip() for l in args.langues.split(",") if l.strip()]

    print(f"Chargement du modèle d'IA pour les langues {langues}...")
    lecteur = LecteurManuscrit(langues=langues)

    print(f"Analyse de l'image : {chemin_image}")
    resultat = lecteur.lire(
        str(chemin_image),
        appliquer_pretraitement=not args.sans_pretraitement,
    )

    print("\n" + "=" * 50)
    print("TEXTE RECONNU")
    print("=" * 50)
    print(resultat.texte_complet or "(aucun texte détecté)")
    print("=" * 50)
    print(f"Confiance moyenne : {resultat.confiance_moyenne * 100:.1f}%")

    if args.sortie:
        chemin_sortie = Path(args.sortie)
        chemin_sortie.write_text(resultat.texte_complet, encoding="utf-8")
        print(f"\nTexte enregistré dans : {chemin_sortie}")


if __name__ == "__main__":
    main()
