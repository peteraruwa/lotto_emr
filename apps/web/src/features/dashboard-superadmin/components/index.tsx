'use client';

import React from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Users, UserPlus, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useSuperadminDashboardData } from '../hooks/use-dashboard-data';

const ROLE_LABEL: Record<string, string> = {
  doctor: 'Doctor', nurse: 'Nurse', pharmacist: 'Pharmacist',
  lab: 'Lab Tech', radiologist: 'Radiologist', admin: 'Admin', superadmin: 'Super Admin',
};
const ROLE_COLORS: Record<string, string> = {
  doctor: 'bg-blue-100 text-blue-800', nurse: 'bg-teal-100 text-teal-800',
  pharmacist: 'bg-purple-100 text-purple-800', lab: 'bg-amber-100 text-amber-800',
  radiologist: 'bg-indigo-100 text-indigo-800', admin: 'bg-gray-100 text-gray-700',
  superadmin: 'bg-red-100 text-red-800',
};

export function SuperadminDashboard() {
  const { data, isLoading } = useSuperadminDashboardData();

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR &amp; System Administration</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/hr/new">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Register Employee
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/hr">
              <Users className="h-4 w-4 mr-1.5" />
              All Employees
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff',           value: data?.totalEmployees,     icon: Users,      color: 'bg-hospital-600' },
          { label: 'New Hires This Month',  value: data?.newHiresThisMonth,  icon: UserPlus,   color: 'bg-green-600'    },
          { label: 'Registered Patients',   value: data?.totalPatients,      icon: Activity,   color: 'bg-purple-600'   },
          { label: "Today's Registrations", value: data?.todayRegistrations, icon: ShieldCheck, color: 'bg-amber-500'   },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.color} flex-shrink-0`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? '—' : (s.value ?? 0)}</p>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent hires */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                Recently Registered Staff
              </CardTitle>
              <Link href="/hr" className="text-xs text-hospital-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (data?.recentHires.length ?? 0) === 0 ? (
              <div className="px-6 py-8 text-center">
                <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No employees registered yet.</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/hr/new"><UserPlus className="h-3.5 w-3.5 mr-1" />Register first employee</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {['Name', 'Department', 'Role', 'Registered'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data?.recentHires.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <Link href={`/hr/${e.id}`} className="font-medium text-hospital-700 hover:underline">{e.fullName}</Link>
                          <p className="text-xs text-gray-400">{e.jobTitle}</p>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{e.department}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[e.systemRole] ?? 'bg-gray-100 text-gray-700'}`}>
                            {ROLE_LABEL[e.systemRole] ?? e.systemRole}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">
                          {e.hiredAt ? formatDistanceToNow(new Date(e.hiredAt), { addSuffix: true }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-hospital-600" />
              Staff by Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (data?.roleBreakdown.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              data?.roleBreakdown.map(({ role, count }) => (
                <div key={role} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABEL[role] ?? role}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-hospital-400 rounded-full"
                        style={{ width: `${Math.min(100, (count / (data?.totalEmployees || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
