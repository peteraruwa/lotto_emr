'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { ScoreRuleItem } from '../types';

interface RuleBreakdownProps {
  breakdown: ScoreRuleItem[];
  defaultOpen?: boolean;
}

function pointsBgClass(points: number): string {
  if (points >= 3) return 'bg-red-50/60';
  if (points >= 1) return 'bg-amber-50/60';
  if (points < 0) return 'bg-blue-50/60';
  return 'bg-white';
}

function pointsTextClass(points: number): string {
  if (points >= 3) return 'text-red-700';
  if (points >= 1) return 'text-amber-700';
  if (points < 0) return 'text-blue-700';
  return 'text-gray-400';
}

export function RuleBreakdown({ breakdown, defaultOpen = false }: RuleBreakdownProps) {
  const [open, setOpen] = useState(defaultOpen);

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);
  // Some engines (BMI, eGFR, MAP) use 0-point breakdowns as informational rows;
  // only show "+" prefix when there are non-zero rows
  const hasPointValues = breakdown.some((b) => b.points !== 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>Score breakdown ({breakdown.length} parameters)</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">
                  Parameter
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">
                  Value
                </th>
                <th className="px-4 py-2 text-right font-semibold text-gray-500 uppercase tracking-wide">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {breakdown.map((item, idx) => (
                <tr key={`${item.parameter}-${idx}`} className={cn(pointsBgClass(item.points))}>
                  <td className="px-4 py-2 align-top text-gray-700 font-medium">
                    {item.parameter}
                    {item.explanation && (
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{item.explanation}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top text-gray-800 tabular-nums">{item.value}</td>
                  <td className={cn('px-4 py-2 align-top text-right font-bold tabular-nums', pointsTextClass(item.points))}>
                    {item.points > 0 ? '+' : ''}
                    {item.points}
                  </td>
                </tr>
              ))}
              {hasPointValues && (
                <tr className="bg-gray-100 font-bold">
                  <td className="px-4 py-2 text-gray-800 uppercase tracking-wide text-[11px]">Total</td>
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2 text-right text-gray-900 tabular-nums">{total}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
