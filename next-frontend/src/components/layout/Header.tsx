import React from 'react';
import { Brand } from '../ui/Brand';
import { ScreenView, InputMode } from '../../types';
import { LayoutDashboard, Upload, Camera, FileDown } from 'lucide-react';

interface HeaderProps {
  screen: ScreenView;
  setScreen: (v: ScreenView) => void;
  setInputMode: (m: InputMode) => void;
  onImportClick: () => void;
  onExportWord: () => void;
}

export function Header({ screen, setScreen, setInputMode, onImportClick, onExportWord }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-[68px] sm:h-[76px] items-center justify-between border-b border-[#1e2640] bg-[#080b14]/90 px-4 sm:px-8 lg:px-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4 sm:gap-8">
        <Brand />
        <nav className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setScreen("home")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              screen === "home"
                ? "bg-[#7c5cfc]/15 text-[#a98bff] border border-[#7c5cfc]/30 shadow-[0_0_15px_rgba(124,92,252,0.2)]"
                : "text-[#8892b0] hover:bg-[#131928] hover:text-[#e8eaf2]"
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>Tableau de bord</span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onImportClick}
          className="btn-ghost flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:border-[#7c5cfc] transition active:scale-98 cursor-pointer"
        >
          <Upload className="size-4 text-[#22d4fd]" />
          <span className="hidden xs:inline sm:inline">Importer</span>
        </button>

        <button
          onClick={() => setInputMode('camera')}
          className="btn-ghost flex items-center gap-1.5 sm:gap-2 rounded-xl border-rose-500/30 bg-rose-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 transition active:scale-98 cursor-pointer"
        >
          <Camera className="size-4" />
          <span className="hidden sm:inline">Caméra</span>
        </button>

        <button
          onClick={onExportWord}
          className="btn-primary flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg active:scale-98 cursor-pointer"
        >
          <FileDown className="size-4" />
          <span>Exporter</span>
        </button>

        <div className="h-6 w-px bg-[#1e2640] mx-1 hidden sm:block" />

        <button
          aria-label="Compte"
          className="flex size-9 sm:size-10 items-center justify-center rounded-full border border-[#7c5cfc]/40 bg-[#131928] text-xs sm:text-sm font-mono font-bold text-[#a98bff] shadow-[0_0_12px_rgba(124,92,252,0.25)] hover:scale-105 transition shrink-0"
        >
          AM
        </button>
      </div>
    </header>
  );
}
