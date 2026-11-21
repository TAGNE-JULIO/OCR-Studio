'use client';

import React, { useMemo, useState, useRef } from 'react';
import { Metric } from '../ui/Metric';
import { RichRenderer } from '../RichRenderer';
import { ImageDocument, EditorDisplayMode, ImageFilterMode } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { 
  ArrowLeft, Edit3, Sparkles, FileDown, FileSpreadsheet, 
  RotateCcw, Check, Layers, Loader2, AlertTriangle, 
  Copy, ZoomIn, ZoomOut, Maximize2, CheckCheck,
  Bold, Italic, Heading1, Heading2, Table, List, ListOrdered, 
  Sigma, Sun, SplitSquareVertical, SlidersHorizontal, RefreshCw, FileText
} from 'lucide-react';

interface ReviewScreenProps {
  currentDoc: ImageDocument | null;
  fileName: string;
  setFileName?: (name: string) => void;
  compare: boolean;
  setCompare: (c: boolean) => void;
  onBack: () => void;
  onScanAgain: () => void;
  onExportWord: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onExportTxt?: () => void;
  onTriggerAI?: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  pan: { x: number, y: number };
  scale: { x: number, y: number };
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
  recalc: () => void;
  showBoxes: boolean;
  activeLineId: number | null;
  setActiveLineId: (id: number | null) => void;
  saved: boolean;
  setSaved: (s: boolean) => void;
  updateFullText: (val: string) => void;
}

export function ReviewScreen({
  currentDoc, fileName, setFileName, compare, setCompare, onBack, onScanAgain, 
  onExportWord, onExportExcel, onExportPdf, onExportTxt, onTriggerAI,
  zoom, setZoom, setPan, pan, scale, onWheel, onMouseDown, onMouseMove, onMouseUp, 
  imgRef, recalc, showBoxes, activeLineId, setActiveLineId, saved, setSaved, updateFullText
}: ReviewScreenProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorDisplayMode>('split');
  const [imageFilter, setImageFilter] = useState<ImageFilterMode>('none');
  const [rotation, setRotation] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const DEFAULT_MANUSCRIPT_TEXT = `# Réunion produit — 6 septembre\n\nÀ retenir pour la prochaine version :\n- simplifier l'import de documents\n- afficher les mots à vérifier dès la lecture\n- permettre l'export vers Word, Excel et PDF\n\nFormule d'optimisation mathématique :\n$$ f(x) = \\sum_{i=1}^{n} w_i \\cdot \\sigma(x_i) $$\n\n| Fonctionnalité | Statut | Priorité |\n| --- | --- | --- |\n| Transcription IA | Opérationnel | Haute |\n| Édition Manuelle | Flexible | Haute |\n| Export Word/Excel | Validé | Moyenne |\n\nDécision : tester le nouveau parcours avec 8 personnes lundi.`;
  
  const resultat = currentDoc?.resultat ?? null;
  const step = currentDoc?.step ?? 'empty';
  const imageUrl = currentDoc?.url ?? null;
  const errMsg = currentDoc?.errMsg ?? null;
  const isManual = currentDoc?.transcriptionMode === 'manual';

  const textContent = currentDoc?.texteManuel !== undefined
    ? currentDoc.texteManuel
    : (resultat 
        ? resultat.texte_complet 
        : (step === 'loading' 
            ? t.loadingApiMsg 
            : (step === 'error' 
                ? `⚠️ ${t.errorApiTitle} :\n${errMsg || 'Erreur inconnue'}\n\n${t.errorApiTip}` 
                : DEFAULT_MANUSCRIPT_TEXT)));
            
  const wordsCount = useMemo(() => textContent.trim().split(/\s+/).filter(Boolean).length, [textContent]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(6, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, +(z - 0.25).toFixed(2)));
  const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const handleRotate = () => setRotation(r => (r + 90) % 360);

  // Formatting Toolbar Helpers
  const insertFormatting = (prefix: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = textContent.substring(start, end);
    const replacement = `${prefix}${selected || 'texte'}${suffix}`;
    const newText = textContent.substring(0, start) + replacement + textContent.substring(end);
    updateFullText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 5));
    }, 50);
  };

  const insertTemplate = () => {
    const template = `\n# Nouveau Document\n\n## Points Clés\n- Point important 1\n- Point important 2\n\n## Formule scientifique\n$$ E = mc^2 $$\n\n## Tableau récapitulatif\n| Paramètre | Valeur |\n| --- | --- |\n| Test 1 | 98.4% |\n`;
    updateFullText(textContent + template);
  };

  // Image filter CSS classes
  const getImageFilterClass = () => {
    switch (imageFilter) {
      case 'contrast': return 'contrast-150 saturate-125 brightness-105';
      case 'grayscale': return 'grayscale contrast-125 brightness-105';
      case 'invert': return 'invert hue-rotate-180 contrast-125';
      default: return '';
    }
  };

  const boxStyle = (boite: number[][] | null) => {
    if (!boite || boite.length < 4) return null;
    const xs = boite.map(p => p[0]);
    const ys = boite.map(p => p[1]);
    const minX = Math.min(...xs) * scale.x;
    const minY = Math.min(...ys) * scale.y;
    const maxX = Math.max(...xs) * scale.x;
    const maxY = Math.max(...ys) * scale.y;
    return {
      left: `${minX}px`,
      top: `${minY}px`,
      width: `${maxX - minX}px`,
      height: `${maxY - minY}px`,
    };
  };

  return (
    <section className="flex-1 min-w-0 px-3 py-4 sm:px-8 sm:py-8 transition-colors">
      <div className="mx-auto max-w-[1500px] space-y-6">
        
        {/* Navigation & Document Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-indigo-600 dark:text-cyan-400 hover:text-indigo-800 dark:hover:text-cyan-300 hover:underline transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>{t.btnBack}</span>
          </button>

          {/* Mode Badge & Action Button */}
          <div className="flex items-center gap-3">
            {isManual ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Edit3 className="size-3.5" />
                <span>Mode Saisie Manuelle</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-500/30">
                <Sparkles className="size-3.5" />
                <span>Mode IA Hybride</span>
              </span>
            )}

            {onTriggerAI && (
              <button
                onClick={onTriggerAI}
                disabled={step === 'loading'}
                className="btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {step === 'loading' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5 text-cyan-300" />
                )}
                <span>{step === 'loading' ? 'Analyse...' : t.btnAnalyzeAI}</span>
              </button>
            )}
          </div>
        </div>

        {/* Title and View Switcher */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="section-tag">
              <Sparkles className="size-3 text-indigo-500 dark:text-cyan-400" />
              <span>{t.reviewTag}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
              {fileName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Split Switcher [Simple] [Comparative] */}
            <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-1 text-xs font-bold shadow-xs">
              <button
                onClick={() => setCompare(false)}
                className={`rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                  !compare ? "btn-primary text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.modeSimpleEdit}
              </button>
              <button
                onClick={() => setCompare(true)}
                className={`rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                  compare ? "btn-primary text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.modeCompare}
              </button>
            </div>
          </div>
        </div>

        {/* 3 Metrics */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric 
            label={t.metricConfidence} 
            value={resultat ? `${Math.round(resultat.confiance_moyenne * 100)}%` : (step === 'loading' ? '...' : (isManual ? '100% (Manuel)' : '98,4 %'))} 
            note={isManual ? 'Saisie humaine directe' : t.metricConfidenceNote} 
          />
          <Metric 
            label={t.metricLanguage} 
            value={t.metricLanguageValue} 
            note={t.metricLanguageNote} 
          />
          <Metric 
            label={t.metricStructured} 
            value={resultat?.matrice?.length ? `${resultat.matrice.length} lignes` : 'LaTeX & Tableaux'} 
            note={t.metricStructuredNote} 
          />
        </div>

        {/* Live Loading / Error Notification */}
        {step === 'loading' && (
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-400/50 bg-indigo-50 dark:bg-indigo-950/40 px-5 py-3.5 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 shadow-md animate-pulse">
            <Loader2 className="size-5 animate-spin text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span><strong>Analyse FastAPI en cours :</strong> {t.loadingApiMsg}</span>
          </div>
        )}

        {step === 'error' && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/30 px-5 py-4 text-xs sm:text-sm text-rose-900 dark:text-rose-200 shadow-sm">
            <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">{t.errorApiTitle}</strong>
              <p className="font-mono text-xs text-rose-700 dark:text-rose-300">{errMsg}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">{t.errorApiTip}</p>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={onScanAgain}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{t.btnRetry}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Studio Dual-Pane Layout */}
        <div className={`grid overflow-hidden rounded-3xl card-glass gradient-border shadow-lg ${compare ? "xl:grid-cols-2" : ""}`}>
          
          {/* LEFT PANE: Source Image & Image Visibility Tools */}
          {compare && (
            <div className="border-b border-slate-200 dark:border-slate-800 xl:border-b-0 xl:border-r flex flex-col min-h-[620px]">
              
              {/* Image Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-indigo-600 dark:text-cyan-400" />
                  <span className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t.sourceDocTitle}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Zoom Tools */}
                  <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-1 py-0.5 text-xs shadow-xs">
                    <button onClick={handleZoomOut} title={t.zoomOut} className="p-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400">
                      <ZoomOut className="size-3.5" />
                    </button>
                    <span className="font-mono text-[11px] px-1 font-bold text-slate-800 dark:text-slate-200">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={handleZoomIn} title={t.zoomIn} className="p-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400">
                      <ZoomIn className="size-3.5" />
                    </button>
                    <button onClick={handleZoomReset} title={t.zoomReset} className="p-1 border-l border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400">
                      <Maximize2 className="size-3.5" />
                    </button>
                  </div>

                  {/* Rotate 90 deg */}
                  <button
                    onClick={handleRotate}
                    title={t.rotateRight}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-400 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>

                  {/* Image Filter Selector (Contrast, B&W, Invert) */}
                  <select
                    value={imageFilter}
                    onChange={e => setImageFilter(e.target.value as ImageFilterMode)}
                    className="text-xs font-bold py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
                    title={t.filterLabel}
                  >
                    <option value="none">🎨 {t.filterNormal}</option>
                    <option value="contrast">✨ {t.filterContrast}</option>
                    <option value="grayscale">⬛ {t.filterGrayscale}</option>
                    <option value="invert">🌓 {t.filterInvert}</option>
                  </select>

                  <button
                    onClick={onScanAgain}
                    className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline cursor-pointer ml-1"
                  >
                    {t.btnScanAgain}
                  </button>
                </div>
              </div>

              {/* Image Viewport Canvas */}
              <div className="relative flex-1 blueprint-grid p-4 sm:p-6 flex items-center justify-center overflow-hidden min-h-[500px]">
                {imageUrl ? (
                  <div
                    className="relative transition-transform duration-75 max-w-full cursor-grab active:cursor-grabbing select-none"
                    onWheel={onWheel}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    style={{ 
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)` 
                    }}
                  >
                    <img
                      ref={imgRef}
                      src={imageUrl}
                      alt="Document source"
                      onLoad={recalc}
                      className={`mx-auto min-h-[360px] max-h-[550px] max-w-full object-contain rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xl transition-all ${getImageFilterClass()}`}
                    />

                    {/* Interactive Bounding Boxes */}
                    {showBoxes && step === 'done' && resultat && (
                      <div className="absolute inset-0 pointer-events-none">
                        {resultat.lignes.map(l => {
                          const style = boxStyle(l.boite);
                          if (!style) return null;
                          const isActive = activeLineId === l.id;
                          return (
                            <div
                              key={l.id}
                              style={style}
                              className={`ocr-detection-box pointer-events-auto cursor-pointer ${isActive ? 'active' : ''}`}
                              onMouseEnter={() => setActiveLineId(l.id)}
                              onMouseLeave={() => setActiveLineId(null)}
                              onClick={() => setActiveLineId(l.id)}
                              title={`Ligne ${l.id + 1} (${Math.round(l.confiance * 100)}%)`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <article className="mx-auto min-h-[380px] max-w-[460px] bg-white dark:bg-slate-900 p-8 shadow-xl rounded-xl border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                    <p className="border-b border-indigo-200 dark:border-indigo-500/30 pb-3 font-display text-xl italic text-indigo-600 dark:text-cyan-400">
                      Document Vierge / Saisie Manuelle
                    </p>
                    <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
                      Vous pouvez taper et mettre en page votre transcription dans l'éditeur à droite.
                    </p>
                    <p className="mt-4 text-xs font-mono text-indigo-600 dark:text-cyan-300">
                      💡 Importez une image ou ouvrez la caméra à tout moment pour afficher un document source ici.
                    </p>
                  </article>
                )}
              </div>
            </div>
          )}

          {/* RIGHT PANE: Flexible Editor with Full Formatting Toolbar */}
          <div className="flex flex-col min-h-[620px] bg-white/70 dark:bg-slate-950/70">
            
            {/* Top Toolbar: Display Modes & Validation */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.transcriptionTitle}
                </span>

                {/* 3 Display Modes */}
                <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-0.5 text-xs">
                  <button
                    onClick={() => setEditorMode('edit')}
                    title={t.tabRawEditor}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
                      editorMode === 'edit'
                        ? 'btn-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Edit3 className="size-3" />
                    <span className="hidden sm:inline">{t.tabRawEditor}</span>
                  </button>

                  <button
                    onClick={() => setEditorMode('split')}
                    title={t.tabSplitEditor}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
                      editorMode === 'split'
                        ? 'btn-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <SplitSquareVertical className="size-3" />
                    <span className="hidden sm:inline">{t.tabSplitEditor}</span>
                  </button>

                  <button
                    onClick={() => setEditorMode('preview')}
                    title={t.tabStructuredView}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
                      editorMode === 'preview'
                        ? 'btn-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="size-3 text-cyan-400" />
                    <span className="hidden sm:inline">{t.tabStructuredView}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={copyToClipboard}
                  title={copied ? t.btnCopied : t.btnCopy}
                  className="btn-ghost flex items-center gap-1 rounded-xl px-2.5 sm:px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="size-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{t.btnCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-indigo-500 dark:text-cyan-400" />
                      <span className="hidden sm:inline">{t.btnCopy}</span>
                    </>
                  )}
                </button>

                {/* Validate Button */}
                <button
                  onClick={() => setSaved(!saved)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1 font-mono text-xs font-bold transition cursor-pointer ${
                    saved 
                      ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40" 
                      : "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 hover:bg-indigo-100"
                  }`}
                >
                  <Check className="size-3.5" />
                  <span>{saved ? t.btnValidated : t.btnValidate}</span>
                </button>
              </div>
            </div>

            {/* Rich Markdown & LaTeX Formatting Toolbar */}
            {editorMode !== 'preview' && (
              <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                <button onClick={() => insertFormatting('**', '**')} title={t.toolBold} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition">
                  <Bold className="size-3.5" />
                </button>
                <button onClick={() => insertFormatting('*', '*')} title={t.toolItalic} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition">
                  <Italic className="size-3.5" />
                </button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                <button onClick={() => insertFormatting('# ')} title={t.toolH1} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 font-bold transition">
                  H1
                </button>
                <button onClick={() => insertFormatting('## ')} title={t.toolH2} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 font-bold transition">
                  H2
                </button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                <button onClick={() => insertFormatting('$', '$')} title={t.toolLatexInline} className="px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-800 font-mono font-bold text-indigo-600 dark:text-cyan-400 transition">
                  $x$
                </button>
                <button onClick={() => insertFormatting('\n$$ ', ' $$\n')} title={t.toolLatexBlock} className="px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-800 font-mono font-bold text-indigo-600 dark:text-cyan-400 transition">
                  $$\sum$$
                </button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                <button onClick={() => insertFormatting('\n| Colonne 1 | Colonne 2 |\n| --- | --- |\n| Donnée 1 | Donnée 2 |\n')} title={t.toolTable} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition">
                  <Table className="size-3.5" />
                </button>
                <button onClick={() => insertFormatting('- ')} title={t.toolBullet} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition">
                  <List className="size-3.5" />
                </button>
                <button onClick={() => insertFormatting('1. ')} title={t.toolNumber} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition">
                  <ListOrdered className="size-3.5" />
                </button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                <button onClick={insertTemplate} title={t.toolTemplate} className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-cyan-300 font-semibold hover:bg-indigo-100 transition">
                  + {t.toolTemplate}
                </button>
              </div>
            )}

            {/* Central Editor Area */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-hidden flex flex-col">
                
                {/* Mode 1: Editor Only */}
                {editorMode === 'edit' && (
                  <textarea
                    ref={textareaRef}
                    value={textContent}
                    onChange={e => updateFullText(e.target.value)}
                    placeholder="Tapez ou collez votre texte ici..."
                    aria-label="Zone d'édition"
                    className="flex-1 w-full min-h-[420px] resize-none font-mono text-[14px] leading-relaxed text-slate-800 dark:text-slate-100 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-cyan-400 focus:outline-none transition-all shadow-inner"
                  />
                )}

                {/* Mode 2: Split Mode (Editor on Left, Live KaTeX/Markdown on Right) */}
                {editorMode === 'split' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[420px]">
                    <textarea
                      ref={textareaRef}
                      value={textContent}
                      onChange={e => updateFullText(e.target.value)}
                      placeholder="Tapez votre markdown et formules LaTeX..."
                      aria-label="Zone d'édition fractionnée"
                      className="w-full h-full min-h-[380px] resize-none font-mono text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-100 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-cyan-400 focus:outline-none transition shadow-inner"
                    />
                    <div className="w-full h-full min-h-[380px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 overflow-y-auto">
                      <div className="pb-2 border-b border-slate-200 dark:border-slate-800 mb-3 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Rendu direct (KaTeX & Markdown)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Temps réel
                        </span>
                      </div>
                      <RichRenderer content={textContent} />
                    </div>
                  </div>
                )}

                {/* Mode 3: Structured View Only */}
                {editorMode === 'preview' && (
                  <div className="flex-1 min-h-[420px] p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 overflow-y-auto">
                    {textContent.trim() ? (
                      <RichRenderer content={textContent} />
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500 italic text-sm font-mono">{t.emptyContentNote}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Metadata & Export Action Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">{wordsCount}</span> {t.wordsCount}
                  <span>·</span>
                  <span className="font-bold text-slate-900 dark:text-white">{textContent.length}</span> {t.charsCount}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onExportWord}
                    className="btn-ghost flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition cursor-pointer"
                  >
                    <FileDown className="size-3.5 text-indigo-500 dark:text-cyan-400" />
                    <span>Word (.doc)</span>
                  </button>

                  <button
                    onClick={onExportExcel}
                    className="btn-ghost flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-500" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={onExportPdf}
                    className="btn-primary flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-sm transition cursor-pointer"
                  >
                    <FileDown className="size-3.5" />
                    <span>PDF Pro</span>
                  </button>

                  {onExportTxt && (
                    <button
                      onClick={onExportTxt}
                      className="btn-ghost flex items-center gap-1 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 transition cursor-pointer"
                      title={t.btnExportTxt}
                    >
                      <FileText className="size-3.5" />
                      <span>TXT</span>
                    </button>
                  )}

                  <button
                    onClick={() => updateFullText('')}
                    className="rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    {t.toolClear}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
