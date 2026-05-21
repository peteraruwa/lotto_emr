'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  BarChart2, Activity, Pill, Settings, FileText, Brain, Download,
} from 'lucide-react';
import { Button } from '@lotto-emr/ui';
import { OverviewCards } from './overview-cards';
import { ClinicalPanel } from './clinical-panel';
import { PharmacyPanel } from './pharmacy-panel';
import { OperationsPanel } from './operations-panel';
import { MohPanel } from './moh-panel';
import { AiInsightsPanel } from './ai-insights-panel';
import { getDateRange } from '../hooks/use-analytics';
import type { DateRangePreset, DateRange } from '../hooks/use-analytics';

type Tab = 'overview' | 'clinical' | 'pharmacy' | 'operations' | 'moh' | 'ai';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'overview',    label: 'Overview',    icon: <BarChart2 className="h-4 w-4" /> },
  { id: 'clinical',   label: 'Clinical',    icon: <Activity className="h-4 w-4" /> },
  { id: 'pharmacy',   label: 'Pharmacy',    icon: <Pill className="h-4 w-4" /> },
  { id: 'operations', label: 'Operations',  icon: <Settings className="h-4 w-4" /> },
  { id: 'moh',        label: 'MoH Reports', icon: <FileText className="h-4 w-4" /> },
  { id: 'ai',         label: 'AI Insights', icon: <Brain className="h-4 w-4" /> },
];

const PRESET_LABELS: Record<DateRangePreset, string> = {
  '7d':     'Last 7 days',
  '30d':    'Last 30 days',
  '90d':    'Last 90 days',
  '1y':     'Last 12 months',
  'custom': 'Custom',
};

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab]       = useState<Tab>('overview');
  const [preset, setPreset]             = useState<DateRangePreset>('30d');
  const [customRange, setCustomRange]   = useState<DateRange | undefined>(undefined);

  const range = getDateRange(preset, customRange);

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-blue-600" />
            Analytics & Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Date range selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(['7d', '30d', '90d', '1y'] as DateRangePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  preset === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards — always visible */}
      <OverviewCards range={range} />

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview'    && <ClinicalPanel range={range} />}
        {activeTab === 'clinical'    && <ClinicalPanel range={range} />}
        {activeTab === 'pharmacy'    && <PharmacyPanel range={range} />}
        {activeTab === 'operations'  && <OperationsPanel range={range} />}
        {activeTab === 'moh'         && <MohPanel />}
        {activeTab === 'ai'          && <AiInsightsPanel range={range} />}
      </div>
    </div>
  );
}
