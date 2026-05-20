'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserPlus, Search, Users } from 'lucide-react';
import { Badge, Button, Card, CardContent, Input } from '@lotto-emr/ui';
import { useEmployees } from '../api/use-employees';

const ROLE_VARIANT: Record<string, 'active' | 'pending' | 'stable' | 'default'> = {
  doctor:      'active',
  nurse:       'stable',
  pharmacist:  'pending',
  lab:         'default',
  radiologist: 'default',
  admin:       'default',
  superadmin:  'default',
};

const ROLE_LABEL: Record<string, string> = {
  doctor:      'Doctor',
  nurse:       'Nurse',
  pharmacist:  'Pharmacist',
  lab:         'Lab Tech',
  radiologist: 'Radiologist',
  admin:       'Admin',
  superadmin:  'Super Admin',
};

export function EmployeeList() {
  const { data: employees, isLoading, error } = useEmployees();
  const [search, setSearch] = useState('');

  const filtered = (employees ?? []).filter((e) => {
    const q = search.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.staffId.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.jobTitle.toLowerCase().includes(q) ||
      e.loginEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, staff ID, department…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild size="sm">
          <Link href="/hr/new">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Register Employee
          </Link>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading employees…</div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">Failed to load employees.</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No employees match your search.' : 'No employees registered yet.'}
              </p>
              {!search && (
                <Button asChild size="sm" className="mt-3">
                  <Link href="/hr/new"><UserPlus className="h-3.5 w-3.5 mr-1" />Register first employee</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {['Staff ID', 'Name', 'Department', 'Job Title', 'System Role', 'Login Email', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.staffId}</td>
                      <td className="px-4 py-3">
                        <Link href={`/hr/${emp.id}`} className="font-medium text-hospital-700 hover:underline">
                          {emp.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.jobTitle}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_VARIANT[emp.systemRole] ?? 'default'} className="text-xs">
                          {ROLE_LABEL[emp.systemRole] ?? emp.systemRole}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{emp.loginEmail}</td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.active ? 'stable' : 'cancelled'} className="text-xs">
                          {emp.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
