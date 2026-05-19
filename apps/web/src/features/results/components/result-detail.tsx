'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Badge, Button } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import type { ResultListItem } from '../types';

interface ResultDetailProps {
  result: ResultListItem;
  onClose: () => void;
}

export function ResultDetail({ result, onClose }: ResultDetailProps) {
  const isCritical =
    result.criticality === 'critical-high' || result.criticality === 'critical-low';

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{result.name}</h2>
          {result.loincCode && (
            <p className="text-xs font-mono text-gray-400">LOINC: {result.loincCode}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isCritical && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <p className="text-sm font-bold text-red-700">
            CRITICAL VALUE — Immediate clinical action required
          </p>
        </div>
      )}

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b">
          <dt className="font-medium text-gray-500">Result</dt>
          <dd>
            <span className={isCritical ? 'critical-value text-base font-bold' : 'font-semibold text-base'}>
              {result.value}
            </span>
          </dd>
        </div>

        {result.referenceRange && (
          <div className="flex justify-between py-2 border-b">
            <dt className="font-medium text-gray-500">Reference Range</dt>
            <dd className="text-gray-700">{result.referenceRange}</dd>
          </div>
        )}

        <div className="flex justify-between py-2 border-b">
          <dt className="font-medium text-gray-500">Criticality</dt>
          <dd>
            <Badge
              variant={
                isCritical
                  ? 'critical'
                  : result.criticality === 'normal'
                  ? 'stable'
                  : result.criticality === 'high' || result.criticality === 'low'
                  ? 'destructive'
                  : 'default'
              }
              className="capitalize"
            >
              {result.criticality.replace('-', ' ')}
            </Badge>
          </dd>
        </div>

        <div className="flex justify-between py-2 border-b">
          <dt className="font-medium text-gray-500">Status</dt>
          <dd className="capitalize">{result.status}</dd>
        </div>

        <div className="flex justify-between py-2 border-b">
          <dt className="font-medium text-gray-500">Date / Time</dt>
          <dd>{formatDateTime(result.effectiveDate)}</dd>
        </div>

        {result.performerName && (
          <div className="flex justify-between py-2 border-b">
            <dt className="font-medium text-gray-500">Performed By</dt>
            <dd>{result.performerName}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
