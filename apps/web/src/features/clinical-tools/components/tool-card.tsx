'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@lotto-emr/ui';
import { Zap } from 'lucide-react';
import type { ScoreRisk, ToolDefinition, ToolInputField, ToolResult } from '../types';
import { ScoreBadge } from './score-badge';
import { RuleBreakdown } from './rule-breakdown';
import { CopyResultsButton } from './copy-results-button';

interface ToolCardProps {
  tool: ToolDefinition;
  initialValues?: Record<string, unknown>;
  patientId?: string;
  patientName?: string;
  compact?: boolean;
  onResult?: (result: ToolResult) => void;
}

const RISK_BORDER: Record<ScoreRisk, string> = {
  low: 'border-l-green-500',
  moderate: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
};

function defaultValueForField(field: ToolInputField): unknown {
  if (field.type === 'boolean') return false;
  if (field.type === 'select') return field.options?.[0]?.value ?? '';
  if (field.type === 'range' || field.type === 'number') {
    if (typeof field.min === 'number') return field.min;
    return 0;
  }
  return '';
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: ToolInputField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const inputBase =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-400 bg-white';

  if (field.type === 'boolean') {
    const checked = Boolean(value);
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-hospital-600 focus:ring-hospital-400"
        />
        <span className="text-sm text-gray-700">{checked ? 'Yes' : 'No'}</span>
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => {
          const found = field.options?.find((o) => String(o.value) === e.target.value);
          onChange(found?.value ?? e.target.value);
        }}
        className={inputBase}
      >
        {field.options?.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'range') {
    const numVal = Number(value) || 0;
    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={numVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-hospital-600"
        />
        <div className="w-14 text-center px-2 py-1 rounded-lg bg-gray-100 font-bold text-gray-800 tabular-nums text-sm">
          {numVal}
        </div>
      </div>
    );
  }

  // number
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        value={value === '' || value === undefined || value === null ? '' : Number(value)}
        placeholder={field.placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? '' : Number(raw));
        }}
        className={cn(inputBase, 'flex-1')}
      />
      {field.unit && (
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{field.unit}</span>
      )}
    </div>
  );
}

export function ToolCard({
  tool,
  initialValues,
  patientId,
  patientName,
  compact = false,
  onResult,
}: ToolCardProps) {
  // Initialise state with defaults + any provided initial values
  const initial = useMemo<Record<string, unknown>>(() => {
    const base: Record<string, unknown> = {};
    tool.fields.forEach((f) => {
      base[f.id] = initialValues?.[f.id] ?? defaultValueForField(f);
    });
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.id]);

  const [values, setValues] = useState<Record<string, unknown>>(initial);

  // Compute result on every change
  const result = useMemo<ToolResult>(() => {
    const r = tool.compute(values);
    if (patientId) r.patientId = patientId;
    if (patientName) r.patientName = patientName;
    return r;
  }, [tool, values, patientId, patientName]);

  // Notify parent of latest result
  useEffect(() => {
    onResult?.(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  function setField(id: string, v: unknown) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 overflow-hidden',
        RISK_BORDER[result.risk],
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{tool.name}</h3>
            {!compact && tool.description && (
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{tool.description}</p>
            )}
          </div>
          <ScoreBadge score={result.score} risk={result.risk} label={result.label} size={compact ? 'sm' : 'md'} />
        </div>
      </div>

      {/* Form */}
      <div className={cn('px-4 py-3', compact ? 'space-y-2.5' : 'space-y-3')}>
        <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          {tool.fields.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                {field.label}
              </label>
              <FieldControl
                field={field}
                value={values[field.id]}
                onChange={(v) => setField(field.id, v)}
              />
              {field.hint && <p className="text-[10px] text-gray-400">{field.hint}</p>}
            </div>
          ))}
        </div>

        {/* Interpretation */}
        <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs space-y-1">
          <p className="text-gray-800">
            <span className="font-semibold text-gray-900">Interpretation:</span>{' '}
            {result.interpretation}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Recommendation:</span>{' '}
            {result.recommendation}
          </p>
        </div>

        {/* Breakdown */}
        <RuleBreakdown breakdown={result.breakdown} />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />
            <span>Computed using deterministic clinical rules. Not AI-generated.</span>
          </div>
          <CopyResultsButton result={result} />
        </div>

        {tool.reference && (
          <p className="text-[10px] text-gray-400 italic">Ref: {tool.reference}</p>
        )}
      </div>
    </div>
  );
}
