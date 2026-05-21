'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Users, MinusCircle } from 'lucide-react';

interface SeedResult {
  name:   string;
  email:  string;
  role:   string;
  status: 'created' | 'skipped' | 'error';
  error?: string;
}

const ROLE_COLORS: Record<string, string> = {
  doctor:      'bg-blue-100 text-blue-700',
  nurse:       'bg-teal-100 text-teal-700',
  pharmacist:  'bg-purple-100 text-purple-700',
  lab:         'bg-amber-100 text-amber-700',
  radiologist: 'bg-indigo-100 text-indigo-700',
  admin:       'bg-gray-100 text-gray-700',
  hr:          'bg-rose-100 text-rose-700',
  records:     'bg-cyan-100 text-cyan-700',
  billing:     'bg-green-100 text-green-700',
  superadmin:  'bg-red-100 text-red-700',
};

export default function SeedEmployeesPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [summary,  setSummary]  = useState<string | null>(null);
  const [results,  setResults]  = useState<SeedResult[] | null>(null);

  async function handleSeed(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setSummary(null);

    try {
      const res  = await fetch('/api/seed-employees', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ adminEmail: email, adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Seeding failed');
      setResults(data.results);
      setSummary(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg space-y-6">

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-hospital-600 mb-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Seed Employee Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Creates 19 test staff accounts across all 10 hospital roles with password <code className="bg-gray-100 px-1 rounded">123456789</code>.
          </p>
        </div>

        {!results && (
          <form onSubmit={handleSeed} className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Enter your super-admin credentials (same as the Setup page). This is idempotent — existing accounts will be skipped.
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@yourdomain.com"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-hospital-600 text-white text-sm font-medium hover:bg-hospital-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating accounts…</>
                : 'Seed 19 Employee Accounts'}
            </button>
          </form>
        )}

        {results && (
          <div className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="font-semibold text-sm">{summary}</p>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                    r.status === 'created' ? 'bg-green-50' :
                    r.status === 'skipped' ? 'bg-gray-50'  : 'bg-red-50'
                  }`}
                >
                  {r.status === 'created' && <CheckCircle   className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                  {r.status === 'skipped' && <MinusCircle   className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                  {r.status === 'error'   && <XCircle       className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                  <span className="font-medium flex-1 truncate">{r.name}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLORS[r.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {r.role}
                  </span>
                  {r.error && <span className="text-xs text-red-600 truncate max-w-32">{r.error}</span>}
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="font-semibold text-gray-700">Login credentials for all created accounts:</p>
              <p>Email: <code>username@lotto.ng</code> (e.g. <code>doctor1@lotto.ng</code>)</p>
              <p>Password: <code>123456789</code></p>
            </div>

            <div className="flex gap-3 pt-1">
              <Link
                href="/"
                className="flex-1 h-9 rounded-md bg-hospital-600 text-white text-sm font-medium hover:bg-hospital-700 flex items-center justify-center"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => { setResults(null); setSummary(null); }}
                className="flex-1 h-9 rounded-md border text-sm font-medium hover:bg-gray-50 flex items-center justify-center"
              >
                Run Again
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/seed-patients" className="hover:underline">Seed patients instead</Link>
          {' · '}
          <Link href="/setup" className="hover:underline">← Back to Setup</Link>
        </p>
      </div>
    </div>
  );
}
