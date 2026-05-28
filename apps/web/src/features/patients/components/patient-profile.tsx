'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, Plus, Activity, Baby,
  FileText, FlaskConical, ClipboardList, Calendar,
  Pill, Phone, MapPin, Shield, Loader2, User,
  Heart, Stethoscope, ChevronRight, BedDouble,
  Droplets, HeartPulse, Thermometer, Wind, Scale, Ruler, Calculator,
  BadgeCheck, Fingerprint, X, DollarSign, Syringe,
} from 'lucide-react';
import { ImmunizationHistoryView } from '@/features/nursing/components/immunization-tab';
import { FamilyPlanningHistoryView } from '@/features/nursing/components/family-planning-tab';
import { cn } from '@lotto-emr/ui';
import { capitalize, formatDate, formatDateTime } from '@/shared/lib/utils';
import { usePatientProfile } from '../hooks/use-patient-profile';
import type { VitalRow } from '../hooks/use-patient-profile';
import { useVerifyNin } from '../hooks/use-verify-nin';
import { NoteList } from '@/features/clinical-notes';
import { EncounterList } from '@/features/encounters';
import { ResultsList } from '@/features/results';
import { OrderList } from '@/features/orders';
import { NoteTypeSelectorModal } from '@/features/clinical-notes/components/note-type-selector-modal';
import { NoteType } from '@/features/clinical-notes/types';
import { PatientBillingView } from '@/features/billing-hmo';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'summary' | 'encounters' | 'vitals' | 'notes' | 'results' | 'orders' | 'billing' | 'anc' | 'immunization' | 'family-planning';
type NoteTypeFilter = 'ALL' | NoteType;

// ── Tab config ────────────────────────────────────────────────────────────────

const MAIN_TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'summary',         label: 'Summary',         icon: User },
  { id: 'encounters',      label: 'Encounters',      icon: Calendar },
  { id: 'vitals',          label: 'Vitals',          icon: Activity },
  { id: 'notes',           label: 'Notes',           icon: FileText },
  { id: 'results',         label: 'Results',         icon: FlaskConical },
  { id: 'orders',          label: 'Orders',          icon: ClipboardList },
  { id: 'billing',         label: 'Billing',         icon: DollarSign },
  { id: 'immunization',    label: 'Immunization',    icon: Syringe },
  { id: 'family-planning', label: 'Family Planning', icon: Heart },
];

const NOTE_TYPE_TABS: { label: string; value: NoteTypeFilter }[] = [
  { label: 'All',       value: 'ALL' },
  { label: 'SOAP',      value: NoteType.SOAP },
  { label: 'Progress',  value: NoteType.PROGRESS },
  { label: 'Discharge', value: NoteType.DISCHARGE },
  { label: 'Referral',  value: NoteType.REFERRAL },
];

// ── Vital card ────────────────────────────────────────────────────────────────

const VITAL_META: { key: keyof VitalRow | 'bmi'; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'bp',     label: 'Blood Pressure', icon: Droplets,    color: 'text-red-600',     bg: 'bg-red-50' },
  { key: 'hr',     label: 'Heart Rate',     icon: HeartPulse,  color: 'text-pink-600',    bg: 'bg-pink-50' },
  { key: 'temp',   label: 'Temperature',    icon: Thermometer, color: 'text-orange-600',  bg: 'bg-orange-50' },
  { key: 'spo2',   label: 'SpO₂',           icon: Wind,        color: 'text-blue-600',    bg: 'bg-blue-50' },
  { key: 'weight', label: 'Weight',         icon: Scale,       color: 'text-violet-600',  bg: 'bg-violet-50' },
  { key: 'height', label: 'Height',         icon: Ruler,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'bmi',    label: 'BMI',            icon: Calculator,  color: 'text-teal-600',    bg: 'bg-teal-50' },
];

function VitalCard({ meta, value, sub }: { meta: typeof VITAL_META[number]; value?: string; sub?: string }) {
  const Icon = meta.icon;
  return (
    <div className={cn('rounded-2xl p-4 flex flex-col gap-1', meta.bg)}>
      <Icon className={cn('h-4 w-4', value ? meta.color : 'text-gray-300')} />
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide leading-tight">{meta.label}</p>
      <p className={cn('text-lg font-bold leading-tight', value ? meta.color : 'text-gray-300')}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Biodata field ─────────────────────────────────────────────────────────────

function BioField({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────

function SectionCard({ icon: Icon, iconBg, iconColor, title, children, action }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
            <Icon className={cn('h-3.5 w-3.5', iconColor)} />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── NIN Verify Modal ──────────────────────────────────────────────────────────

function NinVerifyModal({
  patientId, nin, onClose, onVerified,
}: {
  patientId: string; nin: string; onClose: () => void; onVerified: () => void;
}) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [result,   setResult]   = useState<string | null>(null);
  const { mutateAsync: verifyNin, isPending } = useVerifyNin();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    try {
      const res = await verifyNin({ nin, patientId, adminEmail: email, adminPassword: password });
      if (res.verified) {
        setResult(`✅ ${res.message}${res.name ? ` — NIMC name: ${res.name}` : ''}`);
        setTimeout(onVerified, 1200);
      } else {
        setResult(`❌ ${res.message}`);
      }
    } catch (err) {
      setResult(`❌ ${(err as Error).message}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Verify NIN with NIMC</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
          <Fingerprint className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
          <p>NIN <span className="font-mono font-bold">{nin}</span> will be checked against the NIMC database. Enter admin credentials to authorise.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {result && (
            <p className={cn('text-xs rounded-xl px-3 py-2 border', result.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700')}>
              {result}
            </p>
          )}

          <button type="submit" disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition-colors">
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <><Fingerprint className="h-4 w-4" /> Verify NIN</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface PatientProfileProps {
  patientId: string;
}

export function PatientProfile({ patientId }: PatientProfileProps) {
  const { profileData, isLoading, error } = usePatientProfile(patientId);

  const [activeTab, setActiveTab]       = useState<Tab>('summary');
  const [noteTypeFilter, setNoteTypeFilter] = useState<NoteTypeFilter>('ALL');
  const [noteModalOpen, setNoteModalOpen]   = useState(false);
  const [ninModalOpen,  setNinModalOpen]    = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-hospital-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-center space-y-2">
        <div>
          <p className="text-sm font-semibold text-red-600">Failed to load patient</p>
          <p className="text-xs text-gray-400 mt-1">{(error as any)?.message ?? String(error)}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-hospital-500" />
      </div>
    );
  }

  const { biodata, hasActiveEncounter, allergies, conditions, vitalRows, latestVitals, medications } = profileData;
  const isFemale = biodata.gender === 'female';
  const initials = biodata.fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const tabs = isFemale
    ? [...MAIN_TABS, { id: 'anc' as Tab, label: 'ANC', icon: Baby }]
    : MAIN_TABS;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">

      {/* ── Patient header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-6 py-4 space-y-4">

          {/* Back + avatar row */}
          <div className="flex items-start gap-3 flex-wrap">
            <Link
              href="/patients"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-hospital-400 to-hospital-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm shadow-hospital-600/20">
              {initials}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                  {biodata.mrn}
                </span>
                {hasActiveEncounter && (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Encounter
                  </span>
                )}
                {biodata.bloodGroup && (
                  <span className="text-[11px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                    {biodata.bloodGroup}
                  </span>
                )}
                {biodata.genotype && (
                  <span className="text-[11px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                    {biodata.genotype}
                  </span>
                )}
                {biodata.bloodTransfusionConsent === 'refuses' && (
                  <span className="text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    🚫 NO BLOOD
                  </span>
                )}
                {biodata.ninVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    <BadgeCheck className="h-3 w-3" /> NIN Verified
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight truncate">{biodata.fullName}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {biodata.age} yrs · {capitalize(biodata.sex)} · {biodata.dateOfBirth ? formatDate(biodata.dateOfBirth) : '—'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setNoteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-hospital-600/20"
              >
                <FileText className="h-3.5 w-3.5" />
                New Note
              </button>
              {!hasActiveEncounter && (
                <Link
                  href={`/patients/${patientId}/admit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
                >
                  <BedDouble className="h-3.5 w-3.5" />
                  Admit
                </Link>
              )}
            </div>
          </div>

          {/* Allergy alert */}
          {allergies.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide mr-2">Allergies:</span>
                <span className="text-xs text-red-600">
                  {allergies.map((a) => `${a.substance}${a.reaction ? ` (${a.reaction})` : ''}`).join(' · ')}
                </span>
              </div>
            </div>
          )}

          {/* Blood Transfusion Consent — always visible in clinical header */}
          {biodata.bloodTransfusionConsent && (
            <div className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl border',
              biodata.bloodTransfusionConsent === 'refuses'     ? 'bg-red-100 border-red-400 text-red-800' :
              biodata.bloodTransfusionConsent === 'consents'    ? 'bg-green-50 border-green-300 text-green-800' :
              biodata.bloodTransfusionConsent === 'conditional' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                                                  'bg-gray-50 border-gray-200 text-gray-700',
            )}>
              <span className="text-base flex-shrink-0">
                {biodata.bloodTransfusionConsent === 'refuses'     ? '🚫' :
                 biodata.bloodTransfusionConsent === 'consents'    ? '✅' :
                 biodata.bloodTransfusionConsent === 'conditional' ? '⚠️' : '🕐'}
              </span>
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wide mr-2">Blood Transfusion:</span>
                <span className="text-xs font-semibold">
                  {biodata.bloodTransfusionConsent === 'refuses'     ? 'PATIENT REFUSES — Do not transfuse without reassessment' :
                   biodata.bloodTransfusionConsent === 'consents'    ? 'Patient consents to transfusion' :
                   biodata.bloodTransfusionConsent === 'conditional' ? 'Conditional consent — verify conditions before transfusing' :
                                                                       'Decision deferred — obtain consent before transfusion'}
                </span>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0',
                  activeTab === id
                    ? 'border-hospital-600 text-hospital-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 py-5 space-y-4 animate-fade-in">

        {/* ── SUMMARY ─────────────────────────────────────────────────────── */}
        {activeTab === 'summary' && (
          <div className="space-y-4">

            {/* Latest vitals strip */}
            {latestVitals ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                  Latest Vitals — {latestVitals.dateLabel}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  {VITAL_META.map((m) => {
                    let value: string | undefined;
                    let sub: string | undefined;
                    if (m.key === 'bmi') {
                      // Compute BMI from raw weight/height strings
                      const wStr = latestVitals.weight; // e.g. "70 kg"
                      const hStr = latestVitals.height; // e.g. "170 cm"
                      if (wStr && hStr) {
                        const wKg = parseFloat(wStr);
                        const hM  = parseFloat(hStr) / 100;
                        if (!isNaN(wKg) && !isNaN(hM) && hM > 0) {
                          const bmi = wKg / (hM * hM);
                          value = bmi.toFixed(1);
                          sub = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
                        }
                      }
                    } else {
                      value = latestVitals[m.key as keyof VitalRow] as string | undefined;
                    }
                    return <VitalCard key={m.key} meta={m} value={value} sub={sub} />;
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                <Activity className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No vitals recorded yet</p>
              </div>
            )}

            {/* Grid: Biodata + Conditions/Meds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Biodata */}
              <SectionCard icon={User} iconBg="bg-hospital-50" iconColor="text-hospital-600" title="Patient Information">
                <div className="space-y-3">
                  <BioField icon={Phone}    label="Phone"       value={biodata.phone} />
                  <BioField icon={MapPin}   label="Address"     value={biodata.address} />
                  <BioField icon={Shield}   label="HMO / Insurance" value={biodata.hmo !== 'N/A' ? biodata.hmo : undefined} />

                  {/* NIN + verification */}
                  {biodata.nin && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Fingerprint className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">NIN</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm text-gray-800 font-mono font-medium">{biodata.nin}</p>
                            {biodata.ninVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                                <BadgeCheck className="h-2.5 w-2.5" /> Verified
                              </span>
                            ) : (
                              <button
                                onClick={() => setNinModalOpen(true)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full hover:bg-amber-100 transition-colors"
                              >
                                <Fingerprint className="h-2.5 w-2.5" /> Verify NIN
                              </button>
                            )}
                          </div>
                          {biodata.ninVerifiedAt && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Verified {formatDate(biodata.ninVerifiedAt.slice(0, 10))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Tribe</p>
                      <p className="text-sm text-gray-800 font-medium">{biodata.tribe ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Religion</p>
                      <p className="text-sm text-gray-800 font-medium">{biodata.religion ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Conditions + Medications */}
              <div className="space-y-4">

                <SectionCard
                  icon={Stethoscope} iconBg="bg-blue-50" iconColor="text-blue-600"
                  title="Chronic Conditions"
                  action={
                    <span className="text-[11px] text-gray-400">{conditions.length} total</span>
                  }
                >
                  {conditions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No chronic conditions</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {conditions.map((c) => (
                        <span key={c.id} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                          {c.text}
                        </span>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  icon={Pill} iconBg="bg-violet-50" iconColor="text-violet-600"
                  title="Current Medications"
                  action={
                    <Link
                      href={`/orders?patient=${patientId}&type=medication`}
                      className="flex items-center gap-1 text-[11px] text-hospital-600 font-semibold hover:underline"
                    >
                      Prescribe <ChevronRight className="h-3 w-3" />
                    </Link>
                  }
                >
                  {medications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No active prescriptions</p>
                  ) : (
                    <div className="space-y-1.5">
                      {medications.slice(0, 5).map((m) => (
                        <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-violet-50/60">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                          <span className="text-xs text-gray-700 font-medium truncate">{m.name}</span>
                        </div>
                      ))}
                      {medications.length > 5 && (
                        <p className="text-[11px] text-gray-400 pt-0.5">+{medications.length - 5} more</p>
                      )}
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>

            {/* Quick actions */}
            <SectionCard icon={ClipboardList} iconBg="bg-orange-50" iconColor="text-orange-600" title="Quick Actions">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Order Lab',       href: `/orders?patient=${patientId}&type=lab`,       icon: FlaskConical, cls: 'hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700', iconCls: 'text-amber-500' },
                  { label: 'Request Imaging', href: `/orders?patient=${patientId}&type=imaging`,    icon: Activity,     cls: 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',   iconCls: 'text-blue-500' },
                  { label: 'Prescribe',       href: `/orders?patient=${patientId}&type=medication`, icon: Pill,         cls: 'hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700', iconCls: 'text-violet-500' },
                  { label: 'Refer Patient',   href: `/patients/${patientId}/clinical-note/new?type=referral_note`, icon: Heart, cls: 'hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700', iconCls: 'text-rose-500' },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-3 rounded-xl border border-gray-100 text-xs font-semibold text-gray-600 transition-all group',
                      a.cls,
                    )}
                  >
                    <a.icon className={cn('h-4 w-4 flex-shrink-0', a.iconCls)} />
                    <span className="truncate">{a.label}</span>
                  </Link>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── ENCOUNTERS ──────────────────────────────────────────────────── */}
        {activeTab === 'encounters' && (
          <EncounterList patientId={patientId} />
        )}

        {/* ── VITALS ──────────────────────────────────────────────────────── */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            {latestVitals && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">
                  Latest — {latestVitals.dateLabel}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  {VITAL_META.map((m) => {
                    let value: string | undefined;
                    let sub: string | undefined;
                    if (m.key === 'bmi') {
                      const wStr = latestVitals.weight;
                      const hStr = latestVitals.height;
                      if (wStr && hStr) {
                        const wKg = parseFloat(wStr);
                        const hM  = parseFloat(hStr) / 100;
                        if (!isNaN(wKg) && !isNaN(hM) && hM > 0) {
                          const bmi = wKg / (hM * hM);
                          value = bmi.toFixed(1);
                          sub = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
                        }
                      }
                    } else {
                      value = latestVitals[m.key as keyof VitalRow] as string | undefined;
                    }
                    return <VitalCard key={m.key} meta={m} value={value} sub={sub} />;
                  })}
                </div>
              </>
            )}

            {vitalRows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Activity className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">No vitals recorded yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vital Signs History</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        {['Date', 'Blood Pressure', 'Heart Rate', 'Temperature', 'SpO₂', 'Weight', 'Height'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {vitalRows.map((row) => (
                        <tr key={row.date} className={cn('hover:bg-gray-50/50', row.isToday && 'bg-emerald-50/30 border-l-2 border-emerald-400')}>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                            {row.dateLabel}
                            {row.isToday && <span className="ml-2 text-[11px] text-emerald-600 font-semibold">Today</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.bp ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.hr ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.temp ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.spo2 ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.weight ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.height ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NOTES ───────────────────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            {/* Note type sub-tabs + New Note button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
                {NOTE_TYPE_TABS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setNoteTypeFilter(value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                      noteTypeFilter === value
                        ? 'bg-hospital-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setNoteModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-hospital-600/20 flex-shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                New Note
              </button>
            </div>

            {/* Note list filtered by type */}
            <NoteList
              patientId={patientId}
              typeFilter={noteTypeFilter !== 'ALL' ? noteTypeFilter : undefined}
              hideNewButton
            />
          </div>
        )}

        {/* ── RESULTS ─────────────────────────────────────────────────────── */}
        {activeTab === 'results' && (
          <ResultsList patientId={patientId} />
        )}

        {/* ── ORDERS ──────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 flex-wrap">
              {[
                { label: 'Order Lab',       href: `/orders?patient=${patientId}&type=lab`,       icon: FlaskConical },
                { label: 'Request Imaging', href: `/orders?patient=${patientId}&type=imaging`,    icon: Activity },
                { label: 'Prescribe',       href: `/orders?patient=${patientId}&type=medication`, icon: Pill },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-hospital-600/20"
                >
                  <a.icon className="h-3.5 w-3.5" />
                  {a.label}
                </Link>
              ))}
            </div>
            <OrderList patientId={patientId} />
          </div>
        )}

        {/* ── BILLING ─────────────────────────────────────────────────────── */}
        {activeTab === 'billing' && (
          <PatientBillingView patientId={patientId} />
        )}

        {/* ── IMMUNIZATION ────────────────────────────────────────────────── */}
        {activeTab === 'immunization' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Syringe className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Immunization History</h3>
              </div>
              <div className="p-4">
                <ImmunizationHistoryView patientId={patientId} />
              </div>
            </div>
          </div>
        )}

        {/* ── FAMILY PLANNING ──────────────────────────────────────────────── */}
        {activeTab === 'family-planning' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                  <Heart className="h-3.5 w-3.5 text-pink-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Family Planning Records</h3>
              </div>
              <div className="p-4">
                <FamilyPlanningHistoryView patientId={patientId} />
              </div>
            </div>
          </div>
        )}

        {/* ── ANC ─────────────────────────────────────────────────────────── */}
        {activeTab === 'anc' && isFemale && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Baby className="h-10 w-10 text-pink-300 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Antenatal Care</h3>
            <p className="text-xs text-gray-400 mb-4">Manage this patient's antenatal care visits and records.</p>
            <Link
              href={`/patients/${patientId}/anc`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-pink-600/20"
            >
              Open ANC Module <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* ── Note type selector modal ────────────────────────────────────── */}
      <NoteTypeSelectorModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        patientId={patientId}
      />

      {/* ── NIN verification modal ──────────────────────────────────────── */}
      {ninModalOpen && biodata.nin && (
        <NinVerifyModal
          patientId={patientId}
          nin={biodata.nin}
          onClose={() => setNinModalOpen(false)}
          onVerified={() => setNinModalOpen(false)}
        />
      )}
    </div>
  );
}
