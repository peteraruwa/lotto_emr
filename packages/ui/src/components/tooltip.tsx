import * as React from 'react';
import { cn } from '../lib/utils';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/**
 * Lightweight CSS-only tooltip wrapper.
 * Wraps any element; shows `label` on hover above (or below) the child.
 */
export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  return (
    <div className={cn('relative inline-flex group', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 px-2 py-1',
          'rounded bg-gray-900 text-white text-[11px] leading-tight whitespace-nowrap',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          side === 'top'
            ? 'bottom-full mb-2 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-900'
            : 'top-full mt-2 after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900'
        )}
      >
        {label}
      </span>
    </div>
  );
}
