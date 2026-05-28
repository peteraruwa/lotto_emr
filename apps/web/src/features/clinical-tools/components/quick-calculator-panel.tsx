'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, Baby, Brain, ChevronRight, Droplets,
  Heart, Scissors, Stethoscope, Users, Wind, X, Zap,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { ALL_TOOLS, TOOL_GROUPS, getToolById } from '../constants';
import type { ToolDefinition, ToolGroup } from '../types';
import { ToolCard } from './tool-card';

const ICON_MAP: Record<string, React.ElementType> = {
  AlertTriangle,
  Stethoscope,
  Heart,
  Wind,
  Brain,
  Droplets,
  Scissors,
  Baby,
  Users,
  Activity,
};

interface QuickCalculatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialToolId?: string;
}

export function QuickCalculatorPanel({ isOpen, onClose, initialToolId }: QuickCalculatorPanelProps) {
  const [activeGroup, setActiveGroup] = useState<ToolGroup>(() => {
    if (initialToolId) {
      const t = getToolById(initialToolId);
      if (t) return t.group;
    }
    return TOOL_GROUPS[0].id;
  });
  const [activeToolId, setActiveToolId] = useState<string | null>(initialToolId ?? null);

  useEffect(() => {
    if (initialToolId) {
      const t = getToolById(initialToolId);
      if (t) {
        setActiveGroup(t.group);
        setActiveToolId(initialToolId);
      }
    }
  }, [initialToolId]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const visibleGroups = useMemo(
    () => TOOL_GROUPS.filter((g) => ALL_TOOLS.some((t) => t.group === g.id)),
    [],
  );

  const toolsInGroup = useMemo<ToolDefinition[]>(
    () => ALL_TOOLS.filter((t) => t.group === activeGroup),
    [activeGroup],
  );

  const activeTool = activeToolId ? getToolById(activeToolId) : null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:bg-black/20"
        onClick={onClose}
      />

      {/* Slide-over */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 bg-white shadow-2xl flex flex-col',
          'w-full md:w-[480px]',
          'animate-slide-in-right',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeTool && (
              <button
                type="button"
                onClick={() => setActiveToolId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                title="Back to tool list"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {activeTool ? activeTool.shortName : 'Clinical Tools'}
              </p>
              <p className="text-[11px] text-gray-400 truncate leading-tight">
                {activeTool ? activeTool.name : 'Deterministic clinical scoring engines'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTool ? (
            <div className="p-4">
              <ToolCard tool={activeTool} />
            </div>
          ) : (
            <>
              {/* Group tabs */}
              <div className="border-b border-gray-100 px-3 py-2 flex gap-1 overflow-x-auto scrollbar-hide sticky top-0 bg-white z-10">
                {visibleGroups.map((g) => {
                  const Icon = ICON_MAP[g.icon] ?? Activity;
                  const isActive = activeGroup === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveGroup(g.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors',
                        isActive
                          ? 'bg-hospital-600 text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      {g.label}
                    </button>
                  );
                })}
              </div>

              {/* Tools list */}
              <div className="p-3 space-y-1.5">
                {toolsInGroup.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveToolId(tool.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white border border-gray-100 hover:border-hospital-200 hover:bg-hospital-50/40 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{tool.shortName}</p>
                      <p className="text-[11px] text-gray-400 truncate leading-tight">{tool.description}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
                {toolsInGroup.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-8">No tools in this group yet.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="border-t border-gray-100 px-4 py-2.5 bg-amber-50 flex items-start gap-2 flex-shrink-0">
          <Zap className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-snug">
            Deterministic clinical rules. Not AI-generated. Not a substitute for clinical judgement.
          </p>
        </div>
      </aside>
    </>
  );
}
