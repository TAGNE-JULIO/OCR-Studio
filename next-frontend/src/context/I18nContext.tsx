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
  btnValidate: string;
  btnValidated: string;
  btnReset: string;
  btnBack: string;
  btnBackWorkspace: string;
  btnScanAgain: string;
  btnCapture: string;
  btnNewDocument: string;
  btnStartScan: string;
  btnRetry: string;
  btnCopied: string;
  btnCopy: string;

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

  // Review Screen
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

  // Camera Modal
  cameraTitle: string;
  cameraGuide: string;
  cameraSwitch: string;

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
  brandTagline: "AI MANUSCRIPT STUDIO",
  navOverview: "Vue d'ensemble",
  navDocuments: "Documents",
  navCamera: "Scanner Caméra",
  navHistory: "Historique",
  navPreferences: "Préférences",
  btnImport: "Importer",
  btnCamera: "Caméra",
  btnExport: "Exporter",
  btnExportWord: "Word (.doc)",
  btnExportExcel: "Excel (.xlsx)",
  btnExportPdf: "PDF Pro",
  btnValidate: "Valider le texte",
  btnValidated: "Texte validé",
  btnReset: "Réinitialiser",
  btnBack: "Retour à la vue d'ensemble",
  btnBackWorkspace: "Retour à l'espace de travail",
  btnScanAgain: "Scanner à nouveau",
  btnCapture: "Capturer",
  btnNewDocument: "Nouveau document",
  btnStartScan: "Démarrer une numérisation",
  btnRetry: "Réessayer",
  btnCopied: "Copié !",
  btnCopy: "Copier",

  apiConnected: "API Connectée",
  apiChecking: "Vérification API...",
  apiOffline: "API Hors ligne",
  themeToggleDark: "Passer au mode sombre",
  themeToggleLight: "Passer au mode clair",
  langToggle: "Changer de langue",

  greetingPrefix: "Bonjour,",
  greetingSubtitle: "Prêt à numériser et transformer vos notes manuscrites en texte parfait ?",
  engineTag: "Moteur IA Hybride & OpenCV",
  heroBadge: "Haute Précision OCR Studio",
  heroTitle: "Du manuscrit au texte structuré, sans bavure.",
  heroDescription: "Importez vos photos de cours, comptes-rendus, tableaux et formules mathématiques. Notre algorithme OpenCV retire les ombres et l'IA retranscrit tout en LaTeX et Markdown.",
  activityTitle: "Activité globale",
  activitySub: "Reconnaissances du mois",
  activityDocsCount: "documents numérisés avec succès",
  dragDropTitle: "Glissez-déposez votre document ici",
  dragDropSubtitle: "PNG, JPG, WEBP jusqu'à 25 Mo · Traitement instantané par IA",
  dragDropBrowse: "Parcourir les fichiers",
  recentDocsTitle: "Documents récents",
  recentDocsSubtitle: "Retrouvez vos transcriptions et exportations récentes",
  colName: "Document",
  colDate: "Date",
  colPages: "Pages",
  colConfidence: "Score de précision",
  colAction: "Action",
  actionOpen: "Ouvrir",

  reviewTag: "Analyse OCR Précise",
  modeSimpleEdit: "Édition simple",
  modeCompare: "Vue comparative",
  metricConfidence: "Niveau de confiance",
  metricConfidenceNote: "Haute fidélité contextuelle",
  metricLanguage: "Langue détectée",
  metricLanguageValue: "Français & Maths",
  metricLanguageNote: "Reconnaissance multimodale",
  metricStructured: "Éléments structurés",
  metricStructuredNote: "Tableaux & LaTeX formatés",
  sourceDocTitle: "Document source original",
  pageCounter: "PAGE 1 / 1",
  transcriptionTitle: "Transcription IA",
  tabRawEditor: "Éditeur Brut",
  tabStructuredView: "Rendu Structuré",
  editorTip: "Mode édition direct : Modifiez librement le texte. Les formules LaTeX et tableaux Markdown s'actualisent en direct.",
  emptyContentNote: "Aucun contenu disponible. Analysez un document.",
  wordsCount: "mots",
  charsCount: "caractères",
  loadingApiMsg: "Analyse FastAPI en direct : Prétraitement OpenCV, détection spatiale et transcription IA GPT-4o en cours...",
  errorApiTitle: "Impossible de joindre l'API FastAPI",
  errorApiTip: "Vérifiez que la variable NEXT_PUBLIC_API_URL est bien configurée dans Vercel avec l'URL de votre backend FastAPI (ex: https://ocr-studio-api.vercel.app).",
  zoomIn: "Zoom avant",
  zoomOut: "Zoom arrière",
  zoomReset: "Réinitialiser zoom",
  zoomFit: "Ajuster l'image",

  cameraTitle: "Scanner Pro · OCR Studio",
  cameraGuide: "Alignez le document manuscrit dans ce cadre",
  cameraSwitch: "Changer de caméra",

  prefTag: "Paramètres Système",
  prefTitle: "Préférences & Moteur OCR",
  prefSubtitle: "Configurez les algorithmes de prétraitement, le thème, la langue et la communication API.",
  prefEngineTitle: "Moteur de reconnaissance (OCR)",
  prefEngineHybridTitle: "Mode Hybride Intelligent (Recommandé)",
  prefEngineHybridDesc: "Combine le prétraitement OpenCV (suppression d'ombres), GPT-4o Vision et EasyOCR local. Idéal pour les formules mathématiques en LaTeX et les tableaux Markdown.",
  prefEngineLocalTitle: "Mode 100% Local (Open Source EasyOCR)",
  prefEngineLocalDesc: "Exécution autonome sur processeur local sans dépendance cloud.",
  prefEngineBadgeActive: "Actif",
  prefProcTitle: "Exportation & Prétraitement",
  prefOpenCVTitle: "Prétraitement d'image automatique (OpenCV)",
  prefOpenCVDesc: "Supprime les ombres de smartphone et redresse les scans inclinés.",
  prefLatexTitle: "Interprétation mathématique LaTeX",
  prefLatexDesc: "Rend les équations avec KaTeX en haute résolution.",
  prefLangTitle: "Langue de l'interface",
  prefLangDesc: "Basculez l'intégralité de l'interface entre français et anglais.",
  prefThemeTitle: "Thème d'affichage",
  prefThemeDesc: "Choisissez entre le mode sombre obsidian ou le mode clair moderne.",
  prefApiTestTitle: "Vérification Backend FastAPI",
  prefApiTestDesc: "Testez la connectivité directe avec l'API de transcription.",
  prefApiTestBtn: "Tester la connexion API",
  prefApiTestSuccess: "Connexion réussie ! Backend opérationnel.",
  prefApiTestFail: "Échec de connexion au backend.",
};

const translationsEn: Translations = {
  brandTitle: "OCR Studio",
  brandTagline: "AI MANUSCRIPT STUDIO",
  navOverview: "Overview",
  navDocuments: "Documents",
  navCamera: "Camera Scanner",
  navHistory: "History",
  navPreferences: "Preferences",
  btnImport: "Import",
  btnCamera: "Camera",
  btnExport: "Export",
  btnExportWord: "Word (.doc)",
  btnExportExcel: "Excel (.xlsx)",
  btnExportPdf: "PDF Pro",
  btnValidate: "Validate text",
  btnValidated: "Text validated",
  btnReset: "Reset",
  btnBack: "Back to overview",
  btnBackWorkspace: "Back to workspace",
  btnScanAgain: "Scan again",
  btnCapture: "Capture",
  btnNewDocument: "New document",
  btnStartScan: "Start scanning",
  btnRetry: "Retry",
  btnCopied: "Copied!",
  btnCopy: "Copy",

  apiConnected: "API Connected",
  apiChecking: "Checking API...",
  apiOffline: "API Offline",
  themeToggleDark: "Switch to Dark Mode",
  themeToggleLight: "Switch to Light Mode",
  langToggle: "Switch language",

  greetingPrefix: "Welcome,",
  greetingSubtitle: "Ready to scan and transform your handwritten notes into structured text?",
  engineTag: "Hybrid AI Engine & OpenCV",
  heroBadge: "High Precision OCR Studio",
  heroTitle: "From manuscript to structured text, flawless.",
  heroDescription: "Import lecture notes, meeting memos, tables, and mathematical formulas. Our OpenCV algorithm removes shadows while multimodal AI transcribes everything to LaTeX and Markdown.",
  activityTitle: "Overall Activity",
  activitySub: "Monthly transcriptions",
  activityDocsCount: "documents successfully scanned",
  dragDropTitle: "Drag and drop your document here",
  dragDropSubtitle: "PNG, JPG, WEBP up to 25 MB · Instant AI transcription",
  dragDropBrowse: "Browse files",
  recentDocsTitle: "Recent Documents",
  recentDocsSubtitle: "Access your latest transcriptions and exported files",
  colName: "Document",
  colDate: "Date",
  colPages: "Pages",
  colConfidence: "Accuracy score",
  colAction: "Action",
  actionOpen: "Open",

  reviewTag: "High Precision OCR Analysis",
  modeSimpleEdit: "Simple edit",
  modeCompare: "Comparative view",
  metricConfidence: "Confidence Level",
  metricConfidenceNote: "High contextual fidelity",
  metricLanguage: "Detected Language",
  metricLanguageValue: "English / French & Math",
  metricLanguageNote: "Multimodal recognition",
  metricStructured: "Structured Items",
  metricStructuredNote: "Formatted Tables & LaTeX",
  sourceDocTitle: "Original Source Document",
  pageCounter: "PAGE 1 / 1",
  transcriptionTitle: "AI Transcription",
  tabRawEditor: "Raw Editor",
  tabStructuredView: "Structured View",
  editorTip: "Direct edit mode: Edit text freely. LaTeX formulas and Markdown tables update in real time.",
  emptyContentNote: "No content available. Analyze a document to get started.",
  wordsCount: "words",
  charsCount: "characters",
  loadingApiMsg: "Live FastAPI Analysis: OpenCV preprocessing, spatial line detection, and GPT-4o vision transcription in progress...",
  errorApiTitle: "Unable to reach FastAPI backend",
  errorApiTip: "Verify that the NEXT_PUBLIC_API_URL environment variable is configured in Vercel with your FastAPI backend URL (e.g. https://ocr-studio-api.vercel.app).",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  zoomReset: "Reset zoom",
  zoomFit: "Fit image",

  cameraTitle: "Scanner Pro · OCR Studio",
  cameraGuide: "Align handwritten document inside this frame",
  cameraSwitch: "Switch camera",

  prefTag: "System Settings",
  prefTitle: "Preferences & OCR Engine",
  prefSubtitle: "Configure preprocessing algorithms, visual theme, language, and API connectivity.",
  prefEngineTitle: "Recognition Engine (OCR)",
  prefEngineHybridTitle: "Smart Hybrid Mode (Recommended)",
  prefEngineHybridDesc: "Combines OpenCV shadow removal, GPT-4o Vision, and fallback EasyOCR. Ideal for LaTeX mathematical expressions and Markdown tables.",
  prefEngineLocalTitle: "100% Local Mode (Open Source EasyOCR)",
  prefEngineLocalDesc: "Autonomous execution on local CPU without cloud dependency.",
  prefEngineBadgeActive: "Active",
  prefProcTitle: "Export & Preprocessing",
  prefOpenCVTitle: "Automatic Image Preprocessing (OpenCV)",
  prefOpenCVDesc: "Removes smartphone shadows and straightens tilted scans.",
  prefLatexTitle: "LaTeX Mathematical Interpretation",
  prefLatexDesc: "Renders equations with KaTeX in high definition.",
  prefLangTitle: "Interface Language",
  prefLangDesc: "Switch the entire application interface between French and English.",
  prefThemeTitle: "Display Theme",
  prefThemeDesc: "Choose between sleek obsidian dark mode and clean modern light mode.",
  prefApiTestTitle: "FastAPI Backend Check",
  prefApiTestDesc: "Test direct connectivity with the transcription API service.",
  prefApiTestBtn: "Test API Connection",
  prefApiTestSuccess: "Connection successful! Backend is online.",
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
