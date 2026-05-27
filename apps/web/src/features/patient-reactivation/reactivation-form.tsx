'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserCheck, AlertTriangle, CheckCircle2, ChevronRight, X, Loader2, RefreshCw } from 'lucide-react';
import { useSearchInactivePatients, type PatientSearchResult } from './hooks/use-search-inactive-patients';
import { useReactivatePatient } from './hooks/use-reactivate-patient';
import { NIGERIAN_STATES } from '../patient-registration/types';

// ── helpers ─────────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 flex-shrink-0 w-28">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

// ── Patient result card ──────────────────────────────────────────────────────
function PatientCard({
  patient,
  onSelect,
}: {
  patient: PatientSearchResult;
  onSelect: (p: PatientSearchResult) => void;
}) {
  const ini = patient.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isMale = patient.gender === 'male';

  return (
    <button
      type="button"
      onClick={() => onSelect(patient)}
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-emerald-50 transition-colors group text-left"
    >
      {/* Avatar */}
      <div className={[
        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
        isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700',
      ].join(' ')}>
        {ini}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 truncate">{patient.fullName}</p>
          {!patient.isActive && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex-shrink-0">INACTIVE</span>
          )}
          {patient.isActive && (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">ACTIVE</span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {patient.mrn}
          {patient.dateOfBirth ? ` · DOB ${patient.dateOfBirth}` : ''}
          {patient.phone ? ` · ${patient.phone}` : ''}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-600 flex-shrink-0" />
    </button>
  );
}

// ── Reactivation panel ──────────────────────────────────────────────────────
function ReactivationPanel({
  patient,
  onClose,
  onDone,
}: {
  patient: PatientSearchResult;
  onClose: () => void;
  onDone: (patientId: string) => void;
}) {
  const { mutateAsync: reactivate, isPending } = useReactivatePatient();
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [phone,       setPhone]    = useState(patient.phone ?? '');
  const [email,       setEmail]    = useState(
    patient.raw.telecom?.find((t) => t.system === 'email')?.value ?? ''
  );
  const [addrLine,    setAddrLine] = useState(patient.raw.address?.[0]?.line?.[0] ?? '');
  const [city,        setCity]     = useState(patient.raw.address?.[0]?.city ?? '');
  const [state,       setState]    = useState(patient.raw.address?.[0]?.state ?? '');

  const inp = 'w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white';
  const lbl = 'block text-xs font-semibold text-emerald-800 mb-1';

  async function handleReactivate() {
    setError(null);
    try {
      await reactivate({
        patientId: patient.id,
        phone:     phone || undefined,
        email:     email || undefined,
        addressLine1: addrLine || undefined,
        city:      city || undefined,
        state:     state || undefined,
      });
      onDone(patient.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reactivation failed. Please try again.');
    }
  }

  const ini  = patient.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isMale = patient.gender === 'male';

  return (
    <div className="space-y-5">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={[
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0',
            isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700',
          ].join(' ')}>
            {ini}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{patient.fullName}</h3>
            <p className="text-xs text-gray-500 font-mono">{patient.mrn}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Existing record summary */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Existing Record</p>
        <Field label="Date of Birth" value={patient.dateOfBirth} />
        <Field label="Gender"        value={patient.gender} />
        <Field label="Phone"         value={patient.phone} />
        <Field label="Address"       value={patient.address} />
        <Field label="NIN"           value={patient.nin || 'Not recorded'} />
      </div>

      {/* Status banner */}
      {patient.isActive ? (
        <div className="flex gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">This patient is already active.</p>
            <p>You can still update their contact details below. No reactivation is needed.</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <RefreshCw className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800">
            <p className="font-semibold">This patient is currently INACTIVE.</p>
            <p>Confirm or update their details below, then click "Reactivate" to reinstate them.</p>
          </div>
        </div>
      )}

      {/* Updatable fields */}
      <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-4">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
          Confirm / Update Contact Details
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Primary Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className={inp} type="tel" />
          </div>
          <div>
            <label className={lbl}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@email.com" className={inp} type="email" />
          </div>
        </div>

        <div>
          <label className={lbl}>Address Line</label>
          <input value={addrLine} onChange={(e) => setAddrLine(e.target.value)} placeholder="12 Broad Street" className={inp} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lagos" className={inp} />
          </div>
          <div>
            <label className={lbl}>State</label>
            <select value={state} onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
              <option value="">— Select State —</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleReactivate}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Reactivating…</>
          ) : (
            <><UserCheck className="h-4 w-4" />{patient.isActive ? 'Update Details' : 'Reactivate Patient'}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ patientId, name }: { patientId: string; name: string }) {
  const router = useRouter();
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Patient Reactivated!</h2>
        <p className="text-gray-500 text-sm mt-2">{name} is now active in the system.</p>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push(`/patients/${patientId}`)}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          Open Patient Profile →
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
        >
          Reactivate Another
        </button>
      </div>
    </div>
  );
}

// ── Main exported component ──────────────────────────────────────────────────
export function PatientReactivationForm() {
  const [query,    setQuery]    = useState('');
  const [live,     setLive]     = useState('');
  const [selected, setSelected] = useState<PatientSearchResult | null>(null);
  const [doneId,   setDoneId]   = useState<string | null>(null);

  const { data: results = [], isFetching, error } = useSearchInactivePatients(live);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLive(query.trim());
    setSelected(null);
  }

  if (doneId && selected) {
    return <SuccessScreen patientId={doneId} name={selected.fullName} />;
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
        <span className="text-3xl">🔄</span>
        <div>
          <h2 className="text-xl font-bold">Reactivate a Returning Patient</h2>
          <p className="text-emerald-100 text-sm mt-1">
            Search by name, MRN (e.g. LCH-2025-123456), NIN, or phone number.
            The system will find both active and inactive patients.
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter patient name, MRN, NIN or phone…"
            className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={query.trim().length < 2}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold rounded-xl transition-colors"
        >
          Search
        </button>
      </form>

      {/* Tip */}
      <div className="flex gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
        <span className="text-blue-500 text-sm flex-shrink-0 mt-0.5">💡</span>
        <p className="text-xs text-blue-700">
          <strong>Search tips:</strong> Type at least 2 characters. MRN format: <code className="bg-blue-100 px-1 rounded">LCH-2025-123456</code>.
          NIN: 11 digits. Inactive patients are shown with a red "INACTIVE" badge.
        </p>
      </div>

      {/* Two-column layout: results + panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Search results */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search Results</span>
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
          </div>

          {/* Idle */}
          {!live && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search className="h-8 w-8 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500 font-medium">Search for a patient above</p>
              <p className="text-xs text-gray-400 mt-1">Results will appear here</p>
            </div>
          )}

          {/* Loading */}
          {live && isFetching && results.length === 0 && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Searching…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center py-10 text-center px-4">
              <AlertTriangle className="h-6 w-6 text-red-400 mb-2" />
              <p className="text-sm text-red-600 font-medium">Search failed</p>
              <p className="text-xs text-gray-400 mt-1">{(error as any).message}</p>
            </div>
          )}

          {/* Empty */}
          {live && !isFetching && !error && results.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center px-4">
              <UserCheck className="h-8 w-8 text-gray-200 mb-3" />
              <p className="text-sm text-gray-600 font-medium">No patients found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different name, MRN, NIN, or phone number</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              {results.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  onSelect={(pt) => { setSelected(pt); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reactivation panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-[200px]">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <UserCheck className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500 font-medium">Select a patient from the results</p>
              <p className="text-xs text-gray-400 mt-1">Their details will appear here for review</p>
            </div>
          ) : (
            <ReactivationPanel
              patient={selected}
              onClose={() => setSelected(null)}
              onDone={(id) => setDoneId(id)}
            />
          )}
        </div>

      </div>
    </div>
  );
}
