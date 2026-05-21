'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useMonthlyVolume, useTopDiagnoses, useDepartmentLoad } from '../hooks/use-analytics';
import type { DateRange } from '../hooks/use-analytics';

function PanelLoading() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

function PanelEmpty({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center h-48 gap-2 text-sm text-gray-400">
      <AlertCircle className="h-4 w-4" />
      {msg}
    </div>
  );
}

interface Props {
  range: DateRange;
}

export function ClinicalPanel({ range }: Props) {
  const { data: monthly, isLoading: mLoading } = useMonthlyVolume(6);
  const { data: diagnoses, isLoading: dLoading } = useTopDiagnoses(range, 10);
  const { data: deptLoad, isLoading: deptLoading } = useDepartmentLoad(range);

  return (
    <div className="space-y-5">

      {/* Patient volume trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Patient Volume — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          {mLoading ? <PanelLoading /> :
            !monthly?.length ? <PanelEmpty msg="No encounter data available" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="encounters" name="Encounters" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="patients" name="New Patients" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top 10 Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            {dLoading ? <PanelLoading /> :
              !diagnoses?.length ? <PanelEmpty msg="No diagnosis data" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={diagnoses.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="display"
                      tick={{ fontSize: 10 }}
                      width={120}
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                    />
                    <Tooltip />
                    <Bar dataKey="count" name="Cases" fill="#0d9488" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        {/* Department workload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Department Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {deptLoading ? <PanelLoading /> :
              !deptLoad?.length ? <PanelEmpty msg="No department data" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={deptLoad}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="department"
                      tick={{ fontSize: 10 }}
                      width={100}
                      tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                    />
                    <Tooltip />
                    <Bar dataKey="count" name="Encounters" fill="#6366f1" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>
      </div>

      {/* Diagnosis table */}
      {!dLoading && diagnoses && diagnoses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Diagnosis Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Rank</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Diagnosis</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Code</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs">Cases</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnoses.map((d, i) => {
                    const total = diagnoses.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0';
                    return (
                      <tr key={d.code} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-2 text-gray-900">{d.display}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{d.code}</td>
                        <td className="px-4 py-2 text-right font-semibold">{d.count}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
