import os
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import pandas as pd

from ocr_core import LecteurManuscrit, pretraiter_image

class OCRDesktopApp:
    def __init__(self, root):
        self.root = root
        self.root.title("OCR Manuscrit vers Excel (Application de Bureau)")
        self.root.geometry("900x700")

        self.chemin_image = None
        self.resultat_ocr = None
        
        # UI Elements
        self.create_widgets()
        
        # Placeholder for AI model
        self.lecteur = None

    def create_widgets(self):
        # Top frame (Controls)
        frame_top = tk.Frame(self.root)
        frame_top.pack(pady=10, fill=tk.X, padx=20)

        self.btn_charger = tk.Button(frame_top, text="📁 Charger une image", command=self.charger_image, font=("Arial", 12))
        self.btn_charger.pack(side=tk.LEFT, padx=10)

        self.btn_analyser = tk.Button(frame_top, text="🔍 Analyser l'écriture", command=self.analyser_image, font=("Arial", 12), state=tk.DISABLED)
        self.btn_analyser.pack(side=tk.LEFT, padx=10)
        
        self.var_pretraitement = tk.BooleanVar(value=True)
        self.chk_pretraitement = tk.Checkbutton(frame_top, text="Nettoyage automatique", variable=self.var_pretraitement)
        self.chk_pretraitement.pack(side=tk.LEFT, padx=10)

        self.lbl_status = tk.Label(frame_top, text="En attente...", fg="blue")
        self.lbl_status.pack(side=tk.RIGHT, padx=10)

        # Middle frame (Image and Text)
        frame_mid = tk.Frame(self.root)
        frame_mid.pack(expand=True, fill=tk.BOTH, padx=20)

        # Left side: Image
        self.lbl_image = tk.Label(frame_mid, text="Aucune image sélectionnée", bg="lightgray", width=40)
        self.lbl_image.pack(side=tk.LEFT, expand=True, fill=tk.BOTH, padx=5)

        # Right side: Text result
        frame_text = tk.Frame(frame_mid)
        frame_text.pack(side=tk.RIGHT, expand=True, fill=tk.BOTH, padx=5)

        tk.Label(frame_text, text="Texte reconnu (modifiable):").pack(anchor=tk.W)
        self.text_area = tk.Text(frame_text, height=20, width=40, font=("Arial", 12))
        self.text_area.pack(expand=True, fill=tk.BOTH)

        # Bottom frame (Export)
        frame_bottom = tk.Frame(self.root)
        frame_bottom.pack(pady=10, fill=tk.X, padx=20)

        self.btn_export_txt = tk.Button(frame_bottom, text="📄 Exporter en TXT", command=self.exporter_txt, font=("Arial", 12), state=tk.DISABLED)
        self.btn_export_txt.pack(side=tk.LEFT, padx=10)

        self.btn_export_excel = tk.Button(frame_bottom, text="📊 Exporter en Excel", command=self.exporter_excel, font=("Arial", 12), state=tk.DISABLED)
        self.btn_export_excel.pack(side=tk.LEFT, padx=10)

    def charger_image(self):
        fichier = filedialog.askopenfilename(
            title="Choisissez une image",
            filetypes=[("Images", "*.jpg *.jpeg *.png"), ("Tous les fichiers", "*.*")]
        )
        if fichier:
            self.chemin_image = fichier
            self.btn_analyser.config(state=tk.NORMAL)
            self.afficher_image(fichier)
            self.lbl_status.config(text="Image chargée. Prêt pour analyse.")
            self.text_area.delete(1.0, tk.END)
            self.btn_export_txt.config(state=tk.DISABLED)
            self.btn_export_excel.config(state=tk.DISABLED)

    def afficher_image(self, chemin):
        img = Image.open(chemin)
        # Redimensionner en conservant les proportions
        img.thumbnail((450, 550))
        self.img_tk = ImageTk.PhotoImage(img)
        self.lbl_image.config(image=self.img_tk, text="")

    def analyser_image(self):
        if not self.chemin_image:
            return

        self.lbl_status.config(text="Chargement du modèle... (veuillez patienter)")
        self.root.update()

        try:
            if not self.lecteur:
                self.lecteur = LecteurManuscrit(langues=["fr", "en"])
            
            self.lbl_status.config(text="Analyse de l'image en cours...")
            self.root.update()

            self.resultat_ocr = self.lecteur.lire(self.chemin_image, appliquer_pretraitement=self.var_pretraitement.get())
            
            self.text_area.delete(1.0, tk.END)
            self.text_area.insert(tk.END, self.resultat_ocr.texte_complet)

            confiance = self.resultat_ocr.confiance_moyenne * 100
            self.lbl_status.config(text=f"Analyse terminée. Confiance: {confiance:.1f}%")

            self.btn_export_txt.config(state=tk.NORMAL)
            self.btn_export_excel.config(state=tk.NORMAL)

        except Exception as e:
            messagebox.showerror("Erreur", f"Une erreur est survenue lors de l'analyse :\n{e}")
            self.lbl_status.config(text="Erreur.")

    def exporter_txt(self):
        if not self.resultat_ocr:
            return
        
        # Prendre le texte (potentiellement corrigé par l'utilisateur)
        texte = self.text_area.get(1.0, tk.END)
        fichier = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Fichier Texte", "*.txt")],
            title="Enregistrer le texte"
        )
        if fichier:
            with open(fichier, "w", encoding="utf-8") as f:
                f.write(texte)
            messagebox.showinfo("Succès", "Texte exporté avec succès !")

    def exporter_excel(self):
        if not self.resultat_ocr:
            return
        
        fichier = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Fichier Excel", "*.xlsx")],
            title="Enregistrer en Excel"
        )
        if fichier:
            # Pour l'Excel on utilise le texte originel reconnu ligne par ligne
            df = pd.DataFrame([
                {"Ligne": i+1, "Texte reconnu": ligne.texte, "Confiance (%)": round(ligne.confiance * 100, 1)}
                for i, ligne in enumerate(self.resultat_ocr.lignes)
            ])
            try:
                df.to_excel(fichier, index=False, sheet_name='OCR_Resultat')
                messagebox.showinfo("Succès", "Tableau Excel exporté avec succès !")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors de l'export Excel:\n{e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = OCRDesktopApp(root)
    root.mainloop()
