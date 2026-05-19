'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import { useResults } from '../api/use-results';
import { ResultDetail } from './result-detail';
import type { ResultListItem } from '../types';

const CRITICALITY_VARIANT: Record<string, 'critical' | 'destructive' | 'pending' | 'stable' | 'default'> = {
  'critical-high': 'critical',
  'critical-low': 'critical',
  high: 'destructive',
  low: 'pending',
  normal: 'stable',
};

interface ResultsListProps {
  patientId?: string;
}

export function ResultsList({ patientId }: ResultsListProps) {
  const [selectedResult, setSelectedResult] = useState<ResultListItem | null>(null);
  const { data: results = [], isLoading, error } = useResults({ patientId });

  const criticalCount = results.filter(
    (r) => r.criticality === 'critical-high' || r.criticality === 'critical-low'
  ).length;

  return (
    <div className="space-y-4">
      {criticalCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {criticalCount} critical value{criticalCount !== 1 ? 's' : ''} require immediate attention
          </p>
        </div>
      )}

      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <ResultDetail
              result={selectedResult}
              onClose={() => setSelectedResult(null)}
            />
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="clinical-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Value</th>
              <th>Reference Range</th>
              <th>Status</th>
              <th>Performed</th>
              <th>Performer</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading results...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-destructive">
                  Failed to load results.
                </td>
              </tr>
            )}
            {!isLoading && results.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No results available.
                </td>
              </tr>
            )}
            {results.map((result) => (
              <tr
                key={result.id}
                className={`cursor-pointer ${
                  result.criticality === 'critical-high' || result.criticality === 'critical-low'
                    ? 'bg-red-50'
                    : ''
                }`}
                onClick={() => setSelectedResult(result)}
              >
                <td>
                  <div className="flex items-center gap-2">
                    {(result.criticality === 'critical-high' || result.criticality === 'critical-low') && (
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  {result.loincCode && (
                    <span className="text-xs font-mono text-gray-400">{result.loincCode}</span>
                  )}
                </td>
                <td>
                  <span
                    className={
                      result.criticality === 'critical-high' || result.criticality === 'critical-low'
                        ? 'critical-value'
                        : ''
                    }
                  >
                    {result.value}
                  </span>
                </td>
                <td className="text-muted-foreground text-xs">{result.referenceRange ?? '—'}</td>
                <td>
                  <Badge
                    variant={CRITICALITY_VARIANT[result.criticality] ?? 'default'}
                    className="text-xs"
                  >
                    {result.criticality === 'normal' ? 'Normal' : result.criticality.replace('-', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td>{formatDateTime(result.effectiveDate)}</td>
                <td>{result.performerName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
