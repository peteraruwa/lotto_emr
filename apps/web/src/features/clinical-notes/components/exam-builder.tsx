'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Loader2, Wand2 } from 'lucide-react';
import { Button, Tooltip } from '@lotto-emr/ui';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EXAM_MODULES } from '../data/exam-data';
import type { ExamModule, ExamOption, VitalsSnapshot } from '../data/exam-data';

// ── Types ──────────────────────────────────────────────────────────────────────
export type ExamBuilderValue = Record<string, Record<string, string | string[]>>;

interface ExamBuilderProps {
  value: ExamBuilderValue;
  onChange: (v: ExamBuilderValue) => void;
  vitals?: VitalsSnapshot;
  onGenerateNarrative: () => void;
  isGenerating: boolean;
  aiAlerts?: string[];
}

// ── Defaults builder ───────────────────────────────────────────────────────────
function buildDefaults(vitals?: VitalsSnapshot): ExamBuilderValue {
  const defaults: ExamBuilderValue = {};
  for (const mod of EXAM_MODULES) {
    defaults[mod.id] = {};
    for (const item of mod.items) {
      if (item.type === 'single_select' && item.default !== undefined) {
        defaults[mod.id][item.category] = item.default;
      } else if (item.type === 'multi_select' && item.default_selected !== undefined) {
        defaults[mod.id][item.category] = [...item.default_selected];
      } else if (item.type === 'free_numeric_text' && item.vitalKey && vitals) {
        const v = vitals[item.vitalKey as keyof VitalsSnapshot];
        if (v !== undefined) defaults[mod.id][item.category] = v;
      }
    }
  }
  return defaults;
}

function isModuleNormal(mod: ExamModule, moduleValue: Record<string, string | string[]>): boolean {
  for (const item of mod.items) {
    if (item.type === 'free_numeric_text') continue;
    const current = moduleValue[item.category];
    if (item.type === 'single_select') {
      if (current !== item.default) return false;
    } else {
      const def = item.default_selected ?? [];
      const cur = (current as string[]) ?? [];
      if (cur.length !== def.length || !def.every((d) => cur.includes(d))) return false;
    }
  }
  return true;
}

// ── Pill selects ───────────────────────────────────────────────────────────────
function SingleSelectRow({ item, selected, onSelect }: {
  item: ExamOption; selected: string; onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600">{item.category}</p>
      <div className="flex flex-wrap gap-1.5">
        {(item.options ?? []).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ' +
              (selected === opt
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:text-teal-700')
            }
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectRow({ item, selected, onToggle }: {
  item: ExamOption; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600">{item.category}</p>
      <div className="flex flex-wrap gap-1.5">
        {(item.options ?? []).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ' +
              (selected.includes(opt)
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:text-teal-700')
            }
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FreeNumericTextRow({ item, value, vitals, onChange }: {
  item: ExamOption; value: string; vitals?: VitalsSnapshot; onChange: (v: string) => void;
}) {
  const vitalValue = item.vitalKey && vitals ? vitals[item.vitalKey as keyof VitalsSnapshot] : undefined;
  const hasVital = vitalValue !== undefined && vitalValue !== '';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-gray-600">{item.category}</p>
        {hasVital && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
            {vitalValue} · from nurse vitals
          </span>
        )}
      </div>
      {!hasVital && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={item.placeholder ?? ''}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      )}
    </div>
  );
}

// ── Module card (shared body) ──────────────────────────────────────────────────
function ModuleBody({
  mod,
  moduleValue,
  vitals,
  onModuleChange,
}: {
  mod: ExamModule;
  moduleValue: Record<string, string | string[]>;
  vitals?: VitalsSnapshot;
  onModuleChange: (category: string, val: string | string[]) => void;
}) {
  return (
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
        } else if (item.type === 'multi_select') {
          const val = (moduleValue[item.category] as string[]) ?? item.default_selected ?? [];
          return (
            <MultiSelectRow
              key={item.category}
              item={item}
              selected={val}
              onToggle={(v) => {
                const cur = (moduleValue[item.category] as string[]) ?? [];
                onModuleChange(item.category, cur.includes(v) ? cur.filter((c) => c !== v) : [...cur, v]);
              }}
            />
          );
        } else {
          const vitalValue = item.vitalKey && vitals ? vitals[item.vitalKey as keyof VitalsSnapshot] : undefined;
          const hasVital = vitalValue !== undefined && vitalValue !== '';
          const displayVal = hasVital ? (vitalValue as string) : ((moduleValue[item.category] as string) ?? '');
          return (
            <FreeNumericTextRow
              key={item.category}
              item={item}
              value={displayVal}
              vitals={vitals}
              onChange={(v) => onModuleChange(item.category, v)}
            />
          );
        }
      })}
    </div>
  );
}

// ── Fixed module card (General Examination) ────────────────────────────────────
function FixedModuleCard({
  mod,
  moduleValue,
  vitals,
  onModuleChange,
}: {
  mod: ExamModule;
  moduleValue: Record<string, string | string[]>;
  vitals?: VitalsSnapshot;
  onModuleChange: (category: string, val: string | string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const normal = isModuleNormal(mod, moduleValue);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{mod.label}</span>
          <span className="text-[10px] font-medium text-gray-400 bg-gray-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
            Fixed
          </span>
          {normal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
              ✓ All normal
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>
      {open && (
        <ModuleBody mod={mod} moduleValue={moduleValue} vitals={vitals} onModuleChange={onModuleChange} />
      )}
    </div>
  );
}

// ── Sortable module card ───────────────────────────────────────────────────────
function SortableModuleCard({
  mod,
  moduleValue,
  vitals,
  onModuleChange,
}: {
  mod: ExamModule;
  moduleValue: Record<string, string | string[]>;
  vitals?: VitalsSnapshot;
  onModuleChange: (category: string, val: string | string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const normal = isModuleNormal(mod, moduleValue);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${mod.label}`}
          className="px-2 py-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center justify-between pr-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{mod.label}</span>
            {normal && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                ✓ All normal
              </span>
            )}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
        </button>
      </div>

      {open && (
        <ModuleBody mod={mod} moduleValue={moduleValue} vitals={vitals} onModuleChange={onModuleChange} />
      )}
    </div>
  );
}

// ── Main ExamBuilder ───────────────────────────────────────────────────────────
const FIXED_MODULE = EXAM_MODULES[0]; // general_examination — always first
const DRAGGABLE_MODULES = EXAM_MODULES.slice(1);

export function ExamBuilder({
  value,
  onChange,
  vitals,
  onGenerateNarrative,
  isGenerating,
  aiAlerts = [],
}: ExamBuilderProps) {
  const [moduleOrder, setModuleOrder] = useState<string[]>(() =>
    DRAGGABLE_MODULES.map((m) => m.id)
  );

  // Populate defaults on first mount
  useEffect(() => {
    if (Object.keys(value).length === 0) {
      onChange(buildDefaults(vitals));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModuleOrder((prev) => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  function handleModuleChange(moduleId: string, category: string, val: string | string[]) {
    onChange({
      ...value,
      [moduleId]: { ...(value[moduleId] ?? {}), [category]: val },
    });
  }

  const orderedDraggable = moduleOrder
    .map((id) => DRAGGABLE_MODULES.find((m) => m.id === id))
    .filter(Boolean) as ExamModule[];

  return (
    <div className="space-y-3">
      {/* AI alerts */}
      {aiAlerts.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3">
          <p className="text-sm font-semibold text-yellow-800 mb-1.5">⚠ AI Suggestions based on vitals:</p>
          <ul className="space-y-1">
            {aiAlerts.map((alert, idx) => (
              <li key={idx} className="text-sm text-yellow-800 flex gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fixed: General Examination */}
      <FixedModuleCard
        mod={FIXED_MODULE}
        moduleValue={value[FIXED_MODULE.id] ?? {}}
        vitals={vitals}
        onModuleChange={(cat, val) => handleModuleChange(FIXED_MODULE.id, cat, val)}
      />

      {/* Draggable hint */}
      <p className="text-[11px] text-gray-400 text-right pr-1">
        Drag <GripVertical className="inline h-3 w-3" /> to reorder examination sections
      </p>

      {/* Draggable sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={moduleOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedDraggable.map((mod) => (
              <SortableModuleCard
                key={mod.id}
                mod={mod}
                moduleValue={value[mod.id] ?? {}}
                vitals={vitals}
                onModuleChange={(cat, val) => handleModuleChange(mod.id, cat, val)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Generate Narrative */}
      <div className="flex justify-end pt-2">
        <Tooltip label="Convert the examination findings above into a written clinical narrative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateNarrative}
            disabled={isGenerating}
            className="gap-1.5"
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {isGenerating ? 'Generating...' : 'Generate Examination Narrative'}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
