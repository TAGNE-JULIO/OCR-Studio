'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'fr' | 'en';

export interface Translations {
  // Navigation & General
  brandTitle: string;
  brandTagline: string;
  navOverview: string;
  navDocuments: string;
  navCamera: string;
  navHistory: string;
  navPreferences: string;
  btnImport: string;
  btnCamera: string;
  btnExport: string;
  btnExportWord: string;
  btnExportExcel: string;
  btnExportPdf: string;
  btnExportTxt: string;
  btnValidate: string;
  btnValidated: string;
  btnReset: string;
  btnBack: string;
  btnBackWorkspace: string;
  btnScanAgain: string;
  btnCapture: string;
  btnNewDocument: string;
  btnNewBlankDocument: string;
  btnStartScan: string;
  btnRetry: string;
  btnCopied: string;
  btnCopy: string;
  btnAnalyzeAI: string;
  btnManualMode: string;

  // Header & Status
  apiConnected: string;
  apiChecking: string;
  apiOffline: string;
  themeToggleDark: string;
  themeToggleLight: string;
  langToggle: string;

  // Dashboard
  greetingPrefix: string;
  greetingSubtitle: string;
  engineTag: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  activityTitle: string;
  activitySub: string;
  activityDocsCount: string;
  dragDropTitle: string;
  dragDropSubtitle: string;
  dragDropBrowse: string;
  recentDocsTitle: string;
  recentDocsSubtitle: string;
  colName: string;
  colDate: string;
  colPages: string;
  colConfidence: string;
  colAction: string;
  actionOpen: string;

  // Review Screen & Flexible Editor
  reviewTag: string;
  modeSimpleEdit: string;
  modeCompare: string;
  metricConfidence: string;
  metricConfidenceNote: string;
  metricLanguage: string;
  metricLanguageValue: string;
  metricLanguageNote: string;
  metricStructured: string;
  metricStructuredNote: string;
  sourceDocTitle: string;
  pageCounter: string;
  transcriptionTitle: string;
  tabRawEditor: string;
  tabSplitEditor: string;
  tabStructuredView: string;
  editorTip: string;
  emptyContentNote: string;
  wordsCount: string;
  charsCount: string;
  loadingApiMsg: string;
  errorApiTitle: string;
  errorApiTip: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  zoomFit: string;
  rotateRight: string;
  filterNormal: string;
  filterContrast: string;
  filterGrayscale: string;
  filterInvert: string;
  filterLabel: string;

  // Editor Toolbar
  toolBold: string;
  toolItalic: string;
  toolH1: string;
  toolH2: string;
  toolLatexInline: string;
  toolLatexBlock: string;
  toolTable: string;
  toolBullet: string;
  toolNumber: string;
  toolTemplate: string;
  toolClear: string;
  manualTypingNotice: string;
  launchAiTip: string;

  // Camera Modal
  cameraTitle: string;
  cameraGuide: string;
  cameraSwitch: string;
  cameraGrid: string;
  cameraTorch: string;
  cameraFit: string;
  cameraRetake: string;
  cameraConfirmAI: string;
  cameraConfirmManual: string;

  // Preferences Screen
  prefTag: string;
  prefTitle: string;
  prefSubtitle: string;
  prefEngineTitle: string;
  prefEngineHybridTitle: string;
  prefEngineHybridDesc: string;
  prefEngineLocalTitle: string;
  prefEngineLocalDesc: string;
  prefEngineBadgeActive: string;
  prefProcTitle: string;
  prefOpenCVTitle: string;
  prefOpenCVDesc: string;
  prefLatexTitle: string;
  prefLatexDesc: string;
  prefLangTitle: string;
  prefLangDesc: string;
  prefThemeTitle: string;
  prefThemeDesc: string;
  prefApiTestTitle: string;
  prefApiTestDesc: string;
  prefApiTestBtn: string;
  prefApiTestSuccess: string;
  prefApiTestFail: string;
}

const translationsFr: Translations = {
  brandTitle: "OCR Studio",
  brandTagline: "STUDIO NUMÉRIQUE & IA",
  navOverview: "Tableau de bord",
  navDocuments: "Documents",
  navCamera: "Scanner Caméra",
  navHistory: "Historique",
  navPreferences: "Préférences",
  btnImport: "Importer Image",
  btnCamera: "Scanner Caméra",
  btnExport: "Exporter",
  btnExportWord: "Word (.doc)",
  btnExportExcel: "Excel (.xlsx)",
  btnExportPdf: "PDF Pro",
  btnExportTxt: "Texte brut (.txt)",
  btnValidate: "Valider le texte",
  btnValidated: "Texte validé ✓",
  btnReset: "Réinitialiser",
  btnBack: "Retour",
  btnBackWorkspace: "Retour à l'espace de travail",
  btnScanAgain: "Scanner à nouveau",
  btnCapture: "Prendre la photo",
  btnNewDocument: "Importer un document",
  btnNewBlankDocument: "Nouveau document vierge (Saisie manuelle)",
  btnStartScan: "Démarrer une numérisation",
  btnRetry: "Réessayer",
  btnCopied: "Copié !",
  btnCopy: "Copier tout",
  btnAnalyzeAI: "⚡ Lancer l'analyse IA",
  btnManualMode: "✍️ Passer en saisie manuelle",

  apiConnected: "API Connectée",
  apiChecking: "Vérification API...",
  apiOffline: "API Hors ligne",
  themeToggleDark: "Passer au mode sombre",
  themeToggleLight: "Passer au mode clair",
  langToggle: "Changer de langue",

  greetingPrefix: "Bonjour,",
  greetingSubtitle: "Numérisez, éditez manuellement ou transcrivez automatiquement par IA vos manuscrits et notes.",
  engineTag: "Transcription Hybride & Édition Libre",
  heroBadge: "Haute Précision & Contrôle Total",
  heroTitle: "Du manuscrit au texte structuré, en toute liberté.",
  heroDescription: "Ne soyez plus bloqué par l'IA : importez vos documents, saisissez manuellement ou déclenchez l'analyse IA GPT-4o selon vos besoins. Formules mathématiques LaTeX et tableaux éditables en direct.",
  activityTitle: "Activité globale",
  activitySub: "Reconnaissances du mois",
  activityDocsCount: "documents traités avec succès",
  dragDropTitle: "Glissez-déposez votre document manuscrit ici",
  dragDropSubtitle: "PNG, JPG, WEBP · Saisie manuelle immédiate ou analyse IA à la demande",
  dragDropBrowse: "Parcourir les fichiers",
  recentDocsTitle: "Documents récents",
  recentDocsSubtitle: "Retrouvez vos transcriptions et exportations récentes",
  colName: "Document",
  colDate: "Date",
  colPages: "Pages",
  colConfidence: "Score / Statut",
  colAction: "Action",
  actionOpen: "Ouvrir",

  reviewTag: "Studio d'Édition & Transcription",
  modeSimpleEdit: "Éditeur seul",
  modeCompare: "Vue comparative (Image + Texte)",
  metricConfidence: "Précision / Confiance",
  metricConfidenceNote: "Calculée par l'algorithme",
  metricLanguage: "Langue & Mode",
  metricLanguageValue: "Français & Formules",
  metricLanguageNote: "Édition multimodale",
  metricStructured: "Structure détectée",
  metricStructuredNote: "LaTeX, Markdown & Tableaux",
  sourceDocTitle: "Document source original",
  pageCounter: "PAGE 1 / 1",
  transcriptionTitle: "Espace de Transcription",
  tabRawEditor: "Édition Seule",
  tabSplitEditor: "Édition + Rendu Direct",
  tabStructuredView: "Rendu Structuré",
  editorTip: "Édition 100% libre : Utilisez la barre d'outils ci-dessus pour enrichir votre texte ou déclenchez l'IA si souhaité.",
  emptyContentNote: "Espace prêt. Commencez à taper ou cliquez sur 'Lancer l'analyse IA'.",
  wordsCount: "mots",
  charsCount: "caractères",
  loadingApiMsg: "Analyse FastAPI en cours : Prétraitement OpenCV et transcription GPT-4o Vision...",
  errorApiTitle: "Impossible de joindre l'API FastAPI",
  errorApiTip: "Vérifiez que votre backend est opérationnel. Vous pouvez transcrire manuellement dès maintenant sans attendre l'API.",
  zoomIn: "Zoom avant",
  zoomOut: "Zoom arrière",
  zoomReset: "100%",
  zoomFit: "Ajuster",
  rotateRight: "Pivoter 90°",
  filterNormal: "Couleur normale",
  filterContrast: "Contraste renforcé",
  filterGrayscale: "Noir & Blanc",
  filterInvert: "Négatif (Haute lisibilité)",
  filterLabel: "Lisibilité image",

  toolBold: "Gras",
  toolItalic: "Italique",
  toolH1: "Titre principal",
  toolH2: "Sous-titre",
  toolLatexInline: "Formule LaTeX ($x$)",
  toolLatexBlock: "Formule LaTeX Bloc ($$...$$)",
  toolTable: "Insérer un tableau",
  toolBullet: "Liste à puces",
  toolNumber: "Liste numérotée",
  toolTemplate: "Modèle de document",
  toolClear: "Effacer tout",
  manualTypingNotice: "Mode saisie libre actif. Tapez ou modifiez à volonté.",
  launchAiTip: "Vous préférez que l'IA remplisse ce texte pour vous ?",

  cameraTitle: "Scanner Caméra Haute Résolution",
  cameraGuide: "Cadrez le document manuscrit bien à plat avec un bon éclairage",
  cameraSwitch: "Changer de caméra (Arrière / Avant)",
  cameraGrid: "Grille de cadrage",
  cameraTorch: "Lampe / Flash",
  cameraFit: "Ajuster la vue",
  cameraRetake: "Reprendre la photo",
  cameraConfirmAI: "⚡ Valider et analyser par IA",
  cameraConfirmManual: "✍️ Valider et transcrire moi-même",

  prefTag: "Configuration & Moteur",
  prefTitle: "Préférences du Studio",
  prefSubtitle: "Personnalisez votre expérience : transcription automatique, saisie manuelle, thème et connexion API.",
  prefEngineTitle: "Stratégie de transcription par défaut",
  prefEngineHybridTitle: "Mode Hybride Flexible (Recommandé)",
  prefEngineHybridDesc: "Permet de choisir librement entre saisie manuelle immédiate et transcription automatique GPT-4o Vision.",
  prefEngineLocalTitle: "Mode Manuel Prioritaire",
  prefEngineLocalDesc: "Ouvre toujours les documents en mode saisie manuelle sans déclencher d'appel IA automatique.",
  prefEngineBadgeActive: "Flexible",
  prefProcTitle: "Traitement d'image & Équations",
  prefOpenCVTitle: "Prétraitement d'image automatique (OpenCV)",
  prefOpenCVDesc: "Élimine les ombres de smartphones et renforce le contraste des écritures pâles.",
  prefLatexTitle: "Interprétation mathématique LaTeX",
  prefLatexDesc: "Rendu instantané des équations via KaTeX en haute résolution vectorielle.",
  prefLangTitle: "Langue de l'interface",
  prefLangDesc: "Basculez l'intégralité de l'application entre français et anglais.",
  prefThemeTitle: "Thème visuel",
  prefThemeDesc: "Basculez entre le mode sombre obsidienne haute visibilité et le mode clair moderne.",
  prefApiTestTitle: "Vérification Backend FastAPI",
  prefApiTestDesc: "Testez la connectivité directe avec le serveur de traitement.",
  prefApiTestBtn: "Tester la connexion API",
  prefApiTestSuccess: "Connexion réussie ! Backend opérationnel.",
  prefApiTestFail: "Échec de connexion au backend.",
};

const translationsEn: Translations = {
  brandTitle: "OCR Studio",
  brandTagline: "DIGITAL STUDIO & AI",
  navOverview: "Dashboard",
  navDocuments: "Documents",
  navCamera: "Camera Scanner",
  navHistory: "History",
  navPreferences: "Preferences",
  btnImport: "Import Image",
  btnCamera: "Camera Scanner",
  btnExport: "Export",
  btnExportWord: "Word (.doc)",
  btnExportExcel: "Excel (.xlsx)",
  btnExportPdf: "PDF Pro",
  btnExportTxt: "Plain Text (.txt)",
  btnValidate: "Validate text",
  btnValidated: "Text validated ✓",
  btnReset: "Reset",
  btnBack: "Back",
  btnBackWorkspace: "Back to workspace",
  btnScanAgain: "Scan again",
  btnCapture: "Take photo",
  btnNewDocument: "Import Document",
  btnNewBlankDocument: "New Blank Document (Manual Entry)",
  btnStartScan: "Start Scanning",
  btnRetry: "Retry",
  btnCopied: "Copied!",
  btnCopy: "Copy All",
  btnAnalyzeAI: "⚡ Run AI Analysis",
  btnManualMode: "✍️ Switch to Manual Mode",

  apiConnected: "API Connected",
  apiChecking: "Checking API...",
  apiOffline: "API Offline",
  themeToggleDark: "Switch to Dark Mode",
  themeToggleLight: "Switch to Light Mode",
  langToggle: "Switch language",

  greetingPrefix: "Welcome,",
  greetingSubtitle: "Digitize, manually edit, or automatically transcribe manuscripts and notes with AI.",
  engineTag: "Hybrid Transcription & Free Editing",
  heroBadge: "High Precision & Full Control",
  heroTitle: "From manuscript to structured text, on your own terms.",
  heroDescription: "Never get locked into AI: import your files, type manually or trigger GPT-4o multimodal analysis whenever you need. Real-time LaTeX math formulas and editable Markdown tables.",
  activityTitle: "Overall Activity",
  activitySub: "Monthly transcriptions",
  activityDocsCount: "documents successfully processed",
  dragDropTitle: "Drag and drop your manuscript document here",
  dragDropSubtitle: "PNG, JPG, WEBP · Immediate manual editing or AI analysis on demand",
  dragDropBrowse: "Browse files",
  recentDocsTitle: "Recent Documents",
  recentDocsSubtitle: "Access your latest transcriptions and exported files",
  colName: "Document",
  colDate: "Date",
  colPages: "Pages",
  colConfidence: "Score / Status",
  colAction: "Action",
  actionOpen: "Open",

  reviewTag: "Editing & Transcription Studio",
  modeSimpleEdit: "Editor only",
  modeCompare: "Comparative view (Image + Text)",
  metricConfidence: "Accuracy / Confidence",
  metricConfidenceNote: "Calculated by algorithm",
  metricLanguage: "Language & Mode",
  metricLanguageValue: "English / French & Math",
  metricLanguageNote: "Multimodal editing",
  metricStructured: "Detected Structure",
  metricStructuredNote: "LaTeX, Markdown & Tables",
  sourceDocTitle: "Original Source Document",
  pageCounter: "PAGE 1 / 1",
  transcriptionTitle: "Transcription Workspace",
  tabRawEditor: "Editor Only",
  tabSplitEditor: "Editor + Live Preview",
  tabStructuredView: "Structured View",
  editorTip: "100% Free Editing: Use the toolbar above to format your text or trigger AI analysis when desired.",
  emptyContentNote: "Workspace ready. Start typing or click 'Run AI Analysis'.",
  wordsCount: "words",
  charsCount: "characters",
  loadingApiMsg: "FastAPI analysis running: OpenCV preprocessing and GPT-4o Vision transcription...",
  errorApiTitle: "Unable to reach FastAPI backend",
  errorApiTip: "Verify your backend connection. You can continue transcribing manually right now without waiting.",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  zoomReset: "100%",
  zoomFit: "Fit image",
  rotateRight: "Rotate 90°",
  filterNormal: "Normal color",
  filterContrast: "High contrast",
  filterGrayscale: "Black & White",
  filterInvert: "Inverted (High legibility)",
  filterLabel: "Image legibility",

  toolBold: "Bold",
  toolItalic: "Italic",
  toolH1: "Heading 1",
  toolH2: "Heading 2",
  toolLatexInline: "LaTeX Inline ($x$)",
  toolLatexBlock: "LaTeX Block ($$...$$)",
  toolTable: "Insert Table",
  toolBullet: "Bullet List",
  toolNumber: "Numbered List",
  toolTemplate: "Insert Template",
  toolClear: "Clear All",
  manualTypingNotice: "Free manual editing mode. Type or modify freely.",
  launchAiTip: "Prefer the AI to fill this out for you?",

  cameraTitle: "High-Definition Camera Scanner",
  cameraGuide: "Frame the handwritten document flat with good lighting",
  cameraSwitch: "Switch camera (Rear / Front)",
  cameraGrid: "Framing grid",
  cameraTorch: "Flashlight / Torch",
  cameraFit: "Fit view",
  cameraRetake: "Retake photo",
  cameraConfirmAI: "⚡ Confirm & Analyze with AI",
  cameraConfirmManual: "✍️ Confirm & Transcribe manually",

  prefTag: "Configuration & Engine",
  prefTitle: "Studio Preferences",
  prefSubtitle: "Customize your workflow: automatic AI, manual entry, visual theme, and backend connectivity.",
  prefEngineTitle: "Default Transcription Strategy",
  prefEngineHybridTitle: "Flexible Hybrid Mode (Recommended)",
  prefEngineHybridDesc: "Choose freely between immediate manual typing and automated GPT-4o Vision transcription.",
  prefEngineLocalTitle: "Manual Priority Mode",
  prefEngineLocalDesc: "Always opens documents in manual editing mode without auto-triggering AI calls.",
  prefEngineBadgeActive: "Flexible",
  prefProcTitle: "Image Processing & Equations",
  prefOpenCVTitle: "Automatic Image Preprocessing (OpenCV)",
  prefOpenCVDesc: "Eliminates smartphone shadows and sharpens faint pencil or pen handwriting.",
  prefLatexTitle: "LaTeX Mathematical Interpretation",
  prefLatexDesc: "Real-time rendering of mathematical formulas via high-definition vector KaTeX.",
  prefLangTitle: "Interface Language",
  prefLangDesc: "Switch the entire application interface between French and English.",
  prefThemeTitle: "Display Theme",
  prefThemeDesc: "Switch between high-contrast obsidian dark mode and modern clean light mode.",
  prefApiTestTitle: "FastAPI Backend Check",
  prefApiTestDesc: "Test direct connectivity with the transcription backend server.",
  prefApiTestBtn: "Test API Connection",
  prefApiTestSuccess: "Connection successful! Backend is operational.",
  prefApiTestFail: "Failed to connect to backend.",
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('ocr_locale') as Locale | null;
    if (saved === 'fr' || saved === 'en') {
      setLocaleState(saved);
    } else {
      const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
      setLocaleState(browserLang);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('ocr_locale', l);
  };

  const toggleLocale = () => {
    setLocale(locale === 'fr' ? 'en' : 'fr');
  };

  const t = locale === 'fr' ? translationsFr : translationsEn;

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'fr' as Locale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: translationsFr,
    };
  }
  return ctx;
}
