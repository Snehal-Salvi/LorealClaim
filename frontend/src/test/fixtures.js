export const claim = {
  id: 'claim-1',
  productName: 'Revitalift Night Cream',
  claimType: 'EFFICACY',
  claimText: 'Reduces wrinkles by 20% in 4 weeks',
  status: 'ASSESSED',
};

export const notJustified = {
  id: 'assessment-1',
  justified: false,
  confidence: 0.8,
  reasoning: 'The 18% result falls short of the 20% claimed.',
  model: 'gemini-3.6-flash',
  promptVersion: 'v1',
  createdAt: '2026-10-19T14:42:54.047Z',
  criteria: [
    { name: 'RIGHT_PROOF', applicable: true, met: true, detail: 'Profilometry suits an efficacy claim.' },
    { name: 'ENDPOINT', applicable: true, met: true, detail: 'Wrinkle depth was measured.' },
    { name: 'MAGNITUDE', applicable: true, met: false, detail: '18% vs 20% claimed.' },
    { name: 'DURATION', applicable: true, met: true, detail: '4 weeks matches.' },
    { name: 'RELIABILITY', applicable: true, met: true, detail: '100 women, placebo, p < 0.05.' },
  ],
};

export const justifiedWithNa = {
  ...notJustified,
  justified: true,
  confidence: 1,
  reasoning: 'All applicable checks passed.',
  criteria: notJustified.criteria.map((c) =>
    c.name === 'DURATION' ? { ...c, applicable: false, met: false, detail: 'No timeframe in the claim.' } : { ...c, met: true },
  ),
};
