'use client';
import React, { useState } from 'react';
import { Syringe, Plus, CheckCircle2, XCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { format } from 'date-fns';
import type { NursingPatient, ImmunizationRecord } from '../types';
import { NIGERIA_EPI_VACCINES, INJECTION_SITES, INJECTION_ROUTES } from '../constants';
import { useAllPatientsImmunizations, useRecordImmunization } from '../hooks/use-immunization';

// ── Record Form ───────────────────────────────────────────────────────────────

interface RecordFormProps {
  patients: NursingPatient[];
  selectedPatientId?: string;
  onDone: () => void;
}

function RecordForm({ patients, selectedPatientId, onDone }: RecordFormProps) {
  const [patientId,     setPatientId]     = useState(selectedPatientId ?? '');
  const [vaccineCode,   setVaccineCode]   = useState('');
  const [customVaccine, setCustomVaccine] = useState('');
  const [doseNumber,    setDoseNumber]    = useState('1');
  const [lotNumber,     setLotNumber]     = useState('');
  const [expiryDate,    setExpiryDate]    = useState('');
  const [site,          setSite]          = useState('');
  const [route,         setRoute]         = useState('');
  const [doseVolume,    setDoseVolume]    = useState('');
  const [givenAt,       setGivenAt]       = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes,         setNotes]         = useState('');
  const [notGiven,      setNotGiven]      = useState(false);
  const [refuseReason,  setRefuseReason]  = useState('');
  const [success,       setSuccess]       = useState(false);

  const { mutateAsync, isPending } = useRecordImmunization();

  const selectedVaccine = NIGERIA_EPI_VACCINES.find(v => v.cvx === vaccineCode);
  const patient = patients.find(p => p.patientId === patientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || (!vaccineCode && !customVaccine)) return;
    const vaccine = selectedVaccine ?? { cvx: 'OTHER', name: customVaccine, route: route, site: site, doseVolume: doseVolume, doses: 1 };
    await mutateAsync({
      patientId,
      patientName: patient?.patientName ?? '',
      encounterId: patient?.encounterId,
      vaccineCode: vaccine.cvx,
      vaccineName: vaccine.name,
      doseNumber: Number(doseNumber),
      lotNumber:  lotNumber || undefined,
      expirationDate: expiryDate || undefined,
      site:       site       || vaccine.site       || undefined,
      route:      route      || vaccine.route      || undefined,
      doseVolume: doseVolume || vaccine.doseVolume || undefined,
      occurrenceDateTime: new Date(givenAt).toISOString(),
      notes:      notes      || undefined,
      status:     notGiven ? 'not-done' : 'completed',
      statusReason: notGiven ? (refuseReason || 'Patient refused') : undefined,
    });
    setSuccess(true);
    setTimeout(onDone, 1500);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="text-sm font-bold text-green-700">
          {notGiven ? 'Vaccine not-given recorded' : 'Immunization recorded successfully'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Patient */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Patient *</label>
        <select
          value={patientId}
          onChange={e => setPatientId(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
        >
          <option value="">Select patient…</option>
          {patients.map(p => (
            <option key={p.patientId} value={p.patientId}>
              {p.patientName} — Bed {p.bed}
            </option>
          ))}
        </select>
      </div>

      {/* Vaccine */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Vaccine *</label>
        <select
          value={vaccineCode}
          onChange={e => {
            setVaccineCode(e.target.value);
            const v = NIGERIA_EPI_VACCINES.find(vx => vx.cvx === e.target.value);
            if (v) { setRoute(v.route); setSite(v.site); setDoseVolume(v.doseVolume); }
          }}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
        >
          <option value="">Select vaccine…</option>
          {NIGERIA_EPI_VACCINES.map(v => (
            <option key={`${v.cvx}-${v.name}`} value={v.cvx}>{v.name}</option>
          ))}
          <option value="OTHER">Other (specify below)</option>
        </select>
        {vaccineCode === 'OTHER' && (
          <input
            type="text" value={customVaccine} onChange={e => setCustomVaccine(e.target.value)}
            placeholder="Vaccine name"
            required
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        )}
      </div>

      {selectedVaccine && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
          <p className="font-semibold">{selectedVaccine.name}</p>
          <p>Schedule: {selectedVaccine.schedule} · {selectedVaccine.doses} dose{selectedVaccine.doses > 1 ? 's' : ''} · {selectedVaccine.doseVolume}</p>
        </div>
      )}

      {/* Grid fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Dose Number</label>
          <input
            type="number" min="1" max="10" value={doseNumber}
            onChange={e => setDoseNumber(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Dose Volume</label>
          <input
            type="text" value={doseVolume} onChange={e => setDoseVolume(e.target.value)}
            placeholder="0.5 mL"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Route</label>
          <select value={route} onChange={e => setRoute(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400">
            <option value="">Select…</option>
            {INJECTION_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Site</label>
          <select value={site} onChange={e => setSite(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400">
            <option value="">Select…</option>
            {INJECTION_SITES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Lot Number</label>
          <input type="text" value={lotNumber} onChange={e => setLotNumber(e.target.value)}
            placeholder="e.g. LC20240601"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Vial Expiry Date</label>
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Date &amp; Time Given *</label>
          <input type="datetime-local" value={givenAt} onChange={e => setGivenAt(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
          />
        </div>
      </div>

      {/* Not given checkbox */}
      <div className="flex items-center gap-2">
        <input id="notGiven" type="checkbox" checked={notGiven} onChange={e => setNotGiven(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-amber-600" />
        <label htmlFor="notGiven" className="text-xs font-semibold text-gray-600">Vaccine NOT given (record refusal or contraindication)</label>
      </div>
      {notGiven && (
        <input type="text" value={refuseReason} onChange={e => setRefuseReason(e.target.value)}
          placeholder="Reason (e.g. patient refused, contraindicated, stock-out)"
          className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      )}

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Optional clinical notes"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hospital-400"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onDone}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isPending || !patientId || (!vaccineCode && !customVaccine)}
          className="flex-1 py-2.5 rounded-xl bg-hospital-600 text-white text-sm font-bold hover:bg-hospital-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          <Syringe className="h-4 w-4" />
          {isPending ? 'Saving…' : 'Record Immunization'}
        </button>
      </div>
    </form>
  );
}

// ── History List ──────────────────────────────────────────────────────────────

function ImmunizationHistoryList({ records, compact = false }: { records: ImmunizationRecord[]; compact?: boolean }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Syringe className="h-8 w-8 text-gray-200" />
        <p className="text-sm text-gray-400">No immunization records</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map(r => (
        <div key={r.id} className={cn(
          'rounded-xl border p-3 flex items-start gap-3',
          r.status === 'completed'           ? 'bg-green-50 border-green-100' :
          r.status === 'not-done'            ? 'bg-amber-50 border-amber-200' :
                                              'bg-gray-50 border-gray-100',
        )}>
          {r.status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-900">{r.vaccineName}</p>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              )}>
                {r.status === 'completed' ? `Dose ${r.doseNumber}` : 'Not Given'}
              </span>
            </div>
            {!compact && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                {r.site  && <span>Site: {r.site}</span>}
                {r.route && <span>Route: {r.route}</span>}
                {r.dose  && <span>Dose: {r.dose}</span>}
                {r.lotNumber && <span>Lot: {r.lotNumber}</span>}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {r.patientName && (
                <span className="text-[11px] text-hospital-700 font-semibold">{r.patientName}</span>
              )}
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {r.occurrenceDateTime ? format(new Date(r.occurrenceDateTime), 'dd MMM yyyy') : '—'}
              </span>
              {r.statusReason && (
                <span className="text-[11px] text-amber-600">({r.statusReason})</span>
              )}
            </div>
            {r.notes && <p className="text-[11px] text-gray-500 mt-1 italic">{r.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

interface ImmunizationTabProps {
  patients: NursingPatient[];
  selectedPatientId?: string;
}

export function ImmunizationTab({ patients, selectedPatientId }: ImmunizationTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterPatient, setFilterPatient] = useState(selectedPatientId ?? '');

  const patientIds = patients.map(p => p.patientId);
  const { data: records = [], isLoading } = useAllPatientsImmunizations(patientIds);

  const filtered = filterPatient ? records.filter(r => r.patientId === filterPatient) : records;

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={filterPatient}
          onChange={e => setFilterPatient(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-hospital-400"
        >
          <option value="">All ward patients</option>
          {patients.map(p => (
            <option key={p.patientId} value={p.patientId}>{p.patientName}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-xs font-semibold transition-colors"
        >
          {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Record Vaccine'}
        </button>
      </div>

      {/* Record form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-hospital-100 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Syringe className="h-4 w-4 text-hospital-600" />
            Record Immunization
          </h3>
          <RecordForm
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
            Immunization History
            {filtered.length > 0 && <span className="ml-2 text-[11px] text-gray-400">({filtered.length})</span>}
          </h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 border-2 border-hospital-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ImmunizationHistoryList records={filtered} />
        )}
      </div>
    </div>
  );
}

// ── Exported read-only view for patient profile ───────────────────────────────

export function ImmunizationHistoryView({ patientId }: { patientId: string }) {
  const { data: records = [], isLoading } = useAllPatientsImmunizations([patientId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-4 w-4 border-2 border-hospital-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <ImmunizationHistoryList records={records} compact />;
}
