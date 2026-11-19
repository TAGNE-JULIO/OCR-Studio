'use client';

import React from 'react';

interface MetricProps {
  label: string;
  value: string;
  note: string;
}

export function Metric({ label, value, note }: MetricProps) {
  return (
    <div className="card-glass gradient-border p-5 sm:p-6 hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_0_25px_rgba(124,92,252,0.2)] transition-all duration-300 group">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500 dark:text-[#8892b0] group-hover:text-indigo-600 dark:group-hover:text-[#a98bff] transition-colors">
        {label}
      </p>
      <strong className="mt-3 block font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white gradient-text">
        {value}
      </strong>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-[#8892b0] font-medium transition-colors">
        {note}
      </p>
    </div>
  );
}
