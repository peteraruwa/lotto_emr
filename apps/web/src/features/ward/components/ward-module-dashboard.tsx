'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@lotto-emr/ui';
import {
  LayoutDashboard, Users, BedDouble, ClipboardList, Stethoscope,
  ArrowLeftRight, LogOut, BarChart2, Bell, Settings, Search,
  ChevronDown, AlertTriangle, Activity, CheckCircle2, Clock,
  User, Plus, RefreshCw, Loader2, XCircle, CheckCircle,
  ArrowRight, MoveRight, Bed, Filter, TrendingUp, TrendingDown,
  Clipboard, Pill, FlaskConical, Thermometer, Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@lotto-emr/ui';
import { useWardData } from '../hooks/use-ward-data';
import { useWardBeds, WARD_NAMES, WARD_BED_CONFIG } from '../hooks/use-ward-beds';
import { useWardTasks, useCreateWardTask, useCompleteWardTask } from '../hooks/use-ward-tasks';
import { useUpdateDischargeStatus } from '../hooks/use-ward-discharge';
import { useWardHandover, useAddHandoverEntry } from '../hooks/use-ward-handover';
import { useWardAlerts } from '../hooks/use-ward-alerts';
import { WardAlertsPanel } from './ward-alerts-panel';
import type { WardPatient, WardBed, WardTask, DischargeStatus, HandoverCategory } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionId =
  | 'overview' | 'patients' | 'beds' | 'tasks'
  | 'round' | 'handover' | 'discharge' | 'transfers'
  | 'analytics' | 'alerts';

// ─── Constants ────────────────────────────────────────────────────────────────
const SHIFTS = ['Morning (7am–3pm)', 'Afternoon (3pm–11pm)', 'Night (11pm–7am)'];
function getCurrentShift(): string {
  const h = new Date().getHours();
  if (h >= 7 && h < 15) return SHIFTS[0];
  if (h >= 15 && h < 23) return SHIFTS[1];
  return SHIFTS[2];
}

const STATUS_BADGE: Record<WardPatient['status'], { label: string; cls: string }> = {
  stable:         { label: 'Stable',      cls: 'bg-green-100 text-green-800' },
  observation:    { label: 'Watch',       cls: 'bg-amber-100 text-amber-800' },
  critical:       { label: 'Critical',    cls: 'bg-red-600 text-white' },
  'for-discharge':{ label: 'Discharge',   cls: 'bg-blue-100 text-blue-800' },
};

const DISCHARGE_STEPS: { status: DischargeStatus; label: string }[] = [
  { status: 'ready',           label: 'Ready' },
  { status: 'summary-pending', label: 'Summary Pending' },
  { status: 'pharmacy-pending',label: 'Pharmacy Pending' },
  { status: 'doctor-approval', label: 'Doctor Approval' },
  { status: 'completed',       label: 'Completed' },
];

const BED_STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  occupied:       { bg: 'bg-teal-50',   border: 'border-teal-300',  text: 'text-teal-800',  dot: 'bg-teal-500' },
  'high-dependency': { bg: 'bg-red-50', border: 'border-red-300',   text: 'text-red-800',   dot: 'bg-red-500' },
  isolation:      { bg: 'bg-purple-50', border: 'border-purple-300',text: 'text-purple-800',dot: 'bg-purple-500' },
  available:      { bg: 'bg-green-50',  border: 'border-green-300', text: 'text-green-800', dot: 'bg-green-400' },
  cleaning:       { bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-400' },
  reserved:       { bg: 'bg-blue-50',   border: 'border-blue-300',  text: 'text-blue-800',  dot: 'bg-blue-400' },
  blocked:        { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-500', dot: 'bg-slate-400' },
};

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
const NAV_ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'patients',   label: 'Patients',    icon: Users },
  { id: 'beds',       label: 'Bed Board',   icon: BedDouble },
  { id: 'tasks',      label: 'Tasks',       icon: ClipboardList },
  { id: 'round',      label: 'Ward Round',  icon: Stethoscope },
  { id: 'handover',   label: 'Handover',    icon: ArrowLeftRight },
  { id: 'discharge',  label: 'Discharge',   icon: LogOut },
  { id: 'transfers',  label: 'Transfers',   icon: MoveRight },
  { id: 'analytics',  label: 'Analytics',   icon: BarChart2 },
  { id: 'alerts',     label: 'Alerts',      icon: Bell },
];

// ─── Small helpers ────────────────────────────────────────────────────────────
function Chip({ label, colorCls }: { label: string; colorCls: string }) {
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold', colorCls)}>
      {label}
    </span>
  );
}

function SnapshotCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Section: Overview ────────────────────────────────────────────────────────
function OverviewSection({
  patients,
  tasks,
  alerts,
  acknowledgedIds,
  onAcknowledge,
}: {
  patients: WardPatient[];
  tasks: WardTask[];
  alerts: ReturnType<typeof useWardAlerts>;
  acknowledgedIds: Set<string>;
  onAcknowledge: (id: string) => void;
}) {
  const total = patients.length;
  const stable = patients.filter(p => p.status === 'stable').length;
  const critical = patients.filter(p => p.status === 'critical').length;
  const forDischarge = patients.filter(p => p.status === 'for-discharge').length;
  const observation = patients.filter(p => p.status === 'observation').length;

  const medsDue = tasks.filter(t => t.type === 'medication' && (t.status === 'due' || t.status === 'overdue')).length;
  const vitalsDue = tasks.filter(t => t.type === 'vitals' && (t.status === 'due' || t.status === 'overdue')).length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

  const activeAlerts = alerts.filter(a => !acknowledgedIds.has(a.id));

  return (
    <div className="space-y-5">
      {/* Ward Snapshot */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Ward Snapshot</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SnapshotCard label="Total Inpatients" value={total}       icon={Users}       color="bg-teal-600" />
          <SnapshotCard label="Stable"           value={stable}      icon={CheckCircle} color="bg-green-600" />
          <SnapshotCard label="Critical"         value={critical}    icon={AlertTriangle} color="bg-red-600" />
          <SnapshotCard label="For Discharge"    value={forDischarge} icon={LogOut}     color="bg-blue-600" />
        </div>
      </section>

      {/* Acuity + Load */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Acuity overview */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-600">Patient Acuity</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {[
              { label: 'Stable',    count: stable,      color: 'bg-green-500' },
              { label: 'Watch',     count: observation, color: 'bg-amber-500' },
              { label: 'Critical',  count: critical,    color: 'bg-red-600' },
              { label: 'Discharge', count: forDischarge,color: 'bg-blue-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-20 text-[11px] text-slate-600">{label}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', color)}
                    style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
                <div className="w-6 text-right text-[11px] font-bold text-slate-700">{count}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Clinical load */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-600">Active Clinical Load</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {[
              { label: 'Medications due',   value: medsDue,     icon: Pill,        color: 'text-indigo-600' },
              { label: 'Vitals due',        value: vitalsDue,   icon: Activity,    color: 'text-teal-600' },
              { label: 'Overdue tasks',     value: overdueTasks,icon: Clock,       color: 'text-red-600' },
              { label: 'Active alerts',     value: activeAlerts.length, icon: Bell, color: 'text-amber-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-3.5 w-3.5', color)} />
                  <span className="text-[12px] text-slate-600">{label}</span>
                </div>
                <span className={cn('text-[13px] font-bold', value > 0 ? color : 'text-slate-400')}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Feed */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-red-700">
                Critical Alerts ({activeAlerts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1 space-y-2">
            {activeAlerts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Chip label={a.severity.toUpperCase()} colorCls={a.severity === 'critical' ? 'bg-red-600 text-white' : a.severity === 'high' ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'} />
                    <span className="text-[12px] font-semibold text-slate-800">{a.patientName}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{a.message}</p>
                  <p className="text-[10px] text-slate-400">{a.ward} · Bed {a.bedNumber}</p>
                </div>
                <button
                  onClick={() => onAcknowledge(a.id)}
                  className="shrink-0 text-[10px] px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium"
                >
                  ACK
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent patients */}
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-600">All Patients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Bed', 'Patient', 'Diagnosis', 'Days', 'Status', 'Nurse'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 12).map(p => {
                const sb = STATUS_BADGE[p.status];
                return (
                  <tr key={p.patientId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-[12px] text-slate-700">{p.bedNumber}</td>
                    <td className="px-3 py-2">
                      <Link href={`/patients/${p.patientId}`} className="font-medium text-[12px] text-teal-700 hover:underline">
                        {p.patientName}
                      </Link>
                      <p className="text-[10px] text-slate-400">{p.mrn}</p>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600 max-w-[140px] truncate">{p.admittingDiagnosis}</td>
                    <td className="px-3 py-2 text-[12px] text-slate-700">{p.daysAdmitted}d</td>
                    <td className="px-3 py-2"><Chip label={sb.label} colorCls={sb.cls} /></td>
                    <td className="px-3 py-2 text-[11px] text-slate-500">{p.nurseAssigned ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Patients ────────────────────────────────────────────────────────
function PatientsSection({ patients }: { patients: WardPatient[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<WardPatient['status'] | 'all'>('all');

  const filtered = useMemo(() => {
    let list = filter === 'all' ? patients : patients.filter(p => p.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.patientName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.bedNumber.toLowerCase().includes(q) ||
        p.admittingDiagnosis.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patients, filter, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, MRN, bed..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        {(['all', 'stable', 'observation', 'critical', 'for-discharge'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1 text-xs rounded-full border font-medium capitalize transition-colors',
              filter === s
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
            )}
          >
            {s === 'all' ? `All (${patients.length})` : s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(p => {
          const sb = STATUS_BADGE[p.status];
          return (
            <Card key={p.patientId} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/patients/${p.patientId}`} className="text-sm font-semibold text-slate-900 hover:text-teal-700 hover:underline">
                          {p.patientName}
                        </Link>
                        <Chip label={sb.label} colorCls={sb.cls} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.mrn} · {p.age}y {p.gender} · Bed <span className="font-mono font-bold">{p.bedNumber}</span> · {p.ward}
                      </p>
                      <p className="text-[11px] text-slate-700 mt-0.5 font-medium">{p.admittingDiagnosis}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-slate-500">Day {p.daysAdmitted}</p>
                    {p.news2Score !== undefined && p.news2Score > 0 && (
                      <p className={cn('text-[10px] font-bold', p.news2Score >= 7 ? 'text-red-600' : p.news2Score >= 4 ? 'text-amber-600' : 'text-green-600')}>
                        NEWS2: {p.news2Score}
                      </p>
                    )}
                  </div>
                </div>

                {/* Clinical indicators */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {p.onOxygen    && <Chip label="O₂" colorCls="bg-blue-100 text-blue-700" />}
                  {p.hasIVLine   && <Chip label="IV" colorCls="bg-teal-100 text-teal-700" />}
                  {p.hasCatheter && <Chip label="IDC" colorCls="bg-slate-100 text-slate-600" />}
                  {p.isFallRisk  && <Chip label="FALL RISK" colorCls="bg-yellow-100 text-yellow-800" />}
                  {p.isIsolation && <Chip label="ISOLATION" colorCls="bg-purple-100 text-purple-700" />}
                  {p.isNPO       && <Chip label="NPO" colorCls="bg-orange-100 text-orange-700" />}
                  {(p.alertCount ?? 0) > 0 && <Chip label={`${p.alertCount} Alert`} colorCls="bg-red-100 text-red-700" />}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Link href={`/patients/${p.patientId}`}>
                    <button className="text-[11px] px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 font-medium">
                      Open Chart
                    </button>
                  </Link>
                  <span className="text-[11px] text-slate-400">Nurse: {p.nurseAssigned ?? '—'}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No patients match your filter.</div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Bed Board ───────────────────────────────────────────────────────
function BedBoardSection({ beds }: { beds: WardBed[] }) {
  const [wardFilter, setWardFilter] = useState<string>('all');
  const wardBeds = wardFilter === 'all' ? beds : beds.filter(b => b.ward === wardFilter);

  const byWard = useMemo(() => {
    const m = new Map<string, WardBed[]>();
    for (const b of wardBeds) {
      if (!m.has(b.ward)) m.set(b.ward, []);
      m.get(b.ward)!.push(b);
    }
    return m;
  }, [wardBeds]);

  const totalBeds = beds.length;
  const occupied = beds.filter(b => b.status === 'occupied' || b.status === 'high-dependency' || b.status === 'isolation').length;
  const available = beds.filter(b => b.status === 'available').length;
  const cleaning = beds.filter(b => b.status === 'cleaning').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <SnapshotCard label="Total Beds"  value={totalBeds} icon={Bed}           color="bg-slate-600" />
        <SnapshotCard label="Occupied"    value={occupied}  icon={Users}          color="bg-teal-600" />
        <SnapshotCard label="Available"   value={available} icon={CheckCircle}    color="bg-green-600" />
        <SnapshotCard label="Cleaning"    value={cleaning}  icon={RefreshCw}      color="bg-amber-500" />
      </div>

      {/* Ward filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', ...WARD_NAMES]).map(w => (
          <button
            key={w}
            onClick={() => setWardFilter(w)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-full border font-medium transition-colors',
              wardFilter === w
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
            )}
          >
            {w === 'all' ? 'All Wards' : w}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(BED_STATUS_STYLES).map(([status, s]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', s.dot)} />
            <span className="text-[11px] text-slate-600 capitalize">{status.replace('-', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Bed grid per ward */}
      {Array.from(byWard.entries()).map(([ward, wBeds]) => (
        <Card key={ward}>
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-600">{ward}</CardTitle>
              <span className="text-[11px] text-slate-400">
                {wBeds.filter(b => b.status === 'available').length} / {wBeds.length} available
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {wBeds.map(bed => {
                const s = BED_STATUS_STYLES[bed.status] ?? BED_STATUS_STYLES.available;
                return (
                  <div
                    key={bed.id}
                    className={cn(
                      'rounded-lg border p-1.5 text-center cursor-default transition-shadow hover:shadow-sm',
                      s.bg, s.border
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <div className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                      <span className={cn('font-mono text-[11px] font-bold', s.text)}>{bed.bedNumber}</span>
                    </div>
                    {bed.patient ? (
                      <p className={cn('text-[9px] truncate leading-tight', s.text)}>
                        {bed.patient.patientName.split(' ')[0]}
                      </p>
                    ) : (
                      <p className={cn('text-[9px] leading-tight capitalize', s.text)}>
                        {bed.status}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Section: Tasks ───────────────────────────────────────────────────────────
function TasksSection({ tasks, patients }: { tasks: WardTask[]; patients: WardPatient[] }) {
  const complete = useCompleteWardTask();
  const createTask = useCreateWardTask();
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ patientId: '', description: '', type: 'vitals' as WardTask['type'], priority: 'routine' as WardTask['priority'], dueAt: '' });

  const overdue  = tasks.filter(t => t.status === 'overdue');
  const dueNow   = tasks.filter(t => t.status === 'due');
  const upcoming = tasks.filter(t => t.status === 'upcoming');

  const TASK_TYPE_ICONS: Record<string, React.ElementType> = {
    medication: Pill, vitals: Activity, 'wound-dressing': Heart,
    'iv-fluid-review': FlaskConical, 'lab-sample': FlaskConical,
    'catheter-care': Activity, 'discharge-paperwork': Clipboard,
    other: ClipboardList,
  };

  function TaskGroup({ title, items, color }: { title: string; items: WardTask[]; color: string }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', color)} />
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">{title} ({items.length})</h4>
        </div>
        {items.map(t => {
          const Icon = TASK_TYPE_ICONS[t.type] ?? ClipboardList;
          return (
            <Card key={t.id} className={cn('border-l-4', t.status === 'overdue' ? 'border-l-red-500' : t.status === 'due' ? 'border-l-amber-500' : 'border-l-slate-300')}>
              <CardContent className="p-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={cn('p-1.5 rounded', t.status === 'overdue' ? 'bg-red-100' : t.status === 'due' ? 'bg-amber-100' : 'bg-slate-100')}>
                    <Icon className={cn('h-3.5 w-3.5', t.status === 'overdue' ? 'text-red-600' : t.status === 'due' ? 'text-amber-600' : 'text-slate-500')} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">{t.description}</p>
                    <p className="text-[11px] text-slate-500">
                      {t.patientName} · Bed {t.bedNumber}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {t.minutesUntilDue < 0
                        ? `${Math.abs(t.minutesUntilDue)}m overdue`
                        : t.minutesUntilDue === 0 ? 'Due now'
                        : `Due in ${t.minutesUntilDue}m`}
                      {t.assignedTo && ` · ${t.assignedTo}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => complete.mutate({ taskId: t.id })}
                  disabled={complete.isPending}
                  className="shrink-0 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Done
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Ward Task Queue</h3>
          <p className="text-[11px] text-slate-500">{overdue.length} overdue · {dueNow.length} due now · {upcoming.length} upcoming</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white h-8" onClick={() => setShowCreate(s => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>

      {showCreate && (
        <Card className="border-teal-300 bg-teal-50">
          <CardContent className="p-3 space-y-2">
            <h4 className="text-xs font-bold text-teal-800">New Task</h4>
            <select
              className="w-full text-xs border rounded px-2 py-1.5 bg-white"
              value={newTask.patientId}
              onChange={e => setNewTask(prev => ({ ...prev, patientId: e.target.value }))}
            >
              <option value="">Select patient…</option>
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>{p.patientName} (Bed {p.bedNumber})</option>
              ))}
            </select>
            <select
              className="w-full text-xs border rounded px-2 py-1.5 bg-white"
              value={newTask.type}
              onChange={e => setNewTask(prev => ({ ...prev, type: e.target.value as WardTask['type'] }))}
            >
              <option value="vitals">Vitals Check</option>
              <option value="medication">Medication</option>
              <option value="wound-dressing">Wound Dressing</option>
              <option value="iv-fluid-review">IV Fluid Review</option>
              <option value="catheter-care">Catheter Care</option>
              <option value="lab-sample">Lab Sample Collection</option>
              <option value="discharge-paperwork">Discharge Paperwork</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Task description…"
              value={newTask.description}
              onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1.5"
            />
            <div className="flex gap-2">
              <select
                className="flex-1 text-xs border rounded px-2 py-1.5 bg-white"
                value={newTask.priority}
                onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as WardTask['priority'] }))}
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
              <input
                type="datetime-local"
                value={newTask.dueAt}
                onChange={e => setNewTask(prev => ({ ...prev, dueAt: e.target.value }))}
                className="flex-1 text-xs border rounded px-2 py-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-7"
                disabled={!newTask.patientId || !newTask.description || createTask.isPending}
                onClick={() => {
                  const p = patients.find(pt => pt.patientId === newTask.patientId);
                  if (!p) return;
                  createTask.mutate({
                    patientId: p.patientId,
                    patientName: p.patientName,
                    ward: p.ward,
                    bedNumber: p.bedNumber,
                    type: newTask.type,
                    description: newTask.description,
                    priority: newTask.priority,
                    dueAt: newTask.dueAt || new Date().toISOString(),
                  }, {
                    onSuccess: () => {
                      setShowCreate(false);
                      setNewTask({ patientId: '', description: '', type: 'vitals', priority: 'routine', dueAt: '' });
                    },
                  });
                }}
              >
                {createTask.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Task'}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <TaskGroup title="Overdue" items={overdue}  color="bg-red-500" />
      <TaskGroup title="Due Now" items={dueNow}   color="bg-amber-500" />
      <TaskGroup title="Upcoming" items={upcoming} color="bg-slate-300" />

      {tasks.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">No active tasks. Ward is clear.</div>
      )}
    </div>
  );
}

// ─── Section: Ward Round ──────────────────────────────────────────────────────
function WardRoundSection({ patients, tasks }: { patients: WardPatient[]; tasks: WardTask[] }) {
  const sorted = useMemo(() =>
    [...patients].sort((a, b) => {
      const order = { critical: 0, observation: 1, stable: 2, 'for-discharge': 3 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    }),
  [patients]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Ward Round</h3>
          <p className="text-[11px] text-slate-500">{format(new Date(), 'EEEE d MMM yyyy')} · {sorted.length} patients</p>
        </div>
      </div>
      {sorted.map(p => {
        const sb = STATUS_BADGE[p.status];
        const ptTasks = tasks.filter(t => t.patientId === p.patientId && t.status !== 'completed');
        return (
          <Card key={p.patientId} className={cn('border-l-4', p.status === 'critical' ? 'border-l-red-500' : p.status === 'observation' ? 'border-l-amber-500' : p.status === 'for-discharge' ? 'border-l-blue-500' : 'border-l-green-400')}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Bed {p.bedNumber}
                    </span>
                    <Link href={`/patients/${p.patientId}`} className="font-semibold text-sm text-slate-900 hover:text-teal-700 hover:underline">
                      {p.patientName}
                    </Link>
                    <Chip label={sb.label} colorCls={sb.cls} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {p.mrn} · {p.age}y {p.gender} · Day {p.daysAdmitted}
                  </p>
                  <p className="text-[12px] text-slate-700 mt-1 font-medium">{p.admittingDiagnosis}</p>
                </div>
                <div className="text-right shrink-0">
                  {p.news2Score !== undefined && (
                    <p className={cn('text-[11px] font-bold', p.news2Score >= 7 ? 'text-red-600' : p.news2Score >= 4 ? 'text-amber-600' : 'text-green-600')}>
                      NEWS2: {p.news2Score}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">{p.nurseAssigned}</p>
                </div>
              </div>
              {/* Indicators row */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {p.onOxygen    && <Chip label="O₂" colorCls="bg-blue-100 text-blue-700" />}
                {p.hasIVLine   && <Chip label="IV" colorCls="bg-teal-100 text-teal-700" />}
                {p.isFallRisk  && <Chip label="Fall Risk" colorCls="bg-yellow-100 text-yellow-800" />}
                {p.isIsolation && <Chip label="Isolation" colorCls="bg-purple-100 text-purple-700" />}
                {p.isNPO       && <Chip label="NPO" colorCls="bg-orange-100 text-orange-700" />}
              </div>
              {ptTasks.length > 0 && (
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-medium">Pending:</span>
                  {ptTasks.slice(0, 3).map(t => (
                    <Chip key={t.id} label={t.description} colorCls="bg-slate-100 text-slate-600" />
                  ))}
                  {ptTasks.length > 3 && <Chip label={`+${ptTasks.length - 3} more`} colorCls="bg-slate-100 text-slate-500" />}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Section: Handover ────────────────────────────────────────────────────────
function HandoverSection({ patients }: { patients: WardPatient[] }) {
  const { data: entries = [], isLoading } = useWardHandover();
  const addEntry = useAddHandoverEntry();
  const [form, setForm] = useState({ patientId: '', category: 'stable' as HandoverCategory, note: '' });
  const [showForm, setShowForm] = useState(false);

  const byCategory: Record<HandoverCategory, typeof entries> = {
    stable: entries.filter(e => e.category === 'stable'),
    'at-risk': entries.filter(e => e.category === 'at-risk'),
    critical: entries.filter(e => e.category === 'critical'),
    'pending-task': entries.filter(e => e.category === 'pending-task'),
    watchlist: entries.filter(e => e.category === 'watchlist'),
  };

  const CATEGORY_STYLES: Record<HandoverCategory, string> = {
    stable: 'bg-green-100 text-green-800',
    'at-risk': 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
    'pending-task': 'bg-blue-100 text-blue-800',
    watchlist: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Shift Handover</h3>
          <p className="text-[11px] text-slate-500">{format(new Date(), 'EEEE d MMM · HH:mm')} · {getCurrentShift()}</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white h-8" onClick={() => setShowForm(s => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Add Note
        </Button>
      </div>

      {showForm && (
        <Card className="border-teal-300 bg-teal-50">
          <CardContent className="p-3 space-y-2">
            <h4 className="text-xs font-bold text-teal-800">Add Handover Entry</h4>
            <select
              className="w-full text-xs border rounded px-2 py-1.5 bg-white"
              value={form.patientId}
              onChange={e => setForm(prev => ({ ...prev, patientId: e.target.value }))}
            >
              <option value="">Select patient…</option>
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>{p.patientName} (Bed {p.bedNumber})</option>
              ))}
            </select>
            <select
              className="w-full text-xs border rounded px-2 py-1.5 bg-white"
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value as HandoverCategory }))}
            >
              <option value="stable">Stable</option>
              <option value="at-risk">At-Risk</option>
              <option value="critical">Critical</option>
              <option value="pending-task">Pending Task</option>
              <option value="watchlist">Watchlist</option>
            </select>
            <textarea
              rows={2}
              placeholder="Handover note…"
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
              className="w-full text-xs border rounded px-2 py-1.5 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-7"
                disabled={!form.patientId || !form.note.trim() || addEntry.isPending}
                onClick={() => {
                  const p = patients.find(pt => pt.patientId === form.patientId);
                  if (!p) return;
                  addEntry.mutate({
                    patientId: p.patientId,
                    patientName: p.patientName,
                    ward: p.ward,
                    bedNumber: p.bedNumber,
                    category: form.category,
                    note: form.note,
                    addedBy: 'Current User',
                  }, { onSuccess: () => { setShowForm(false); setForm({ patientId: '', category: 'stable', note: '' }); } });
                }}
              >
                {addEntry.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">No handover entries for today. Add notes above.</div>
      ) : (
        <div className="space-y-4">
          {(Object.keys(byCategory) as HandoverCategory[]).map(cat => {
            const catEntries = byCategory[cat];
            if (catEntries.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <Chip label={cat.replace('-', ' ').toUpperCase()} colorCls={CATEGORY_STYLES[cat]} />
                  <span className="text-[11px] text-slate-500">{catEntries.length} patient{catEntries.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {catEntries.map(e => (
                    <Card key={e.id}>
                      <CardContent className="p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded">Bed {e.bedNumber}</span>
                              <span className="text-[12px] font-semibold text-slate-800">{e.patientName}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">{e.note}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 shrink-0">{e.addedBy}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section: Discharge ───────────────────────────────────────────────────────
function DischargeSection({ patients }: { patients: WardPatient[] }) {
  const updateDischarge = useUpdateDischargeStatus();
  const discharging = patients.filter(p => p.status === 'for-discharge' || p.dischargeStatus && p.dischargeStatus !== 'not-started');

  const STEP_INDEX: Record<string, number> = {
    'not-started': -1, ready: 0, 'summary-pending': 1, 'pharmacy-pending': 2, 'doctor-approval': 3, completed: 4, dama: 4, death: 4, transfer: 4,
  };

  function nextStatus(current: DischargeStatus | undefined): DischargeStatus {
    const map: Record<string, DischargeStatus> = {
      'not-started': 'ready',
      ready: 'summary-pending',
      'summary-pending': 'pharmacy-pending',
      'pharmacy-pending': 'doctor-approval',
      'doctor-approval': 'completed',
    };
    return map[current ?? 'not-started'] ?? 'completed';
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Discharge Pipeline</h3>
        <p className="text-[11px] text-slate-500">{discharging.length} patients in discharge workflow</p>
      </div>

      {/* Pipeline header */}
      <div className="hidden sm:flex items-center gap-1 overflow-x-auto pb-1">
        {DISCHARGE_STEPS.map((step, i) => (
          <React.Fragment key={step.status}>
            <div className="shrink-0 text-center">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mx-auto">
                {i + 1}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">{step.label}</p>
            </div>
            {i < DISCHARGE_STEPS.length - 1 && (
              <ArrowRight className="h-3 w-3 text-slate-300 shrink-0 mt-[-10px]" />
            )}
          </React.Fragment>
        ))}
      </div>

      {discharging.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">No patients currently in discharge workflow.</div>
      ) : (
        <div className="space-y-3">
          {discharging.map(p => {
            const currentStatus = p.dischargeStatus ?? 'ready';
            const stepIdx = STEP_INDEX[currentStatus] ?? 0;
            const isDone = ['completed', 'dama', 'death', 'transfer'].includes(currentStatus);
            return (
              <Card key={p.patientId} className="border-l-4 border-l-blue-500">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">Bed {p.bedNumber}</span>
                        <Link href={`/patients/${p.patientId}`} className="text-sm font-semibold text-slate-900 hover:text-teal-700">
                          {p.patientName}
                        </Link>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.mrn} · Day {p.daysAdmitted}</p>
                      <p className="text-[11px] text-slate-700 mt-0.5">{p.admittingDiagnosis}</p>
                    </div>
                    {!isDone && (
                      <Button
                        size="sm"
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                        disabled={updateDischarge.isPending}
                        onClick={() => updateDischarge.mutate({ encounterId: p.encounterId, status: nextStatus(p.dischargeStatus) })}
                      >
                        {updateDischarge.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                          <>Advance <ArrowRight className="h-3 w-3 ml-1" /></>
                        )}
                      </Button>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-1 mt-3">
                    {DISCHARGE_STEPS.map((step, i) => (
                      <div
                        key={step.status}
                        className={cn(
                          'flex-1 h-1.5 rounded-full transition-colors',
                          i <= stepIdx ? 'bg-blue-500' : 'bg-slate-200'
                        )}
                        title={step.label}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 capitalize">
                    {isDone ? 'Discharge complete' : `Step: ${currentStatus.replace(/-/g, ' ')}`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section: Transfers ───────────────────────────────────────────────────────
function TransfersSection({ patients }: { patients: WardPatient[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-800">Patient Transfers</h3>
      <div className="grid grid-cols-2 gap-3">
        <SnapshotCard label="Ward → ICU"    value={0} icon={TrendingUp}    color="bg-red-600" />
        <SnapshotCard label="ICU → Ward"    value={0} icon={TrendingDown}  color="bg-green-600" />
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <MoveRight className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Transfer Management</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Initiate ward transfers by opening a patient chart and selecting Transfer.
          </p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">{patients.length} patients currently admitted</p>
        </CardContent>
      </Card>
      {patients.filter(p => p.status === 'critical').length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Critical — Transfer Candidates</h4>
          {patients.filter(p => p.status === 'critical').map(p => (
            <Card key={p.patientId} className="mb-2 border-red-200">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Chip label="Critical" colorCls="bg-red-600 text-white" />
                    <span className="text-sm font-semibold text-slate-800">{p.patientName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Bed {p.bedNumber} · {p.ward} · Day {p.daysAdmitted}</p>
                </div>
                <Link href={`/patients/${p.patientId}`}>
                  <button className="text-[11px] px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium">
                    Open Chart
                  </button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: Analytics ───────────────────────────────────────────────────────
function AnalyticsSection({ patients, tasks }: { patients: WardPatient[]; tasks: WardTask[] }) {
  const totalBeds = Object.values(WARD_BED_CONFIG).reduce((a, b) => a + b, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((patients.length / totalBeds) * 100) : 0;
  const avgLOS = patients.length > 0
    ? Math.round(patients.reduce((s, p) => s + p.daysAdmitted, 0) / patients.length)
    : 0;
  const criticalCount = patients.filter(p => p.status === 'critical').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const forDischarge = patients.filter(p => p.status === 'for-discharge').length;

  const wardStats = WARD_NAMES.map(ward => {
    const admitted = patients.filter(p => p.ward === ward).length;
    const capacity = WARD_BED_CONFIG[ward] ?? 10;
    return { ward, admitted, capacity, pct: Math.round((admitted / capacity) * 100) };
  });

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-slate-800">Ward Analytics</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SnapshotCard label="Occupancy Rate"     value={`${occupancyRate}%`}  icon={BarChart2}   color="bg-teal-600" />
        <SnapshotCard label="Avg Length of Stay" value={`${avgLOS} days`}     icon={Clock}       color="bg-blue-600" />
        <SnapshotCard label="For Discharge"      value={forDischarge}          icon={LogOut}      color="bg-green-600" />
        <SnapshotCard label="Critical Patients"  value={criticalCount}         icon={AlertTriangle} color="bg-red-600" />
        <SnapshotCard label="Overdue Tasks"      value={overdueTasks}          icon={ClipboardList} color="bg-amber-500" />
        <SnapshotCard label="Total Admitted"     value={patients.length}       icon={Users}       color="bg-slate-600" />
      </div>

      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-600">Occupancy by Ward</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2.5">
          {wardStats.map(({ ward, admitted, capacity, pct }) => (
            <div key={ward} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-700 font-medium">{ward}</span>
                <span className="text-slate-500">{admitted}/{capacity} ({pct}%)</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-2 rounded-full transition-all', pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-teal-500')}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-600">Acuity Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {(['stable', 'observation', 'critical', 'for-discharge'] as const).map(s => {
            const count = patients.filter(p => p.status === s).length;
            const pct = patients.length > 0 ? Math.round((count / patients.length) * 100) : 0;
            const sb = STATUS_BADGE[s];
            return (
              <div key={s} className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
                <Chip label={sb.label} colorCls={sb.cls} />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn('h-2 rounded-full', s === 'critical' ? 'bg-red-500' : s === 'observation' ? 'bg-amber-500' : s === 'for-discharge' ? 'bg-blue-500' : 'bg-green-500')} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Alerts ─────────────────────────────────────────────────────────
function AlertsSection({
  alerts,
  acknowledgedIds,
  onAcknowledge,
}: {
  alerts: ReturnType<typeof useWardAlerts>;
  acknowledgedIds: Set<string>;
  onAcknowledge: (id: string) => void;
}) {
  const active = alerts.filter(a => !acknowledgedIds.has(a.id));
  const acked = alerts.filter(a => acknowledgedIds.has(a.id));

  const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; pill: string }> = {
    critical: { border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-800', pill: 'bg-red-600 text-white' },
    high:     { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800', pill: 'bg-orange-500 text-white' },
    warning:  { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-800', pill: 'bg-amber-500 text-white' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Ward Alerts</h3>
          <p className="text-[11px] text-slate-500">{active.length} active · {acked.length} acknowledged</p>
        </div>
        {active.length > 0 && (
          <button
            onClick={() => active.forEach(a => onAcknowledge(a.id))}
            className="text-xs px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 font-medium text-slate-600"
          >
            Acknowledge All
          </button>
        )}
      </div>

      {active.length === 0 && acked.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">No active alerts. All patients stable.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide">Active ({active.length})</h4>
          {active.map(a => {
            const s = SEVERITY_STYLES[a.severity];
            return (
              <div key={a.id} className={cn('rounded-lg border p-3', s.border, s.bg)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Chip label={a.severity.toUpperCase()} colorCls={s.pill} />
                      <span className={cn('text-sm font-semibold', s.text)}>{a.patientName}</span>
                    </div>
                    <p className={cn('text-[12px] mt-0.5', s.text)}>{a.message}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{a.ward} · Bed {a.bedNumber} · {a.mrn}</p>
                  </div>
                  <button
                    onClick={() => onAcknowledge(a.id)}
                    className="shrink-0 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 font-medium"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    ACK
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {acked.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Acknowledged ({acked.length})</h4>
          {acked.map(a => (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 opacity-60">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[12px] font-medium text-slate-600">{a.patientName}</span>
                <Chip label="ACK" colorCls="bg-green-100 text-green-700" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function WardModuleDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [showRightPanel, setShowRightPanel] = useState(true);

  const { data: allPatients = [], isLoading, refetch } = useWardData();
  const { data: tasks = [] } = useWardTasks(allPatients.map(p => p.patientId));
  const alerts = useWardAlerts(allPatients);

  // Filter by selected ward
  const patients = useMemo(() => {
    let list = selectedWard === 'all' ? allPatients : allPatients.filter(p => p.ward === selectedWard);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.patientName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.bedNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allPatients, selectedWard, search]);

  const beds = useWardBeds(allPatients, selectedWard);
  const activeAlerts = alerts.filter(a => !acknowledgedIds.has(a.id));

  const onAcknowledge = useCallback((id: string) => {
    setAcknowledgedIds(prev => new Set([...prev, id]));
  }, []);

  // Occupancy
  const totalBeds = useMemo(() => {
    if (selectedWard === 'all') return Object.values(WARD_BED_CONFIG).reduce((a, b) => a + b, 0);
    return WARD_BED_CONFIG[selectedWard] ?? 10;
  }, [selectedWard]);
  const occupancyPct = totalBeds > 0 ? Math.round((patients.length / totalBeds) * 100) : 0;

  // Badge counts for sidebar
  const SECTION_BADGES: Partial<Record<SectionId, number>> = {
    tasks: tasks.filter(t => t.status === 'overdue' || t.status === 'due').length,
    alerts: activeAlerts.length,
    discharge: patients.filter(p => p.status === 'for-discharge').length,
  };

  function renderSection() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      );
    }
    switch (activeSection) {
      case 'overview':   return <OverviewSection patients={patients} tasks={tasks} alerts={alerts} acknowledgedIds={acknowledgedIds} onAcknowledge={onAcknowledge} />;
      case 'patients':   return <PatientsSection patients={patients} />;
      case 'beds':       return <BedBoardSection beds={beds} />;
      case 'tasks':      return <TasksSection tasks={tasks} patients={patients} />;
      case 'round':      return <WardRoundSection patients={patients} tasks={tasks} />;
      case 'handover':   return <HandoverSection patients={patients} />;
      case 'discharge':  return <DischargeSection patients={patients} />;
      case 'transfers':  return <TransfersSection patients={patients} />;
      case 'analytics':  return <AnalyticsSection patients={allPatients} tasks={tasks} />;
      case 'alerts':     return <AlertsSection alerts={alerts} acknowledgedIds={acknowledgedIds} onAcknowledge={onAcknowledge} />;
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top Bar */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 flex-wrap">
        {/* Ward selector */}
        <div className="flex items-center gap-1.5">
          <BedDouble className="h-4 w-4 text-teal-600" />
          <select
            value={selectedWard}
            onChange={e => setSelectedWard(e.target.value)}
            className="text-sm font-semibold text-slate-800 border-none outline-none bg-transparent cursor-pointer pr-1"
          >
            <option value="all">All Wards</option>
            {WARD_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or bed…"
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Occupancy chip */}
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
            occupancyPct >= 90 ? 'bg-red-100 text-red-700' : occupancyPct >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
          )}>
            <Activity className="h-3 w-3" />
            {patients.length}/{totalBeds} ({occupancyPct}%)
          </div>

          {/* Shift */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-[11px] text-slate-600">
            <Clock className="h-3 w-3" />
            {getCurrentShift().split(' ')[0]}
          </div>

          {/* Alerts bell */}
          <button
            onClick={() => setActiveSection('alerts')}
            className="relative p-1.5 rounded hover:bg-slate-100"
          >
            <Bell className="h-4 w-4 text-slate-600" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button onClick={() => refetch()} className="p-1.5 rounded hover:bg-slate-100">
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {/* Toggle right panel */}
          <button
            onClick={() => setShowRightPanel(p => !p)}
            className={cn('p-1.5 rounded text-xs font-medium', showRightPanel ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100 text-slate-500')}
            title="Toggle live panel"
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <nav className="shrink-0 w-44 bg-white border-r border-slate-200 flex flex-col py-2 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const badge = SECTION_BADGES[id];
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors w-full',
                  activeSection === id
                    ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', activeSection === id ? 'text-teal-600' : 'text-slate-400')} />
                <span className="flex-1 truncate">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className={cn(
                    'shrink-0 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1',
                    id === 'alerts' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-auto pt-2 border-t border-slate-100">
            <button className="flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 w-full">
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </button>
          </div>
        </nav>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4">
          {renderSection()}
        </main>

        {/* Right Panel */}
        {showRightPanel && (
          <WardAlertsPanel
            alerts={alerts}
            patients={allPatients}
            tasks={tasks}
            acknowledgedIds={acknowledgedIds}
            onAcknowledge={onAcknowledge}
            onClose={() => setShowRightPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
