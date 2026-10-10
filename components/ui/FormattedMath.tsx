'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface FormattedMathProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export function FormattedMath({ math, displayMode = true, className = '' }: FormattedMathProps) {
  const html = useMemo(() => {
    try {
      // Clean up common string artifacts
      let cleaned = math.trim();
      // If it contains newlines, split or convert to aligned environment
      if (cleaned.includes('\n')) {
        const lines = cleaned.split('\n').filter((l) => l.trim().length > 0);
        cleaned = `\\begin{aligned} ${lines.map((l) => l.replace(/=/g, '&= ')).join(' \\\\[4pt] ')} \\end{aligned}`;
      }

      return katex.renderToString(cleaned, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch (err) {
      console.warn('KaTeX rendering error:', err);
      return `<span class="font-mono text-xs">${math}</span>`;
    }
  }, [math, displayMode]);

  return (
    <div
      className={`katex-math-container font-serif select-text ${
        displayMode
          ? 'py-2 px-3 my-1 rounded-xl bg-[#faf9f5] dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] overflow-x-auto text-center shadow-2xs'
          : 'inline-block'
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
