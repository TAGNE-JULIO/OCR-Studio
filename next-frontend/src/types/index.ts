export interface LigneOCR {
  id: number;
  texte: string;
  confiance: number;
  boite: number[][] | null;
}

export interface ResultatOCR {
  success: boolean;
  image_width: number;
  image_height: number;
  texte_complet: string;
  confiance_moyenne: number;
  lignes: LigneOCR[];
  matrice: string[][];
}

export type TranscriptionMode = 'ai' | 'manual';

export interface ImageDocument {
  id: number;
  file?: File;
  url: string;
  name: string;
  resultat: ResultatOCR | null;
  step: AppStep;
  errMsg?: string;
  transcriptionMode?: TranscriptionMode;
  texteManuel?: string;
}

export type AppStep = 'empty' | 'loading' | 'done' | 'error';
export type ScreenView = 'home' | 'review' | 'preferences';
export type InputMode = 'upload' | 'camera';
export type EditorDisplayMode = 'edit' | 'split' | 'preview';
export type ImageFilterMode = 'none' | 'contrast' | 'grayscale' | 'invert' | 'sharpen';
