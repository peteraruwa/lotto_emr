'use client';
import React, { useState } from 'react';
import { Heart, Plus, ChevronUp, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { format } from 'date-fns';
import type { NursingPatient, FamilyPlanningRecord, FPVisitType, FPMethod } from '../types';
import {
  FP_VISIT_TYPE_LABELS, FP_METHODS, FP_COUNSELING_TOPICS, FP_METHODS_CATEGORY_COLORS,
} from '../constants';
import { useAllPatientsFamilyPlanning, useRecordFpVisit } from '../hooks/use-family-planning';

// ── Record Form ───────────────────────────────────────────────────────────────

interface FpRecordFormProps {
  patients: NursingPatient[];
  selectedPatientId?: string;
  onDone: () => void;
}

function FpRecordForm({ patients, selectedPatientId, onDone }: FpRecordFormProps) {
  const [patientId,        setPatientId]        = useState(selectedPatientId ?? '');
  const [visitType,        setVisitType]        = useState<FPVisitType>('counseling');
  const [currentMethod,    setCurrentMethod]    = useState<FPMethod>('None');
  const [previousMethod,   setPreviousMethod]   = useState<FPMethod>('None');
  const [lmp,              setLmp]              = useState('');
  const [parity,           setParity]           = useState('');
  const [gravida,          setGravida]          = useState('');
  const [bp,               setBp]               = useState('');
  const [weight,           setWeight]           = useState('');
  const [contraindications,setContraindications]= useState('');
  const [complications,    setComplications]    = useState('');
  const [nextVisit,        setNextVisit]        = useState('');
  const [performedAt,      setPerformedAt]      = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [topics,           setTopics]           = useState<string[]>([]);
  const [notes,            setNotes]            = useState('');
  const [success,          setSuccess]          = useState(false);

  const { mutateAsync, isPending } = useRecordFpVisit();
  const patient = patients.find(p => p.patientId === patientId);

  function toggleTopic(t: string) {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    await mutateAsync({
      patientId,
      patientName:    patient?.patientName ?? '',
      encounterId:    patient?.encounterId,
      visitType,
      currentMethod,
      previousMethod: previousMethod !== 'None' ? previousMethod : undefined,
      counselingTopics: topics.length > 0 ? topics : undefined,
      lmp:            lmp        || undefined,
      parity:         parity     ? Number(parity)  : undefined,
      gravida:        gravida    ? Number(gravida)  : undefined,
      bloodPressure:  bp         || undefined,
      weight:         weight     || undefined,
      contraindications: contraindications || undefined,
      complications:  complications || undefined,
      nextVisitDate:  nextVisit  || undefined,
      performedAt:    new Date(performedAt).toISOString(),
      notes:          notes      || undefined,
    });
    setSuccess(true);
    setTimeout(onDone, 1500);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="text-sm font-bold text-green-700">Family planning visit recorded</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Patient */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Patient *</label>
        <select
          value={patientId} onChange={e => setPatientId(e.target.value)} required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
        >
          <option value="">Select patient…</option>
          {patients.map(p => (
            <option key={p.patientId} value={p.patientId}>{p.patientName} — Bed {p.bed}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Visit type */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Visit Type *</label>
          <select value={visitType} onChange={e => setVisitType(e.target.value as FPVisitType)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400">
            {Object.entries(FP_VISIT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Date &amp; Time *</label>
          <input type="datetime-local" value={performedAt} onChange={e => setPerformedAt(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>

        {/* Current method */}
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Current / Chosen Method *</label>
          <select value={currentMethod} onChange={e => setCurrentMethod(e.target.value as FPMethod)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400">
            {FP_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Previous method — only for continuing/discontinuation */}
        {(visitType === 'continuing' || visitType === 'discontinuation') && (
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Previous Method</label>
            <select value={previousMethod} onChange={e => setPreviousMethod(e.target.value as FPMethod)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400">
              {FP_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Obstetric history */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Gravida</label>
          <input type="number" min="0" value={gravida} onChange={e => setGravida(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Parity</label>
          <input type="number" min="0" value={parity} onChange={e => setParity(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">LMP</label>
          <input type="date" value={lmp} onChange={e => setLmp(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Next Visit</label>
          <input type="date" value={nextVisit} onChange={e => setNextVisit(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Blood Pressure</label>
          <input type="text" value={bp} onChange={e => setBp(e.target.value)}
            placeholder="120/80"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Weight (kg)</label>
          <input type="text" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="65"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
      </div>

      {/* Contraindications */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Contraindications / Conditions</label>
        <input type="text" value={contraindications} onChange={e => setContraindications(e.target.value)}
          placeholder="e.g. hypertension, DVT history"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
        />
      </div>

      {/* Complications */}
      {(visitType === 'complication' || visitType === 'follow-up') && (
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Complications / Side-effects</label>
          <input type="text" value={complications} onChange={e => setComplications(e.target.value)}
            placeholder="Describe complications"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
      )}

      {/* Counseling topics */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-2">Counseling Topics (select all that apply)</label>
        <div className="flex flex-wrap gap-1.5">
          {FP_COUNSELING_TOPICS.map(t => (
            <button
              key={t} type="button"
              onClick={() => toggleTopic(t)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors',
                topics.includes(t)
                  ? 'bg-hospital-600 text-white border-hospital-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-hospital-300',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Additional clinical notes"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onDone}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isPending || !patientId}
          className="flex-1 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          <Heart className="h-4 w-4" />
          {isPending ? 'Saving…' : 'Record FP Visit'}
        </button>
      </div>
    </form>
  );
}

// ── History List ──────────────────────────────────────────────────────────────

function FpHistoryList({ records, compact = false }: { records: FamilyPlanningRecord[]; compact?: boolean }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Heart className="h-8 w-8 text-gray-200" />
        <p className="text-sm text-gray-400">No family planning records</p>
      </div>
    );
  }

  const methodEntry = (method: FPMethod | undefined) => FP_METHODS.find(m => m.value === method);

  return (
    <div className="space-y-2">
      {records.map(r => {
        const mEntry = methodEntry(r.currentMethod);
        const catColor = FP_METHODS_CATEGORY_COLORS[mEntry?.category ?? 'None'] ?? 'bg-gray-100 text-gray-600';
        return (
          <div key={r.id} className="rounded-xl border border-pink-100 bg-pink-50/40 p-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 flex-shrink-0" />
                <p className="text-sm font-bold text-gray-900">{FP_VISIT_TYPE_LABELS[r.visitType] ?? r.visitType}</p>
              </div>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', catColor)}>
                {mEntry?.label ?? r.currentMethod}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-gray-500">
              {r.patientName && (
                <span className="font-semibold text-hospital-700">{r.patientName}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {r.performedAt ? format(new Date(r.performedAt), 'dd MMM yyyy') : '—'}
              </span>
              {!compact && r.parity !== undefined && <span>Para {r.parity}</span>}
              {!compact && r.gravida !== undefined && <span>G{r.gravida}</span>}
              {!compact && r.bloodPressure && <span>BP: {r.bloodPressure}</span>}
              {!compact && r.nextVisitDate && (
                <span className="text-hospital-600 font-semibold">
                  Next: {format(new Date(r.nextVisitDate), 'dd MMM yyyy')}
                </span>
              )}
            </div>
            {!compact && r.counselingTopics && r.counselingTopics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {r.counselingTopics.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded-full bg-white border border-pink-200 text-[10px] text-pink-700 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {r.notes && <p className="text-[11px] text-gray-500 mt-1 italic">{r.notes}</p>}
            {!compact && r.complications && (
              <p className="text-[11px] text-amber-700 mt-1">⚠ {r.complications}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

interface FamilyPlanningTabProps {
  patients: NursingPatient[];
  selectedPatientId?: string;
}

export function FamilyPlanningTab({ patients, selectedPatientId }: FamilyPlanningTabProps) {
  const [showForm,      setShowForm]      = useState(false);
  const [filterPatient, setFilterPatient] = useState(selectedPatientId ?? '');

  const patientIds = patients.map(p => p.patientId);
  const { data: records = [], isLoading } = useAllPatientsFamilyPlanning(patientIds);

  const filtered = filterPatient ? records.filter(r => r.patientId === filterPatient) : records;

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={filterPatient} onChange={e => setFilterPatient(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-hospital-400"
        >
          <option value="">All ward patients</option>
          {patients.map(p => (
            <option key={p.patientId} value={p.patientId}>{p.patientName}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold transition-colors"
        >
          {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Record FP Visit'}
        </button>
      </div>

      {/* Record form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-600" />
            Record Family Planning Visit
          </h3>
          <FpRecordForm
            patients={patients}
            selectedPatientId={selectedPatientId}
            onDone={() => setShowForm(false)}
          />
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Family Planning History
            {filtered.length > 0 && <span className="ml-2 text-[11px] text-gray-400">({filtered.length})</span>}
          </h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 border-2 border-hospital-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <FpHistoryList records={filtered} />
        )}
      </div>
    </div>
  );
}

// ── Exported read-only view for patient profile ───────────────────────────────

export function FamilyPlanningHistoryView({ patientId }: { patientId: string }) {
  const { data: records = [], isLoading } = useAllPatientsFamilyPlanning([patientId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-4 w-4 border-2 border-hospital-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <FpHistoryList records={records} compact />;
}
