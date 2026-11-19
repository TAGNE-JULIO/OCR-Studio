'use client';

import React, { useState, useEffect } from 'react';
import { Brand } from '../ui/Brand';
import { ScreenView, InputMode } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { 
  LayoutDashboard, Upload, Camera, FileDown, 
  Sun, Moon, Globe, CheckCircle2, AlertCircle, Activity
} from 'lucide-react';

interface HeaderProps {
  screen: ScreenView;
  setScreen: (v: ScreenView) => void;
  setInputMode: (m: InputMode) => void;
  onImportClick: () => void;
  onExportWord: () => void;
}

export function Header({ screen, setScreen, setInputMode, onImportClick, onExportWord }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale, t } = useI18n();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Health check on mount and periodically
  useEffect(() => {
    let active = true;
    const checkApi = async () => {
      try {
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ocr-studio-api.vercel.app';
        const url = `${rawUrl.replace(/\/+$/, '')}/health`;
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (active) {
          setApiOnline(res.ok);
        }
      } catch {
        if (active) setApiOnline(false);
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-[70px] sm:h-[76px] items-center justify-between border-b border-slate-200 dark:border-[#1e2640] bg-white/80 dark:bg-[#080b14]/90 px-4 sm:px-8 lg:px-10 backdrop-blur-xl shadow-xs dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors">
      <div className="flex items-center gap-4 sm:gap-8">
        <Brand />
        <nav className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setScreen("home")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              screen === "home"
                ? "bg-indigo-50 dark:bg-[#7c5cfc]/15 text-indigo-600 dark:text-[#a98bff] border border-indigo-200 dark:border-[#7c5cfc]/30 shadow-xs dark:shadow-[0_0_15px_rgba(124,92,252,0.2)]"
                : "text-slate-600 dark:text-[#8892b0] hover:bg-slate-100 dark:hover:bg-[#131928] hover:text-slate-900 dark:hover:text-[#e8eaf2]"
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>{t.navOverview}</span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* API Status Indicator */}
        <div 
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border bg-slate-50 dark:bg-[#0c101d] border-slate-200 dark:border-[#1e2640] select-none"
          title={apiOnline === true ? t.apiConnected : apiOnline === false ? t.apiOffline : t.apiChecking}
        >
          <span className="relative flex size-2">
            {apiOnline === true && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full size-2 ${
              apiOnline === true ? "bg-emerald-500" : apiOnline === false ? "bg-rose-500" : "bg-amber-400"
            }`} />
          </span>
          <span className="text-slate-600 dark:text-slate-300 font-semibold">
            {apiOnline === true ? t.apiConnected : apiOnline === false ? t.apiOffline : "API..."}
          </span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={toggleLocale}
          title={t.langToggle}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#1e2640] bg-white dark:bg-[#131928] px-2.5 sm:px-3 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-[#7c5cfc] hover:bg-indigo-50/50 dark:hover:bg-[#1e2640] transition cursor-pointer shadow-xs"
        >
          <Globe className="size-3.5 text-indigo-500 dark:text-[#22d4fd]" />
          <span>{locale.toUpperCase()}</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? t.themeToggleLight : t.themeToggleDark}
          className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-slate-200 dark:border-[#1e2640] bg-white dark:bg-[#131928] text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-[#7c5cfc] hover:bg-indigo-50/50 dark:hover:bg-[#1e2640] transition cursor-pointer shadow-xs"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="size-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="size-4 text-indigo-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-[#1e2640] mx-0.5 sm:mx-1 hidden xs:block" />

        {/* Import Button */}
        <button
          onClick={onImportClick}
          className="btn-ghost flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition active:scale-98 cursor-pointer"
        >
          <Upload className="size-4 text-indigo-500 dark:text-[#22d4fd]" />
          <span className="hidden xs:inline">{t.btnImport}</span>
        </button>

        {/* Camera Button */}
        <button
          onClick={() => setInputMode('camera')}
          className="btn-ghost flex items-center gap-1.5 sm:gap-2 rounded-xl border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/60 transition active:scale-98 cursor-pointer"
        >
          <Camera className="size-4" />
          <span className="hidden sm:inline">{t.btnCamera}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExportWord}
          className="btn-primary flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md active:scale-98 cursor-pointer"
        >
          <FileDown className="size-4" />
          <span>{t.btnExport}</span>
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => setScreen("preferences")}
          aria-label="User profile"
          className="flex size-9 sm:size-10 items-center justify-center rounded-full border border-indigo-300 dark:border-[#7c5cfc]/40 bg-indigo-50 dark:bg-[#131928] text-xs sm:text-sm font-mono font-bold text-indigo-600 dark:text-[#a98bff] shadow-xs dark:shadow-[0_0_12px_rgba(124,92,252,0.25)] hover:scale-105 transition shrink-0 cursor-pointer ml-1"
        >
          AM
        </button>
      </div>
    </header>
  );
}
