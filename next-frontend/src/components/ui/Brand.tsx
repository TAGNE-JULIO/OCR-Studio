import React from 'react';
import { Sparkles } from 'lucide-react';

export function Brand() {
  return (
    <div className="flex items-center gap-3.5 group cursor-pointer">
      <div className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#5b3de8] shadow-[0_0_20px_rgba(124,92,252,0.4)] group-hover:scale-105 transition-transform">
        <span className="font-display text-xl font-bold text-white">O</span>
        <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#22d4fd] ring-2 ring-[#080b14]" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-[19px] font-bold tracking-tight text-white flex items-center gap-1">
          OCR Studio <span className="text-[#22d4fd] text-xs font-mono font-normal px-1.5 py-0.5 rounded bg-[#22d4fd]/10 border border-[#22d4fd]/20">PRO</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8892b0]">
          AI Manuscript Studio
        </span>
      </div>
    </div>
  );
}
