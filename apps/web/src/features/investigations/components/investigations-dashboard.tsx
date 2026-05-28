'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@lotto-emr/ui';
import { format, parseISO, isValid, differenceInMinutes } from 'date-fns';
import {
  LayoutDashboard,
  ClipboardList,
  FlaskConical,
  Microscope,
  Scan,
  CheckCircle,
  AlertTriangle,
  Archive,
  Wrench,
  Package,
  BarChart2,
  ClipboardCheck,
  Settings,
  ChevronRight,
  Bell,
  Search,
  Phone,
  RefreshCw,
  Loader2,
  CheckCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  Clock,
  User,
  Hash,
  Tag,
  Beaker,
} from 'lucide-react';
import { useInvestigationOrders, useCompletedOrders, useUpdateOrderStatus } from '../hooks/use-investigation-orders';
import { useRecordLabResult } from '../hooks/use-record-lab-result';
import { useRecordRadiologyReport } from '../hooks/use-record-radiology-report';
import {
  LAB_BENCH_LABELS,
  LAB_BENCH_COLORS,
  IMAGING_MODALITY_LABELS,
  IMAGING_MODALITY_COLORS,
  REJECTION_REASONS,
  LAB_PANELS,
  RADIOLOGY_TEMPLATES,
  SPECIMEN_TYPES,
} from '../constants';
import type {
  InvDept,
  InvOrder,
  OrderStatus,
  LabResultEntry,
  ShiftHandoverEntry,
  CriticalAlert,
} from '../types';
import type { RecordLabResultInput } from '../hooks/use-record-lab-result';
import type { RecordRadiologyReportInput } from '../hooks/use-record-radiology-report';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, 'HH:mm');
}

function fmtDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, 'd MMM, HH:mm');
}

function minsAgo(iso: string | undefined): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  const mins = differenceInMinutes(new Date(), d);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

const PRIORITY_BORDER: Record<string, string> = {
  stat:    'border-l-4 border-l-red-500',
  urgent:  'border-l-4 border-l-orange-400',
  routine: 'border-l-4 border-l-slate-300',
};

const STATUS_PILL: Record<OrderStatus, string> = {
  pending:    'bg-amber-100 text-amber-700',
  accepted:   'bg-blue-100 text-blue-700',
  collecting: 'bg-cyan-100 text-cyan-700',
  collected:  'bg-teal-100 text-teal-700',
  received:   'bg-sky-100 text-sky-700',
  processing: 'bg-violet-100 text-violet-700',
  imaging:    'bg-indigo-100 text-indigo-700',
  verifying:  'bg-yellow-100 text-yellow-700',
  verified:   'bg-lime-100 text-lime-700',
  released:   'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Pending',
  accepted:   'Accepted',
  collecting: 'Collecting',
  collected:  'Collected',
  received:   'Received',
  processing: 'Processing',
  imaging:    'Imaging',
  verifying:  'Verifying',
  verified:   'Verified',
  released:   'Released',
  rejected:   'Rejected',
};

// ─── sidebar sections ─────────────────────────────────────────────────────────

type SectionId =
  | 'overview' | 'orders' | 'specimen' | 'bench' | 'worklist'
  | 'verification' | 'critical' | 'archive' | 'equipment'
  | 'inventory' | 'analytics' | 'handover' | 'settings';

interface SidebarSection {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  deptOnly?: InvDept;
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: 'overview',      label: 'Overview',          icon: LayoutDashboard },
  { id: 'orders',        label: 'Orders Queue',       icon: ClipboardList },
  { id: 'specimen',      label: 'Specimen Tracking',  icon: FlaskConical,   deptOnly: 'lab' },
  { id: 'bench',         label: 'Lab Bench',          icon: Microscope,     deptOnly: 'lab' },
  { id: 'worklist',      label: 'Imaging Worklist',   icon: Scan,           deptOnly: 'radiology' },
  { id: 'verification',  label: 'Verification',       icon: CheckCircle },
  { id: 'critical',      label: 'Critical Results',   icon: AlertTriangle },
  { id: 'archive',       label: 'Reports Archive',    icon: Archive },
  { id: 'equipment',     label: 'Equipment & QC',     icon: Wrench },
  { id: 'inventory',     label: 'Inventory',          icon: Package },
  { id: 'analytics',     label: 'Analytics',          icon: BarChart2 },
  { id: 'handover',      label: 'Shift Handover',     icon: ClipboardCheck },
  { id: 'settings',      label: 'Settings',           icon: Settings },
];

// ─── sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_PILL[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === 'stat'   ? 'bg-red-600 text-white' :
    priority === 'urgent' ? 'bg-orange-500 text-white' :
                            'bg-slate-200 text-slate-700';
  return (
    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide', cls)}>
      {priority}
    </span>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {desc && <p className="text-xs text-slate-400 max-w-xs">{desc}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: InvOrder;
  dept: InvDept;
  expanded: boolean;
  onToggleExpand: () => void;
  showActions?: ('accept' | 'collect' | 'reject' | 'updateStatus' | 'enterResult' | 'notify')[];
}

function OrderCard({ order, dept, expanded, onToggleExpand, showActions = [] }: OrderCardProps) {
  const updateStatus = useUpdateOrderStatus();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  const handleAccept = () => updateStatus.mutate({ orderId: order.id, status: 'accepted' });
  const handleCollect = () => updateStatus.mutate({ orderId: order.id, status: 'collected' });
  const handleProcess = () => updateStatus.mutate({ orderId: order.id, status: 'processing' });
  const handleVerify = () => updateStatus.mutate({ orderId: order.id, status: 'verifying' });
  const handleReject = () => {
    updateStatus.mutate({ orderId: order.id, status: 'rejected', rejectionReason: rejectReason, notes: rejectNotes });
    setRejectOpen(false);
  };

  const benchOrModality = dept === 'lab'
    ? (order.bench ? (
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', LAB_BENCH_COLORS[order.bench])}>
          {LAB_BENCH_LABELS[order.bench]}
        </span>
      ) : null)
    : (order.modality ? (
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', IMAGING_MODALITY_COLORS[order.modality])}>
          {IMAGING_MODALITY_LABELS[order.modality]}
        </span>
      ) : null);

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-slate-200',
      PRIORITY_BORDER[order.priority],
      order.isCritical && 'ring-2 ring-red-400',
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={order.priority} />
              <StatusPill status={order.status} />
              {order.isCritical && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> CRITICAL
                </span>
              )}
            </div>
            <p className="mt-1.5 font-semibold text-slate-900 text-sm leading-tight">{order.testName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {order.patientName}</span>
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {order.mrn}</span>
              {order.ward && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {order.ward}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {minsAgo(order.orderedAt)}</span>
              {order.requester && <span>Req: {order.requester}</span>}
            </div>
            {order.clinicalIndication && (
              <p className="mt-1 text-xs text-slate-500 italic">Indication: {order.clinicalIndication}</p>
            )}
            {benchOrModality && <div className="mt-2">{benchOrModality}</div>}
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap">{fmtTime(order.orderedAt)}</div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {showActions.includes('accept') && order.status === 'pending' && (
            <button
              onClick={handleAccept}
              disabled={updateStatus.isPending}
              className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              Accept
            </button>
          )}
          {showActions.includes('collect') && (order.status === 'accepted' || order.status === 'collecting') && dept === 'lab' && (
            <button
              onClick={handleCollect}
              disabled={updateStatus.isPending}
              className="text-xs px-3 py-1.5 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 font-medium"
            >
              Mark Collected
            </button>
          )}
          {showActions.includes('updateStatus') && (order.status === 'collected' || order.status === 'received') && dept === 'lab' && (
            <button
              onClick={handleProcess}
              disabled={updateStatus.isPending}
              className="text-xs px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 font-medium"
            >
              Start Processing
            </button>
          )}
          {showActions.includes('updateStatus') && order.status === 'processing' && (
            <button
              onClick={handleVerify}
              disabled={updateStatus.isPending}
              className="text-xs px-3 py-1.5 rounded bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 font-medium"
            >
              Ready for Verification
            </button>
          )}
          {showActions.includes('enterResult') && (order.status === 'accepted' || order.status === 'processing' || order.status === 'verifying' || order.status === 'received') && (
            <button
              onClick={onToggleExpand}
              className={cn(
                'text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1',
                expanded
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              )}
            >
              {expanded ? <><ChevronUp className="h-3 w-3" /> Hide Form</> : <><FileText className="h-3 w-3" /> Enter Result</>}
            </button>
          )}
          {showActions.includes('reject') && (order.status === 'pending' || order.status === 'accepted' || order.status === 'collected') && (
            <button
              onClick={() => setRejectOpen(v => !v)}
              className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium"
            >
              Reject
            </button>
          )}
          {showActions.includes('notify') && order.isCritical && (
            <button
              className="text-xs px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 font-medium flex items-center gap-1"
            >
              <Phone className="h-3 w-3" /> Notify Doctor
            </button>
          )}
        </div>

        {/* Reject form */}
        {rejectOpen && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
            <select
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full text-xs border border-red-200 rounded px-2 py-1.5 bg-white"
            >
              <option value="">Select reason...</option>
              {Object.entries(REJECTION_REASONS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <textarea
              placeholder="Additional notes..."
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              rows={2}
              className="w-full text-xs border border-red-200 rounded px-2 py-1.5 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!rejectReason || updateStatus.isPending}
                className="text-xs px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectOpen(false)}
                className="text-xs px-3 py-1.5 rounded bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {updateStatus.isError && (
          <p className="mt-2 text-xs text-red-500">Error updating status. Please try again.</p>
        )}
      </div>
    </div>
  );
}

// ─── Lab Result Entry Form ────────────────────────────────────────────────────

function LabResultForm({ order, onClose }: { order: InvOrder; onClose: () => void }) {
  const recordResult = useRecordLabResult();
  const panelKeys = Object.keys(LAB_PANELS);

  // Detect panel from test name
  const detectedPanel = panelKeys.find(k =>
    order.testName.toLowerCase().includes(k.toLowerCase()) ||
    LAB_PANELS[k].label.toLowerCase().includes(order.testName.toLowerCase())
  ) ?? panelKeys[0];

  const [selectedPanel, setSelectedPanel] = useState(detectedPanel);
  const panel = LAB_PANELS[selectedPanel];

  const [entries, setEntries] = useState<LabResultEntry[]>(() =>
    panel.analytes.map(a => ({
      analyte: a.name,
      value: '',
      unit: a.unit,
      referenceRange: a.refRange,
      interpretation: 'normal' as const,
    }))
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handlePanelChange = (pk: string) => {
    setSelectedPanel(pk);
    const p = LAB_PANELS[pk];
    setEntries(p.analytes.map(a => ({
      analyte: a.name,
      value: '',
      unit: a.unit,
      referenceRange: a.refRange,
      interpretation: 'normal' as const,
    })));
  };

  const updateEntry = (idx: number, field: keyof LabResultEntry, val: string) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  };

  const handleSubmit = async (verify: boolean) => {
    setError('');
    const filled = entries.filter(e => e.value.trim());
    if (!filled.length) { setError('Enter at least one result value.'); return; }
    try {
      await recordResult.mutateAsync({
        orderId: order.id,
        patientId: order.patientId,
        encounterId: order.encounterId,
        testName: `${panel.label} — ${order.patientName}`,
        entries: filled,
        notes,
        verify,
      } as RecordLabResultInput);
      onClose();
    } catch (e) {
      setError('Failed to save result. Please try again.');
    }
  };

  const interpColors: Record<string, string> = {
    normal:        'text-slate-700',
    low:           'text-blue-600',
    high:          'text-orange-600',
    'critical-low':  'text-red-700 font-bold',
    'critical-high': 'text-red-700 font-bold',
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Result Entry — {order.patientName}</p>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Panel selector */}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Test Panel</label>
        <select
          value={selectedPanel}
          onChange={e => handlePanelChange(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white w-full max-w-xs"
        >
          {panelKeys.map(pk => (
            <option key={pk} value={pk}>{LAB_PANELS[pk].label}</option>
          ))}
        </select>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-slate-600 min-w-[180px]">Analyte</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 w-28">Value</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 w-24">Unit</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 min-w-[160px]">Reference Range</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 w-36">Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {entries.map((entry, idx) => (
              <tr key={entry.analyte} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-700 font-medium">{entry.analyte}</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={entry.value}
                    onChange={e => updateEntry(idx, 'value', e.target.value)}
                    placeholder="—"
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2 text-slate-500">{entry.unit || '—'}</td>
                <td className="px-3 py-2 text-slate-500">{entry.referenceRange}</td>
                <td className="px-3 py-2">
                  <select
                    value={entry.interpretation}
                    onChange={e => updateEntry(idx, 'interpretation', e.target.value)}
                    className={cn(
                      'w-full border border-slate-300 rounded px-1 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500',
                      interpColors[entry.interpretation]
                    )}
                  >
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="critical-low">Critical Low</option>
                    <option value="critical-high">Critical High</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Notes / Comments</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes..."
          className="w-full text-xs border border-slate-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(false)}
          disabled={recordResult.isPending}
          className="text-xs px-4 py-2 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 font-medium flex items-center gap-1"
        >
          {recordResult.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Save Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={recordResult.isPending}
          className="text-xs px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-1"
        >
          {recordResult.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          <CheckCheck className="h-3 w-3" /> Verify &amp; Release
        </button>
        <button onClick={onClose} className="text-xs px-4 py-2 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Radiology Report Form ────────────────────────────────────────────────────

function RadiologyReportForm({ order, onClose }: { order: InvOrder; onClose: () => void }) {
  const recordReport = useRecordRadiologyReport();
  const templateKeys = Object.keys(RADIOLOGY_TEMPLATES);

  const detectedTemplate = templateKeys.find(k =>
    order.testName.toLowerCase().includes(k.replace(/-/g, ' ')) ||
    RADIOLOGY_TEMPLATES[k].label.toLowerCase().includes(order.testName.toLowerCase().slice(0, 8))
  ) ?? templateKeys[0];

  const [selectedTemplate, setSelectedTemplate] = useState(detectedTemplate);
  const [findings, setFindings] = useState(RADIOLOGY_TEMPLATES[detectedTemplate].findingsTemplate);
  const [impression, setImpression] = useState(RADIOLOGY_TEMPLATES[detectedTemplate].impressionTemplate);
  const [isCritical, setIsCritical] = useState(false);
  const [notes, setNotes] = useState('');
  const [radiologistName, setRadiologistName] = useState('');
  const [error, setError] = useState('');

  const handleTemplateChange = (tk: string) => {
    setSelectedTemplate(tk);
    setFindings(RADIOLOGY_TEMPLATES[tk].findingsTemplate);
    setImpression(RADIOLOGY_TEMPLATES[tk].impressionTemplate);
  };

  const handleSubmit = async (verify: boolean) => {
    setError('');
    if (!findings.trim() || !impression.trim()) {
      setError('Findings and Impression are required.');
      return;
    }
    try {
      await recordReport.mutateAsync({
        orderId: order.id,
        patientId: order.patientId,
        encounterId: order.encounterId,
        studyType: order.testName,
        modality: order.modality ?? 'x-ray',
        findings,
        impression,
        isCritical,
        verify,
        notes,
        radiologistName,
      } as RecordRadiologyReportInput);
      onClose();
    } catch (e) {
      setError('Failed to save report. Please try again.');
    }
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Radiology Report — {order.patientName}</p>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Template selector */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 block mb-1">Report Template</label>
          <select
            value={selectedTemplate}
            onChange={e => handleTemplateChange(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white w-full"
          >
            {templateKeys.map(tk => (
              <option key={tk} value={tk}>{RADIOLOGY_TEMPLATES[tk].label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 block mb-1">Reporting Radiologist</label>
          <input
            type="text"
            value={radiologistName}
            onChange={e => setRadiologistName(e.target.value)}
            placeholder="Dr. Name"
            className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white w-full"
          />
        </div>
      </div>

      {/* Findings */}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Findings</label>
        <textarea
          value={findings}
          onChange={e => setFindings(e.target.value)}
          rows={10}
          className="w-full text-xs border border-slate-300 rounded px-3 py-2 resize-y font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Impression */}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Impression</label>
        <textarea
          value={impression}
          onChange={e => setImpression(e.target.value)}
          rows={3}
          className="w-full text-xs border border-slate-300 rounded px-3 py-2 resize-y font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Notes + Critical flag */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 block mb-1">Additional Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full text-xs border border-slate-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div className="flex items-start pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCritical}
              onChange={e => setIsCritical(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-xs font-medium text-red-600">Critical Finding</span>
          </label>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(false)}
          disabled={recordReport.isPending}
          className="text-xs px-4 py-2 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 font-medium flex items-center gap-1"
        >
          {recordReport.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Save Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={recordReport.isPending}
          className="text-xs px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center gap-1"
        >
          {recordReport.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          <CheckCheck className="h-3 w-3" /> Verify &amp; Release
        </button>
        <button onClick={onClose} className="text-xs px-4 py-2 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Orders Section (5 tabs) ──────────────────────────────────────────────────

type OrderTab = 'pending' | 'inprogress' | 'results' | 'critical' | 'completed';

function OrdersSection({ orders, completedOrders, loading, dept }: {
  orders: InvOrder[];
  completedOrders: InvOrder[];
  loading: boolean;
  dept: InvDept;
}) {
  const [tab, setTab] = useState<OrderTab>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const pending     = orders.filter(o => o.status === 'pending');
  const inProgress  = orders.filter(o => ['accepted','collecting','collected','received','processing','imaging'].includes(o.status));
  const forResult   = orders.filter(o => ['accepted','processing','verifying','received','imaging'].includes(o.status));
  const criticals   = orders.filter(o => o.isCritical);
  const verifying   = orders.filter(o => o.status === 'verifying');

  const TABS: { id: OrderTab; label: string; count?: number }[] = [
    { id: 'pending',    label: 'Pending',       count: pending.length },
    { id: 'inprogress', label: 'In Progress',   count: inProgress.length },
    { id: 'results',    label: 'Results Entry', count: forResult.length },
    { id: 'critical',   label: 'Critical',      count: criticals.length },
    { id: 'completed',  label: 'Completed',     count: completedOrders.length },
  ];

  function renderList(list: InvOrder[], actions: OrderCardProps['showActions']) {
    if (loading) return <Spinner />;
    if (!list.length) return <EmptyState icon={ClipboardList} title="No orders in this category" desc="Orders will appear here as they are received." />;
    return (
      <div className="space-y-3">
        {list.map(order => (
          <div key={order.id}>
            <OrderCard
              order={order}
              dept={dept}
              expanded={expandedId === order.id}
              onToggleExpand={() => toggleExpand(order.id)}
              showActions={actions}
            />
            {expandedId === order.id && (
              dept === 'lab'
                ? <LabResultForm order={order} onClose={() => setExpandedId(null)} />
                : <RadiologyReportForm order={order} onClose={() => setExpandedId(null)} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setExpandedId(null); }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? dept === 'lab'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
              t.id === 'critical' && t.count && t.count > 0 && 'text-red-600'
            )}
          >
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span className={cn(
                'text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[1.25rem] text-center',
                t.id === 'critical' ? 'bg-red-600 text-white' :
                tab === t.id
                  ? dept === 'lab' ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'pending'    && renderList(pending,       ['accept', 'reject'])}
        {tab === 'inprogress' && renderList(inProgress,    ['collect', 'updateStatus', 'reject'])}
        {tab === 'results'    && renderList(forResult,     ['enterResult'])}
        {tab === 'critical'   && renderList(criticals,     ['notify', 'enterResult'])}
        {tab === 'completed'  && renderList(completedOrders, [])}
      </div>

      {/* Verifying notice at bottom */}
      {verifying.length > 0 && tab !== 'results' && (
        <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-2 flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" />
          <p className="text-xs text-amber-700 font-medium">
            {verifying.length} order{verifying.length > 1 ? 's' : ''} awaiting verification
          </p>
          <button onClick={() => setTab('results')} className="text-xs text-amber-700 underline ml-1">View</button>
        </div>
      )}
    </div>
  );
}

// ─── Overview Section ─────────────────────────────────────────────────────────

function OverviewSection({ orders, completedOrders, dept }: {
  orders: InvOrder[];
  completedOrders: InvOrder[];
  dept: InvDept;
}) {
  const pending    = orders.filter(o => o.status === 'pending').length;
  const inProgress = orders.filter(o => ['accepted','collecting','collected','received','processing','imaging'].includes(o.status)).length;
  const criticals  = orders.filter(o => o.isCritical).length;
  const done       = completedOrders.length;

  const accentColor = dept === 'lab' ? 'blue' : 'violet';

  const cards = [
    { label: 'Pending Orders',   value: pending,    color: 'amber',   icon: ClipboardList },
    { label: 'In Progress',      value: inProgress, color: accentColor, icon: Activity },
    { label: 'Critical Alerts',  value: criticals,  color: 'red',     icon: AlertTriangle },
    { label: 'Completed Today',  value: done,        color: 'green',   icon: CheckCheck },
  ];

  const colorMap: Record<string, string> = {
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    green:  'bg-green-50 border-green-200 text-green-700',
  };
  const iconColorMap: Record<string, string> = {
    amber:  'text-amber-500', blue: 'text-blue-500', violet: 'text-violet-500', red: 'text-red-500', green: 'text-green-500',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className={cn('rounded-xl border p-4 flex flex-col gap-2', colorMap[card.color])}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-80">{card.label}</span>
              <card.icon className={cn('h-5 w-5', iconColorMap[card.color])} />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Orders</h3>
        {orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No active orders" desc="New orders will appear here when received." />
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 8).map(o => (
              <div key={o.id} className={cn(
                'flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200',
                PRIORITY_BORDER[o.priority]
              )}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{o.testName}</p>
                  <p className="text-xs text-slate-500">{o.patientName} · {o.mrn}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={o.priority} />
                  <StatusPill status={o.status} />
                  <span className="text-xs text-slate-400">{fmtTime(o.orderedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Specimen Tracking ────────────────────────────────────────────────────────

function SpecimenSection({ orders, loading }: { orders: InvOrder[]; loading: boolean }) {
  const [scanId, setScanId] = useState('');
  const updateStatus = useUpdateOrderStatus();

  const handleScanIn = (orderId: string) => {
    if (!scanId.trim()) return;
    updateStatus.mutate({ orderId, status: 'received', specimenId: scanId.trim() });
    setScanId('');
  };

  if (loading) return <Spinner />;

  const specimenOrders = orders.filter(o =>
    ['pending','accepted','collecting','collected','received','processing'].includes(o.status)
  );

  return (
    <div className="p-6 space-y-4">
      {/* Scan-in form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Specimen Scan-In</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={scanId}
            onChange={e => setScanId(e.target.value)}
            placeholder="Scan or enter specimen barcode / accession number"
            className="flex-1 text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={!scanId.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Scan In
          </button>
        </div>
      </div>

      {/* Specimen table */}
      {specimenOrders.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No specimens in queue" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Patient</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Test</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Ordered</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Specimen ID</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {specimenOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{o.patientName}</p>
                    <p className="text-xs text-slate-500">{o.mrn}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{o.testName}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={o.priority} /></td>
                  <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(o.orderedAt)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{o.specimenId ?? '—'}</td>
                  <td className="px-4 py-3">
                    {o.status === 'collected' && (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="Barcode"
                          className="w-24 text-xs border border-slate-300 rounded px-2 py-1"
                          onKeyDown={e => { if (e.key === 'Enter') handleScanIn(o.id); }}
                          onChange={e => setScanId(e.target.value)}
                          value={scanId}
                        />
                        <button
                          onClick={() => handleScanIn(o.id)}
                          className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Receive
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Lab Bench Section ────────────────────────────────────────────────────────

function BenchSection({ orders, loading }: { orders: InvOrder[]; loading: boolean }) {
  if (loading) return <Spinner />;

  const byBench = orders.reduce<Record<string, InvOrder[]>>((acc, o) => {
    const bench = o.bench ?? 'chemistry';
    if (!acc[bench]) acc[bench] = [];
    acc[bench].push(o);
    return acc;
  }, {});

  if (!Object.keys(byBench).length) {
    return <EmptyState icon={Microscope} title="No orders in the lab" desc="Orders assigned to bench sections will appear here." />;
  }

  return (
    <div className="p-6 space-y-6">
      {Object.entries(byBench).map(([bench, benchOrders]) => (
        <div key={bench}>
          <div className="flex items-center gap-3 mb-3">
            <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', LAB_BENCH_COLORS[bench as keyof typeof LAB_BENCH_COLORS])}>
              {LAB_BENCH_LABELS[bench as keyof typeof LAB_BENCH_LABELS] ?? bench}
            </span>
            <span className="text-xs text-slate-500">{benchOrders.length} order{benchOrders.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {benchOrders.map(o => (
              <div key={o.id} className={cn(
                'bg-white rounded-lg border border-slate-200 p-3',
                PRIORITY_BORDER[o.priority]
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.testName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{o.patientName} · {o.mrn}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge priority={o.priority} />
                    <StatusPill status={o.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{minsAgo(o.orderedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Imaging Worklist ─────────────────────────────────────────────────────────

function WorklistSection({ orders, loading }: { orders: InvOrder[]; loading: boolean }) {
  if (loading) return <Spinner />;

  const byModality = orders.reduce<Record<string, InvOrder[]>>((acc, o) => {
    const mod = o.modality ?? 'x-ray';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(o);
    return acc;
  }, {});

  if (!Object.keys(byModality).length) {
    return <EmptyState icon={Scan} title="No imaging studies in worklist" desc="Accepted imaging orders will appear here grouped by modality." />;
  }

  return (
    <div className="p-6 space-y-6">
      {Object.entries(byModality).map(([mod, modalityOrders]) => (
        <div key={mod}>
          <div className="flex items-center gap-3 mb-3">
            <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', IMAGING_MODALITY_COLORS[mod as keyof typeof IMAGING_MODALITY_COLORS])}>
              {IMAGING_MODALITY_LABELS[mod as keyof typeof IMAGING_MODALITY_LABELS] ?? mod}
            </span>
            <span className="text-xs text-slate-500">{modalityOrders.length} study/studies</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {modalityOrders.map(o => (
              <div key={o.id} className={cn(
                'bg-white rounded-lg border border-slate-200 p-3',
                PRIORITY_BORDER[o.priority]
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.testName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{o.patientName} · {o.mrn}</p>
                    {o.clinicalIndication && (
                      <p className="text-xs text-slate-400 italic mt-0.5">Indication: {o.clinicalIndication}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge priority={o.priority} />
                    <StatusPill status={o.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{minsAgo(o.orderedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Verification Section ─────────────────────────────────────────────────────

function VerificationSection({ orders, loading, dept }: { orders: InvOrder[]; loading: boolean; dept: InvDept }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const verifying = orders.filter(o => o.status === 'verifying');

  if (loading) return <Spinner />;
  if (!verifying.length) {
    return <EmptyState icon={CheckCircle} title="No orders awaiting verification" desc="Orders marked for verification will appear here." />;
  }

  return (
    <div className="p-6 space-y-3">
      <p className="text-sm text-slate-600 font-medium">{verifying.length} order{verifying.length !== 1 ? 's' : ''} awaiting verification</p>
      {verifying.map(order => (
        <div key={order.id}>
          <OrderCard
            order={order}
            dept={dept}
            expanded={expandedId === order.id}
            onToggleExpand={() => setExpandedId(prev => prev === order.id ? null : order.id)}
            showActions={['enterResult']}
          />
          {expandedId === order.id && (
            dept === 'lab'
              ? <LabResultForm order={order} onClose={() => setExpandedId(null)} />
              : <RadiologyReportForm order={order} onClose={() => setExpandedId(null)} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Critical Section ─────────────────────────────────────────────────────────

function CriticalSection({ orders, loading }: { orders: InvOrder[]; loading: boolean }) {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const criticals = orders.filter(o => o.isCritical);

  if (loading) return <Spinner />;
  if (!criticals.length) {
    return <EmptyState icon={AlertTriangle} title="No critical alerts" desc="Critical values will be highlighted here when detected." />;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="text-sm font-semibold text-red-700">{criticals.length} Critical Alert{criticals.length !== 1 ? 's' : ''}</h3>
      </div>
      {criticals.map(o => (
        <div
          key={o.id}
          className={cn(
            'bg-white rounded-xl border-2 p-4',
            acknowledged.has(o.id) ? 'border-green-300 opacity-70' : 'border-red-400'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm font-bold text-red-700">CRITICAL VALUE</p>
                <PriorityBadge priority={o.priority} />
              </div>
              <p className="text-sm font-semibold text-slate-800">{o.testName}</p>
              <p className="text-xs text-slate-600 mt-0.5">{o.patientName} · MRN: {o.mrn} {o.ward ? `· ${o.ward}` : ''}</p>
              <p className="text-xs text-slate-500 mt-1">Ordered: {fmtDateTime(o.orderedAt)}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {!acknowledged.has(o.id) && (
                <>
                  <button className="text-xs px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Notify Doctor
                  </button>
                  <button
                    onClick={() => setAcknowledged(prev => new Set([...prev, o.id]))}
                    className="text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="h-3 w-3" /> Acknowledge
                  </button>
                </>
              )}
              {acknowledged.has(o.id) && (
                <span className="text-xs px-3 py-1.5 rounded bg-green-100 text-green-700 font-medium flex items-center gap-1">
                  <CheckCheck className="h-3 w-3" /> Acknowledged
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Archive Section ──────────────────────────────────────────────────────────

function ArchiveSection({ completedOrders, loading }: { completedOrders: InvOrder[]; loading: boolean }) {
  if (loading) return <Spinner />;
  if (!completedOrders.length) {
    return <EmptyState icon={Archive} title="No completed reports" desc="Completed and released reports will appear here." />;
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Test</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Ordered</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {completedOrders.map(o => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{o.patientName}</p>
                  <p className="text-xs text-slate-500">{o.mrn}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{o.testName}</td>
                <td className="px-4 py-3"><PriorityBadge priority={o.priority} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(o.orderedAt)}</td>
                <td className="px-4 py-3"><StatusPill status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Equipment Section ────────────────────────────────────────────────────────

function EquipmentSection() {
  const mockEquipment = [
    { name: 'Hematology Analyzer (Sysmex XN-550)', status: 'operational', lastQC: '2026-05-28T06:00:00Z' },
    { name: 'Chemistry Analyzer (Cobas c311)',      status: 'operational', lastQC: '2026-05-28T06:00:00Z' },
    { name: 'Coagulation Analyzer (Stago STA-R)',   status: 'maintenance', lastQC: '2026-05-27T18:00:00Z' },
    { name: 'Blood Culture System (BACTEC FX)',     status: 'operational', lastQC: '2026-05-28T07:00:00Z' },
    { name: 'X-Ray Unit (Carestream DR 7500)',       status: 'operational', lastQC: '2026-05-28T08:00:00Z' },
    { name: 'Ultrasound (GE Logiq S8)',              status: 'operational', lastQC: '2026-05-28T08:30:00Z' },
  ];

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Equipment Status & QC Log</h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Equipment</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Last QC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockEquipment.map(eq => (
              <tr key={eq.name} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{eq.name}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    eq.status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    {eq.status === 'operational' ? 'Operational' : 'Maintenance'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(eq.lastQC)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inventory Section ────────────────────────────────────────────────────────

function InventorySection() {
  const reagents = [
    { name: 'EDTA Tubes (3 mL)',          stock: 450, min: 100, unit: 'tubes'   },
    { name: 'SST Tubes (5 mL)',            stock: 280, min: 100, unit: 'tubes'   },
    { name: 'Citrate Tubes (2.7 mL)',     stock: 120, min: 50,  unit: 'tubes'   },
    { name: 'CBC Reagent Kit',            stock: 8,   min: 5,   unit: 'kits'    },
    { name: 'Malaria RDT Kits',           stock: 45,  min: 20,  unit: 'tests'   },
    { name: 'HIV Test Kits (Determine)',  stock: 30,  min: 20,  unit: 'tests'   },
    { name: 'Ultrasound Gel',             stock: 6,   min: 3,   unit: 'bottles' },
    { name: 'X-Ray Films (35x43 cm)',     stock: 80,  min: 30,  unit: 'sheets'  },
  ];

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Reagents & Consumables Inventory</h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Item</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Min</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reagents.map(r => {
              const low = r.stock < r.min;
              const critical = r.stock < r.min * 0.5;
              return (
                <tr key={r.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                  <td className="px-4 py-3 text-slate-700">{r.stock} {r.unit}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">Min: {r.min}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      critical ? 'bg-red-100 text-red-700' :
                      low      ? 'bg-amber-100 text-amber-700' :
                                 'bg-green-100 text-green-700'
                    )}>
                      {critical ? 'Critical' : low ? 'Low' : 'Adequate'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Analytics Section ────────────────────────────────────────────────────────

function AnalyticsSection({ orders, completedOrders }: { orders: InvOrder[]; completedOrders: InvOrder[] }) {
  const total = orders.length + completedOrders.length;
  const pending = orders.filter(o => o.status === 'pending').length;
  const rejected = orders.filter(o => o.status === 'rejected').length;
  const critical = orders.filter(o => o.isCritical).length;
  const stat = orders.filter(o => o.priority === 'stat').length;

  const metrics = [
    { label: 'Total Orders (Active + Done)', value: total,             unit: '' },
    { label: 'Active Backlog',               value: orders.length,     unit: '' },
    { label: 'Completed Today',              value: completedOrders.length, unit: '' },
    { label: 'Pending Acceptance',           value: pending,           unit: '' },
    { label: 'Rejected Specimens',           value: rejected,          unit: '' },
    { label: 'Critical Values',             value: critical,          unit: '' },
    { label: 'STAT Orders',                  value: stat,              unit: '' },
    { label: 'Avg Turnaround (est.)',        value: 45,                unit: 'min' },
    { label: 'Critical Response Time (est.)', value: 12,               unit: 'min' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-sm font-semibold text-slate-700">Department Analytics</h3>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-2">{m.label}</p>
            <p className="text-2xl font-bold text-slate-800">
              {m.value}{m.unit && <span className="text-sm font-normal text-slate-500 ml-1">{m.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Throughput by hour — simplified bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-medium text-slate-600 mb-3">Hourly Order Distribution (Today)</p>
        <div className="flex items-end gap-1 h-16">
          {[3,5,8,12,9,7,11,14,10,8,6,4].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-blue-400 rounded-t"
                style={{ height: `${(v / 14) * 100}%` }}
              />
              <span className="text-[9px] text-slate-400">{(6 + i) % 24}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shift Handover Section ───────────────────────────────────────────────────

function HandoverSection() {
  const [entries, setEntries] = useState<ShiftHandoverEntry[]>([]);
  const [form, setForm] = useState({
    category: 'pending-urgent' as ShiftHandoverEntry['category'],
    description: '',
    priority: 'info' as ShiftHandoverEntry['priority'],
  });

  const handleAdd = () => {
    if (!form.description.trim()) return;
    const entry: ShiftHandoverEntry = {
      id: Date.now().toString(),
      ...form,
      at: new Date().toISOString(),
      by: 'Current User',
    };
    setEntries(prev => [entry, ...prev]);
    setForm({ category: 'pending-urgent', description: '', priority: 'info' });
  };

  const CATEGORIES: Record<ShiftHandoverEntry['category'], string> = {
    'pending-urgent':    'Pending Urgent',
    'machine-downtime':  'Machine Downtime',
    'delayed-report':    'Delayed Report',
    'critical-pending':  'Critical Pending',
    'reagent-shortage':  'Reagent Shortage',
    'equipment-issue':   'Equipment Issue',
    'other':             'Other',
  };

  const priorityColors: Record<ShiftHandoverEntry['priority'], string> = {
    info:     'bg-blue-50 border-blue-200 text-blue-700',
    warning:  'bg-amber-50 border-amber-200 text-amber-700',
    critical: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-sm font-semibold text-slate-700">Shift Handover Notes</h3>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-slate-600 block mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as ShiftHandoverEntry['category'] }))}
              className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white w-full"
            >
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="text-xs font-medium text-slate-600 block mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as ShiftHandoverEntry['priority'] }))}
              className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white w-full"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Describe the issue or handover item..."
            className="w-full text-xs border border-slate-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!form.description.trim()}
          className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          Add Handover Note
        </button>
      </div>

      {/* Log */}
      {entries.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No handover notes yet" desc="Add notes above to document shift handover items." />
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className={cn('rounded-xl border p-4', priorityColors[entry.priority])}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide">{CATEGORIES[entry.category]}</span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium',
                      entry.priority === 'critical' ? 'bg-red-600 text-white' :
                      entry.priority === 'warning'  ? 'bg-amber-500 text-white' :
                                                       'bg-blue-500 text-white'
                    )}>
                      {entry.priority}
                    </span>
                  </div>
                  <p className="text-sm">{entry.description}</p>
                </div>
                <p className="text-xs opacity-60 shrink-0">{fmtDateTime(entry.at)}</p>
              </div>
              <p className="text-xs opacity-60 mt-1">By: {entry.by}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({ dept }: { dept: InvDept }) {
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">
        {dept === 'lab' ? 'Laboratory' : 'Radiology'} Department Settings
      </h3>
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500 space-y-3">
        <p className="font-medium text-slate-700">Configuration options</p>
        <ul className="space-y-2 text-xs list-disc list-inside">
          <li>Critical value thresholds and notification recipients</li>
          <li>Turnaround time targets by priority and test type</li>
          <li>Default bench / modality assignments</li>
          <li>Report templates and header information</li>
          <li>Accession number prefix configuration</li>
          <li>Shift schedule and on-call radiologist assignment</li>
          <li>Integration settings (LIS / RIS / PACS)</li>
          <li>Printer and label configuration</li>
        </ul>
        <p className="text-xs text-slate-400 italic pt-2">Settings configuration is managed by your system administrator.</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

interface InvestigationsDashboardProps {
  dept: InvDept;
}

export function InvestigationsDashboard({ dept: initialDept }: InvestigationsDashboardProps) {
  const [dept, setDept] = useState<InvDept>(initialDept);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: orders = [], isLoading: ordersLoading, refetch } = useInvestigationOrders(dept);
  const { data: completedOrders = [], isLoading: completedLoading } = useCompletedOrders(dept);

  const loading = ordersLoading;

  // Filter orders by search
  const filteredOrders = searchQuery
    ? orders.filter(o =>
        o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.testName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  const criticalCount = orders.filter(o => o.isCritical).length;
  const pendingCount  = orders.filter(o => o.status === 'pending').length;
  const verifyCount   = orders.filter(o => o.status === 'verifying').length;

  const sections = SIDEBAR_SECTIONS.filter(s => !s.deptOnly || s.deptOnly === dept);

  const accentClass = dept === 'lab'
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-violet-600 hover:bg-violet-700 text-white';

  const sectionAccent = dept === 'lab' ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white';

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-12 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-4 z-20">
        {/* Dept toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => { setDept('lab'); setActiveSection('overview'); }}
            className={cn('px-3 py-1 rounded-md text-sm font-medium transition-colors', dept === 'lab' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-800')}
          >
            Laboratory
          </button>
          <button
            onClick={() => { setDept('radiology'); setActiveSection('overview'); }}
            className={cn('px-3 py-1 rounded-md text-sm font-medium transition-colors', dept === 'radiology' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:text-slate-800')}
          >
            Radiology
          </button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patient, MRN, test…"
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
          />
        </div>

        <div className="flex-1" />

        {/* Critical alerts badge */}
        {criticalCount > 0 && (
          <button
            onClick={() => setActiveSection('critical')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold animate-pulse hover:animate-none"
          >
            <Bell className="h-3.5 w-3.5" />
            {criticalCount} Critical
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Shift indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Day Shift · {format(new Date(), 'HH:mm')}</span>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-10">
          <div className="px-3 py-4 shrink-0">
            <div className="flex items-center gap-2 px-2">
              <div className={cn('h-6 w-6 rounded-md flex items-center justify-center', dept === 'lab' ? 'bg-blue-100' : 'bg-violet-100')}>
                {dept === 'lab'
                  ? <Microscope className="h-3.5 w-3.5 text-blue-600" />
                  : <Scan className="h-3.5 w-3.5 text-violet-600" />
                }
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {dept === 'lab' ? 'Laboratory' : 'Radiology'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Investigations</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 pb-4 space-y-0.5">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const badge =
                section.id === 'orders'       ? pendingCount :
                section.id === 'verification' ? verifyCount :
                section.id === 'critical'     ? criticalCount :
                null;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? cn('text-white', sectionAccent)
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate text-xs">{section.label}</span>
                  {badge != null && badge > 0 && (
                    <span className={cn(
                      'text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[1.2rem] text-center',
                      isActive ? 'bg-white/30 text-white' :
                      section.id === 'critical' ? 'bg-red-600 text-white' :
                      'bg-slate-200 text-slate-600'
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Section header */}
          <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
            {(() => {
              const sec = sections.find(s => s.id === activeSection);
              const Icon = sec?.icon ?? LayoutDashboard;
              return (
                <>
                  <Icon className={cn('h-5 w-5', dept === 'lab' ? 'text-blue-600' : 'text-violet-600')} />
                  <h2 className="text-sm font-semibold text-slate-800">{sec?.label ?? 'Overview'}</h2>
                  {searchQuery && activeSection === 'orders' && (
                    <span className="text-xs text-slate-500">· Showing results for "{searchQuery}"</span>
                  )}
                </>
              );
            })()}
          </div>

          {/* Section content */}
          <div className="flex-1 overflow-hidden">
            {activeSection === 'overview' && (
              <div className="h-full overflow-y-auto">
                <OverviewSection orders={filteredOrders} completedOrders={completedOrders} dept={dept} />
              </div>
            )}

            {activeSection === 'orders' && (
              <div className="h-full flex flex-col overflow-hidden">
                <OrdersSection
                  orders={filteredOrders}
                  completedOrders={completedOrders}
                  loading={loading}
                  dept={dept}
                />
              </div>
            )}

            {activeSection === 'specimen' && dept === 'lab' && (
              <div className="h-full overflow-y-auto">
                <SpecimenSection orders={filteredOrders} loading={loading} />
              </div>
            )}

            {activeSection === 'bench' && dept === 'lab' && (
              <div className="h-full overflow-y-auto">
                <BenchSection orders={filteredOrders} loading={loading} />
              </div>
            )}

            {activeSection === 'worklist' && dept === 'radiology' && (
              <div className="h-full overflow-y-auto">
                <WorklistSection orders={filteredOrders} loading={loading} />
              </div>
            )}

            {activeSection === 'verification' && (
              <div className="h-full overflow-y-auto">
                <VerificationSection orders={filteredOrders} loading={loading} dept={dept} />
              </div>
            )}

            {activeSection === 'critical' && (
              <div className="h-full overflow-y-auto">
                <CriticalSection orders={orders} loading={loading} />
              </div>
            )}

            {activeSection === 'archive' && (
              <div className="h-full overflow-y-auto">
                <ArchiveSection completedOrders={completedOrders} loading={completedLoading} />
              </div>
            )}

            {activeSection === 'equipment' && (
              <div className="h-full overflow-y-auto">
                <EquipmentSection />
              </div>
            )}

            {activeSection === 'inventory' && (
              <div className="h-full overflow-y-auto">
                <InventorySection />
              </div>
            )}

            {activeSection === 'analytics' && (
              <div className="h-full overflow-y-auto">
                <AnalyticsSection orders={orders} completedOrders={completedOrders} />
              </div>
            )}

            {activeSection === 'handover' && (
              <div className="h-full overflow-y-auto">
                <HandoverSection />
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="h-full overflow-y-auto">
                <SettingsSection dept={dept} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
