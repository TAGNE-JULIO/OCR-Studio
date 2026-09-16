import React from 'react';
import { Metric } from '../ui/Metric';
import { Plus, ArrowRight, FileText, TrendingUp, Sparkles, Clock, Scan } from 'lucide-react';

interface DashboardScreenProps {
  onNewDocument: () => void;
  onOpenDocument: (idx: number) => void;
  recentDocuments: { id: number; title: string; date: string; pages: string; score: string; }[];
}

export function DashboardScreen({ onNewDocument, onOpenDocument, recentDocuments }: DashboardScreenProps) {
  return (
    <section className="flex-1 min-w-0 px-6 py-8 sm:px-10 sm:py-10">
      <div className="mx-auto max-w-[1340px] space-y-9">
        
        {/* En-tête avec Section Tag et Titre Fraunces */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-2">
          <div className="space-y-2.5">
            <div className="section-tag">
              <Sparkles className="size-3 text-[#22d4fd]" />
              <span>Moteur IA Hybride & OpenCV</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Bonjour, <span className="gradient-text">Amine</span>.
            </h1>
            <p className="text-sm sm:text-base text-[#8892b0]">
              Prêt à numériser et transformer vos notes manuscrites en texte parfait ?
            </p>
          </div>

          <button
            onClick={onNewDocument}
            className="btn-primary flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold shadow-xl active:scale-98 cursor-pointer"
          >
            <Plus className="size-4.5" />
            <span>Nouveau document</span>
          </button>
        </div>

        {/* Grille Principale : Hero Card + Graphique Activité */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          
          {/* Hero Card Royale Violette & Cyan */}
          <button
            onClick={() => onOpenDocument(0)}
            className="group relative min-h-[340px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#131928] via-[#161f36] to-[#201844] p-8 sm:p-10 text-left text-white border border-[#7c5cfc]/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:border-[#7c5cfc]/60 hover:shadow-[0_0_40px_rgba(124,92,252,0.3)] transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div className="absolute -right-20 -top-24 size-80 rounded-full border-[32px] border-[#7c5cfc]/10 pointer-events-none" />
            <div className="absolute bottom-[-140px] right-20 size-80 rounded-full bg-[#7c5cfc]/20 blur-3xl pointer-events-none" />
            <div className="absolute top-10 right-10 size-40 rounded-full bg-[#22d4fd]/10 blur-2xl pointer-events-none" />
            
            <div className="relative space-y-4 max-w-[500px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22d4fd]/30 bg-[#22d4fd]/10 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-[.14em] text-[#22d4fd]">
                <Scan className="size-3.5" />
                <span>Haute Précision OCR Studio</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-white">
                Du manuscrit au texte structuré, sans bavure.
              </h2>
              <p className="text-sm leading-relaxed text-[#8892b0]">
                Importez vos photos de cours, comptes-rendus, tableaux et formules mathématiques. Notre algorithme OpenCV retire les ombres et l'IA retranscrit tout en LaTeX et Markdown.
              </p>
            </div>

            <div className="relative pt-6">
              <span className="btn-primary inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold shadow-lg group-hover:translate-x-1 transition-transform">
                <span>Démarrer une numérisation</span>
                <ArrowRight className="size-4 text-[#22d4fd]" />
              </span>
            </div>
          </button>

          {/* Widget Graphique d'activité mensuelle */}
          <div className="card-glass gradient-border p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#8892b0]">Activité globale</p>
                  <p className="font-display text-sm font-bold text-white mt-0.5">Reconnaissances du mois</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[#7c5cfc]/20 border border-[#7c5cfc]/40 px-3 py-1 font-mono text-xs font-bold text-[#a98bff]">
                  <TrendingUp className="size-3.5 text-[#22d4fd] text-xs" /> +18 %
                </span>
              </div>
              <strong className="mt-5 block font-display text-5xl font-bold tracking-tight text-white gradient-text">
                47
              </strong>
              <p className="mt-1 text-xs text-[#8892b0]">documents numérisés avec succès</p>
            </div>

            {/* Graphique Histogramme Cyan & Violet */}
            <div className="pt-6">
              <div className="flex h-22 items-end gap-2.5 px-1">
                {[35, 52, 40, 78, 55, 92, 68, 85, 60, 100, 75, 92].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span
                      className={`w-full rounded-md transition-all duration-300 ${
                        i === 11
                          ? "bg-gradient-to-t from-[#7c5cfc] to-[#22d4fd] shadow-[0_0_15px_rgba(34,212,253,0.5)]"
                          : "bg-[#1e2640] hover:bg-[#7c5cfc]/50"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between font-mono text-[10px] text-[#8892b0] border-t border-[#1e2640] pt-2.5">
                <span>01 SEP</span>
                <span>15 SEP</span>
                <span className="font-bold text-[#22d4fd]">AUJOURD'HUI</span>
              </div>
            </div>
          </div>

        </div>

        {/* Grille des 3 Métriques clés */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Metric label="Précision d'extraction" value="98,7 %" note="Taux de fidélité des transcriptions" />
          <Metric label="Vitesse moyenne" value="1,8 s" note="Temps d'exécution par document" />
          <Metric label="Formules & Tableaux" value="100 %" note="Support LaTeX et Markdown complet" />
        </div>

        {/* Grille des Documents Récents */}
        <div className="card-glass gradient-border overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1e2640] px-6 py-5 sm:px-8 bg-[#131928]/40">
            <div className="space-y-0.5">
              <h2 className="font-display text-lg font-bold tracking-tight text-white">Documents récents</h2>
              <p className="text-xs text-[#8892b0]">Accédez rapidement à vos dernières transcriptions</p>
            </div>
            <button 
              onClick={() => onOpenDocument(0)} 
              className="font-mono text-xs font-bold text-[#22d4fd] hover:text-[#a98bff] hover:underline cursor-pointer transition"
            >
              Tout afficher →
            </button>
          </div>

          <div className="divide-y divide-[#1e2640]">
            {recentDocuments.map((item, index) => (
              <button
                key={item.title}
                onClick={() => onOpenDocument(index)}
                className="flex w-full items-center gap-5 px-6 py-4.5 text-left hover:bg-[#7c5cfc]/5 sm:px-8 transition-colors cursor-pointer group"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[#7c5cfc]/15 border border-[#7c5cfc]/30 text-[#a98bff] shrink-0 font-bold group-hover:bg-[#7c5cfc] group-hover:text-white transition-all shadow-[0_0_15px_rgba(124,92,252,0.15)]">
                  <FileText className="size-5" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block truncate text-sm font-bold text-white group-hover:text-[#22d4fd] transition-colors">
                    {item.title}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-xs text-[#8892b0]">
                    <Clock className="size-3 text-[#7c5cfc]" />
                    <span>{item.date}</span>
                    <span>·</span>
                    <span>{item.pages}</span>
                  </span>
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-[#131928] border border-[#7c5cfc]/30 px-3.5 py-1 font-mono text-xs font-bold text-[#22d4fd]">
                  {item.score}
                </span>
                <span className="text-[#8892b0] group-hover:text-[#22d4fd] group-hover:translate-x-1 transition-all">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
