'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft, Upload, Download, FileText, CheckCircle2,
  AlertCircle, Info, Loader2, X, Users,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { STAFF, DEPT_META } from '../data/staff-data';
import { useRosterData } from '../hooks/use-roster-data';
import { useSaveRoster } from '../hooks/use-save-roster';
import { generateCSV, parseCSV, downloadText } from '../lib/csv';
import type { ParseResult } from '../lib/csv';
import type { StoredRosterEntry } from '../types';

// ─── Staff reference card ─────────────────────────────────────────────────────

function StaffReference() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">Staff ID Reference</p>
        <span className="text-xs text-gray-400">({STAFF.length} staff members)</span>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
        {STAFF.map((s) => {
          const dm = DEPT_META[s.department];
          return (
            <div key={s.id} className="flex items-center gap-3 px-5 py-2">
              <span className="font-mono text-xs font-bold text-gray-500 w-12 flex-shrink-0">{s.id}</span>
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0', dm.badgeBg, dm.badgeText)}>
                {dm.shortLabel}
              </span>
              <span className="text-xs text-gray-700 truncate">{s.name}</span>
              <span className="text-[10px] text-gray-400 truncate hidden sm:block">{s.role}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Preview table ────────────────────────────────────────────────────────────

function PreviewTable({ entries }: { entries: StoredRosterEntry[] }) {
  // Group by date
  const byDate = entries.reduce<Record<string, StoredRosterEntry[]>>((acc, e) => {
    acc[e.date] = acc[e.date] ?? [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const dates = Object.keys(byDate).sort();

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-600">
          Preview — {entries.length} assignments across {dates.length} day{dates.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
        {dates.map((date) => {
          const dayEntries = byDate[date];
          const d = new Date(date + 'T00:00:00');
          return (
            <div key={date} className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">{format(d, 'EEE d MMM yyyy')}</p>
              <div className="flex flex-wrap gap-1.5">
                {dayEntries.map((e, i) => {
                  const dm = DEPT_META[e.department];
                  const staff = STAFF.find((s) => s.id === e.staffId);
                  return (
                    <span
                      key={i}
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full',
                        e.shift === 'morning' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700',
                      )}
                      title={`${e.shift} shift`}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dm.badgeBg.replace('bg-', 'bg-').replace('-50', '-400'))} />
                      {staff?.name.replace(/^(Dr\.|Sr\.|Bro\.|Mr\.|Ms\.)\s*/, '') ?? e.staffId}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RosterUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [importDone, setImportDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: currentRoster } = useRosterData(year, month);
  const saveRoster = useSaveRoster(year, month);

  // ── Download template ──────────────────────────────────────────────────────

  function handleDownload() {
    const entries = currentRoster ?? [];
    const csv = generateCSV(entries);
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    downloadText(`roster-template-${monthStr}.csv`, csv);
  }

  // ── File parsing ───────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setImportDone(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text);
      setParseResult(result);
    };
    reader.readAsText(file);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) processFile(file);
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!parseResult || parseResult.entries.length === 0) return;
    await saveRoster.mutateAsync(parseResult.entries);
    setImportDone(true);
  }

  const hasErrors   = (parseResult?.errors.length ?? 0) > 0;
  const hasEntries  = (parseResult?.entries.length ?? 0) > 0;
  const monthStr    = `${year}-${String(month).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Link href="/roster" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-hospital-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-hospital-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Upload Roster CSV</h1>
                <p className="text-sm text-gray-500">Import shift assignments for {format(now, 'MMMM yyyy')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Step 1 — Download template */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-hospital-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Download the template</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                The template is pre-filled with the current {monthStr} roster as a starting point.
                Open it in Excel or Google Sheets, adjust the assignments, then upload below.
              </p>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mb-4 font-mono text-xs text-gray-600 overflow-x-auto">
                <span className="text-hospital-600">date</span>
                <span className="text-gray-400">,</span>
                <span className="text-hospital-600">shift</span>
                <span className="text-gray-400">,</span>
                <span className="text-hospital-600">staffId</span>
                <span className="text-gray-400">,name,department,ward</span>
                <br />
                2026-06-01,morning,D001,"Dr. Chukwuemeka Okafor",doctors,opd
                <br />
                2026-06-01,night,N005,"Bro. Emeka Onwuegbu",nurses,ae
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500 mb-4">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-400" />
                <span>Only <strong>date</strong>, <strong>shift</strong>, and <strong>staffId</strong> are required. name/department/ward are auto-filled from staff records.</span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-hospital-700 bg-hospital-50 hover:bg-hospital-100 border border-hospital-200 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download template ({monthStr}.csv)
              </button>
            </div>
          </div>
        </div>

        {/* Step 2 — Staff reference */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-hospital-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Staff ID reference</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">Use these IDs in the staffId column of your CSV.</p>
              <StaffReference />
            </div>
          </div>
        </div>

        {/* Step 3 — Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-hospital-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Upload your CSV</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">Drag and drop your file, or click to browse.</p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  isDragging
                    ? 'border-hospital-400 bg-hospital-50'
                    : parseResult
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-gray-50 hover:border-hospital-300 hover:bg-hospital-50/30',
                )}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                {parseResult ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-hospital-500" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                      <p className="text-xs text-gray-500">{parseResult.entries.length} valid entries · click to replace</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setParseResult(null); setFileName(''); setImportDone(false); }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">Drop CSV here or <span className="text-hospital-600 underline">browse</span></p>
                    <p className="text-xs text-gray-400 mt-1">Only .csv files</p>
                  </div>
                )}
              </div>

              {/* Errors */}
              {parseResult && parseResult.errors.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700">{parseResult.errors.length} error{parseResult.errors.length !== 1 ? 's' : ''} found</p>
                  </div>
                  <ul className="space-y-1">
                    {parseResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-600 flex gap-2">
                        <span className="flex-shrink-0">·</span>{err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {parseResult && parseResult.warnings.length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">Warnings</p>
                  </div>
                  <ul className="space-y-1">
                    {parseResult.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700 flex gap-2">
                        <span className="flex-shrink-0">·</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {hasEntries && !importDone && (
                <div className="mt-4">
                  <PreviewTable entries={parseResult!.entries} />
                </div>
              )}

              {/* Success */}
              {importDone && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Roster imported successfully</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {parseResult!.entries.length} assignments saved.{' '}
                      <Link href="/roster" className="underline hover:no-underline">View roster →</Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Import button */}
              {hasEntries && !importDone && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleImport}
                    disabled={saveRoster.isPending || hasErrors}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors',
                      hasErrors
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-hospital-600 hover:bg-hospital-700 text-white',
                    )}
                  >
                    {saveRoster.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                      : <><Upload className="w-4 h-4" /> Import {parseResult!.entries.length} assignments</>
                    }
                  </button>
                  {hasErrors && (
                    <p className="text-xs text-red-500">Fix all errors before importing</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
