'use client';

import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { isClinicalRole, type Role } from '@/shared/rbac/roles';
import { QuickCalculatorPanel } from './quick-calculator-panel';

interface ClinicalToolsTriggerProps {
  role?: string;
}

export function ClinicalToolsTrigger({ role }: ClinicalToolsTriggerProps) {
  const [open, setOpen] = useState(false);

  if (!role || !isClinicalRole(role as Role)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Clinical Tools (Quick Calculator)"
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hospital-50 text-hospital-700 hover:bg-hospital-100 text-xs font-semibold transition-colors border border-hospital-100"
      >
        <Calculator className="h-3.5 w-3.5" />
        Clinical Tools
      </button>

      <QuickCalculatorPanel isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
