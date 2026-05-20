'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft, Activity, AlertTriangle, Pill, ClipboardList,
  FlaskConical, Scan, Stethoscope, CheckCircle, Loader2,
} from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { usePatientSnapshot } from '../hooks/use-patient-snapshot';
import type { AppointmentRow } from '../hooks/use-dashboard-data';

const VITAL_LABELS: Record<string, string> = {
  '8480-6': 'Systolic BP',
  '8462-4': 'Diastolic BP',
  '55284-4': 'Blood Pressure',
  '8867-4': 'Heart Rate',
  '8310-5': 'Temperature',
  '59408-5': 'SpO₂',
  '29463-7': 'Weight',
  '8302-2': 'Height',
};

interface ConsultationViewProps {
  appointment: AppointmentRow;
  onBack: () => void;
}

export function ConsultationView({ appointment, onBack }: ConsultationViewProps) {
  const medplum = useMedplum();
  const patientId = appointment.patientRef?.replace('Patient/', '') ?? null;
  const { data: snap, isLoading } = usePatientSnapshot(patientId);

  const [note, setNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const d = appointment.time ? new Date(appointment.time) : null;
  const timeStr = d && !isNaN(d.getTime()) ? format(d, 'HH:mm, d MMM yyyy') : '—';

  async function saveNote() {
    if (!note.trim() || !patientId) return;
    setNoteSaving(true);
    try {
      await medplum.createResource({
        resourceType: 'DocumentReference',
        status: 'current',
        type: { coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress note' }], text: 'Progress Note' },
        subject: { reference: `Patient/${patientId}` },
        content: [{ attachment: { contentType: 'text/plain', data: btoa(note), title: 'Clinical Note' } }],
        date: new Date().toISOString(),
        ...(snap?.activeEncounterId ? { context: { encounter: [{ reference: `Encounter/${snap.activeEncounterId}` }] } } : {}),
      } as any);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch { /* silent */ } finally {
      setNoteSaving(false);
    }
  }

  async function completeEncounter() {
    if (!snap?.activeEncounterId) return;
    setCompleting(true);
    try {
      const enc = await medplum.readResource('Encounter', snap.activeEncounterId);
      await medplum.updateResource({ ...enc, status: 'finished', period: { ...enc.period, end: new Date().toISOString() } });
      setCompleted(true);
    } catch { /* silent */ } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Patient Queue
        </Button>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-tight">{appointment.patientName}</h2>
          <p className="text-xs text-muted-foreground">{appointment.visitType} · {timeStr}</p>
        </div>
        <div className="flex gap-2">
          {patientId && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/patients/${patientId}`}>Full Chart</Link>
            </Button>
          )}
          {snap?.activeEncounterId && !completed && (
            <Button size="sm" variant="destructive" onClick={completeEncounter} disabled={completing}>
              {completing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              Complete
            </Button>
          )}
          {completed && <Badge variant="completed" className="text-xs">Encounter closed</Badge>}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-hospital-600 mr-2" />
          <span className="text-sm text-muted-foreground">Loading patient data…</span>
        </div>
      )}

      {!isLoading && snap && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Vitals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" /> Latest Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {snap.vitals.length === 0 ? (
                <p className="text-xs text-muted-foreground">No vitals recorded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {snap.vitals.slice(0, 8).map((v) => (
                    <div key={v.code} className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">{VITAL_LABELS[v.code] ?? v.label}</p>
                      <p className="font-semibold text-sm">{v.value} <span className="text-xs font-normal text-gray-400">{v.unit}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conditions + Allergies */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" /> Active Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {snap.conditions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None recorded.</p>
                ) : (
                  snap.conditions.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-xs">{c.text}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Allergies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {snap.allergies.length === 0 ? (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> NKDA</p>
                ) : (
                  snap.allergies.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-xs">{a.substance}</span>
                      {a.severity && <Badge variant="cancelled" className="text-xs">{a.severity}</Badge>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Medications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Pill className="h-4 w-4 text-purple-600" /> Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {snap.medications.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active prescriptions.</p>
              ) : (
                snap.medications.map((m) => (
                  <div key={m.id} className="py-0.5">
                    <p className="text-xs font-medium">{m.name}</p>
                    {m.dose && <p className="text-xs text-gray-400">{m.dose}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Orders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-orange-600" /> Quick Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="outline" className="justify-start">
                  <Link href={patientId ? `/orders?patient=${patientId}&type=lab` : '/orders'}>
                    <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-amber-600" /> Lab Order
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="justify-start">
                  <Link href={patientId ? `/orders?patient=${patientId}&type=imaging` : '/orders'}>
                    <Scan className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Imaging
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="justify-start col-span-2">
                  <Link href={patientId ? `/orders?patient=${patientId}&type=medication` : '/orders'}>
                    <Pill className="h-3.5 w-3.5 mr-1.5 text-purple-600" /> Prescribe Medication
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Clinical Note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-600" /> Clinical Note
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <textarea
            className="w-full min-h-[120px] text-sm border border-input rounded-md p-3 bg-transparent resize-y focus:outline-none focus:ring-2 focus:ring-hospital-600 focus:border-transparent"
            placeholder="Subjective: Patient presents with…&#10;Objective: Vitals stable…&#10;Assessment: …&#10;Plan: …"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex items-center justify-between">
            {noteSaved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Note saved</span>}
            <div className="ml-auto">
              <Button size="sm" onClick={saveNote} disabled={!note.trim() || noteSaving || !patientId}>
                {noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Save Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
