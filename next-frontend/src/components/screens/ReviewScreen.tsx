import React, { useMemo } from 'react';
import { Metric } from '../ui/Metric';
import { RichRenderer } from '../RichRenderer';
import { ImageDocument } from '../../types';
import { 
  ArrowLeft, Edit3, Sparkles, FileDown, FileSpreadsheet, 
  RotateCcw, Check, Eye, Layers
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
  zoom, pan, scale, onWheel, onMouseDown, onMouseMove, onMouseUp, imgRef, recalc,
  showBoxes, activeLineId, setActiveLineId, saved, setSaved, richView, setRichView, updateFullText
}: ReviewScreenProps) {
  const DEFAULT_MANUSCRIPT_TEXT = `Réunion produit — 6 septembre\n\nÀ retenir pour la prochaine version :\n• simplifier l'import de documents\n• afficher les mots à vérifier dès la lecture\n• permettre l'export vers Notion et Google Docs\n\nDécision : tester le nouveau parcours avec 8 personnes lundi.`;
  const resultat = currentDoc?.resultat ?? null;
  const step = currentDoc?.step ?? 'empty';
  const imageUrl = currentDoc?.url ?? null;

  const textContent = resultat ? resultat.texte_complet : DEFAULT_MANUSCRIPT_TEXT;
  const wordsCount = useMemo(() => textContent.trim().split(/\s+/).filter(Boolean).length, [textContent]);

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
    <section className="flex-1 min-w-0 px-6 py-8 sm:px-10 sm:py-10">
      <div className="mx-auto max-w-[1380px] space-y-7">
        
        {/* Bouton Retour élégant */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-mono font-bold text-[#22d4fd] hover:text-[#a98bff] hover:underline transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Retour à la vue d'ensemble</span>
        </button>

        {/* Ligne de Titres et Switcher Segmenté */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-2">
          <div className="space-y-1.5">
            <div className="section-tag">
              <Sparkles className="size-3 text-[#22d4fd]" />
              <span>Analyse OCR Précise</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
              {fileName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented Switcher [Éditer] [Comparer] */}
            <div className="flex rounded-xl border border-[#1e2640] bg-[#0f1422] p-1 text-xs font-bold shadow-inner">
              <button
                onClick={() => setCompare(false)}
                className={`rounded-lg px-4 py-2 transition-all cursor-pointer ${
                  !compare ? "btn-primary text-white shadow-sm" : "text-[#8892b0] hover:text-white"
                }`}
              >
                Édition simple
              </button>
              <button
                onClick={() => setCompare(true)}
                className={`rounded-lg px-4 py-2 transition-all cursor-pointer ${
                  compare ? "btn-primary text-white shadow-sm" : "text-[#8892b0] hover:text-white"
                }`}
              >
                Vue comparative
              </button>
            </div>
          </div>
        </div>

        {/* 3 Métriques Document */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Niveau de confiance" value={resultat ? `${Math.round(resultat.confiance_moyenne * 100)}%` : "98,4 %"} note="Haute fidélité contextuelle" />
          <Metric label="Langue détectée" value="Français & Maths" note="Reconnaissance multimodale" />
          <Metric label="Éléments structurés" value={resultat?.matrice?.length ? `${resultat.matrice.length} lignes` : "Parfait"} note="Tableaux & LaTeX formatés" />
        </div>

        {/* ── CARTE DOUBLE PANNEAU EN VERRE NÉON ── */}
        <div className={`grid overflow-hidden rounded-3xl card-glass gradient-border shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${compare ? "xl:grid-cols-2" : ""}`}>
          
          {/* Panneau de Gauche : Document Source */}
          {compare && (
            <div className="border-b border-[#1e2640] xl:border-b-0 xl:border-r flex flex-col min-h-[580px]">
              <div className="flex justify-between items-center border-b border-[#1e2640] bg-[#131928]/60 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-[#7c5cfc]" />
                  <span className="font-display text-sm font-bold text-white">Document source original</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-[#22d4fd] bg-[#22d4fd]/10 border border-[#22d4fd]/30 px-2.5 py-1 rounded-md">PAGE 1 / 1</span>
                  <button
                    onClick={onScanAgain}
                    className="font-mono text-xs font-bold text-[#a98bff] hover:text-[#22d4fd] hover:underline cursor-pointer transition"
                  >
                    Scanner à nouveau
                  </button>
                </div>
              </div>

              {/* Rendu Image Source avec Canevas Blueprint Dark */}
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
                      className="mx-auto min-h-[380px] max-h-[520px] max-w-full object-contain shadow-2xl rounded-xl border border-[#1e2640]"
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
                              title={`Ligne ${l.id + 1} (${Math.round(l.confiance * 100)}% certitude)`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <article className="mx-auto min-h-[400px] max-w-[460px] -rotate-1 bg-[#0f1422] p-9 shadow-2xl rounded-xl border border-[#1e2640] text-[#e8eaf2]">
                    <p className="border-b border-[#7c5cfc]/30 pb-3 font-display text-2xl italic text-[#a98bff]">
                      Réunion produit — 6 septembre
                    </p>
                    <p className="mt-8 font-serif text-lg leading-8 text-[#8892b0]">
                      À retenir pour la prochaine version :
                    </p>
                    <p className="mt-4 font-serif text-lg leading-8 text-[#d0d7e5]">
                      — simplifier l'import de documents<br/>
                      — afficher les mots à vérifier dès la lecture<br/>
                      — permettre l'export vers Notion et Google Docs
                    </p>
                    <p className="mt-8 font-serif text-lg leading-8 text-[#22d4fd]">
                      Décision : tester le nouveau parcours avec 8 personnes lundi.
                    </p>
                  </article>
                )}
              </div>
            </div>
          )}

          {/* Panneau de Droite : Texte Reconnu */}
          <div className="flex flex-col min-h-[580px] bg-[#0c101d]/60">
            <div className="flex items-center justify-between border-b border-[#1e2640] bg-[#131928]/60 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-bold text-white">Transcription IA</span>
                <div className="flex items-center rounded-xl border border-[#1e2640] bg-[#080b14] p-1">
                  <button
                    onClick={() => setRichView(false)}
                    title="Édition texte brut"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      !richView
                        ? 'btn-primary text-white shadow-xs'
                        : 'text-[#8892b0] hover:text-white'
                    }`}
                  >
                    <Edit3 className="size-3.5" />
                    <span>Éditeur Brut</span>
                  </button>
                  <button
                    onClick={() => setRichView(true)}
                    title="Rendu riche : tableaux, formules, graphiques"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      richView
                        ? 'btn-primary text-white shadow-xs'
                        : 'text-[#8892b0] hover:text-white'
                    }`}
                  >
                    <Sparkles className="size-3.5 text-[#22d4fd]" />
                    <span>Rendu Structuré</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 font-mono text-xs font-bold transition cursor-pointer ${
                    saved 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                      : "bg-[#7c5cfc]/20 text-[#a98bff] border border-[#7c5cfc]/40 hover:bg-[#7c5cfc]/30"
                  }`}
                >
                  <Check className="size-3.5" />
                  <span>{saved ? "Texte validé" : "Valider le texte"}</span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between overflow-auto">
              <div className="flex-1 space-y-4">
                {!saved && !richView && (
                  <div className="rounded-xl bg-[#7c5cfc]/10 border border-[#7c5cfc]/30 px-4 py-3 text-xs text-[#a98bff] flex items-center justify-between">
                    <span>💡 <strong>Mode édition direct :</strong> Modifiez librement le texte. Les formules $\LaTeX$ et tableaux Markdown s'actualisent en direct.</span>
                  </div>
                )}

                {richView ? (
                  <div className="min-h-[380px] p-5 rounded-2xl bg-[#080b14]/70 border border-[#1e2640] overflow-y-auto">
                    {textContent.trim() ? (
                      <RichRenderer content={textContent} />
                    ) : (
                      <p className="text-[#8892b0] italic text-sm font-mono">Aucun contenu disponible. Analysez un document.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={textContent}
                    onChange={event => updateFullText(event.target.value)}
                    aria-label="Texte reconnu"
                    className="min-h-[380px] w-full resize-none font-mono text-[14px] leading-relaxed text-[#c8d4e8] p-5 rounded-2xl bg-[#080b14]/70 border border-[#1e2640] focus:border-[#7c5cfc] focus:bg-[#080b14] focus:outline-none transition-all shadow-inner"
                  />
                )}
              </div>

              {/* Barre de statistiques et exports au bas de feuille */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#1e2640] pt-5 text-xs text-[#8892b0]">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-white">{wordsCount}</span> mots
                  <span>·</span>
                  <span className="font-bold text-white">{textContent.length}</span> caractères
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={onExportWord}
                    className="btn-ghost flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold text-[#e8eaf2] hover:border-[#7c5cfc] transition cursor-pointer"
                  >
                    <FileDown className="size-3.5 text-[#22d4fd]" />
                    <span>Word (.doc)</span>
                  </button>
                  <button
                    onClick={onExportExcel}
                    className="btn-ghost flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold text-[#e8eaf2] hover:border-[#7c5cfc] transition cursor-pointer"
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-400" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={onExportPdf}
                    className="btn-primary flex items-center gap-1.5 rounded-xl px-4 py-1.5 font-mono text-xs font-bold text-white shadow-md transition cursor-pointer"
                  >
                    <FileDown className="size-3.5" />
                    <span>PDF Pro</span>
                  </button>
                  <button
                    onClick={() => setSaved(false)}
                    className="rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-[#8892b0] hover:text-[#22d4fd] hover:underline transition cursor-pointer"
                  >
                    Réinitialiser
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
