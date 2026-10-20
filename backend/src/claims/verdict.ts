import { Check } from '../llm/assessment.schema';

export interface Verdict {
  justified: boolean;
  confidence: number; // 0–1
}

// Our code (not the AI) decides the final result, so it is explainable and testable.
//   justified  = every check that applies has passed
//   confidence = checks passed ÷ checks that apply
export function computeVerdict(checks: Check[]): Verdict {
  const applicable = checks.filter((c) => c.applicable);
  if (applicable.length === 0) return { justified: false, confidence: 0 };

  const passed = applicable.filter((c) => c.met).length;
  return {
    justified: passed === applicable.length,
    confidence: Math.round((passed / applicable.length) * 100) / 100,
  };
}
