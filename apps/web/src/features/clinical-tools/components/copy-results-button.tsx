'use client';

import React, { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { ToolResult } from '../types';
import { formatResultForCopy } from '../utils/copy-results';

interface CopyResultsButtonProps {
  result: ToolResult;
  className?: string;
}

export function CopyResultsButton({ result, className }: CopyResultsButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const text = formatResultForCopy(result);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failure — fall back silently (UX only)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors',
        copied
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
        className,
      )}
    >
      {copied ? (
        <>
          <CheckCheck className="h-3.5 w-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy Results
        </>
      )}
    </button>
  );
}
