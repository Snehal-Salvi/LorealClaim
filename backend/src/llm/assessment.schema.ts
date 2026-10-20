import { z } from 'zod';

// The 5 checks every claim is broken into. The AI answers each one.
export const CHECK_NAMES = ['RIGHT_PROOF', 'ENDPOINT', 'MAGNITUDE', 'DURATION', 'RELIABILITY'] as const;
export type CheckName = (typeof CHECK_NAMES)[number];

export const CheckSchema = z.object({
  name: z.enum(CHECK_NAMES),
  applicable: z.boolean(), // false when the claim has nothing to check here (e.g. no number → MAGNITUDE n/a)
  met: z.boolean(),
  detail: z.string(), // one sentence explaining the answer, quoting the evidence
});

// Exact JSON shape the AI must return. It is sent to the model as a JSON schema
// and the reply is validated against it again before anything is saved.
export const LlmAssessmentSchema = z.object({
  checks: z.array(CheckSchema),
  reasoning: z.string(),
});

export type Check = z.infer<typeof CheckSchema>;
export type LlmAssessment = z.infer<typeof LlmAssessmentSchema>;
