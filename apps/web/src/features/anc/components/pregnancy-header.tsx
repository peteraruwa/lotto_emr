'use client';

import React from 'react';
import { AlertTriangle, Heart } from 'lucide-react';
import type { PregnancyRecord, AncRiskLevel } from '../types';
import { formatGA } from '../lib/anc-utils';

const RISK_STYLES: Record<AncRiskLevel, { bg: string; text: string; border: string }> = {
  low:      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300' },
  moderate: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  high:     { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300' },
};

interface PregnancyHeaderProps {
  pregnancy: PregnancyRecord;
}

export function PregnancyHeader({ pregnancy }: PregnancyHeaderProps) {
  const ga = formatGA(pregnancy.lmpDate);
  const risk = pregnancy.riskLevel;
  const styles = RISK_STYLES[risk];
  const gpoa = `G${pregnancy.gravida}P${pregnancy.para}+${pregnancy.abortus}`;

  // Format EDD as readable date
  const edd = pregnancy.edd
    ? new Date(pregnancy.edd).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const fields: { label: string; value: string }[] = [
    { label: 'GPOA',       value: gpoa },
    { label: 'GA',         value: ga },
    { label: 'EDD',        value: edd },
    { label: 'Blood Grp',  value: pregnancy.bloodGroup ?? '—' },
    { label: 'Genotype',   value: pregnancy.genotype ?? '—' },
    { label: 'HIV',        value: pregnancy.hivStatus ?? '—' },
    { label: 'HBsAg',      value: pregnancy.hbsAgStatus ?? '—' },
    { label: 'VDRL',       value: pregnancy.vdrlStatus ?? '—' },
  ];

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} px-4 py-3`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Heart className={`h-4 w-4 ${styles.text}`} />
        <span className={`text-xs font-bold uppercase tracking-wide ${styles.text}`}>
          Pregnancy Summary
        </span>
        <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styles.bg} ${styles.text} border ${styles.border}`}>
          {risk === 'high' && <AlertTriangle className="h-3 w-3" />}
          {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
        </span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <span className={`text-xs font-semibold uppercase tracking-wider ${styles.text} opacity-70`}>{label}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
          </div>
        ))}
      </div>
      {pregnancy.riskFactors.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {pregnancy.riskFactors.map((rf) => (
            <span key={rf} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text} border ${styles.border}`}>
              ⚠ {rf}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
