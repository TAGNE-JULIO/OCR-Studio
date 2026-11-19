'use client';

import React from 'react';
import { useI18n } from '../../context/I18nContext';

export function Brand() {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3.5 group cursor-pointer select-none">
      <div className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-[#7c5cfc] dark:to-[#5b3de8] shadow-[0_4px_16px_rgba(99,102,241,0.35)] dark:shadow-[0_0_20px_rgba(124,92,252,0.4)] group-hover:scale-105 transition-transform duration-200">
        <span className="font-display text-xl font-bold text-white">O</span>
        <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-[#080b14]" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-[19px] font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors">
          {t.brandTitle} <span className="text-cyan-600 dark:text-[#22d4fd] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 dark:bg-[#22d4fd]/10 border border-cyan-500/20 dark:border-[#22d4fd]/20">PRO</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-[#8892b0] transition-colors">
          {t.brandTagline}
        </span>
      </div>
    </div>
  );
}
