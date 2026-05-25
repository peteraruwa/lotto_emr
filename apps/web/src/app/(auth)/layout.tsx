import React from 'react';
import { LoginHero } from '@/features/auth/components/login-hero';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left panel — animated feature carousel */}
      <div
        className="hidden lg:flex lg:w-[480px] flex-col relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #1a69f3 0%, #1453e0 40%, #132656 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-40 -right-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        <LoginHero />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
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

          <p className="text-center text-xs text-gray-400 mt-5">
            Authorized personnel only · All access is audited
          </p>
          <p className="text-center text-[11px] text-gray-300 mt-2">
            Powered by <span className="font-semibold text-gray-400">SerialQuest</span>
          </p>
        </div>
      </div>
    </div>
  );
}
