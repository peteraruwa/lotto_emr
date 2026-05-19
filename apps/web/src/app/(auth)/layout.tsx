import React from 'react';

/**
 * Auth layout: centers unauthenticated pages (login, forgot-password) in a card.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hospital-50 to-hospital-100 p-4">
      <div className="w-full max-w-md">
        {/* Hospital logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hospital-600 text-white text-2xl font-bold mb-4 shadow-lg">
            LC
          </div>
          <h1 className="text-2xl font-bold text-hospital-900">Lotto Central Hospital</h1>
          <p className="text-hospital-600 text-sm mt-1">Electronic Medical Records</p>
        </div>

        {/* Page content (login form, etc.) */}
        <div className="bg-white rounded-2xl shadow-xl border border-hospital-100 p-8">
          {children}
        </div>

        <p className="text-center text-xs text-hospital-400 mt-6">
          Authorized personnel only. All access is logged and audited.
        </p>
      </div>
    </div>
  );
}
