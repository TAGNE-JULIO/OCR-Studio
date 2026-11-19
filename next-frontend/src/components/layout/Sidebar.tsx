'use client';

import React from 'react';
import { ScreenView, InputMode } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { LayoutDashboard, FileText, Camera, History, Settings, Sparkles, ArrowRight } from 'lucide-react';

interface SidebarProps {
  screen: ScreenView;
  setScreen: (v: ScreenView) => void;
  setInputMode: (m: InputMode) => void;
  onOpenDocument: (idx: number) => void;
  documentsCount: number;
}

export function Sidebar({ screen, setScreen, setInputMode, onOpenDocument, documentsCount }: SidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="hidden border-r border-slate-200 dark:border-[#1e2640] bg-white/70 dark:bg-[#0c101d]/90 p-5 lg:flex lg:flex-col justify-between w-[260px] shrink-0 min-h-[calc(100vh-76px)] backdrop-blur-md transition-colors">
      <div className="space-y-7">
        <div>
          <p className="px-3 pb-3 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500 dark:text-[#8892b0]">
            {t.brandTagline}
          </p>
          <nav className="space-y-1.5 text-sm">
            <button
              onClick={() => setScreen("home")}
              className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold transition-all cursor-pointer ${
                screen === "home"
                  ? "bg-indigo-50 dark:bg-[#7c5cfc]/15 text-indigo-600 dark:text-[#a98bff] border border-indigo-200 dark:border-[#7c5cfc]/30 shadow-xs dark:shadow-[0_0_15px_rgba(124,92,252,0.15)]"
                  : "text-slate-600 dark:text-[#8892b0] hover:bg-slate-100 dark:hover:bg-[#131928] hover:text-slate-900 dark:hover:text-[#e8eaf2]"
              }`}
            >
              <LayoutDashboard className="size-4.5 shrink-0 text-indigo-500 dark:text-[#7c5cfc]" />
              <span>{t.navOverview}</span>
            </button>

            <button
              onClick={() => onOpenDocument(0)}
              className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold transition-all cursor-pointer ${
                screen === "review"
                  ? "bg-indigo-50 dark:bg-[#7c5cfc]/15 text-indigo-600 dark:text-[#a98bff] border border-indigo-200 dark:border-[#7c5cfc]/30 shadow-xs dark:shadow-[0_0_15px_rgba(124,92,252,0.15)]"
                  : "text-slate-600 dark:text-[#8892b0] hover:bg-slate-100 dark:hover:bg-[#131928] hover:text-slate-900 dark:hover:text-[#e8eaf2]"
              }`}
            >
              <FileText className="size-4.5 shrink-0 text-cyan-600 dark:text-[#22d4fd]" />
              <span>{t.navDocuments}</span>
              <span className="ml-auto font-mono text-xs font-bold bg-indigo-50 dark:bg-[#7c5cfc]/20 text-indigo-600 dark:text-[#a98bff] border border-indigo-200 dark:border-[#7c5cfc]/30 px-2.5 py-0.5 rounded-full">
                {documentsCount || 12}
              </span>
            </button>

            <button
              onClick={() => setInputMode('camera')}
              className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold text-slate-600 dark:text-[#8892b0] hover:bg-slate-100 dark:hover:bg-[#131928] hover:text-slate-900 dark:hover:text-[#e8eaf2] transition cursor-pointer"
            >
              <Camera className="size-4.5 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{t.navCamera}</span>
            </button>

            <button
              onClick={() => setScreen("home")}
              className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left font-semibold text-slate-600 dark:text-[#8892b0] hover:bg-slate-100 dark:hover:bg-[#131928] hover:text-slate-900 dark:hover:text-[#e8eaf2] transition cursor-pointer"
            >
              <History className="size-4.5 shrink-0 text-indigo-500 dark:text-[#a98bff]" />
              <span>{t.navHistory}</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-200 dark:border-[#1e2640] pt-6">
          <p className="px-3 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500 dark:text-[#8892b0]">
            System
          </p>
          <button 
            onClick={() => setScreen("preferences")}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all cursor-pointer ${
              screen === "preferences"
                ? "bg-indigo-50 dark:bg-[#7c5cfc]/15 text-indigo-600 dark:text-[#a98bff] border border-indigo-200 dark:border-[#7c5cfc]/30 shadow-xs dark:shadow-[0_0_15px_rgba(124,92,252,0.15)]"
                : "text-slate-600 dark:text-[#8892b0] hover:bg-slate-100 dark:hover:bg-[#131928] hover:text-slate-900 dark:hover:text-[#e8eaf2]"
            }`}
          >
            <Settings className="size-4.5 shrink-0" />
            <span>{t.navPreferences}</span>
          </button>
        </div>
      </div>

      <div className="card-glass gradient-border p-4.5 space-y-2.5">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-[#a98bff]">
          <Sparkles className="size-4 text-cyan-600 dark:text-[#22d4fd]" />
          <p className="font-display text-sm font-bold text-slate-900 dark:text-white">OCR Studio Pro</p>
        </div>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-[#8892b0]">
          {t.heroDescription.slice(0, 75)}...
        </p>
        <div className="pt-1">
          <button 
            onClick={() => setScreen("preferences")}
            className="text-xs font-bold text-indigo-600 dark:text-[#22d4fd] hover:text-indigo-700 dark:hover:text-[#a98bff] hover:underline inline-flex items-center gap-1 transition cursor-pointer"
          >
            <span>{t.navPreferences}</span>
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
