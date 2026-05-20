'use client';

import { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface IcdCode {
  code: string;
  description: string;
}

interface ExpandContext {
  section: string;
}

interface PlanContext {
  age?: number;
  gender?: string;
  conditions?: string[];
  medications?: string[];
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAiAssist() {
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [icdResults, setIcdResults] = useState<IcdCode[]>([]);
  const [isSearchingIcd, setIsSearchingIcd] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  /**
   * Expands a clinical section's text using AI.
   * Returns the expanded text, or undefined on failure.
   */
  const expandSection = useCallback(
    async (section: string, text: string, context?: ExpandContext): Promise<string | undefined> => {
      if (!text.trim()) return undefined;
      setLoadingSection(section);
      try {
        const response = await fetch('/api/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'expand-section',
            text,
            context: context ?? { section },
          }),
        });

        if (!response.ok) return undefined;
        const data = await response.json() as { expanded?: string };
        return data.expanded;
      } catch {
        return undefined;
      } finally {
        setLoadingSection(null);
      }
    },
    []
  );

  /**
   * Searches ICD-10 codes for a given diagnosis text.
   */
  const searchIcd = useCallback(async (text: string): Promise<IcdCode[]> => {
    if (!text.trim()) return [];
    setIsSearchingIcd(true);
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'icd-search', text }),
      });

      if (!response.ok) return [];
      const data = await response.json() as { codes?: IcdCode[] };
      const codes = data.codes ?? [];
      setIcdResults(codes);
      return codes;
    } catch {
      return [];
    } finally {
      setIsSearchingIcd(false);
    }
  }, []);

  /**
   * Generates a management plan based on the diagnosis and patient context.
   * Returns the plan text, or undefined on failure.
   */
  const suggestPlan = useCallback(
    async (diagnosisText: string, context?: PlanContext): Promise<string | undefined> => {
      if (!diagnosisText.trim()) return undefined;
      setIsGeneratingPlan(true);
      try {
        const response = await fetch('/api/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'suggest-plan',
            text: diagnosisText,
            context,
          }),
        });

        if (!response.ok) return undefined;
        const data = await response.json() as { plan?: string };
        return data.plan;
      } catch {
        return undefined;
      } finally {
        setIsGeneratingPlan(false);
      }
    },
    []
  );

  return {
    expandSection,
    searchIcd,
    suggestPlan,
    loadingSection,
    icdResults,
    setIcdResults,
    isSearchingIcd,
    isGeneratingPlan,
  };
}
