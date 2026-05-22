'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Bell, Info, Sparkles, Cake } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  type: 'tip' | 'reminder' | 'birthday' | 'info';
  text: string;
  priority?: boolean;
}

const ANNOUNCEMENTS: Announcement[] = [
  { id: '1', type: 'reminder',  text: 'Reminder: Complete ward round notes before end of shift.',     priority: true },
  { id: '2', type: 'tip',       text: 'EMR Tip: Use templates to speed up clinical documentation.' },
  { id: '3', type: 'info',      text: `Today is ${format(new Date(), 'd MMMM yyyy')}. Have a productive day!` },
  { id: '4', type: 'reminder',  text: 'Quality Check: Ensure all medication orders are signed before handover.' },
  { id: '5', type: 'tip',       text: 'EMR Tip: AI Assist is available on all clinical notes to expand and structure content.' },
  { id: '6', type: 'reminder',  text: 'NHIA Update: Remember to attach insurance pre-authorisation to elective procedure orders.' },
  { id: '7', type: 'tip',       text: 'EMR Tip: Use the ICD-10 search in the Assessment tab to find diagnostic codes quickly.' },
];

const TYPE_STYLE: Record<Announcement['type'], { icon: React.ElementType; cls: string; label: string }> = {
  tip:      { icon: Sparkles, cls: 'bg-blue-50 text-blue-700 border-blue-200',    label: 'Tip' },
  reminder: { icon: Bell,     cls: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Reminder' },
  birthday: { icon: Cake,     cls: 'bg-pink-50 text-pink-700 border-pink-200',     label: 'Birthday' },
  info:     { icon: Info,     cls: 'bg-gray-50 text-gray-600 border-gray-200',     label: 'Info' },
};

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setIdx((i) => (i + 1) % ANNOUNCEMENTS.length);
  }, []);

  useEffect(() => {
    if (paused || dismissed) return;
    const t = setInterval(advance, 6000);
    return () => clearInterval(t);
  }, [paused, dismissed, advance]);

  if (dismissed) return null;

  const item = ANNOUNCEMENTS[idx];
  const cfg  = TYPE_STYLE[item.type];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b text-sm flex-shrink-0',
        cfg.cls,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left: icon + label */}
      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
        {item.priority && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="font-bold hidden sm:inline text-xs uppercase tracking-wide">{cfg.label}</span>
      </div>

      {/* Message — full text, wraps naturally */}
      <p className="flex-1 min-w-0 font-medium leading-relaxed">{item.text}</p>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => setIdx((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
          className="p-1 rounded hover:bg-black/10 transition-colors"
          title="Previous"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs tabular-nums opacity-70">{idx + 1}/{ANNOUNCEMENTS.length}</span>
        <button
          type="button"
          onClick={advance}
          className="p-1 rounded hover:bg-black/10 transition-colors"
          title="Next"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-black/10 transition-colors ml-0.5"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
