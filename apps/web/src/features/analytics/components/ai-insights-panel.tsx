'use client';

import React, { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, TrendingUp, Wrench, Loader2, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useTotalPatients, useEncounterStats, useTopDiagnoses, useTopMedications } from '../hooks/use-analytics';
import type { DateRange } from '../hooks/use-analytics';
import { subDays } from 'date-fns';

interface InsightCard {
  type: 'change' | 'risk' | 'inefficiency' | 'action';
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
}

const SEVERITY_STYLES: Record<InsightCard['severity'], { bg: string; border: string; icon: string; iconCmp: React.ReactNode }> = {
  info:     { bg: 'bg-blue-50',   border: 'border-blue-200',  icon: 'text-blue-600',  iconCmp: <TrendingUp className="h-4 w-4" /> },
  warning:  { bg: 'bg-amber-50',  border: 'border-amber-200', icon: 'text-amber-600', iconCmp: <AlertTriangle className="h-4 w-4" /> },
  critical: { bg: 'bg-red-50',    border: 'border-red-200',   icon: 'text-red-600',   iconCmp: <AlertTriangle className="h-4 w-4" /> },
  positive: { bg: 'bg-green-50',  border: 'border-green-200', icon: 'text-green-600', iconCmp: <TrendingUp className="h-4 w-4" /> },
};

const TYPE_LABELS: Record<InsightCard['type'], string> = {
  change:       'Monthly Change',
  risk:         'Risk Alert',
  inefficiency: 'Inefficiency',
  action:       'Recommended Action',
};

function InsightCardItem({ insight }: { insight: InsightCard }) {
  const s = SEVERITY_STYLES[insight.severity];
  return (
    <div className={`p-4 rounded-lg border ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-3">
        <div className={`${s.icon} flex-shrink-0 mt-0.5`}>{s.iconCmp}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wide ${s.icon}`}>
              {TYPE_LABELS[insight.type]}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{insight.body}</p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  range: DateRange;
}

export function AiInsightsPanel({ range }: Props) {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { data: total } = useTotalPatients();
  const { data: encounters } = useEncounterStats(range);
  const { data: diagnoses } = useTopDiagnoses(range, 10);
  const { data: meds } = useTopMedications(range, 5);

  // Rule-based static insights (always shown)
  const staticInsights: InsightCard[] = [
    {
      type: 'change',
      title: 'Encounter volume is being tracked',
      body: `${encounters?.total ?? 0} encounters recorded in the selected period. ${encounters?.completed ?? 0} completed. Monitor this trend monthly for capacity planning.`,
      severity: 'info',
    },
    {
      type: 'action',
      title: 'Top diagnosis tracking enabled',
      body: diagnoses?.length
        ? `Most common diagnosis: "${diagnoses[0]?.display}" with ${diagnoses[0]?.count} case(s). Ensure adequate staffing and supplies for high-frequency conditions.`
        : 'No diagnosis data yet. Start recording conditions to enable pattern detection.',
      severity: diagnoses?.length ? 'positive' : 'info',
    },
    {
      type: 'action',
      title: 'Pharmacy utilisation available',
      body: meds?.length
        ? `Top prescribed drug: "${meds[0]?.name}" (${meds[0]?.count} prescriptions). Use this data for procurement planning and stock forecasting.`
        : 'No prescription data yet. Pharmacy utilisation insights will appear once MedicationRequests are recorded.',
      severity: 'info',
    },
    {
      type: 'risk',
      title: 'Real-time operational alerts not connected',
      body: 'Lab turnaround times, bed occupancy, and radiology processing times require additional workflow integration. Contact your system administrator to enable these indicators.',
      severity: 'warning',
    },
  ];

  async function runAiAnalysis() {
    if (!total && !encounters?.total) return;

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const context = {
        totalPatients: total,
        encounters: encounters?.total,
        completedEncounters: encounters?.completed,
        topDiagnoses: diagnoses?.slice(0, 5).map((d) => `${d.display} (${d.count} cases)`),
        topMedications: meds?.slice(0, 5).map((m) => `${m.name} (${m.count} prescriptions)`),
      };

      const prompt = `You are a hospital analytics AI assistant. Analyze this hospital data and provide 3-5 concise, actionable insights. Focus on: what changed, key risks, operational improvements, and procurement recommendations.

Hospital Data:
${JSON.stringify(context, null, 2)}

Provide insights in plain text, using bullet points (•). Each insight should be 1-2 sentences. Be specific and actionable. Do not invent data not provided.`;

      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'AI analysis failed');
      }

      const data = await res.json();
      setAiResponse(data.text);
    } catch (err) {
      setAiError((err as Error).message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* AI analysis button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            AI-Powered Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Click to run an AI analysis of your current EMR data. The AI identifies patterns,
            risks, and recommendations based on your hospital&apos;s actual data.
          </p>
          <Button
            onClick={runAiAnalysis}
            disabled={aiLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {aiLoading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analysing…</>
              : <><Sparkles className="h-4 w-4 mr-2" />Run AI Analysis</>
            }
          </Button>

          {aiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {aiError}
            </div>
          )}

          {aiResponse && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">AI Analysis</span>
                <button
                  type="button"
                  onClick={runAiAnalysis}
                  className="ml-auto text-purple-500 hover:text-purple-700"
                  title="Regenerate"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {aiResponse}
              </div>
              <p className="text-xs text-purple-400 mt-3">
                ⚠ AI outputs are advisory only. Always validate with clinical judgement.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule-based insights */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5" />
          System Insights
        </h3>
        <div className="space-y-3">
          {staticInsights.map((ins, i) => (
            <InsightCardItem key={i} insight={ins} />
          ))}
        </div>
      </div>

      {/* Predictive notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-gray-900">Predictive Analytics</h4>
              <p className="text-xs text-gray-500 mt-1">
                Machine learning-based demand forecasting, seasonal disease prediction, and
                staffing optimisation models are available as an add-on. These require 3+
                months of consistent data for reliable predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
