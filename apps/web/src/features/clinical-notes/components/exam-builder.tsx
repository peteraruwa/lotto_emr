'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@lotto-emr/ui';
import { EXAM_MODULES } from '../data/exam-data';
import type { ExamModule, ExamOption } from '../data/exam-data';

// ── Types ──────────────────────────────────────────────────────────────────────
export type ExamBuilderValue = Record<string, Record<string, string | string[]>>;

interface ExamBuilderProps {
  value: ExamBuilderValue;
  onChange: (v: ExamBuilderValue) => void;
  onGenerateNarrative: () => void;
  isGenerating?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build the default selections for all modules */
function buildDefaults(): ExamBuilderValue {
  const defaults: ExamBuilderValue = {};
  for (const mod of EXAM_MODULES) {
    defaults[mod.id] = {};
    for (const item of mod.items) {
      if (item.type === 'single_select' && item.default !== undefined) {
        defaults[mod.id][item.category] = item.default;
      } else if (item.type === 'multi_select' && item.default_selected !== undefined) {
        defaults[mod.id][item.category] = [...item.default_selected];
      }
    }
  }
  return defaults;
}

/** Check whether a module's current selections all match the defaults */
function isModuleNormal(mod: ExamModule, moduleValue: Record<string, string | string[]>): boolean {
  for (const item of mod.items) {
    const current = moduleValue[item.category];
    if (item.type === 'single_select') {
      if (current !== item.default) return false;
    } else {
      const def = item.default_selected ?? [];
      const cur = (current as string[]) ?? [];
      if (
        cur.length !== def.length ||
        !def.every((d) => cur.includes(d))
      ) {
        return false;
      }
    }
  }
  return true;
}

// ── Single-select pill row ──────────────────────────────────────────────────────
function SingleSelectRow({
  item,
  selected,
  onSelect,
}: {
  item: ExamOption;
  selected: string;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600">{item.category}</p>
      <div className="flex flex-wrap gap-1.5">
        {item.options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ' +
                (isSelected
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-700')
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Multi-select chip row ───────────────────────────────────────────────────────
function MultiSelectRow({
  item,
  selected,
  onToggle,
}: {
  item: ExamOption;
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600">{item.category}</p>
      <div className="flex flex-wrap gap-1.5">
        {item.options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ' +
                (isSelected
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-700')
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Module card ─────────────────────────────────────────────────────────────────
function ModuleCard({
  mod,
  moduleValue,
  onModuleChange,
}: {
  mod: ExamModule;
  moduleValue: Record<string, string | string[]>;
  onModuleChange: (category: string, val: string | string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const normal = isModuleNormal(mod, moduleValue);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{mod.label}</span>
          {normal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
              ✓ Normal
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="p-4 space-y-4 bg-white">
          {mod.items.map((item) => {
            if (item.type === 'single_select') {
              const val = (moduleValue[item.category] as string) ?? item.default ?? '';
              return (
                <SingleSelectRow
                  key={item.category}
                  item={item}
                  selected={val}
                  onSelect={(v) => onModuleChange(item.category, v)}
                />
              );
            } else {
              const val = (moduleValue[item.category] as string[]) ?? item.default_selected ?? [];
              return (
                <MultiSelectRow
                  key={item.category}
                  item={item}
                  selected={val}
                  onToggle={(v) => {
                    const current = (moduleValue[item.category] as string[]) ?? [];
                    const next = current.includes(v)
                      ? current.filter((c) => c !== v)
                      : [...current, v];
                    onModuleChange(item.category, next);
                  }}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ExamBuilder component ─────────────────────────────────────────────────
export function ExamBuilder({
  value,
  onChange,
  onGenerateNarrative,
  isGenerating = false,
}: ExamBuilderProps) {
  // Populate defaults on first mount if value is empty
  useEffect(() => {
    const hasAnyData = Object.keys(value).length > 0;
    if (!hasAnyData) {
      onChange(buildDefaults());
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleModuleChange(
    moduleId: string,
    category: string,
    val: string | string[]
  ) {
    onChange({
      ...value,
      [moduleId]: {
        ...(value[moduleId] ?? {}),
        [category]: val,
      },
    });
  }

  return (
    <div className="space-y-3">
      {EXAM_MODULES.map((mod) => (
        <ModuleCard
          key={mod.id}
          mod={mod}
          moduleValue={value[mod.id] ?? {}}
          onModuleChange={(category, val) =>
            handleModuleChange(mod.id, category, val)
          }
        />
      ))}

      {/* Generate Narrative button */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onGenerateNarrative}
          disabled={isGenerating}
          className="gap-1.5"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Narrative'}
        </Button>
      </div>
    </div>
  );
}
