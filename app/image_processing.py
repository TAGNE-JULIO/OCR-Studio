import cv2
import numpy as np

def remove_shadows(image: np.ndarray) -> np.ndarray:
    """Supprime les ombres portees en divisant l'image par son fond estime."""
    # Convertir en niveaux de gris si ce n'est pas deja le cas
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
        
    # Estimer le fond avec un grand filtre median
    # kernel size doit etre suffisamment grand pour effacer le texte mais garder les ombres
    dilated = cv2.dilate(gray, np.ones((7, 7), np.uint8))
    bg_img = cv2.medianBlur(dilated, 21)
    
    # Diviser l'image originale par le fond pour normaliser l'eclairage
    diff = 255 - cv2.absdiff(gray, bg_img)
    norm_img = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)
    
    return norm_img

def enhance_contrast_clahe(image: np.ndarray) -> np.ndarray:
    """Ameliore le contraste local sans bruler les blancs (CLAHE)."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(image)

def correct_skew(image: np.ndarray) -> np.ndarray:
    """Detecte et corrige l'inclinaison du texte (Deskewing)."""
    # Binariser l'image pour trouver le bloc de texte
    coords = np.column_stack(np.where(image > 0))
    if len(coords) == 0:
        return image
        
    angle = cv2.minAreaRect(coords)[-1]
    
    # Ajustement de l'angle renvoye par minAreaRect (varie selon version OpenCV)
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Ne pas pivoter si l'angle est trop faible (bruit)
    if abs(angle) < 0.5:
        return image
        
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return rotated

def adaptive_binarization(image: np.ndarray) -> np.ndarray:
    """Binarise l'image pour avoir un texte noir pur sur fond blanc pur."""
    # Binarisation adaptative Gaussienne
    bin_img = cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    # Nettoyage morphologique leger pour retirer le petit bruit (Erosion puis Dilatation)
    kernel = np.ones((1, 1), np.uint8)
    clean = cv2.morphologyEx(bin_img, cv2.MORPH_OPEN, kernel)
    return clean

def pretraiter_image(image: np.ndarray, ultra_clean: bool = False) -> np.ndarray:
    """
    Pipeline complet de pretraitement pour maximiser la qualite OCR.
    Renvoie une image RGB amelioree (car GPT-4o Vision et EasyOCR gerent bien le RGB).
    Si ultra_clean est True, applique une binarisation stricte.
    """
    # 1. Suppression des ombres (le plus important pour les photos smartphone)
    no_shadow = remove_shadows(image)
    
    # 2. Amelioration du contraste CLAHE
    contrasted = enhance_contrast_clahe(no_shadow)
    
    # 3. Deskewing basique
    straightened = correct_skew(contrasted)
    
    # Si on a besoin d'une image noire et blanche parfaite (utile surtout pour EasyOCR local)
    if ultra_clean:
        final = adaptive_binarization(straightened)
        # Reconvertir en RGB pour garder la coherence des types
        final = cv2.cvtColor(final, cv2.COLOR_GRAY2BGR)
    else:
        # GPT-4o Vision apprecie le niveau de gris propre plutot que le binaire strict
        final = cv2.cvtColor(straightened, cv2.COLOR_GRAY2BGR)
        
    return final
