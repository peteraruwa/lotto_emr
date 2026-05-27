'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Phone, Mail, Stethoscope,
  Users, FlaskConical, CalendarDays, Heart, Activity, Shield,
} from 'lucide-react';

// ── About modal (unchanged) ───────────────────────────────────────────────────

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hospital-500 to-hospital-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              SQ
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">SerialQuest EMR</h2>
              <p className="text-xs text-gray-400">Electronic Medical Records · v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">What is this?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              SerialQuest EMR is a modern, FHIR-native electronic medical records system purpose-built for
              Nigerian public hospitals. It covers the full clinical workflow — from patient registration
              and triage through consultation, investigations, prescriptions, and discharge — in a single,
              responsive interface that works on any device.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Philosophy</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                { t: 'Clinician-first', d: 'Every screen is designed around what a doctor or nurse actually needs at the point of care — not what looks good in a procurement brochure.' },
                { t: 'FHIR as the backbone', d: 'All clinical data is stored as HL7 FHIR R4 resources, making the system interoperable with any standards-compliant external system.' },
                { t: 'Built for Nigeria', d: 'Patient names, genotype fields, Nigerian phone formats, local ward structures, and multi-user concurrency reflect real hospital workflows in Nigeria.' },
                { t: 'Honest about limits', d: 'Demo data is clearly marked. The system shows real uncertainty rather than hiding it behind false confidence.' },
              ].map(({ t, d }) => (
                <li key={t} className="flex gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-hospital-500 flex-shrink-0 mt-1.5" />
                  <span><strong className="text-gray-800">{t}.</strong> {d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-hospital-50 to-sky-50 border border-hospital-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hospital-500 to-hospital-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-hospital-600/20">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">Dr. Peter Aruwa</h3>
                <p className="text-xs text-hospital-600 font-semibold mt-0.5">Medical Doctor · Software Developer</p>
                <div className="mt-2.5 space-y-1.5">
                  <a href="tel:09067008473" className="flex items-center gap-2 text-xs text-gray-600 hover:text-hospital-700 transition-colors group">
                    <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-hospital-500 flex-shrink-0" />
                    09067008473
                  </a>
                  <a href="mailto:serialquest@gmail.com" className="flex items-center gap-2 text-xs text-gray-600 hover:text-hospital-700 transition-colors group">
                    <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-hospital-500 flex-shrink-0" />
                    serialquest@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Credits</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Patient data shown is entirely synthetic — any resemblance to real persons is coincidental. Icons by{' '}
              <a href="https://lucide.dev" target="_blank" rel="noreferrer" className="text-hospital-600 hover:underline">Lucide</a>.
              FHIR infrastructure by{' '}
              <a href="https://medplum.com" target="_blank" rel="noreferrer" className="text-hospital-600 hover:underline">Medplum</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-hospital-600 text-white hover:bg-hospital-700 shadow-sm shadow-hospital-600/30 transition-all hover:shadow-md hover:-translate-y-px active:translate-y-0"
      >
        About app
      </button>
      {open && <AboutModal onClose={() => setOpen(false)} />}
    </>
  );
}

// ── Hero panel ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: Users,
    label: 'Patient Management',
    headline: 'Every patient, one chart.',
    body: 'Registration, vitals, notes, orders, and discharge — all in a single FHIR-native record accessible from any device.',
  },
  {
    icon: Stethoscope,
    label: 'AI Clinical Notes',
    headline: 'Documentation in seconds.',
    body: 'AI-assisted SOAP notes using de-identified Gemini AI — spend more time with patients and less on paperwork.',
  },
  {
    icon: FlaskConical,
    label: 'Lab & Pharmacy',
    headline: 'Results, not just requests.',
    body: 'Drug interaction checks, critical value alerts, and full order-to-result traceability built into every workflow.',
  },
  {
    icon: Heart,
    label: 'Antenatal Care',
    headline: 'Every pregnancy tracked.',
    body: 'ANC visits, fundal height charts, foetal presentation, and delivery notes — purpose-built for Nigerian hospitals.',
  },
  {
    icon: CalendarDays,
    label: 'Team & Roster',
    headline: 'Your team, always in sync.',
    body: 'Shift rosters, on-duty panels, and direct staff contact — right from your dashboard every working day.',
  },
] as const;

// Slide interval and CSS transition duration (ms).
// FADE_MS must match the `transition` duration on the content div.
const INTERVAL = 4800;
const FADE_MS  = 260;

const STAT_CHIPS = [
  { icon: Shield,   text: 'FHIR R4' },
  { icon: Users,    text: '10 Staff Roles' },
  { icon: Activity, text: 'AI-Powered Notes' },
] as const;

function LoginHero() {
  // nextRef tracks what the next slide index will be — avoids stale closures.
  const nextRef = useRef(1);

  // `current` drives the dot/progress indicator — updates immediately.
  const [current, setCurrent] = useState(0);

  // `shown` determines which slide's text is in the DOM — only changes AFTER
  // the fade-out CSS transition completes, preventing ghost/double text.
  const [shown, setShown] = useState(0);

  // `visible` drives the opacity/transform transition.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      // Step 1 — fade out current content
      setVisible(false);

      // Step 2 — after transition completes, swap content and fade back in
      setTimeout(() => {
        const next = nextRef.current;
        setShown(next);
        setCurrent(next);
        nextRef.current = (next + 1) % SLIDES.length;
        setVisible(true);
      }, FADE_MS + 40); // 40 ms buffer beyond the CSS transition
    }, INTERVAL);

    return () => clearInterval(tick);
  }, []); // setters are stable; empty deps is correct

  // Jump to a specific slide when the user clicks a dot
  function jumpTo(i: number) {
    if (i === current) return;
    setVisible(false);
    setTimeout(() => {
      setShown(i);
      setCurrent(i);
      nextRef.current = (i + 1) % SLIDES.length;
      setVisible(true);
    }, FADE_MS + 40);
  }

  const slide = SLIDES[shown];
  const SlideIcon = slide.icon;

  return (
    <div className="hidden lg:flex flex-col h-full relative overflow-hidden"
         style={{ background: 'linear-gradient(145deg, #0c2d6b 0%, #1453e0 55%, #3188fd 100%)' }}>

      {/* ── Decorative blobs ──────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl"
           style={{ background: 'rgba(255,255,255,0.07)' }} />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-96 h-96 rounded-full blur-3xl"
           style={{ background: 'rgba(49,136,253,0.25)' }} />
      <div className="pointer-events-none absolute top-2/5 right-[-4rem] w-60 h-60 rounded-full blur-2xl"
           style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Dot-grid texture ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full px-10 py-10 select-none">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shadow-lg flex-shrink-0"
               style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            SQ
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight">SerialQuest EMR</p>
            <p className="text-white/55 text-[11px]">Electronic Medical Records</p>
          </div>
        </div>

        {/* Centre section — stretches to fill available space */}
        <div className="flex-1 flex flex-col justify-center min-h-0 py-8">

          {/* Static headline */}
          <div className="mb-7">
            <h1 className="text-[2.1rem] font-extrabold text-white leading-[1.18] tracking-tight">
              Modern EMR for<br />
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>Nigerian hospitals.</span>
            </h1>
            <p className="mt-2.5 text-white/55 text-sm leading-relaxed max-w-xs">
              Clinician-first · FHIR R4 · AI-assisted · Purpose-built
            </p>
          </div>

          {/* Animated feature card */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background:    'rgba(255,255,255,0.09)',
              backdropFilter: 'blur(12px)',
              border:         '1px solid rgba(255,255,255,0.14)',
            }}
          >
            {/* Large background icon — purely decorative */}
            <SlideIcon
              className="absolute right-4 top-3 h-20 w-20 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.06)' }}
            />

            {/* Animated content — opacity + slight translateY */}
            <div
              style={{
                opacity:    visible ? 1 : 0,
                transform:  visible ? 'translateY(0)' : 'translateY(7px)',
                transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
              }}
            >
              {/* Feature label */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
                   style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <SlideIcon className="h-3 w-3 text-white/75 flex-shrink-0" />
                <span className="text-[10px] font-bold text-white/85 uppercase tracking-widest">{slide.label}</span>
              </div>

              {/* Headline */}
              <h2 className="text-xl font-extrabold text-white leading-snug mb-2">
                {slide.headline}
              </h2>

              {/* Body */}
              <p className="text-white/65 text-[13px] leading-relaxed max-w-[22rem]">
                {slide.body}
              </p>
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {STAT_CHIPS.map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Icon className="h-3 w-3 text-white/60 flex-shrink-0" />
                {text}
              </span>
            ))}
          </div>

          {/* Progress bar + dots */}
          <div className="mt-7">
            {/* Progress track */}
            <div className="w-full h-0.5 rounded-full mb-3 overflow-hidden"
                 style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div
                key={current}                      /* re-mount resets the CSS animation */
                className="h-full rounded-full animate-progress-bar"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  animationDuration: `${INTERVAL}ms`,
                }}
              />
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => jumpTo(i)}
                  className="rounded-full transition-all duration-300 focus:outline-none"
                  style={{
                    width:      i === current ? 24 : 8,
                    height:     8,
                    background: i === current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="flex-shrink-0 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="text-white/40 text-[11px]">
            Designed by Dr. Peter Aruwa · serialquest@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Auth layout ───────────────────────────────────────────────────────────────

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    /* h-screen + overflow-hidden prevents the hero from pushing the page taller */
    <div className="h-screen flex overflow-hidden">

      {/* Left — animated hero (desktop only) */}
      <div className="hidden lg:block w-[52%] xl:w-[58%] flex-shrink-0 h-full">
        <LoginHero />
      </div>

      {/* Right — login form (always visible, scrollable if needed) */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-sm px-6 py-8">

          {/* Brand mark — shown only when hero is hidden (mobile) */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-hospital-500 to-hospital-700 text-white text-xl font-bold mb-3 shadow-lg shadow-hospital-600/30">
              SQ
            </div>
            <h1 className="text-xl font-bold text-gray-900">SerialQuest EMR</h1>
            <p className="text-gray-400 text-sm mt-0.5">Electronic Medical Records</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
            {children}
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-2 mt-5 px-1 sm:flex-row sm:justify-between">
            <p className="text-xs text-gray-400 text-center sm:text-left">
              Authorized personnel only · All access is audited
            </p>
            <AboutButton />
          </div>
          <p className="text-center text-[11px] text-gray-300 mt-2">
            Powered by <span className="font-semibold text-gray-400">SerialQuest</span>
          </p>

        </div>
      </div>
    </div>
  );
}
