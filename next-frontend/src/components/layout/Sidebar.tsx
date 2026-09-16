import React from 'react';
import { ScreenView, InputMode } from '../../types';
import { LayoutDashboard, FileText, Camera, History, Settings, Sparkles } from 'lucide-react';

interface SidebarProps {
  screen: ScreenView;
  setScreen: (v: ScreenView) => void;
  setInputMode: (m: InputMode) => void;
  onOpenDocument: (idx: number) => void;
  documentsCount: number;
}

export function Sidebar({ screen, setScreen, setInputMode, onOpenDocument, documentsCount }: SidebarProps) {
  return (
    <aside className="hidden border-r border-[#1e2640] bg-[#0c101d]/90 p-5 lg:flex lg:flex-col justify-between w-[260px] shrink-0 min-h-[calc(100vh-76px)] backdrop-blur-md">
      <div className="space-y-7">
        <div>
          <p className="px-3 pb-3 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-[#8892b0]">
            Espace de travail
          </p>
          <nav className="space-y-1.5 text-sm">
            <button
              onClick={() => setScreen("home")}
              className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold transition-all ${
                screen === "home"
                  ? "bg-[#7c5cfc]/15 text-[#a98bff] border border-[#7c5cfc]/30 shadow-[0_0_15px_rgba(124,92,252,0.15)]"
                  : "text-[#8892b0] hover:bg-[#131928] hover:text-[#e8eaf2]"
              }`}
            >
              <LayoutDashboard className="size-4.5 shrink-0 text-[#7c5cfc]" />
              <span>Vue d'ensemble</span>
            </button>

            <button
              onClick={() => onOpenDocument(0)}
              className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold transition-all ${
                screen === "review"
                  ? "bg-[#7c5cfc]/15 text-[#a98bff] border border-[#7c5cfc]/30 shadow-[0_0_15px_rgba(124,92,252,0.15)]"
                  : "text-[#8892b0] hover:bg-[#131928] hover:text-[#e8eaf2]"
              }`}
            >
              <FileText className="size-4.5 shrink-0 text-[#22d4fd]" />
              <span>Documents</span>
              <span className="ml-auto font-mono text-xs font-bold bg-[#7c5cfc]/20 text-[#a98bff] border border-[#7c5cfc]/30 px-2.5 py-0.5 rounded-full">
                {documentsCount || 12}
              </span>
            </button>

            <button
              onClick={() => setInputMode('camera')}
              className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold text-[#8892b0] hover:bg-[#131928] hover:text-[#e8eaf2] transition"
            >
              <Camera className="size-4.5 shrink-0 text-rose-400" />
              <span>Scanner Caméra</span>
            </button>

            <button
              onClick={() => setScreen("home")}
              className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold text-[#8892b0] hover:bg-[#131928] hover:text-[#e8eaf2] transition"
            >
              <History className="size-4.5 shrink-0 text-[#a98bff]" />
              <span>Historique</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-[#1e2640] pt-6">
          <p className="px-3 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-[#8892b0]">
            Système
          </p>
          <button 
            onClick={() => setScreen("preferences")}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all ${
              screen === "preferences"
                ? "bg-[#7c5cfc]/15 text-[#a98bff] border border-[#7c5cfc]/30 shadow-[0_0_15px_rgba(124,92,252,0.15)]"
                : "text-[#8892b0] hover:bg-[#131928] hover:text-[#e8eaf2]"
            }`}
          >
            <Settings className="size-4.5 shrink-0" />
            <span>Préférences</span>
          </button>
        </div>
      </div>

      <div className="card-glass gradient-border p-4.5 space-y-2.5">
        <div className="flex items-center gap-2 text-[#a98bff]">
          <Sparkles className="size-4 text-[#22d4fd]" />
          <p className="font-display text-sm font-bold text-white">OCR Studio Pro</p>
        </div>
        <p className="text-xs leading-relaxed text-[#8892b0]">
          Reconnaissance IA Hybride active. Vos manuscrits sont protégés.
        </p>
        <div className="pt-1">
          <button 
            onClick={() => setScreen("preferences")}
            className="text-xs font-bold text-[#22d4fd] hover:text-[#a98bff] hover:underline inline-flex items-center gap-1 transition"
          >
            Options du moteur <span>→</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
