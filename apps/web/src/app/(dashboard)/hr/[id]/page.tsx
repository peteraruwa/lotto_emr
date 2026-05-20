'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building2, CalendarDays, ShieldCheck } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useEmployees } from '@/features/hr/api/use-employees';

const ROLE_LABEL: Record<string, string> = {
  doctor:'Doctor', nurse:'Nurse', pharmacist:'Pharmacist', lab:'Lab Tech',
  radiologist:'Radiologist', admin:'Admin', superadmin:'Super Admin',
};

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { data: employees, isLoading } = useEmployees();
  const emp = employees?.find((e) => e.id === params.id);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!emp) {
    return <div className="p-6 text-sm text-destructive">Employee not found.</div>;
  }

  return (
    <div className="max-w-2xl space-y-4 p-4 md:p-6">
      <Link href="/hr" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Employees
      </Link>

      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-hospital-100 text-hospital-700 text-lg font-bold flex items-center justify-center flex-shrink-0">
              {emp.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{emp.fullName}</h1>
              <p className="text-sm text-gray-500">{emp.jobTitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={emp.active ? 'stable' : 'cancelled'} className="text-xs">
                  {emp.active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                  {emp.staffId}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wide">Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Building2 className="h-4 w-4 text-gray-400" />
              {emp.department}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              Joined: {emp.dateOfEmployment || '—'}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck className="h-4 w-4 text-gray-400" />
              {ROLE_LABEL[emp.systemRole] ?? emp.systemRole}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wide">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{emp.loginEmail || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              {emp.phone || '—'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
