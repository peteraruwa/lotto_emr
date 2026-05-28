'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Baby, Brain, Calculator, Droplets,
  Heart, Scissors, Stethoscope, Users, Wind, X, Zap,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { PageRoleGuard } from '@/shared/components/page-role-guard';
import { CLINICAL_ROLES } from '@/shared/rbac/roles';
import { ALL_TOOLS, TOOL_GROUPS } from '../constants';
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

function ClinicalToolsContent() {
  const visibleGroups = useMemo(
    () => TOOL_GROUPS.filter((g) => ALL_TOOLS.some((t) => t.group === g.id)),
    [],
  );

  const [activeGroup, setActiveGroup] = useState<ToolGroup>(visibleGroups[0]?.id ?? 'emergency-icu');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);

  const toolsInGroup = useMemo<ToolDefinition[]>(
    () => ALL_TOOLS.filter((t) => t.group === activeGroup),
    [activeGroup],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-hospital-100 text-hospital-700 flex items-center justify-center flex-shrink-0">
          <Calculator className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Clinical Tools</h1>
          <p className="text-xs text-gray-400">
            Deterministic clinical scoring engines. {ALL_TOOLS.length} tools available.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
        <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-snug">
          <span className="font-bold">All scores are computed using deterministic clinical rules.</span>{' '}
          Not AI-generated. Not a substitute for clinical judgement.
        </p>
      </div>

      {/* Group tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {visibleGroups.map((g) => {
          const Icon = ICON_MAP[g.icon] ?? Activity;
          const isActive = activeGroup === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setActiveGroup(g.id);
                setActiveTool(null);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border',
                isActive
                  ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm shadow-hospital-600/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {toolsInGroup.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool)}
            className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-hospital-200 hover:shadow-sm transition-all group"
          >
            <p className="text-sm font-bold text-gray-900 group-hover:text-hospital-700 transition-colors">
              {tool.shortName}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{tool.name}</p>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-snug">{tool.description}</p>
          </button>
        ))}
      </div>

      {/* Tool modal */}
      {activeTool && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-10 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={() => setActiveTool(null)}
        >
          <div
            className="bg-transparent w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="w-8 h-8 rounded-xl bg-white text-gray-500 hover:bg-gray-100 flex items-center justify-center shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ToolCard tool={activeTool} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ClinicalToolsPage() {
  return (
    <PageRoleGuard roles={CLINICAL_ROLES}>
      <ClinicalToolsContent />
    </PageRoleGuard>
  );
}
