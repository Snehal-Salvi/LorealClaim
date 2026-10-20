import { Check } from '../llm/assessment.schema';
import { computeVerdict } from './verdict';

const check = (name: Check['name'], met: boolean, applicable = true): Check => ({ name, met, applicable, detail: '' });

describe('computeVerdict', () => {
  it('is justified when every applicable check passes', () => {
    const checks = [check('RIGHT_PROOF', true), check('ENDPOINT', true), check('MAGNITUDE', true), check('DURATION', true), check('RELIABILITY', true)];
    expect(computeVerdict(checks)).toEqual({ justified: true, confidence: 1 });
  });

  it('is not justified when one check fails (18% vs claimed 20%)', () => {
    const checks = [check('RIGHT_PROOF', true), check('ENDPOINT', true), check('MAGNITUDE', false), check('DURATION', true), check('RELIABILITY', true)];
    expect(computeVerdict(checks)).toEqual({ justified: false, confidence: 0.8 });
  });

  it('ignores checks that do not apply (claim with no number or timeframe)', () => {
    const checks = [check('RIGHT_PROOF', true), check('ENDPOINT', true), check('MAGNITUDE', false, false), check('DURATION', false, false), check('RELIABILITY', true)];
    expect(computeVerdict(checks)).toEqual({ justified: true, confidence: 1 });
  });

  it('is not justified when no check applies', () => {
    expect(computeVerdict([check('RIGHT_PROOF', false, false)])).toEqual({ justified: false, confidence: 0 });
  });
});
