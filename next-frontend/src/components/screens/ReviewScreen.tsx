'use client';

import React, { useMemo, useState } from 'react';
import { Metric } from '../ui/Metric';
import { RichRenderer } from '../RichRenderer';
import { ImageDocument } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { 
  ArrowLeft, Edit3, Sparkles, FileDown, FileSpreadsheet, 
  RotateCcw, Check, Layers, Loader2, AlertTriangle, 
  Copy, ZoomIn, ZoomOut, Maximize2, FileText, CheckCheck
} from 'lucide-react';

interface ReviewScreenProps {
  currentDoc: ImageDocument | null;
  fileName: string;
  compare: boolean;
  setCompare: (c: boolean) => void;
  onBack: () => void;
  onScanAgain: () => void;
  onExportWord: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
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
  richView: boolean;
  setRichView: (r: boolean) => void;
  updateFullText: (val: string) => void;
}

export function ReviewScreen({
  currentDoc, fileName, compare, setCompare, onBack, onScanAgain, onExportWord, onExportExcel, onExportPdf,
  zoom, setZoom, setPan, pan, scale, onWheel, onMouseDown, onMouseMove, onMouseUp, imgRef, recalc,
  showBoxes, activeLineId, setActiveLineId, saved, setSaved, richView, setRichView, updateFullText
}: ReviewScreenProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const DEFAULT_MANUSCRIPT_TEXT = `Réunion produit — 6 septembre\n\nÀ retenir pour la prochaine version :\n• simplifier l'import de documents\n• afficher les mots à vérifier dès la lecture\n• permettre l'export vers Notion et Google Docs\n\nFormule d'optimisation :\n$$ f(x) = \\sum_{i=1}^{n} w_i \\cdot \\sigma(x_i) $$\n\nDécision : tester le nouveau parcours avec 8 personnes lundi.`;
  
  const resultat = currentDoc?.resultat ?? null;
  const step = currentDoc?.step ?? 'empty';
  const imageUrl = currentDoc?.url ?? null;
  const errMsg = currentDoc?.errMsg ?? null;

  const textContent = resultat 
    ? resultat.texte_complet 
    : (step === 'loading' 
        ? t.loadingApiMsg
        : (step === 'error' 
            ? `⚠️ ${t.errorApiTitle} :\n${errMsg || 'Erreur inconnue'}\n\n${t.errorApiTip}` 
            : DEFAULT_MANUSCRIPT_TEXT));
            
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
    <section className="flex-1 min-w-0 px-4 py-6 sm:px-10 sm:py-10 transition-colors">
      <div className="mx-auto max-w-[1380px] space-y-7">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-mono font-bold text-indigo-600 dark:text-[#22d4fd] hover:text-indigo-800 dark:hover:text-[#a98bff] hover:underline transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>{t.btnBack}</span>
        </button>

        {/* Title and Segmented Switcher */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-2">
          <div className="space-y-1.5">
            <div className="section-tag">
              <Sparkles className="size-3 text-indigo-500 dark:text-[#22d4fd]" />
              <span>{t.reviewTag}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
              {fileName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented Switcher [Édition simple] [Vue comparative] */}
            <div className="flex rounded-xl border border-slate-200 dark:border-[#1e2640] bg-slate-100 dark:bg-[#0f1422] p-1 text-xs font-bold shadow-inner">
              <button
                onClick={() => setCompare(false)}
                className={`rounded-lg px-4 py-2 transition-all cursor-pointer ${
                  !compare ? "btn-primary text-white shadow-xs" : "text-slate-600 dark:text-[#8892b0] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.modeSimpleEdit}
              </button>
              <button
                onClick={() => setCompare(true)}
                className={`rounded-lg px-4 py-2 transition-all cursor-pointer ${
                  compare ? "btn-primary text-white shadow-xs" : "text-slate-600 dark:text-[#8892b0] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.modeCompare}
              </button>
            </div>
          </div>
        </div>

        {/* 3 Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric 
            label={t.metricConfidence} 
            value={resultat ? `${Math.round(resultat.confiance_moyenne * 100)}%` : (step === 'loading' ? '...' : (step === 'error' ? '0%' : '98,4 %'))} 
            note={t.metricConfidenceNote} 
          />
          <Metric 
            label={t.metricLanguage} 
            value={t.metricLanguageValue} 
            note={t.metricLanguageNote} 
          />
          <Metric 
            label={t.metricStructured} 
            value={resultat?.matrice?.length ? `${resultat.matrice.length} lines` : (step === 'done' ? 'Formaté' : 'Auto')} 
            note={t.metricStructuredNote} 
          />
        </div>

        {/* Live Status Banner */}
        {step === 'loading' && (
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-300 dark:border-[#7c5cfc]/50 bg-indigo-50 dark:bg-[#7c5cfc]/15 px-6 py-4 text-sm text-indigo-700 dark:text-[#a98bff] shadow-sm dark:shadow-[0_0_30px_rgba(124,92,252,0.25)] animate-pulse">
            <Loader2 className="size-5 animate-spin text-cyan-600 dark:text-[#22d4fd]" />
            <span><strong>FastAPI Analysis:</strong> {t.loadingApiMsg}</span>
          </div>
        )}

        {step === 'error' && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/30 px-6 py-4 text-sm text-rose-800 dark:text-rose-300 shadow-sm">
            <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">{t.errorApiTitle}</strong>
              <p className="text-xs font-mono">{errMsg}</p>
              <p className="text-xs text-slate-500 dark:text-[#8892b0] pt-1">
                {t.errorApiTip}
              </p>
              <button
                onClick={onScanAgain}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                <RotateCcw className="size-3.5" />
                <span>{t.btnRetry}</span>
              </button>
            </div>
          </div>
        )}

        {/* Dual Panel Studio Card */}
        <div className={`grid overflow-hidden rounded-3xl card-glass gradient-border shadow-lg dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${compare ? "xl:grid-cols-2" : ""}`}>
          
          {/* Left Panel: Original Source Document */}
          {compare && (
            <div className="border-b border-slate-200 dark:border-[#1e2640] xl:border-b-0 xl:border-r flex flex-col min-h-[580px]">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e2640] bg-slate-50/80 dark:bg-[#131928]/60 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-indigo-500 dark:text-[#7c5cfc]" />
                  <span className="font-display text-sm font-bold text-slate-900 dark:text-white">{t.sourceDocTitle}</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Zoom Controls Toolbar */}
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-[#1e2640] bg-white dark:bg-[#0c101d] px-1.5 py-1 text-xs">
                    <button onClick={handleZoomOut} title={t.zoomOut} className="p-1 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300">
                      <ZoomOut className="size-3.5" />
                    </button>
                    <span className="font-mono text-[11px] px-1 font-semibold text-slate-700 dark:text-slate-200">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={handleZoomIn} title={t.zoomIn} className="p-1 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300">
                      <ZoomIn className="size-3.5" />
                    </button>
                    <button onClick={handleZoomReset} title={t.zoomReset} className="p-1 border-l border-slate-200 dark:border-[#1e2640] text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300 ml-0.5">
                      <Maximize2 className="size-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={onScanAgain}
                    className="font-mono text-xs font-bold text-indigo-600 dark:text-[#a98bff] hover:text-cyan-600 dark:hover:text-[#22d4fd] hover:underline cursor-pointer transition"
                  >
                    {t.btnScanAgain}
                  </button>
                </div>
              </div>

              {/* Source Image Canvas */}
              <div className="relative flex-1 blueprint-grid p-6 sm:p-8 flex items-center justify-center overflow-hidden min-h-[480px]">
                {imageUrl ? (
                  <div
                    className="relative transition-transform duration-75 max-w-full cursor-grab active:cursor-grabbing select-none"
                    onWheel={onWheel}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                  >
                    <img
                      ref={imgRef}
                      src={imageUrl}
                      alt="Document source"
                      onLoad={recalc}
                      className="mx-auto min-h-[380px] max-h-[520px] max-w-full object-contain shadow-2xl rounded-xl border border-slate-200 dark:border-[#1e2640]"
                    />

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
                  <article className="mx-auto min-h-[400px] max-w-[460px] -rotate-1 bg-white dark:bg-[#0f1422] p-9 shadow-2xl rounded-xl border border-slate-200 dark:border-[#1e2640] text-slate-800 dark:text-[#e8eaf2]">
                    <p className="border-b border-indigo-200 dark:border-[#7c5cfc]/30 pb-3 font-display text-2xl italic text-indigo-600 dark:text-[#a98bff]">
                      Réunion produit — 6 septembre
                    </p>
                    <p className="mt-8 font-serif text-lg leading-8 text-slate-600 dark:text-[#8892b0]">
                      À retenir pour la prochaine version :
                    </p>
                    <p className="mt-4 font-serif text-lg leading-8 text-slate-800 dark:text-[#d0d7e5]">
                      — simplifier l'import de documents<br/>
                      — afficher les mots à vérifier dès la lecture<br/>
                      — permettre l'export vers Notion et Google Docs
                    </p>
                    <p className="mt-8 font-serif text-lg leading-8 text-cyan-600 dark:text-[#22d4fd]">
                      Décision : tester le nouveau parcours avec 8 personnes lundi.
                    </p>
                  </article>
                )}
              </div>
            </div>
          )}

          {/* Right Panel: Recognized Transcription */}
          <div className="flex flex-col min-h-[580px] bg-white/60 dark:bg-[#0c101d]/60">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2640] bg-slate-50/80 dark:bg-[#131928]/60 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-white">{t.transcriptionTitle}</span>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#1e2640] bg-slate-100 dark:bg-[#080b14] p-1">
                  <button
                    onClick={() => setRichView(false)}
                    title={t.tabRawEditor}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      !richView
                        ? 'btn-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-[#8892b0] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Edit3 className="size-3.5" />
                    <span>{t.tabRawEditor}</span>
                  </button>
                  <button
                    onClick={() => setRichView(true)}
                    title={t.tabStructuredView}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      richView
                        ? 'btn-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-[#8892b0] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="size-3.5 text-cyan-500 dark:text-[#22d4fd]" />
                    <span>{t.tabStructuredView}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Copy Button */}
                <button
                  onClick={copyToClipboard}
                  title={copied ? t.btnCopied : t.btnCopy}
                  className="btn-ghost flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:text-[#e8eaf2] transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="size-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">{t.btnCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-slate-500 dark:text-[#22d4fd]" />
                      <span>{t.btnCopy}</span>
                    </>
                  )}
                </button>

                {/* Validate Button */}
                <button
                  onClick={() => setSaved(!saved)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold transition cursor-pointer ${
                    saved 
                      ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 shadow-xs" 
                      : "bg-indigo-50 dark:bg-[#7c5cfc]/20 text-indigo-600 dark:text-[#a98bff] border border-indigo-200 dark:border-[#7c5cfc]/40 hover:bg-indigo-100 dark:hover:bg-[#7c5cfc]/30"
                  }`}
                >
                  <Check className="size-3.5" />
                  <span>{saved ? t.btnValidated : t.btnValidate}</span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between overflow-auto">
              <div className="flex-1 space-y-4">
                {!saved && !richView && (
                  <div className="rounded-xl bg-indigo-50 dark:bg-[#7c5cfc]/10 border border-indigo-200 dark:border-[#7c5cfc]/30 px-4 py-3 text-xs text-indigo-700 dark:text-[#a98bff] flex items-center justify-between">
                    <span>💡 {t.editorTip}</span>
                  </div>
                )}

                {richView ? (
                  <div className="min-h-[380px] p-5 rounded-2xl bg-white dark:bg-[#080b14]/70 border border-slate-200 dark:border-[#1e2640] overflow-y-auto">
                    {textContent.trim() ? (
                      <RichRenderer content={textContent} />
                    ) : (
                      <p className="text-slate-400 dark:text-[#8892b0] italic text-sm font-mono">{t.emptyContentNote}</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={textContent}
                    onChange={event => updateFullText(event.target.value)}
                    aria-label="Texte reconnu"
                    className="min-h-[380px] w-full resize-none font-mono text-[14px] leading-relaxed text-slate-800 dark:text-[#c8d4e8] p-5 rounded-2xl bg-white dark:bg-[#080b14]/70 border border-slate-200 dark:border-[#1e2640] focus:border-indigo-500 dark:focus:border-[#7c5cfc] focus:outline-none transition-all shadow-inner"
                  />
                )}
              </div>

              {/* Bottom Bar: Word count & Exports */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-[#1e2640] pt-5 text-xs text-slate-500 dark:text-[#8892b0]">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">{wordsCount}</span> {t.wordsCount}
                  <span>·</span>
                  <span className="font-bold text-slate-900 dark:text-white">{textContent.length}</span> {t.charsCount}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={onExportWord}
                    className="btn-ghost flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold text-slate-700 dark:text-[#e8eaf2] transition cursor-pointer"
                  >
                    <FileDown className="size-3.5 text-indigo-500 dark:text-[#22d4fd]" />
                    <span>{t.btnExportWord}</span>
                  </button>
                  <button
                    onClick={onExportExcel}
                    className="btn-ghost flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold text-slate-700 dark:text-[#e8eaf2] transition cursor-pointer"
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>{t.btnExportExcel}</span>
                  </button>
                  <button
                    onClick={onExportPdf}
                    className="btn-primary flex items-center gap-1.5 rounded-xl px-4 py-1.5 font-mono text-xs font-bold text-white shadow-md transition cursor-pointer"
                  >
                    <FileDown className="size-3.5" />
                    <span>{t.btnExportPdf}</span>
                  </button>
                  <button
                    onClick={() => setSaved(false)}
                    className="rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-500 dark:text-[#8892b0] hover:text-indigo-600 dark:hover:text-[#22d4fd] hover:underline transition cursor-pointer"
                  >
                    {t.btnReset}
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
