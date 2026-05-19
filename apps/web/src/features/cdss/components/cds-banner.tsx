'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePatientViewCards } from '../api/use-cds-cards';
import { CDSCardComponent } from './cds-card';

interface CDSBannerProps {
  patientId: string;
}

/**
 * Renders all active CDS cards for the current patient.
 * Critical and warning cards are shown by default; info cards can be collapsed.
 */
export function CDSBanner({ patientId }: CDSBannerProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { data: cards = [], isLoading } = usePatientViewCards(patientId);

  if (isLoading || cards.length === 0) return null;

  const criticalCards = cards.filter((c) => c.indicator === 'critical');
  const warningCards = cards.filter((c) => c.indicator === 'warning');
  const infoCards = cards.filter((c) => c.indicator === 'info');

  const priorityCards = [...criticalCards, ...warningCards];

  return (
    <div className="space-y-2">
      {/* Critical and warning cards always visible */}
      {priorityCards.map((card) => (
        <CDSCardComponent key={card.uuid} card={card} />
      ))}

      {/* Info cards collapsible */}
      {infoCards.length > 0 && (
        <div>
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {showInfo ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {infoCards.length} informational alert{infoCards.length !== 1 ? 's' : ''}
          </button>
          {showInfo && (
            <div className="mt-2 space-y-2">
              {infoCards.map((card) => (
                <CDSCardComponent key={card.uuid} card={card} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
