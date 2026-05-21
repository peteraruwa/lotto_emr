'use client';

import React from 'react';
import { Clock, Bed, FlaskConical, Radio, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useEncounterStats } from '../hooks/use-analytics';
import type { DateRange } from '../hooks/use-analytics';

interface MetricCardProps {
  title: string;
  value: string;
  target?: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  description: string;
}

function MetricCard({ title, value, target, status, icon, description }: MetricCardProps) {
  const colors = {
    good:     { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    warning:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
    critical: { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200' },
  }[status];

  return (
    <Card className={`border ${colors.border} ${colors.bg}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={colors.text}>{icon}</div>
          <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>{title}</span>
        </div>
        <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
        {target && <p className="text-xs text-gray-500 mt-0.5">Target: {target}</p>}
        <p className="text-xs text-gray-600 mt-1.5">{description}</p>
      </CardContent>
    </Card>
  );
}

interface Props {
  range: DateRange;
}

export function OperationsPanel({ range }: Props) {
  const { data: encounters } = useEncounterStats(range);

  // These metrics would ideally come from encounter period.start vs period.end calculations
  // For now, showing indicative values with a note about full integration
  const completionRate = encounters
    ? encounters.total > 0
      ? Math.round((encounters.completed / encounters.total) * 100)
      : 0
    : null;

  return (
    <div className="space-y-5">

      {/* KPI metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Encounter Completion Rate"
          value={completionRate !== null ? `${completionRate}%` : '—'}
          target="≥90%"
          status={completionRate === null ? 'good' : completionRate >= 90 ? 'good' : completionRate >= 70 ? 'warning' : 'critical'}
          icon={<Users className="h-4 w-4" />}
          description="Encounters marked as finished in the selected period."
        />
        <MetricCard
          title="Avg. Wait Time"
          value="~22 min"
          target="<30 min"
          status="good"
          icon={<Clock className="h-4 w-4" />}
          description="Estimated triage → consultation time. Requires timed encounter data."
        />
        <MetricCard
          title="Bed Occupancy"
          value="N/A"
          target="<85%"
          status="warning"
          icon={<Bed className="h-4 w-4" />}
          description="Connect Location/Bed resources to enable real-time occupancy tracking."
        />
        <MetricCard
          title="Lab Turnaround"
          value="N/A"
          target="<4 hours"
          status="warning"
          icon={<FlaskConical className="h-4 w-4" />}
          description="Requires DiagnosticReport issued-datetime vs ServiceRequest authored."
        />
        <MetricCard
          title="Radiology TAT"
          value="N/A"
          target="<8 hours"
          status="warning"
          icon={<Radio className="h-4 w-4" />}
          description="Requires ImagingStudy completion timestamps to be enabled."
        />
        <MetricCard
          title="Discharge Delays"
          value="N/A"
          target="<5%"
          status="good"
          icon={<Clock className="h-4 w-4" />}
          description="% of inpatient stays exceeding target LOS. Requires admission tracking."
        />
      </div>

      {/* Patient flow timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Patient Flow — Typical Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { stage: 'Registration', avg: '5 min', max: '15 min', color: 'bg-teal-400', width: 'w-1/6' },
              { stage: 'Triage', avg: '8 min', max: '20 min', color: 'bg-blue-400', width: 'w-1/4' },
              { stage: 'Waiting for Doctor', avg: '22 min', max: '60 min', color: 'bg-amber-400', width: 'w-2/5' },
              { stage: 'Consultation', avg: '15 min', max: '40 min', color: 'bg-indigo-400', width: 'w-1/4' },
              { stage: 'Pharmacy / Discharge', avg: '12 min', max: '30 min', color: 'bg-green-400', width: 'w-1/5' },
            ].map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <div className="w-40 flex-shrink-0 text-xs text-gray-600 font-medium">{stage.stage}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className={`h-4 rounded-full ${stage.color} ${stage.width} flex items-center justify-end pr-2`}>
                    <span className="text-white text-[10px] font-semibold">{stage.avg}</span>
                  </div>
                </div>
                <div className="w-16 text-xs text-gray-400 text-right">max {stage.max}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            These are indicative estimates. Accurate timings require encounter period.start / period.end to be recorded at each stage.
          </p>
        </CardContent>
      </Card>

      {/* Staff distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Staff Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {[
              { role: 'Doctors',        count: 2, total: 19, color: 'bg-blue-500' },
              { role: 'Nurses',         count: 2, total: 19, color: 'bg-teal-500' },
              { role: 'Pharmacists',    count: 2, total: 19, color: 'bg-purple-500' },
              { role: 'Lab Scientists', count: 2, total: 19, color: 'bg-amber-500' },
              { role: 'Radiographers',  count: 2, total: 19, color: 'bg-indigo-500' },
              { role: 'Administration', count: 7, total: 19, color: 'bg-gray-500' },
            ].map(({ role, count, total, color }) => (
              <div key={role} className="flex items-center gap-3">
                <div className="w-32 text-xs text-gray-600">{role}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${color}`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-semibold w-6 text-right">{count}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Based on seeded staff roster.</p>
        </CardContent>
      </Card>
    </div>
  );
}
