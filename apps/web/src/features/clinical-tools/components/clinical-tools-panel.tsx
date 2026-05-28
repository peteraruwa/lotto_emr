'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Baby, Brain, ChevronDown, ChevronRight,
  Droplets, Heart, Scissors, Stethoscope, Users, Wind, Zap,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
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

interface ClinicalToolsPanelProps {
  patientId: string;
  patientName: string;
  patientAge?: number;
  role?: string;
}

export function ClinicalToolsPanel({
  patientId,
  patientName,
  role,
}: ClinicalToolsPanelProps) {
  const isNurse = role === 'nurse';

  // Filter tools by nurse visibility
  const tools = useMemo<ToolDefinition[]>(
    () => (isNurse ? ALL_TOOLS.filter((t) => t.nurseVisible) : ALL_TOOLS),
    [isNurse],
  );

  // Group tools
  const toolsByGroup = useMemo(() => {
    const map = new Map<ToolGroup, ToolDefinition[]>();
    tools.forEach((t) => {
      const list = map.get(t.group) ?? [];
      list.push(t);
      map.set(t.group, list);
    });
    return map;
  }, [tools]);

  const visibleGroups = TOOL_GROUPS.filter((g) => toolsByGroup.has(g.id));

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const first = visibleGroups[0]?.id;
    return first ? { [first]: true } : {};
  });
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  function toggleGroup(groupId: ToolGroup) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
        <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-snug">
          <span className="font-bold">All clinical scores are computed using deterministic clinical rules.</span>{' '}
          Not AI-generated. Not a substitute for clinical judgement.
        </p>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {visibleGroups.map((group) => {
          const Icon = ICON_MAP[group.icon] ?? Activity;
          const groupTools = toolsByGroup.get(group.id) ?? [];
          const isOpen = openGroups[group.id] ?? false;

          return (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', group.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">{group.label}</h3>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {groupTools.length} tool{groupTools.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 p-3 space-y-2 bg-gray-50/40">
                  {groupTools.map((tool) => {
                    const expanded = activeToolId === tool.id;
                    return (
                      <div key={tool.id}>
                        <button
                          type="button"
                          onClick={() => setActiveToolId(expanded ? null : tool.id)}
                          className={cn(
                            'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border',
                            expanded
                              ? 'bg-white border-hospital-200 shadow-sm'
                              : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50',
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{tool.shortName}</p>
                            <p className="text-[11px] text-gray-400 truncate leading-tight">{tool.name}</p>
                          </div>
                          {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>

                        {expanded && (
                          <div className="mt-2">
                            <ToolCard
                              tool={tool}
                              patientId={patientId}
                              patientName={patientName}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
