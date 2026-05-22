'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format, addDays } from 'date-fns';
import { Baby, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Bundle, BundleEntry, Condition, Patient } from '@medplum/fhirtypes';
import { formatPatientName } from '@lotto-emr/core';
import { cn } from '@lotto-emr/ui';
import { formatGA, parsePregnancyRecord } from '@/features/anc';
import type { PregnancyRecord, AncRiskLevel } from '@/features/anc';

// ── Risk badge ────────────────────────────────────────────────────────────────

const RISK_BADGE: Record<AncRiskLevel, { label: string; className: string }> = {
  low:      { label: 'Low',      className: 'bg-emerald-50 text-emerald-700' },
  moderate: { label: 'Moderate', className: 'bg-amber-50 text-amber-700' },
  high:     { label: 'High',     className: 'bg-red-50 text-red-600' },
};

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3 w-40 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-2.5 w-24 rounded-full bg-gray-100 animate-pulse" />
      </div>
      <div className="h-3 w-16 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="h-3 w-20 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="h-7 w-24 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Baby className="h-7 w-7 text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-600">No active ANC registrations</p>
      <p className="text-xs text-gray-400 mt-1">Enrol patients via the individual patient ANC page</p>
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

interface StatProps {
  label: string;
  value: number;
  highlight?: boolean;
}

function Stat({ label, value, highlight }: StatProps) {
  return (
    <div className="flex flex-col items-center px-5 py-3">
      <span className={cn('text-2xl font-bold leading-none', highlight ? 'text-red-600' : 'text-gray-900')}>
        {value}
      </span>
      <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ── Patient initials avatar ───────────────────────────────────────────────────

function Initials({ name }: { name: string }) {
  const ini = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-xl bg-hospital-100 text-hospital-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {ini}
    </div>
  );
}

// ── ANC row ───────────────────────────────────────────────────────────────────

interface AncRowData {
  pregnancy: PregnancyRecord;
  patientName: string;
}

function AncRow({ data }: { data: AncRowData }) {
  const { pregnancy, patientName } = data;
  const riskCfg = RISK_BADGE[pregnancy.riskLevel] ?? RISK_BADGE.low;
  const eddFormatted = pregnancy.edd ? format(new Date(pregnancy.edd), 'd MMM yyyy') : '—';
  const ga = pregnancy.lmpDate ? formatGA(pregnancy.lmpDate) : '—';

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors">
      <Initials name={patientName} />

      {/* Patient name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{patientName}</p>
        <p className="text-xs text-gray-400 mt-0.5">G{pregnancy.gravida} P{pregnancy.para}</p>
      </div>

      {/* Gestational age */}
      <span className="hidden sm:block text-sm text-gray-700 font-medium w-16 text-center flex-shrink-0">
        {ga}
      </span>

      {/* EDD */}
      <span className="hidden md:block text-xs text-gray-500 w-24 text-center flex-shrink-0">
        {eddFormatted}
      </span>

      {/* Risk badge */}
      <span className={cn('hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0', riskCfg.className)}>
        {riskCfg.label}
      </span>

      {/* Open ANC button */}
      <Link
        href={`/patients/${pregnancy.patientId}/anc`}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-hospital-50 hover:bg-hospital-600 hover:text-white text-hospital-700 transition-all flex-shrink-0"
      >
        Open ANC
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ── Table header ──────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 bg-gray-50/60">
      <div className="w-9 flex-shrink-0" />
      <div className="flex-1 min-w-0 text-xs font-semibold text-gray-400 uppercase tracking-wide">Patient</div>
      <div className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 text-center flex-shrink-0">GA</div>
      <div className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 text-center flex-shrink-0">EDD</div>
      <div className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-wide w-20 text-center flex-shrink-0">Risk</div>
      <div className="w-24 flex-shrink-0" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AncPage() {
  const medplum = useMedplum();

  const { data, isLoading } = useQuery<AncRowData[]>({
    queryKey: ['anc-overview'],
    queryFn: async () => {
      const bundle = await medplum.search('Condition', {
        code: '77386006',
        _include: 'Condition:patient',
        _sort: '-_lastUpdated',
        _count: '50',
      }) as Bundle;

      const entries: BundleEntry[] = bundle.entry ?? [];

      // Separate Condition and Patient entries
      const conditions: Condition[] = entries
        .filter((e) => e.resource?.resourceType === 'Condition')
        .map((e) => e.resource as Condition);

      const patientMap = new Map<string, Patient>();
      entries
        .filter((e) => e.resource?.resourceType === 'Patient')
        .forEach((e) => {
          const p = e.resource as Patient;
          if (p.id) patientMap.set(p.id, p);
        });

      // Parse each Condition into a PregnancyRecord + patient name
      return conditions.map((condition): AncRowData => {
        const patientRef = condition.subject?.reference ?? '';
        const patientId = patientRef.replace('Patient/', '');
        const patient = patientMap.get(patientId);
        const pregnancy = parsePregnancyRecord(condition, patientId);
        const patientName = patient ? formatPatientName(patient.name) : 'Unknown Patient';
        return { pregnancy, patientName };
      });
    },
  });

  const rows = data ?? [];

  // Compute summary stats
  const today = new Date();
  const inOneWeek = addDays(today, 7);
  const totalCount = rows.length;
  const highRiskCount = rows.filter((r) => r.pregnancy.riskLevel === 'high').length;
  const dueThisWeek = rows.filter((r) => {
    if (!r.pregnancy.edd) return false;
    const edd = new Date(r.pregnancy.edd);
    return edd >= today && edd <= inOneWeek;
  }).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-hospital-50 flex items-center justify-center flex-shrink-0">
          <Baby className="h-5 w-5 text-hospital-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Antenatal Care</h1>
          <p className="text-sm text-gray-400 mt-0.5">Active ANC registrations</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex divide-x divide-gray-100">
          <Stat label="Total registered" value={totalCount} />
          <Stat label="High risk" value={highRiskCount} highlight={highRiskCount > 0} />
          <Stat label="Due this week" value={dueThisWeek} highlight={dueThisWeek > 0} />
        </div>
      </div>

      {/* Patient list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <TableHeader />
            {rows.map((row) => (
              <AncRow key={row.pregnancy.conditionId} data={row} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
