import React from 'react';

interface MetricProps {
  label: string;
  value: string;
  note: string;
}

export function Metric({ label, value, note }: MetricProps) {
  return (
    <div className="card-glass gradient-border p-5 sm:p-6 hover:shadow-[0_0_25px_rgba(124,92,252,0.2)] transition-all duration-300 group">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-[#8892b0] group-hover:text-[#a98bff] transition-colors">
        {label}
      </p>
      <strong className="mt-3 block font-display text-3xl sm:text-4xl font-bold tracking-tight text-white gradient-text">
        {value}
      </strong>
      <p className="mt-1.5 text-xs text-[#8892b0] font-medium">
        {note}
      </p>
    </div>
  );
}
