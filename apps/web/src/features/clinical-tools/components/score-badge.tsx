'use client';

import React from 'react';
import { cn } from '@lotto-emr/ui';
import type { ScoreRisk } from '../types';

interface ScoreBadgeProps {
  score: number | string;
  risk: ScoreRisk;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const RISK_CLASSES: Record<ScoreRisk, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

const SCORE_SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function ScoreBadge({ score, risk, label, size = 'md' }: ScoreBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border font-semibold',
        SIZE_CLASSES[size],
        RISK_CLASSES[risk],
      )}
    >
      <span className={cn('font-bold tabular-nums leading-none', SCORE_SIZE_CLASSES[size])}>
        {score}
      </span>
      <span className="uppercase tracking-wide leading-none">{label}</span>
    </div>
  );
}
