'use client';

import React from 'react';
import { ScreenView, InputMode } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { LayoutDashboard, FileText, Camera, Settings, Plus } from 'lucide-react';

interface MobileBottomNavProps {
  screen: ScreenView;
  setScreen: (v: ScreenView) => void;
  setInputMode: (m: InputMode) => void;
  onImportClick: () => void;
  onOpenDocument: (idx: number) => void;
}

export function MobileBottomNav({ screen, setScreen, setInputMode, onImportClick, onOpenDocument }: MobileBottomNavProps) {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-around h-16 border-t border-slate-200 dark:border-[#1e2640] bg-white/95 dark:bg-[#080b14]/95 backdrop-blur-2xl px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-colors">
      <button
        onClick={() => setScreen("home")}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
          screen === "home" ? "text-indigo-600 dark:text-[#22d4fd]" : "text-slate-500 dark:text-[#8892b0] hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <LayoutDashboard className="size-4.5" />
        <span className="font-mono text-[10px] font-semibold">{t.navOverview}</span>
      </button>

      <button
        onClick={() => onOpenDocument(0)}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
          screen === "review" ? "text-indigo-600 dark:text-[#22d4fd]" : "text-slate-500 dark:text-[#8892b0] hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <FileText className="size-4.5" />
        <span className="font-mono text-[10px] font-semibold">{t.navDocuments}</span>
      </button>

      {/* Floating center Scan / Import button */}
      <button
        onClick={onImportClick}
        aria-label={t.btnImport}
        className="relative -top-3 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-[#7c5cfc] dark:to-[#5b3de8] text-white shadow-[0_4px_20px_rgba(99,102,241,0.5)] dark:shadow-[0_0_20px_rgba(124,92,252,0.6)] active:scale-95 transition-transform cursor-pointer border-2 border-white dark:border-[#080b14]"
      >
        <Plus className="size-6" />
      </button>

      <button
        onClick={() => setInputMode('camera')}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-slate-500 dark:text-[#8892b0] hover:text-rose-500 dark:hover:text-rose-400 transition-all cursor-pointer"
      >
        <Camera className="size-4.5 text-rose-500 dark:text-rose-400" />
        <span className="font-mono text-[10px] font-semibold">{t.btnCamera}</span>
      </button>

      <button
        onClick={() => setScreen("preferences")}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
          screen === "preferences" ? "text-indigo-600 dark:text-[#22d4fd]" : "text-slate-500 dark:text-[#8892b0] hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Settings className="size-4.5" />
        <span className="font-mono text-[10px] font-semibold">{t.navPreferences}</span>
      </button>
    </nav>
  );
}
