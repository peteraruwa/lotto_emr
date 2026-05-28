import type { ScoreRisk } from '../types';

export { RISK_COLORS } from '../types';

export const ScoreRiskUtils = {
  now: () => new Date().toISOString(),

  riskFromScore(score: number, thresholds: [number, ScoreRisk][]): ScoreRisk {
    for (const [threshold, risk] of thresholds.slice().reverse()) {
      if (score >= threshold) return risk;
    }
    return thresholds[0][1];
  },
};
