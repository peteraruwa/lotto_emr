'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@lotto-emr/ui';

// ── Mockup components ──────────────────────────────────────────────────────────
// Defined BEFORE SLIDES so component references are valid when the array is built.

function Bar({ w, h = 'h-2', opacity = 'opacity-30' }: { w: string; h?: string; opacity?: string }) {
  return <div className={cn('rounded-full bg-white', w, h, opacity)} />;
}

function StatusDot({ color }: { color: string }) {
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', color)} />;
}

function QueueMockup() {
  const rows = [
    { name: 'Chukwuemeka Okafor',  time: '09:00', status: 'In Room',  color: 'bg-emerald-400', badge: 'bg-emerald-400/20 text-emerald-300' },
    { name: 'Adaeze Nwosu',        time: '09:30', status: 'Waiting',  color: 'bg-amber-400',   badge: 'bg-amber-400/20 text-amber-300'   },
    { name: 'Babatunde Adeyemi',   time: '10:00', status: 'Waiting',  color: 'bg-amber-400',   badge: 'bg-amber-400/20 text-amber-300'   },
    { name: 'Ngozi Eze',           time: '10:30', status: 'Done',     color: 'bg-white/20',    badge: 'bg-white/10 text-white/40'        },
    { name: 'Ifeoma Okonkwo',      time: '11:00', status: 'Waiting',  color: 'bg-amber-400',   badge: 'bg-amber-400/20 text-amber-300'   },
  ];
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div className="w-5 h-5 rounded-lg bg-white/20" />
        <Bar w="w-32" h="h-2.5" opacity="opacity-60" />
        <div className="ml-auto">
          <div className="px-2 py-0.5 rounded-lg bg-white/20 text-white/60 text-[10px] font-semibold">12 patients</div>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 px-4 py-2.5">
            <div className={cn('w-7 h-7 rounded-xl flex-shrink-0', r.badge.includes('white') ? 'bg-white/10' : 'bg-white/20')} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{r.name}</p>
              <p className="text-white/40 text-[10px]">{r.time}</p>
            </div>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1', r.badge)}>
              <StatusDot color={r.color} />{r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesMockup() {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex gap-1 px-3 py-2 border-b border-white/10 bg-white/5">
        {['Subjective', 'Objective', 'Assessment', 'Plan'].map((t, i) => (
          <div key={t} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-semibold', i === 1 ? 'bg-white/20 text-white' : 'text-white/40')}>
            {t}
          </div>
        ))}
      </div>
      <div className="p-4 space-y-3">
        {[
          { label: 'Examination Findings', lines: [28, 36, 20] },
          { label: 'Vital Signs',          lines: [16, 22]     },
        ].map((sec) => (
          <div key={sec.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-md bg-white/20" />
              <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">{sec.label}</p>
            </div>
            <div className="space-y-1.5">
              {sec.lines.map((w, i) => <Bar key={i} w={`w-${w}`} opacity="opacity-20" />)}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 border border-white/20">
          <div className="w-4 h-4 rounded-full bg-white/40 animate-pulse" />
          <p className="text-white/80 text-[10px] font-semibold">Generate AI narrative…</p>
        </div>
      </div>
    </div>
  );
}

function OrdersMockup() {
  const tests = [
    { name: 'Full Blood Count (FBC)',   cat: 'Haematology', price: '₵35' },
    { name: 'Liver Function Test',      cat: 'Chemistry',   price: '₵65' },
    { name: 'Chest X-Ray (PA view)',    cat: 'X-Ray',       price: '₵85' },
  ];
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex border-b border-white/10 bg-white/5">
        {['Lab', 'Imaging', 'Pharmacy'].map((t, i) => (
          <div key={t} className={cn('flex-1 py-2 text-center text-[10px] font-semibold', i === 0 ? 'text-white border-b-2 border-white/60' : 'text-white/40')}>
            {t}
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/10">
          <div className="w-3 h-3 rounded-full border border-white/30" />
          <Bar w="w-24" h="h-1.5" opacity="opacity-30" />
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {tests.map((t) => (
          <div key={t.name} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-medium truncate">{t.name}</p>
              <p className="text-white/40 text-[9px]">{t.cat}</p>
            </div>
            <span className="text-white/60 text-[10px] font-semibold">{t.price}</span>
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs leading-none">+</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RosterMockup() {
  const days   = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const cells  = [
    [true,  true,  true,  true,  true,  false, false],
    [true,  true,  true,  true,  true,  true,  false],
    [true,  false, true,  true,  true,  false, false],
    [true,  true,  true,  false, true,  false, false],
  ];
  const depts  = ['Doctors', 'Nurses', 'Lab', 'Pharmacy'];
  const colors = ['bg-blue-400', 'bg-emerald-400', 'bg-purple-400', 'bg-orange-400'];

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-white/80 text-xs font-bold">May 2026</p>
        <div className="flex gap-1">
          {['<', '>'].map((c) => (
            <div key={c} className="w-6 h-6 rounded-lg bg-white/10 text-white/40 text-xs flex items-center justify-center">{c}</div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-white/10">
        {days.map((d, i) => (
          <div key={i} className={cn('py-1 text-center text-[9px] font-bold', i >= 5 ? 'text-white/30' : 'text-white/50')}>{d}</div>
        ))}
      </div>
      <div className="p-2 space-y-1.5">
        {depts.map((dept, di) => (
          <div key={dept} className="flex items-center gap-1.5">
            <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colors[di])} />
            <p className="text-white/50 text-[9px] w-12 flex-shrink-0">{dept}</p>
            <div className="flex-1 grid grid-cols-7 gap-0.5">
              {cells[di].map((on, ci) => (
                <div key={ci} className={cn('h-4 rounded', on ? `${colors[di]} opacity-60` : 'bg-white/5')} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AncMockup() {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
      <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex-shrink-0" />
        <div>
          <Bar w="w-28" h="h-2.5" opacity="opacity-60" />
          <div className="flex items-center gap-2 mt-1.5">
            <div className="px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-semibold">G2 P1</div>
            <p className="text-white/40 text-[9px]">28 weeks · EDD: Aug 2026</p>
          </div>
        </div>
        <div className="ml-auto">
          <div className="px-2 py-0.5 rounded-full bg-red-400/20 text-red-300 text-[9px] font-semibold">⚠ Alert</div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {[['BP', '130/85'], ['HR', '92'], ['Wt', '68 kg'], ['FHR', '144']].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-white/5 border border-white/10 p-2 text-center">
              <p className="text-white/40 text-[8px]">{l}</p>
              <p className="text-white text-[11px] font-bold">{v}</p>
            </div>
          ))}
        </div>
        {[
          { v: 'ANC 1', date: 'Jan 12', done: true  },
          { v: 'ANC 2', date: 'Mar 5',  done: true  },
          { v: 'ANC 3', date: 'May 25', done: false },
        ].map((r) => (
          <div key={r.v} className="flex items-center gap-2 px-2">
            <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0', r.done ? 'bg-emerald-400/30 text-emerald-300' : 'bg-white/20 text-white/60')}>
              {r.done ? '✓' : '•'}
            </div>
            <p className={cn('text-[10px] flex-1', r.done ? 'text-white/60' : 'text-white font-semibold')}>{r.v}</p>
            <p className="text-white/30 text-[9px]">{r.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Slide data — component references, NOT pre-created JSX instances ────────────
// Storing <QueueMockup /> (a stale element object) here causes React's reconciler
// to reuse the same DOM node across slide changes, producing layered/ghost text.
// Storing the function reference (QueueMockup) lets React create a fresh element
// on every render cycle and cleanly swap the DOM.

type SlideEntry = {
  id:          string;
  label:       string;
  title:       string;
  description: string;
  Mockup:      React.ComponentType;
};

const SLIDES: SlideEntry[] = [
  {
    id: 'queue', label: 'Patient Queue',
    title: 'Real-time Patient Queue',
    description: "Monitor today's appointments, track waiting status in real time, and open a consultation with one click.",
    Mockup: QueueMockup,
  },
  {
    id: 'notes', label: 'Clinical Notes',
    title: 'AI-Assisted Documentation',
    description: 'Structured SOAP notes, examination builder, and one-click AI narrative generation — fully FHIR R4 compliant.',
    Mockup: NotesMockup,
  },
  {
    id: 'orders', label: 'Lab & Imaging',
    title: 'Seamless Order Management',
    description: 'Request labs, imaging studies, and prescriptions directly linked to the patient encounter — results flow back automatically.',
    Mockup: OrdersMockup,
  },
  {
    id: 'roster', label: 'Staff Roster',
    title: 'Smart Shift Scheduling',
    description: "Monthly roster for every department. Today's on-duty team is always visible right from the dashboard.",
    Mockup: RosterMockup,
  },
  {
    id: 'anc', label: 'Antenatal Care',
    title: 'Comprehensive ANC Tracking',
    description: 'WHO-compliant antenatal care with automated risk alerts, gestational age tracking, and visit scheduling.',
    Mockup: AncMockup,
  },
];

// ── Carousel ───────────────────────────────────────────────────────────────────

// Fade-out duration (CSS).  The content swap fires after SWAP_DELAY which is
// intentionally longer than FADE_MS so the CSS transition fully completes
// before the DOM text changes — preventing any double/ghost text flash.
const FADE_MS   = 200;
const SWAP_DELAY = 270; // FADE_MS + 70 ms buffer

export function LoginHero() {
  const [current, setCurrent] = useState(0); // active chip index (updates immediately)
  const [shown,   setShown]   = useState(0); // rendered content index (updates after fade)
  const [visible, setVisible] = useState(true);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = SLIDES.length;

  /**
   * Two-index controlled cross-fade — the only approach that guarantees
   * zero simultaneous old+new text in the DOM:
   *
   *  1. setVisible(false)  → CSS opacity 1→0 over FADE_MS
   *  2. setCurrent(idx)    → chip highlight updates immediately (good UX)
   *  3. After SWAP_DELAY   → setShown(idx)   ← DOM content changes while invisible
   *                          setVisible(true) → CSS opacity 0→1 over FADE_MS
   *
   * Because `shown` (what's in the DOM) never changes while opacity > 0,
   * the old and new text can never be simultaneously visible at any level.
   * No `key` changes means React updates in-place — no reconciler race.
   */
  const goTo = useCallback((idx: number) => {
    if (swapTimer.current) clearTimeout(swapTimer.current);
    setVisible(false);
    setCurrent(idx);
    swapTimer.current = setTimeout(() => {
      setShown(idx);
      setVisible(true);
    }, SWAP_DELAY);
  }, []);

  const next = useCallback(() => goTo((current + 1) % total), [current, goTo, total]);

  // Auto-advance every 4.5 s — timer resets each time current changes
  useEffect(() => {
    const t = setTimeout(next, 4500);
    return () => clearTimeout(t);
  }, [current, next]);

  // Cleanup pending swap on unmount
  useEffect(() => () => { if (swapTimer.current) clearTimeout(swapTimer.current); }, []);

  const slide = SLIDES[shown]; // content from shown (not current)
  const { Mockup } = slide;

  return (
    <div className="relative z-10 flex flex-col h-full px-10 py-10">

      {/* ── Brand mark ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-black/20 flex-shrink-0">
          <span className="text-hospital-700 font-black text-sm tracking-tight">SQ</span>
        </div>
        <div>
          <p className="text-white font-extrabold text-base leading-tight tracking-tight">SerialQuest EMR</p>
          <p className="text-white/50 text-[11px] leading-tight">Clinical Intelligence Platform</p>
        </div>
      </div>

      {/* ── Hero headline ── */}
      <div className="mt-8 flex-shrink-0">
        <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
          Modern care,<br />seamless records.
        </h2>
        <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-xs">
          Connecting doctors, nurses, labs, and administration in one secure, intelligent workspace.
        </p>
      </div>

      {/* ── Feature carousel ── */}
      <div className="flex-1 flex flex-col justify-center min-h-0 mt-8">

        {/* Slide label chips */}
        <div className="flex gap-1.5 flex-wrap mb-5 flex-shrink-0">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200',
                i === current
                  ? 'bg-white text-hospital-700 shadow-md'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/*
          Controlled opacity fade — no key changes, no DOM thrashing.
          `shown` only updates while opacity === 0, so old and new text
          are never both visible at any opacity level.
        */}
        <div style={{ opacity: visible ? 1 : 0, transition: `opacity ${FADE_MS}ms ease-in-out` }}>
          <div className="mb-5">
            <Mockup />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{slide.title}</h3>
            <p className="text-white/55 text-sm mt-2 leading-relaxed">{slide.description}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-6 flex-shrink-0">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50',
              )}
            />
          ))}

          {/* Auto-progress bar */}
          <div className="flex-1 ml-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              key={current}
              className="h-full bg-white/40 rounded-full animate-progress-bar"
              style={{ animationDuration: '4.5s' }}
            />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 mt-6 flex items-center gap-3">
        <div className="flex gap-1.5">
          {['FHIR R4', 'Role-Based Access', 'ANC Tracking', 'Real-time Sync'].map((f) => (
            <span key={f} className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/50 text-[10px] font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>

      <p className="text-white/20 text-[10px] mt-4 flex-shrink-0">
        © {new Date().getFullYear()} SerialQuest. All rights reserved.
      </p>
    </div>
  );
}
