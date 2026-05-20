'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';

interface AccountResult {
  email:    string;
  role:     string;
  password: string;
  status:   'created' | 'role_fixed' | 'already_exists' | 'error';
  error?:   string;
}

interface SetupResponse {
  projectId: string;
  results:   AccountResult[];
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin / HR',
  admin:      'Admin',
  doctor:     'Doctor',
};

export default function SetupPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<SetupResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ adminEmail: email, adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Setup failed');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const allDone = result?.results.every((r) => r.status !== 'error');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10 gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-hospital-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
          LC
        </div>
        <h1 className="text-xl font-bold text-gray-900">Initial Account Setup</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          Creates the HR, Admin, and Doctor accounts for Lotto Central Hospital EMR.
        </p>
      </div>

      {/* Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Enter the email and password of the <strong>Medplum project owner</strong> account (the one you used to create the project on{' '}
            <span className="font-mono">app.medplum.com</span>).
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Medplum admin email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-hospital-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Medplum admin password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-hospital-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-hospital-600 hover:bg-hospital-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating accounts…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Create Hospital Accounts
              </>
            )}
          </button>
        </form>
      )}

      {/* Results */}
      {result && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          {allDone ? (
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Setup complete!
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <XCircle className="h-5 w-5 text-red-500" />
              Some accounts had errors
            </div>
          )}

          <div className="space-y-3">
            {result.results.map((r) => (
              <div key={r.email} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">{ROLE_LABEL[r.role] ?? r.role}</span>
                  {r.status === 'created' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Created</span>
                  )}
                  {r.status === 'role_fixed' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Role fixed ✓</span>
                  )}
                  {r.status === 'already_exists' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Already active</span>
                  )}
                  {r.status === 'error' && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Error</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 font-mono">{r.email}</p>
                <p className="text-xs text-gray-500">Password: <span className="font-mono font-medium">{r.password}</span></p>
                {r.error && <p className="text-xs text-red-600 mt-1">{r.error}</p>}
              </div>
            ))}
          </div>

          {allDone && (
            <Link
              href="/login"
              className="block w-full h-10 bg-hospital-600 hover:bg-hospital-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center transition-colors"
            >
              Go to Login →
            </Link>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center max-w-xs">
        This page is safe to revisit — it skips accounts that already exist.
        {' '}<Link href="/seed-patients" className="underline hover:text-gray-600">Seed demo patients →</Link>
      </p>
    </div>
  );
}
