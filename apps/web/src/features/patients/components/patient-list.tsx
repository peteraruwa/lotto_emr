'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Input, Badge } from '@lotto-emr/ui';
import { RequireRole } from '@/shared/rbac';
import { usePatients } from '../api/use-patients';
import { formatDate } from '@/shared/lib/utils';

const PAGE_SIZE = 25;

/**
 * Patient list table with search, pagination, and role-aware edit actions.
 */
export function PatientList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Simple debounce via onBlur / enter key
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      setDebouncedSearch(search);
      setPage(0);
    }
  }

  const { data: patients = [], isLoading, error } = usePatients({
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or MRN... (press Enter)"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <RequireRole roles={['admin', 'doctor', 'nurse']}>
          <Button asChild size="sm">
            <Link href="/patients/new">
              <Plus className="h-4 w-4 mr-1" />
              Register Patient
            </Link>
          </Button>
        </RequireRole>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="clinical-table">
          <thead>
            <tr>
              <th>MRN</th>
              <th>Name</th>
              <th>DOB</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Conditions</th>
              <th>Allergies</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading patients...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-destructive">
                  Failed to load patients. Please try again.
                </td>
              </tr>
            )}
            {!isLoading && patients.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  No patients found.
                </td>
              </tr>
            )}
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  <span className="font-mono text-xs text-gray-500">{patient.mrn}</span>
                </td>
                <td>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="font-medium text-hospital-700 hover:underline"
                  >
                    {patient.fullName}
                  </Link>
                </td>
                <td>{formatDate(patient.dateOfBirth)}</td>
                <td>
                  <span className="capitalize">{patient.gender}</span>
                </td>
                <td>{patient.phone ?? '—'}</td>
                <td>
                  {patient.activeConditionsCount > 0 ? (
                    <Badge variant="active">{patient.activeConditionsCount}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td>
                  {patient.allergiesCount > 0 ? (
                    <Badge variant="destructive">{patient.allergiesCount}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/patients/${patient.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page + 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={patients.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
