import React from 'react';
import { ArrowLeft, Cpu, ShieldCheck, FileText, Sparkles } from 'lucide-react';

interface PreferencesScreenProps {
  onBack: () => void;
}

export function PreferencesScreen({ onBack }: PreferencesScreenProps) {
  return (
    <section className="flex-1 min-w-0 px-6 py-8 sm:px-10 sm:py-10">
      <div className="mx-auto max-w-[920px] space-y-8">
        
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-mono font-bold text-[#22d4fd] hover:text-[#a98bff] hover:underline transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Retour à l'espace de travail</span>
        </button>

        <div className="space-y-1.5">
          <div className="section-tag">
            <Sparkles className="size-3 text-[#22d4fd]" />
            <span>Paramètres Système</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Préférences & Moteur OCR
          </h1>
          <p className="text-sm text-[#8892b0]">
            Configurez les algorithmes de prétraitement et le comportement d'exportation.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1 : Moteur OCR */}
          <div className="card-glass gradient-border p-7 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#1e2640] pb-4 text-[#a98bff]">
              <Cpu className="size-5 text-[#22d4fd]" />
              <h2 className="font-display text-lg font-bold text-white">Moteur de reconnaissance (OCR)</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-5 rounded-2xl border border-[#7c5cfc]/40 bg-[#7c5cfc]/10 cursor-pointer shadow-[0_0_20px_rgba(124,92,252,0.15)]">
                <input type="radio" name="ocr_engine" className="mt-1 size-4.5 text-[#7c5cfc] accent-[#7c5cfc]" defaultChecked />
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-bold">Mode Hybride Intelligent (Recommandé)</strong>
                    <span className="rounded-full bg-[#7c5cfc] px-2.5 py-0.5 font-mono text-[10px] font-bold text-white uppercase tracking-wider">Actif</span>
                  </div>
                  <p className="text-[#8892b0] leading-relaxed">
                    Combine le prétraitement OpenCV (suppression d'ombres), GPT-4o Vision et EasyOCR local. Idéal pour les formules mathématiques en LaTeX et les tableaux Markdown.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-5 rounded-2xl border border-[#1e2640] bg-[#131928]/50 cursor-pointer hover:border-[#7c5cfc]/40 transition">
                <input type="radio" name="ocr_engine" className="mt-1 size-4.5 text-[#7c5cfc] accent-[#7c5cfc]" />
                <div className="space-y-1 text-sm">
                  <strong className="text-white">Mode 100% Local (Open Source EasyOCR)</strong>
                  <p className="text-[#8892b0] leading-relaxed">
                    Exécution autonome sur processeur local sans dépendance cloud.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2 : Exportation */}
          <div className="card-glass gradient-border p-7 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#1e2640] pb-4 text-[#a98bff]">
              <FileText className="size-5 text-[#22d4fd]" />
              <h2 className="font-display text-lg font-bold text-white">Exportation & Prétraitement</h2>
            </div>

            <div className="divide-y divide-[#1e2640]">
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-bold text-white">Prétraitement d'image automatique (OpenCV)</p>
                  <p className="text-xs text-[#8892b0]">Supprime les ombres de smartphone et redresse les scans inclinés.</p>
                </div>
                <input type="checkbox" defaultChecked className="size-5 accent-[#7c5cfc] rounded-md cursor-pointer" />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-bold text-white">Interprétation mathématique $\LaTeX$</p>
                  <p className="text-xs text-[#8892b0]">Rend les équations avec KaTeX en haute résolution.</p>
                </div>
                <input type="checkbox" defaultChecked className="size-5 accent-[#7c5cfc] rounded-md cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
