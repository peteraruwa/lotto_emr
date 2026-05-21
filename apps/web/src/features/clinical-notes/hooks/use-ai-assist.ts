'use client';

import { useState, useCallback } from 'react';
import type { VitalsSnapshot } from '../data/exam-data';

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

export type ExamData = Record<string, Record<string, string | string[]>>;

export function useAiAssist() {
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [icdResults, setIcdResults] = useState<IcdCode[]>([]);
  const [isSearchingIcd, setIsSearchingIcd] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isConvertingExam, setIsConvertingExam] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function callApi(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    setAiError(null);
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        const msg = (data.error as string) ?? `HTTP ${res.status}`;
        setAiError(msg);
        return null;
      }
      return data;
    } catch (err) {
      setAiError((err as Error).message ?? 'Network error');
      return null;
    }
  }

  const expandSection = useCallback(
    async (section: string, text: string, context?: ExpandContext): Promise<string | undefined> => {
      if (!text.trim()) return undefined;
      setLoadingSection(section);
      try {
        const data = await callApi({ action: 'expand-section', text, context: context ?? { section } });
        return (data?.expanded as string | undefined);
      } finally {
        setLoadingSection(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const searchIcd = useCallback(async (text: string): Promise<IcdCode[]> => {
    if (!text.trim()) return [];
    setIsSearchingIcd(true);
    try {
      const data = await callApi({ action: 'icd-search', text });
      const codes = (data?.codes as IcdCode[] | undefined) ?? [];
      setIcdResults(codes);
      return codes;
    } finally {
      setIsSearchingIcd(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestPlan = useCallback(
    async (diagnosisText: string, context?: PlanContext): Promise<string | undefined> => {
      if (!diagnosisText.trim()) return undefined;
      setIsGeneratingPlan(true);
      try {
        const data = await callApi({ action: 'suggest-plan', text: diagnosisText, context });
        return (data?.plan as string | undefined);
      } finally {
        setIsGeneratingPlan(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  );

  const convertExamToNarrative = useCallback(async (examData: ExamData): Promise<string | undefined> => {
    setIsConvertingExam(true);
    try {
      const data = await callApi({ action: 'convert-exam', examData });
      return (data?.narrative as string | undefined);
    } finally {
      setIsConvertingExam(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAiAlerts = useCallback(async (vitals: VitalsSnapshot): Promise<string[]> => {
    setIsLoadingAlerts(true);
    try {
      const data = await callApi({ action: 'suggest-alerts', vitals });
      return (data?.alerts as string[] | undefined) ?? [];
    } finally {
      setIsLoadingAlerts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    expandSection,
    searchIcd,
    suggestPlan,
    convertExamToNarrative,
    getAiAlerts,
    loadingSection,
    icdResults,
    setIcdResults,
    isSearchingIcd,
    isGeneratingPlan,
    isConvertingExam,
    isLoadingAlerts,
    aiError,
    clearAiError: () => setAiError(null),
  };
}
