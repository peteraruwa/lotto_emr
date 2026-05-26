'use client';
import React, { useState } from 'react';
import { LoginHero } from '@/features/auth/components/login-hero';
import { X, Phone, Mail, Stethoscope } from 'lucide-react';

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">What is this?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              SerialQuest EMR is a modern, FHIR-native electronic medical records system purpose-built for
              Nigerian public hospitals. It covers the full clinical workflow — from patient registration
              and triage through consultation, investigations, prescriptions, and discharge — in a single,
              responsive interface that works on any device.
            </p>
          </div>

          {/* Philosophy */}
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

          {/* Creator */}
          <div className="rounded-2xl bg-gradient-to-br from-hospital-50 to-sky-50 border border-hospital-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hospital-500 to-hospital-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-hospital-600/20">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">Dr. Peter Aruwa</h3>
                <p className="text-xs text-hospital-600 font-semibold mt-0.5">Medical Doctor · Software Developer</p>
                <div className="mt-2.5 space-y-1.5">
                  <a
                    href="tel:09067008473"
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-hospital-700 transition-colors group"
                  >
                    <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-hospital-500 flex-shrink-0" />
                    09067008473
                  </a>
                  <a
                    href="mailto:serialquest@gmail.com"
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-hospital-700 transition-colors group"
                  >
                    <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-hospital-500 flex-shrink-0" />
                    serialquest@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Credits</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Patient data shown is entirely synthetic —
              any resemblance to real persons is coincidental. Icons by{' '}
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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden grid lg:grid-cols-[480px_1fr]">
      {/* Left panel — animated feature carousel */}
      <div
        className="hidden lg:flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a69f3 0%, #1453e0 40%, #132656 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-40 -right-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <LoginHero />
      </div>

      {/* Right panel — form (isolated from left panel height changes) */}
      <div className="h-screen overflow-auto flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-hospital-500 to-hospital-700 text-white text-xl font-bold mb-3 shadow-lg shadow-hospital-600/30">
              SQ
            </div>
            <h1 className="text-xl font-bold text-gray-900">SerialQuest EMR</h1>
            <p className="text-gray-400 text-sm mt-0.5">Electronic Medical Records</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
            {children}
          </div>

          <div className="flex items-center justify-between mt-5 px-1">
            <p className="text-xs text-gray-400">Authorized personnel only · All access is audited</p>
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
