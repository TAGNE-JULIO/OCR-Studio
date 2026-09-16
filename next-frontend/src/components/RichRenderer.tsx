import React, { useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RichRendererProps {
  content: string;
}

export function RichRenderer({ content }: RichRendererProps) {
  const htmlContent = useMemo(() => {
    if (!content.trim()) return '';

    // 1. Pre-process: extract and render block math $$...$$
    let processed = content.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          output: 'html',
        });
        return `<div class="katex-block my-4">${rendered}</div>`;
      } catch {
        return `<div class="katex-block my-4 text-red-500">Formule invalide: ${formula}</div>`;
      }
    });

    // 2. Pre-process: extract and render inline math $...$
    processed = processed.replace(/\$([^$\n]+?)\$/g, (_match, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
          output: 'html',
        });
        return `<span class="katex-inline">${rendered}</span>`;
      } catch {
        return `<span class="text-red-500">$${formula}$</span>`;
      }
    });

    // 3. Detect and format [GRAPHIQUE: ...] blocks
    processed = processed.replace(/\[GRAPHIQUE\s*:\s*([^\]]+)\]/gi, (_m, type) => {
      return `<div class="graphique-block my-3 rounded-xl border-2 border-[#bcd0e7] bg-[#f0f7ff] p-4 flex items-center gap-3">
        <span class="text-2xl">\ud83d\udcc8</span>
        <div>
          <p class="font-bold text-[#083e8c] text-sm">Graphique détecté</p>
          <p class="text-[#315b89] text-sm">${type.trim()}</p>
        </div>
      </div>`;
    });

    // 4. Configure marked for clean rendering
    marked.setOptions({
      breaks: true,
      gfm: true,
    } as any);

    // 5. Parse Markdown -> HTML
    const html = marked.parse(processed) as string;
    return html;
  }, [content]);

  return (
    <div
      className="rich-content min-h-[320px] overflow-y-auto"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        lineHeight: 1.75,
        color: '#183d6b',
        fontSize: '15px',
      }}
    />
  );
}
