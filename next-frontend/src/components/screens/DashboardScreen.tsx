'use client';

import React, { useState } from 'react';
import { Metric } from '../ui/Metric';
import { useI18n } from '../../context/I18nContext';
import { 
  Plus, ArrowRight, FileText, TrendingUp, Sparkles, 
  Clock, Scan, UploadCloud, ChevronRight, Edit3, FilePlus2
} from 'lucide-react';

interface DashboardScreenProps {
  onNewDocument: () => void;
  onNewBlankDocument: () => void;
  onOpenDocument: (idx: number) => void;
  onDropFiles?: (files: FileList) => void;
  recentDocuments: { id: number; title: string; date: string; pages: string; score: string; mode?: string }[];
}

export function DashboardScreen({ 
  onNewDocument, 
  onNewBlankDocument, 
  onOpenDocument, 
  onDropFiles, 
  recentDocuments 
}: DashboardScreenProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropFiles) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <section className="flex-1 min-w-0 px-4 py-6 sm:px-10 sm:py-10 transition-colors">
      <div className="mx-auto max-w-[1340px] space-y-8">
        
        {/* Header with Section Tag */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-2">
          <div className="space-y-2.5">
            <div className="section-tag">
              <Sparkles className="size-3 text-indigo-500 dark:text-cyan-400" />
              <span>{t.engineTag}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
              {t.greetingPrefix} <span className="gradient-text">Amine</span>.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium transition-colors">
              {t.greetingSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNewBlankDocument}
              className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold border-indigo-200 dark:border-slate-700 hover:border-indigo-500 transition cursor-pointer"
            >
              <FilePlus2 className="size-4 text-indigo-500 dark:text-cyan-400" />
              <span>{t.btnNewBlankDocument}</span>
            </button>

            <button
              onClick={onNewDocument}
              className="btn-primary flex items-center gap-2.5 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold shadow-xl active:scale-98 cursor-pointer"
            >
              <Plus className="size-4.5" />
              <span>{t.btnNewDocument}</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Upload Highlight Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={onNewDocument}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 hover:border-indigo-500/70 dark:hover:border-cyan-400/70'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 shadow-xs">
              <UploadCloud className="size-6" />
            </div>
            <p className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t.dragDropTitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {t.dragDropSubtitle}
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs font-mono font-bold">
              <span className="text-indigo-600 dark:text-cyan-400 hover:underline">
                {t.dragDropBrowse} →
              </span>
              <span className="text-slate-400">|</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewBlankDocument();
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline"
              >
                ✍️ {t.btnManualMode}
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Hero Card + Activity Chart */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          
          {/* Hero Card */}
          <button
            onClick={() => onOpenDocument(0)}
            className="group relative min-h-[340px] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 dark:from-[#0d1222] dark:via-[#131a30] dark:to-[#1a1438] p-8 sm:p-10 text-left text-white border border-indigo-400/30 dark:border-indigo-500/30 shadow-xl hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div className="absolute -right-20 -top-24 size-80 rounded-full border-[32px] border-white/5 pointer-events-none" />
            <div className="absolute bottom-[-140px] right-20 size-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute top-10 right-10 size-40 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
            
            <div className="relative space-y-4 max-w-[500px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-[.14em] text-cyan-300">
                <Scan className="size-3.5" />
                <span>{t.heroBadge}</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-white">
                {t.heroTitle}
              </h2>
              <p className="text-sm leading-relaxed text-slate-200">
                {t.heroDescription}
              </p>
            </div>

            <div className="relative pt-6">
              <span className="btn-primary inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold shadow-lg group-hover:translate-x-1 transition-transform">
                <span>{t.btnStartScan}</span>
                <ArrowRight className="size-4 text-cyan-300" />
              </span>
            </div>
          </button>

          {/* Activity Widget */}
          <div className="card-glass gradient-border p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">{t.activityTitle}</p>
                  <p className="font-display text-sm font-bold text-slate-900 dark:text-white mt-0.5">{t.activitySub}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/40 px-3 py-1 font-mono text-xs font-bold text-indigo-600 dark:text-cyan-300">
                  <TrendingUp className="size-3.5 text-cyan-600 dark:text-cyan-400" /> +18 %
                </span>
              </div>
              <strong className="mt-5 block font-display text-5xl font-bold tracking-tight text-slate-900 dark:text-white gradient-text">
                47
              </strong>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.activityDocsCount}</p>
            </div>

            {/* Histogram Chart */}
            <div className="pt-6">
              <div className="flex h-24 items-end gap-2.5 px-1">
                {[35, 52, 40, 78, 55, 92, 68, 85, 60, 100, 75, 92].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span
                      className={`w-full rounded-md transition-all duration-300 ${
                        i === 11
                          ? "bg-gradient-to-t from-indigo-600 to-cyan-400 dark:from-[#7c5cfc] dark:to-[#22d4fd] shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                          : "bg-slate-200 dark:bg-slate-800 hover:bg-indigo-300 dark:hover:bg-indigo-500/50"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                <span>01 SEP</span>
                <span>15 SEP</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">LIVE</span>
              </div>
            </div>
          </div>

        </div>

        {/* 3 Metrics Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Metric label={t.colConfidence} value="98,7 %" note={t.metricConfidenceNote} />
          <Metric label="Vitesse de traitement" value="1,8 s" note="FastAPI + OpenCV Pipeline" />
          <Metric label={t.metricStructured} value="100 %" note={t.metricStructuredNote} />
        </div>

        {/* Recent Documents Table */}
        <div className="card-glass gradient-border overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-5 sm:px-8 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="space-y-0.5">
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t.recentDocsTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.recentDocsSubtitle}</p>
            </div>
            <button 
              onClick={() => onOpenDocument(0)} 
              className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer transition"
            >
              {t.actionOpen} →
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {recentDocuments.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onOpenDocument(index)}
                className="flex w-full items-center gap-5 px-6 py-4.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 sm:px-8 transition-colors cursor-pointer group"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-indigo-600 dark:text-cyan-400 shrink-0 font-bold group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-xs">
                  <FileText className="size-5" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="size-3 text-indigo-500 dark:text-cyan-400" />
                    <span>{item.date}</span>
                    <span>·</span>
                    <span>{item.pages}</span>
                  </span>
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                  {item.score}
                </span>
                <ChevronRight className="size-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
