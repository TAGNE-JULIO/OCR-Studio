'use client';

import React, { useState } from 'react';
import { ArrowLeft, Cpu, FileText, Sparkles, Globe, Moon, Sun, Activity, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

interface PreferencesScreenProps {
  onBack: () => void;
}

export function PreferencesScreen({ onBack }: PreferencesScreenProps) {
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();

  // API connectivity test state
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
  } | null>(null);

  const runApiTest = async () => {
    setTestingApi(true);
    setTestResult(null);
    try {
      const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ocr-studio-api.vercel.app';
      const url = `${rawUrl.replace(/\/+$/, '')}/health`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setTestResult({ success: true, data });
    } catch (e: any) {
      setTestResult({ success: false, error: e.message || 'Impossible de joindre le serveur' });
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <section className="flex-1 min-w-0 px-4 py-6 sm:px-10 sm:py-10 transition-colors">
      <div className="mx-auto max-w-[920px] space-y-8">
        
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-mono font-bold text-indigo-600 dark:text-[#22d4fd] hover:text-indigo-800 dark:hover:text-[#a98bff] hover:underline transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>{t.btnBackWorkspace}</span>
        </button>

        <div className="space-y-1.5">
          <div className="section-tag">
            <Sparkles className="size-3 text-indigo-500 dark:text-[#22d4fd]" />
            <span>{t.prefTag}</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
            {t.prefTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#8892b0] transition-colors">
            {t.prefSubtitle}
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Section 1 : Theme & Language */}
          <div className="card-glass gradient-border p-7 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#1e2640] pb-4 text-indigo-600 dark:text-[#a98bff]">
              <Globe className="size-5 text-indigo-500 dark:text-[#22d4fd]" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Interface & Langue / Theme & Language</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Language choice */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-white block">{t.prefLangTitle}</label>
                <p className="text-xs text-slate-500 dark:text-[#8892b0]">{t.prefLangDesc}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setLocale('fr')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                      locale === 'fr'
                        ? 'btn-primary text-white border-transparent shadow-sm'
                        : 'border-slate-200 dark:border-[#1e2640] bg-white dark:bg-[#131928] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🇫🇷 Français (FR)
                  </button>
                  <button
                    onClick={() => setLocale('en')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                      locale === 'en'
                        ? 'btn-primary text-white border-transparent shadow-sm'
                        : 'border-slate-200 dark:border-[#1e2640] bg-white dark:bg-[#131928] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🇬🇧 English (EN)
                  </button>
                </div>
              </div>

              {/* Theme choice */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-white block">{t.prefThemeTitle}</label>
                <p className="text-xs text-slate-500 dark:text-[#8892b0]">{t.prefThemeDesc}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border cursor-pointer ${
                      theme === 'light'
                        ? 'btn-primary text-white border-transparent shadow-sm'
                        : 'border-slate-200 dark:border-[#1e2640] bg-white dark:bg-[#131928] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sun className="size-4" />
                    <span>Mode Clair</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border cursor-pointer ${
                      theme === 'dark'
                        ? 'btn-primary text-white border-transparent shadow-sm'
                        : 'border-slate-200 dark:border-[#1e2640] bg-white dark:bg-[#131928] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="size-4" />
                    <span>Mode Sombre</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Backend FastAPI Health Check */}
          <div className="card-glass gradient-border p-7 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#1e2640] pb-4 text-indigo-600 dark:text-[#a98bff]">
              <Activity className="size-5 text-indigo-500 dark:text-[#22d4fd]" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{t.prefApiTestTitle}</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8892b0]">
              {t.prefApiTestDesc} URL API : <code className="font-mono bg-slate-100 dark:bg-[#080b14] px-2 py-0.5 rounded text-indigo-600 dark:text-[#22d4fd]">{process.env.NEXT_PUBLIC_API_URL || 'https://ocr-studio-api.vercel.app'}</code>
            </p>

            <button
              onClick={runApiTest}
              disabled={testingApi}
              className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-60"
            >
              {testingApi ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t.apiChecking}</span>
                </>
              ) : (
                <>
                  <Activity className="size-4" />
                  <span>{t.prefApiTestBtn}</span>
                </>
              )}
            </button>

            {testResult && (
              <div className={`p-4 rounded-xl text-xs font-mono border ${
                testResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertCircle className="size-4 text-rose-500" />}
                  <span>{testResult.success ? t.prefApiTestSuccess : t.prefApiTestFail}</span>
                </div>
                {testResult.data && (
                  <pre className="mt-2 text-[11px] overflow-x-auto p-2 bg-white/60 dark:bg-black/30 rounded border border-emerald-200 dark:border-emerald-500/20">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
                {testResult.error && (
                  <p className="mt-1 text-rose-600 dark:text-rose-300">{testResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Section 3 : OCR Engine */}
          <div className="card-glass gradient-border p-7 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#1e2640] pb-4 text-indigo-600 dark:text-[#a98bff]">
              <Cpu className="size-5 text-indigo-500 dark:text-[#22d4fd]" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{t.prefEngineTitle}</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-5 rounded-2xl border border-indigo-400/40 dark:border-[#7c5cfc]/40 bg-indigo-50/50 dark:bg-[#7c5cfc]/10 cursor-pointer shadow-xs">
                <input type="radio" name="ocr_engine" className="mt-1 size-4.5 accent-indigo-600 dark:accent-[#7c5cfc]" defaultChecked />
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 dark:text-white font-bold">{t.prefEngineHybridTitle}</strong>
                    <span className="rounded-full bg-indigo-600 dark:bg-[#7c5cfc] px-2.5 py-0.5 font-mono text-[10px] font-bold text-white uppercase tracking-wider">{t.prefEngineBadgeActive}</span>
                  </div>
                  <p className="text-slate-500 dark:text-[#8892b0] leading-relaxed text-xs sm:text-sm">
                    {t.prefEngineHybridDesc}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-[#1e2640] bg-slate-50/50 dark:bg-[#131928]/50 cursor-pointer hover:border-indigo-400/40 dark:hover:border-[#7c5cfc]/40 transition">
                <input type="radio" name="ocr_engine" className="mt-1 size-4.5 accent-indigo-600 dark:accent-[#7c5cfc]" />
                <div className="space-y-1 text-sm">
                  <strong className="text-slate-800 dark:text-white">{t.prefEngineLocalTitle}</strong>
                  <p className="text-slate-500 dark:text-[#8892b0] leading-relaxed text-xs sm:text-sm">
                    {t.prefEngineLocalDesc}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4 : Preprocessing & Exports */}
          <div className="card-glass gradient-border p-7 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#1e2640] pb-4 text-indigo-600 dark:text-[#a98bff]">
              <FileText className="size-5 text-indigo-500 dark:text-[#22d4fd]" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{t.prefProcTitle}</h2>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-[#1e2640]">
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t.prefOpenCVTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-[#8892b0]">{t.prefOpenCVDesc}</p>
                </div>
                <input type="checkbox" defaultChecked className="size-5 accent-indigo-600 dark:accent-[#7c5cfc] rounded cursor-pointer" />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t.prefLatexTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-[#8892b0]">{t.prefLatexDesc}</p>
                </div>
                <input type="checkbox" defaultChecked className="size-5 accent-indigo-600 dark:accent-[#7c5cfc] rounded cursor-pointer" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
