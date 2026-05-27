'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2, Database } from 'lucide-react';

interface SeedResult {
  message: string;
  resourcesSummary: Record<string, number>;
  results: Array<{ name: string; mrn: string; status: string; error?: string; resources?: Record<string, number> }>;
}

export default function SeedFullPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<SeedResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/seed-full', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ adminEmail: email, adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setResult(data as SeedResult);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const created = result?.results.filter((r) => r.status === 'created').length ?? 0;
  const failed  = result?.results.filter((r) => r.status === 'error').length ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Seed Full Patient Dataset</h2>
        <p className="text-sm text-gray-500 mt-1">
          Creates 30 fully-populated patients with encounters, vitals, lab results, notes, medications, and billing data.
        </p>
      </div>

      {/* Warning */}
      <div className="flex gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Run only once per environment.</p>
          <p>This inserts ~600 FHIR resources. Duplicate runs will create duplicate patients.</p>
          <p>Estimated time: 2–4 minutes (processes 30 patients sequentially).</p>
        </div>
      </div>

      {/* Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hr@lotto-hospital.ng"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-400 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-hospital-600 hover:bg-hospital-700 disabled:bg-hospital-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Seeding patients… (this takes 2–4 min)
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Seed 30 Patients
              </>
            )}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">{result.message}</p>
              {failed > 0 && (
                <p className="text-xs text-amber-700 mt-1">{failed} patient(s) had errors — see list below.</p>
              )}
            </div>
          </div>

          {/* Resource counts */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resources Created</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(result.resourcesSummary).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-600">{type}</span>
                  <span className="text-xs font-bold text-hospital-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-patient status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Patients ({created} created)</p>
            <div className="max-h-64 overflow-y-auto space-y-1 text-xs">
              {result.results.map((r) => (
                <div key={r.mrn} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${r.status === 'created' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  <span className="font-medium truncate mr-2">{r.name}</span>
                  <span className="font-mono flex-shrink-0">{r.mrn}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="block w-full text-center py-2.5 px-4 bg-hospital-600 hover:bg-hospital-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
