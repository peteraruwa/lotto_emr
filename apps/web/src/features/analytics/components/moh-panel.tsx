'use client';

import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Clock, Baby, Activity } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useTotalPatients, useEncounterStats, useTopDiagnoses } from '../hooks/use-analytics';

type ReportPeriod = 'current-month' | 'last-month' | 'last-quarter';

export function MohPanel() {
  const [period, setPeriod] = useState<ReportPeriod>('current-month');

  const range = {
    'current-month': { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    'last-month':    { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    'last-quarter':  { start: startOfMonth(subMonths(new Date(), 3)), end: endOfMonth(new Date()) },
  }[period];

  const { data: total } = useTotalPatients();
  const { data: encounters } = useEncounterStats(range);
  const { data: diagnoses } = useTopDiagnoses(range, 20);

  const periodLabel = {
    'current-month': format(new Date(), 'MMMM yyyy'),
    'last-month':    format(subMonths(new Date(), 1), 'MMMM yyyy'),
    'last-quarter':  `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
  }[period];

  function handleDownload() {
    // Build a simple text-based report (real impl would use jsPDF or server-side PDF gen)
    const lines = [
      `LOTTO CENTRAL HOSPITAL`,
      `MONTHLY MORBIDITY REPORT — ${periodLabel.toUpperCase()}`,
      `Generated: ${format(new Date(), 'd MMMM yyyy, HH:mm')}`,
      ``,
      `SUMMARY STATISTICS`,
      `------------------`,
      `Total Registered Patients: ${total ?? 'N/A'}`,
      `Encounters in Period:      ${encounters?.total ?? 'N/A'}`,
      `Completed Encounters:      ${encounters?.completed ?? 'N/A'}`,
      ``,
      `TOP DIAGNOSES (ICD/SNOMED)`,
      `---------------------------`,
      ...(diagnoses ?? []).map((d, i) => `${String(i + 1).padStart(2)}. ${d.display.padEnd(40)} ${d.code}  (${d.count} cases)`),
      ``,
      `MATERNAL & CHILD HEALTH`,
      `-----------------------`,
      `ANC Encounters: (see ANC module for details)`,
      ``,
      `--`,
      `This report is auto-generated from the EMR system.`,
      `For official submission, validate and sign before sending.`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moh-report-${period}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">

      {/* Period selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            Ministry of Health Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['current-month', 'last-month', 'last-quarter'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  period === p
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {p === 'current-month' ? 'Current Month' : p === 'last-month' ? 'Last Month' : 'Last Quarter'}
              </button>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Report Preview: {periodLabel}</h3>
              <Button size="sm" onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download TXT
              </Button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Patients', value: total?.toLocaleString() ?? '—', icon: <Activity className="h-3.5 w-3.5" /> },
                { label: 'Encounters', value: encounters?.total?.toLocaleString() ?? '—', icon: <FileText className="h-3.5 w-3.5" /> },
                { label: 'Completed', value: encounters?.completed?.toLocaleString() ?? '—', icon: <CheckCircle className="h-3.5 w-3.5" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white border rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">{icon}{label}</div>
                  <p className="text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* ICD morbidity table */}
            <div>
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Morbidity Summary (Top 10)</h4>
              {!diagnoses?.length ? (
                <p className="text-xs text-gray-400">No diagnosis data for this period.</p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-2 py-1.5 font-medium text-gray-600">#</th>
                      <th className="text-left px-2 py-1.5 font-medium text-gray-600">Diagnosis</th>
                      <th className="text-left px-2 py-1.5 font-medium text-gray-600">Code</th>
                      <th className="text-right px-2 py-1.5 font-medium text-gray-600">Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnoses.slice(0, 10).map((d, i) => (
                      <tr key={d.code} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-2 py-1.5">{d.display}</td>
                        <td className="px-2 py-1.5 font-mono text-gray-500">{d.code}</td>
                        <td className="px-2 py-1.5 text-right font-semibold">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maternal health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Baby className="h-4 w-4 text-pink-500" />
            Maternal &amp; Child Health Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-gray-500">
            These indicators are auto-derived from the ANC module. Activate the ANC module and
            record deliveries to populate this section.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {[
              { label: 'ANC Bookings', value: '—' },
              { label: 'Deliveries', value: '—' },
              { label: 'Maternal Mortality', value: '—' },
              { label: 'Neonatal Admissions', value: '—' },
              { label: 'High-Risk Pregnancies', value: '—' },
              { label: 'Postnatal Visits', value: '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-pink-50 border border-pink-100 rounded-lg p-3">
                <p className="text-xs text-pink-600 mb-1">{label}</p>
                <p className="text-xl font-bold text-pink-800">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submission tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Report Submission Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { month: format(subMonths(new Date(), 2), 'MMMM yyyy'), status: 'submitted' },
              { month: format(subMonths(new Date(), 1), 'MMMM yyyy'), status: 'submitted' },
              { month: format(new Date(), 'MMMM yyyy'), status: 'pending' },
            ].map(({ month, status }) => (
              <div key={month} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">{month}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                  status === 'submitted'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {status === 'submitted'
                    ? <><CheckCircle className="h-3 w-3" /> Submitted</>
                    : <><Clock className="h-3 w-3" /> Pending</>
                  }
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Manual tracker — update after official submission.</p>
        </CardContent>
      </Card>
    </div>
  );
}
