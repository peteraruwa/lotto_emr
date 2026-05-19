'use client';

import React from 'react';
import { AlertTriangle, Info, AlertCircle, ExternalLink } from 'lucide-react';
import type { CDSCard, CDSIndicator } from '../types';

const INDICATOR_CONFIG: Record<
  CDSIndicator,
  { icon: React.ElementType; bgColor: string; borderColor: string; textColor: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
    iconColor: 'text-amber-500',
  },
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
  },
};

interface CDSCardComponentProps {
  card: CDSCard;
}

/**
 * CDS Card component. Renders a single CDS Hooks card with indicator color coding,
 * summary, detail, and action links.
 */
export function CDSCardComponent({ card }: CDSCardComponentProps) {
  const config = INDICATOR_CONFIG[card.indicator] ?? INDICATOR_CONFIG.info;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${config.textColor}`}>{card.summary}</p>
        {card.detail && (
          <p className={`text-xs mt-0.5 ${config.textColor} opacity-80`}>{card.detail}</p>
        )}
        {card.links && card.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {card.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs underline ${config.textColor} hover:opacity-70`}
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">Source: {card.source.label}</p>
      </div>
    </div>
  );
}
