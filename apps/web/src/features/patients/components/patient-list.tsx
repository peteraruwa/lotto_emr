'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronLeft, ChevronRight, Users, AlertTriangle, Activity } from 'lucide-react';
import { Button, Input } from '@lotto-emr/ui';
import { cn } from '@lotto-emr/ui';
import { RequireRole } from '@/shared/rbac';
import { usePatients } from '../api/use-patients';
import { formatDate } from '@/shared/lib/utils';

const PAGE_SIZE = 25;

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3.5 w-40 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-2.5 w-28 rounded-full bg-gray-100 animate-pulse" />
      </div>
      <div className="hidden sm:flex gap-2">
        <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-6 w-12 rounded-full bg-gray-100 animate-pulse" />
      </div>
      <div className="h-7 w-14 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
    </div>
  );
}

export function PatientList({ initialSearch = '' }: { initialSearch?: string }) {
  const [search, setSearch]               = useState(initialSearch);
  const [page, setPage]                   = useState(0);
  const [debouncedSearch, setDebounced]   = useState(initialSearch);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { setDebounced(search); setPage(0); }
  }
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault(); setDebounced(search); setPage(0);
  }

  const { data: patients = [], isLoading, error } = usePatients({
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by name or MRN…"
              className="pl-9 h-9 rounded-xl bg-gray-100 border-transparent focus:border-hospital-300 focus:bg-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </form>

        <RequireRole roles={['admin']}>
          <Button asChild size="sm" className="h-9 rounded-xl font-semibold shadow-sm shadow-hospital-600/20 flex-shrink-0">
            <Link href="/patients/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Register Patient
            </Link>
          </Button>
        </RequireRole>
      </div>

      {/* Patient cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header row */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">DOB / Gender</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conditions</span>
          <span />
        </div>

        {/* Loading */}
        {isLoading && (
          <div>{[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}</div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Failed to load patients</p>
            <p className="text-xs text-gray-400 mt-1">Please try again or contact support</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && patients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">No patients found</p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Register a patient to get started'}
            </p>
          </div>
        )}

        {/* Rows */}
        {!isLoading && patients.map((patient) => {
          const ini = patient.fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
          const isMale = patient.gender?.toLowerCase() === 'male';

          return (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              className="block border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors group"
            >
              {/* Mobile layout */}
              <div className="flex items-center gap-3 px-4 py-3 sm:hidden">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700',
                )}>
                  {ini}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-hospital-700 transition-colors">
                    {patient.fullName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {patient.mrn} · {formatDate(patient.dateOfBirth)}
                  </p>
                </div>
                {patient.allergiesCount > 0 && (
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5">
                {/* Patient */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700',
                  )}>
                    {ini}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-hospital-700 transition-colors leading-tight">
                      {patient.fullName}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono truncate">{patient.mrn}</p>
                  </div>
                </div>

                {/* DOB / Gender */}
                <div className="min-w-0">
                  <p className="text-xs text-gray-700 truncate">{formatDate(patient.dateOfBirth)}</p>
                  <p className="text-[11px] text-gray-400 capitalize">{patient.gender}</p>
                </div>

                {/* Phone */}
                <p className="text-xs text-gray-600 truncate">{patient.phone ?? '—'}</p>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {patient.activeConditionsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                      <Activity className="h-2.5 w-2.5" />{patient.activeConditionsCount}
                    </span>
                  )}
                  {patient.allergiesCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold">
                      <AlertTriangle className="h-2.5 w-2.5" />{patient.allergiesCount}
                    </span>
                  )}
                  {patient.activeConditionsCount === 0 && patient.allergiesCount === 0 && (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

                {/* Action */}
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 group-hover:bg-hospital-600 group-hover:text-white transition-all flex-shrink-0">
                  View
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {isLoading ? 'Loading…' : `Page ${page + 1}`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="h-8 rounded-lg text-xs gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={patients.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 rounded-lg text-xs gap-1"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
