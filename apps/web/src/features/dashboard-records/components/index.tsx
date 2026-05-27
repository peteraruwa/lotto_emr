'use client';

import React from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Users, UserPlus, FolderOpen, FileText, ArrowRight, Search, UserCheck,
} from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useRecordsDashboardData } from '../hooks/use-dashboard-data';

const DOC_STATUS_STYLE: Record<string, string> = {
  final:      'bg-green-100 text-green-700',
  preliminary:'bg-amber-100 text-amber-700',
  amended:    'bg-blue-100 text-blue-700',
  entered:    'bg-gray-100 text-gray-600',
  current:    'bg-green-100 text-green-700',
  unknown:    'bg-gray-100 text-gray-500',
};

const GENDER_LABEL: Record<string, string> = {
  male: 'M', female: 'F', other: 'O', unknown: '—',
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">
            {loading ? <span className="text-gray-300">—</span> : value}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecordsDashboard() {
  const { data, isLoading } = useRecordsDashboardData();

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/patients/new">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Register Patient
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/patients/reactivate">
              <UserCheck className="h-4 w-4 mr-1.5" />
              Reactivate Patient
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/patients">
              <Search className="h-4 w-4 mr-1.5" />
              Search Records
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Patients"      value={data?.totalPatients ?? 0}    icon={Users}      color="bg-cyan-600"     loading={isLoading} />
        <StatCard label="New Patients Today"  value={data?.newPatientsToday ?? 0} icon={UserPlus}   color="bg-green-600"    loading={isLoading} />
        <StatCard label="Total Documents"     value={data?.totalDocuments ?? 0}   icon={FolderOpen} color="bg-indigo-600"   loading={isLoading} />
        <StatCard label="Documents Today"     value={data?.documentsToday ?? 0}   icon={FileText}   color="bg-amber-500"    loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent documents */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-indigo-600" />
                Recent Documents
              </CardTitle>
              <Link href="/patients" className="text-xs text-hospital-600 hover:underline flex items-center gap-1">
                All records <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (data?.recentDocuments.length ?? 0) === 0 ? (
              <div className="px-6 py-8 text-center">
                <FolderOpen className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No documents filed today.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data?.recentDocuments.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={doc.patientId ? `/patients/${doc.patientId}` : '#'}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-hospital-700">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{doc.patientName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize ${DOC_STATUS_STYLE[doc.docStatus] ?? DOC_STATUS_STYLE.unknown}`}>
                          {doc.docStatus}
                        </span>
                        <span className="text-xs text-gray-400">
                          {doc.date
                            ? formatDistanceToNow(new Date(doc.date), { addSuffix: true })
                            : '—'}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent patient registrations */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                New Registrations Today
              </CardTitle>
              <Link href="/patients" className="text-xs text-hospital-600 hover:underline flex items-center gap-1">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (data?.recentPatients.length ?? 0) === 0 ? (
              <div className="px-4 py-6 text-center">
                <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No new registrations today.</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/patients/new">
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Register patient
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data?.recentPatients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/patients/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-hospital-700">
                          {p.fullName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.mrn} · {GENDER_LABEL[p.gender] ?? '—'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {p.registeredAt
                          ? formatDistanceToNow(new Date(p.registeredAt), { addSuffix: true })
                          : '—'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
