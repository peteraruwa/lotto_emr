'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft, Activity, AlertTriangle, Pill, ClipboardList,
  FlaskConical, Scan, Stethoscope, CheckCircle, Loader2,
  ChevronRight, FileText,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import type { Encounter } from '@medplum/fhirtypes';
import { safeUpdateResource, FhirConflictError } from '@/shared/lib/fhir-safe-update';
import { usePatientSnapshot } from '../hooks/use-patient-snapshot';
import { SoapNoteEditor } from '@/features/clinical-notes/components/soap-note-editor';
import type { AppointmentRow } from '../hooks/use-dashboard-data';

const VITAL_LABELS: Record<string, string> = {
  '8480-6':  'Systolic BP',
  '8462-4':  'Diastolic BP',
  '55284-4': 'BP',
  '8867-4':  'Heart Rate',
  '8310-5':  'Temperature',
  '59408-5': 'SpO₂',
  '29463-7': 'Weight',
  '8302-2':  'Height',
};

const VITAL_ICONS: Record<string, string> = {
  '8480-6': '🩸', '8462-4': '🩸', '55284-4': '💓',
  '8867-4': '❤️', '8310-5': '🌡️', '59408-5': '🫁',
  '29463-7': '⚖️', '8302-2': '📏',
};

interface ConsultationViewProps {
  appointment: AppointmentRow;
  onBack: () => void;
}

function SectionCard({ icon: Icon, iconColor, iconBg, title, children }: {
  icon: React.ElementType; iconColor: string; iconBg: string;
  title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 truncate">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function ConsultationView({ appointment, onBack }: ConsultationViewProps) {
  const medplum   = useMedplum();
  const patientId = appointment.patientRef?.replace('Patient/', '') ?? null;
  const { data: snap, isLoading } = usePatientSnapshot(patientId);

  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted]   = useState(false);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const d = appointment.time ? new Date(appointment.time) : null;
  const timeStr = d && !isNaN(d.getTime()) ? format(d, 'HH:mm, d MMM yyyy') : '—';

  const patientInitials = appointment.patientName
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  async function completeEncounter() {
    if (!snap?.activeEncounterId) return;
    setCompleting(true);
    setConflictMsg(null);
    try {
      await safeUpdateResource<Encounter>(medplum, 'Encounter', snap.activeEncounterId, (enc) => ({
        status: 'finished',
        period: { ...enc.period, end: new Date().toISOString() },
      }));
      setCompleted(true);
    } catch (err) {
      if (err instanceof FhirConflictError) {
        setConflictMsg('This encounter was updated by someone else. Please refresh.');
      }
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="p-4 md:p-5 space-y-4 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hospital-400 to-hospital-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
            {patientInitials}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-base text-gray-900 truncate leading-tight">{appointment.patientName}</h2>
            <p className="text-xs text-gray-400 truncate">{appointment.visitType} · {timeStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {patientId && (
            <Link
              href={`/patients/${patientId}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Full Chart <ChevronRight className="h-3 w-3" />
            </Link>
          )}
          {snap?.activeEncounterId && !completed && (
            <button
              onClick={completeEncounter}
              disabled={completing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-emerald-600/20"
            >
              {completing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Complete
            </button>
          )}
          {completed && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
              ✓ Encounter closed
            </span>
          )}
        </div>
        {conflictMsg && (
          <p className="w-full text-xs text-red-600 mt-1">{conflictMsg}</p>
        )}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-hospital-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading patient data…</p>
          </div>
        </div>
      )}

      {/* ── Allergy banner ──────────────────────────────────────────────────── */}
      {!isLoading && snap && snap.allergies.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Allergy Alert</p>
            <p className="text-sm text-red-600 mt-0.5 break-words">
              {snap.allergies.map((a) => `${a.substance}${a.severity ? ` (${a.severity})` : ''}`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Clinical data grid ──────────────────────────────────────────────── */}
      {!isLoading && snap && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Vitals */}
          <SectionCard icon={Activity} iconColor="text-emerald-600" iconBg="bg-emerald-50" title="Latest Vitals">
            {snap.vitals.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No vitals recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {snap.vitals.slice(0, 8).map((v) => (
                  <div key={v.code} className="rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-[11px] text-gray-400 truncate leading-tight">
                      {VITAL_ICONS[v.code] ?? ''} {VITAL_LABELS[v.code] ?? v.label}
                    </p>
                    <p className="font-bold text-sm text-gray-800 truncate mt-0.5">
                      {v.value}
                      {v.unit && <span className="text-xs font-normal text-gray-400 ml-1">{v.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Active Conditions */}
          <SectionCard icon={Stethoscope} iconColor="text-blue-600" iconBg="bg-blue-50" title="Active Conditions">
            {snap.conditions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No active conditions.</p>
            ) : (
              <div className="space-y-2">
                {snap.conditions.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                    <span className="text-xs text-gray-700 leading-relaxed">{c.text}</span>
                  </div>
                ))}
                {snap.conditions.length > 6 && (
                  <p className="text-xs text-gray-400 pt-1">+{snap.conditions.length - 6} more</p>
                )}
              </div>
            )}
          </SectionCard>

          {/* Medications */}
          <SectionCard icon={Pill} iconColor="text-violet-600" iconBg="bg-violet-50" title="Current Medications">
            {snap.medications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No active prescriptions.</p>
            ) : (
              <div className="space-y-2">
                {snap.medications.slice(0, 5).map((m) => (
                  <div key={m.id} className="rounded-xl bg-violet-50/60 px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{m.name}</p>
                    {m.dose && <p className="text-[11px] text-gray-400 truncate mt-0.5">{m.dose}</p>}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Quick Orders */}
          <SectionCard icon={ClipboardList} iconColor="text-orange-600" iconBg="bg-orange-50" title="Quick Orders">
            <div className="space-y-2">
              <Link href={patientId ? `/orders?patient=${patientId}&type=lab` : '/orders'}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 text-xs font-semibold text-gray-700 hover:text-amber-700 transition-all group">
                <FlaskConical className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">Order Lab Tests</span>
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-amber-400 flex-shrink-0" />
              </Link>
              <Link href={patientId ? `/orders?patient=${patientId}&type=imaging` : '/orders'}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-xs font-semibold text-gray-700 hover:text-blue-700 transition-all group">
                <Scan className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">Request Imaging</span>
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
              </Link>
              <Link href={patientId ? `/orders?patient=${patientId}&type=medication` : '/orders'}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 text-xs font-semibold text-gray-700 hover:text-violet-700 transition-all group">
                <Pill className="h-4 w-4 text-violet-500 flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">Prescribe Medication</span>
                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-violet-400 flex-shrink-0" />
              </Link>
            </div>
          </SectionCard>

        </div>
      )}

      {/* ── SOAP Clinical Note ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-hospital-50 flex items-center justify-center flex-shrink-0">
            <FileText className="h-3.5 w-3.5 text-hospital-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">SOAP Clinical Note</h3>
          <span className="ml-auto text-xs text-gray-400">Subjective · Objective · Assessment · Plan</span>
        </div>
        <div className="p-4">
          <SoapNoteEditor
            patientId={patientId ?? ''}
            encounterId={snap?.activeEncounterId}
            vitals={snap?.vitals ?? []}
          />
        </div>
      </div>

    </div>
  );
}
