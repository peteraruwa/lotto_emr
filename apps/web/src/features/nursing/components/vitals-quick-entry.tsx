'use client';
import React, { useState } from 'react';
import { Activity, CheckCircle2, ChevronDown } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { NursingPatient, VitalEntryForm } from '../types';
import { useVitalsQuick } from '../hooks/use-vitals-quick';

interface VitalsQuickEntryProps {
  patients: NursingPatient[];
  defaultPatientId?: string;
}

function numInput(label: string, unit: string, value: string, onChange: (v: string) => void, placeholder?: string) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '—'}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-hospital-400 bg-white"
          inputMode="decimal"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap w-8 text-right">{unit}</span>
      </div>
    </div>
  );
}

export function VitalsQuickEntry({ patients, defaultPatientId }: VitalsQuickEntryProps) {
  const [patientId, setPatientId] = useState(defaultPatientId ?? patients[0]?.patientId ?? '');
  const [systolic,  setSystolic]  = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [hr,        setHr]        = useState('');
  const [temp,      setTemp]      = useState('');
  const [spo2,      setSpo2]      = useState('');
  const [rr,        setRr]        = useState('');
  const [weight,    setWeight]    = useState('');
  const [saved,     setSaved]     = useState(false);

  const { mutateAsync, isPending } = useVitalsQuick();
  const selectedPatient = patients.find(p => p.patientId === patientId);

  async function handleSave() {
    if (!patientId || (!systolic && !hr && !temp && !spo2 && !rr)) return;
    const form: VitalEntryForm = {
      patientId,
      encounterId: selectedPatient?.encounterId ?? '',
      systolic:    systolic  ? Number(systolic)  : undefined,
      diastolic:   diastolic ? Number(diastolic) : undefined,
      hr:          hr        ? Number(hr)        : undefined,
      temp:        temp      ? Number(temp)      : undefined,
      spo2:        spo2      ? Number(spo2)      : undefined,
      rr:          rr        ? Number(rr)        : undefined,
      weight:      weight    ? Number(weight)    : undefined,
    };
    await mutateAsync(form);
    // Clear form
    setSystolic(''); setDiastolic(''); setHr(''); setTemp('');
    setSpo2(''); setRr(''); setWeight('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Patient selector */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Patient</label>
        <div className="relative">
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-hospital-400"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientName} — Bed {p.bed} ({p.status})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {selectedPatient?.bloodTransfusionConsent === 'refuses' && (
          <p className="text-[11px] font-bold text-red-700 mt-1">⚠ Patient refuses blood transfusion</p>
        )}
      </div>

      {/* Vitals form grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* BP on full width row */}
        <div className="col-span-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Blood Pressure</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={systolic}
              onChange={e => setSystolic(e.target.value)}
              placeholder="Systolic"
              inputMode="numeric"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-hospital-400"
            />
            <span className="text-gray-400 font-bold">/</span>
            <input
              type="number"
              value={diastolic}
              onChange={e => setDiastolic(e.target.value)}
              placeholder="Diastolic"
              inputMode="numeric"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-hospital-400"
            />
            <span className="text-xs text-gray-400 w-12">mmHg</span>
          </div>
        </div>

        {numInput('Heart Rate', '/min', hr, setHr, '72')}
        {numInput('Temperature', '°C',  temp, setTemp, '36.5')}
        {numInput('SpO₂', '%',  spo2, setSpo2, '98')}
        {numInput('Resp Rate', '/min', rr, setRr, '16')}
        {numInput('Weight', 'kg', weight, setWeight, '')}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isPending || !patientId || (!systolic && !hr && !temp && !spo2 && !rr)}
        className={cn(
          'w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50',
          saved
            ? 'bg-green-600 text-white'
            : 'bg-hospital-600 hover:bg-hospital-700 text-white'
        )}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4" /> Vitals Saved</span>
        ) : isPending ? (
          'Saving...'
        ) : (
          <span className="flex items-center justify-center gap-2"><Activity className="h-4 w-4" /> Save Vitals</span>
        )}
      </button>
    </div>
  );
}
