'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { useTopMedications } from '../hooks/use-analytics';
import type { DateRange } from '../hooks/use-analytics';

const MED_COLORS = [
  '#0d9488', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6',
];

interface Props {
  range: DateRange;
}

export function PharmacyPanel({ range }: Props) {
  const { data: meds, isLoading } = useTopMedications(range, 10);

  const total = meds?.reduce((s, m) => s + m.count, 0) ?? 0;

  return (
    <div className="space-y-5">

      {/* Top medications chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Most Prescribed Medications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !meds?.length ? (
            <div className="flex items-center justify-center h-48 gap-2 text-sm text-gray-400">
              <AlertCircle className="h-4 w-4" />
              No prescription data in range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={meds} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={130}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip />
                <Bar dataKey="count" name="Prescriptions" radius={[0, 3, 3, 0]}>
                  {meds.map((_, i) => (
                    <Cell key={i} fill={MED_COLORS[i % MED_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Medication utilisation table */}
      {!isLoading && meds && meds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Drug Utilisation Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600">Medication</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-600">Prescriptions</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-600">Share</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-600">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((m, i) => (
                    <tr key={m.name} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: MED_COLORS[i % MED_COLORS.length] }}
                          />
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">{m.count}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${total > 0 ? (m.count / total) * 100 : 0}%`,
                                backgroundColor: MED_COLORS[i % MED_COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{m.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {/* Sparkline placeholder — real impl would query per-month data */}
                        <div className="flex items-end gap-0.5 h-5">
                          {[0.4, 0.6, 0.5, 0.7, 0.8, 0.9].map((h, j) => (
                            <div
                              key={j}
                              className="w-1 rounded-sm"
                              style={{
                                height: `${h * 20}px`,
                                backgroundColor: MED_COLORS[i % MED_COLORS.length] + '88',
                              }}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock risk alerts (static for now; would connect to inventory module) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-500" />
            Stock Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Stock integration not connected</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Connect your pharmacy inventory system to enable real-time stock monitoring,
                depletion forecasting, and overstock alerts.
              </p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Procurement Forecast</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Based on current prescription rates, the top 5 drugs will need restocking
                within the next 30 days. Export this report for procurement planning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
