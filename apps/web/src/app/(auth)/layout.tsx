import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] flex-col relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #1a69f3 0%, #1453e0 40%, #132656 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-40 -right-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white text-sm font-bold shadow-inner">
              LC
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Lotto Central</p>
              <p className="text-white/60 text-xs">Hospital EMR</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-white leading-snug text-balance">
              Modern care,<br />seamless records.
            </h2>
            <p className="text-white/60 text-sm mt-4 leading-relaxed max-w-xs">
              Lotto Central's integrated EMR platform connecting doctors, nurses, labs, and administration in one secure workspace.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {['FHIR R4 Compliant', 'Role-Based Access', 'Real-Time Sync', 'ANC Tracking'].map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Lotto Central Hospital
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-hospital-500 to-hospital-700 text-white text-xl font-bold mb-3 shadow-lg shadow-hospital-600/30">
              LC
            </div>
            <h1 className="text-xl font-bold text-gray-900">Lotto Central Hospital</h1>
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
