'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';

interface SeedResult {
  name: string;
  mrn: string;
  status: 'created' | 'error';
  error?: string;
}

export default function SeedPatientsPage() {
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [results, setResults] = useState<SeedResult[] | null>(null);

  async function handleSeed(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/seed-patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: email, adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Seeding failed');
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  const created = results?.filter((r) => r.status === 'created').length ?? 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-hospital-600 mb-3">
            <Database className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Seed Patient Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Creates 10 dummy Nigerian patients with vital signs in your Medplum project.
          </p>
        </div>

        {!results && (
          <form onSubmit={handleSeed} className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Enter your super-admin credentials (same as the Setup page).
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
                placeholder="hr@lotto-hospital.ng"
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
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Seeding patients…</> : 'Seed 10 Patients'}
            </button>
          </form>
        )}

        {results && (
          <div className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="font-semibold">{created} of {results.length} patients created successfully</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${r.status === 'created' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {r.status === 'created'
                    ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  }
                  <span className="font-medium">{r.name}</span>
                  <span className="font-mono text-xs text-gray-500">{r.mrn}</span>
                  {r.error && <span className="text-xs text-red-600 ml-auto">{r.error}</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/" className="flex-1 h-9 rounded-md bg-hospital-600 text-white text-sm font-medium hover:bg-hospital-700 flex items-center justify-center">
                Go to Dashboard
              </Link>
              <button
                onClick={() => setResults(null)}
                className="flex-1 h-9 rounded-md border text-sm font-medium hover:bg-gray-50 flex items-center justify-center"
              >
                Seed Again
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/setup" className="hover:underline">← Back to Setup</Link>
        </p>
      </div>
    </div>
  );
}
