import { useState } from 'react';
import { assessClaim } from '../api.js';
import ResultCard from './ResultCard.jsx';
import { ErrorPanel, IdlePanel, LoadingPanel } from './StatePanels.jsx';

const CLAIM_TYPES = [
  { value: 'EFFICACY', label: 'Efficacy', hint: 'Needs a clinical measurement.' },
  { value: 'CONSUMER_PERCEPTION', label: 'Consumer perception', hint: 'Needs a consumer survey.' },
  { value: 'SENSORY', label: 'Sensory', hint: 'Needs a trained sensory panel.' },
  { value: 'SAFETY', label: 'Safety', hint: 'Needs a dermatologist study.' },
];

// Sample data so the demo can be filled in one click.
const EXAMPLES = [
  {
    label: 'Wrinkle claim',
    productName: 'Revitalift Night Cream',
    claimType: 'EFFICACY',
    claimText: 'Reduces wrinkles by 20% in 4 weeks',
    evidence:
      '4-week double-blind study, 100 women aged 40-65, wrinkle depth measured by profilometry, 18% average reduction vs 3% in placebo group, p < 0.05.',
  },
  {
    label: 'Absorption claim',
    productName: 'Hydra Genius Serum',
    claimType: 'SENSORY',
    claimText: 'Absorbs in 30 seconds',
    evidence:
      'Sensory panel of 20 trained assessors, standardised application of 0.5 ml on the forearm. Mean absorption time 24 seconds; all panelists recorded absorption under 30 seconds.',
  },
];

const EMPTY = { productName: '', claimType: 'EFFICACY', claimText: '', evidence: '' };
const MIN_EVIDENCE = 50;

export default function ClaimAssessment() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const fillExample = ({ label, ...example }) => {
    setForm(example);
    setStatus('idle');
  };

  const isLoading = status === 'loading';
  const evidenceLength = form.evidence.trim().length;
  const canSubmit = !isLoading && form.productName.trim() && form.claimText.trim() && evidenceLength >= MIN_EVIDENCE;
  const typeHint = CLAIM_TYPES.find((t) => t.value === form.claimType)?.hint;

  async function runAssessment() {
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      setResult(await assessClaim(form));
      setStatus('done');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (canSubmit) runAssessment();
  }

  function handleReset() {
    setForm(EMPTY);
    setStatus('idle');
    setResult(null);
    setError(null);
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(EMPTY) || status !== 'idle';

  return (
    <div className="workspace">
      <section className="brief" aria-labelledby="form-title">
        <form className="form-card" onSubmit={handleSubmit} onReset={handleReset} noValidate>
          <div className="form-card-head">
            <h1 id="form-title">Assess a claim</h1>
            <div className="examples">
              <span>Fill with an example:</span>
              {EXAMPLES.map((ex) => (
                <button type="button" key={ex.label} className="chip" onClick={() => fillExample(ex)} disabled={isLoading}>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <fieldset disabled={isLoading}>
            <legend>Product and claim</legend>
            <div className="row">
              <label className="field">
                <span className="field-label">Product name <em aria-hidden>*</em></span>
                <input value={form.productName} onChange={update('productName')} placeholder="e.g. Revitalift Night Cream" required />
              </label>
              <label className="field">
                <span className="field-label">Claim type <em aria-hidden>*</em></span>
                <select value={form.claimType} onChange={update('claimType')}>
                  {CLAIM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <span className="hint">{typeHint}</span>
              </label>
            </div>
            <label className="field">
              <span className="field-label">Claim <em aria-hidden>*</em></span>
              <input value={form.claimText} onChange={update('claimText')} placeholder="e.g. Reduces wrinkles by 20% in 4 weeks" required />
            </label>
          </fieldset>

          <fieldset disabled={isLoading}>
            <legend>Clinical study evidence</legend>
            <label className="field">
              <span className="field-label label-row">
                <span>Study results <em aria-hidden>*</em></span>
                <span className={`counter ${evidenceLength >= MIN_EVIDENCE ? 'enough' : ''}`}>
                  {evidenceLength < MIN_EVIDENCE ? `${MIN_EVIDENCE - evidenceLength} more characters needed` : `${evidenceLength} characters`}
                </span>
              </span>
              <textarea
                rows={4}
                value={form.evidence}
                onChange={update('evidence')}
                placeholder="Duration, number of participants, how it was measured, the result, placebo, p-value…"
                required
              />
            </label>
          </fieldset>

          <div className="actions">
            <p className="required-note"><em aria-hidden>*</em> Required</p>
            <button type="reset" className="btn btn-outline" disabled={isLoading || !isDirty}>Reset</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {isLoading ? 'Assessing…' : 'Assess claim'}
            </button>
          </div>
        </form>
      </section>

      <section className="verdict-panel" aria-live="polite">
        {status === 'idle' && <IdlePanel />}
        {isLoading && <LoadingPanel claimText={form.claimText} />}
        {status === 'error' && <ErrorPanel error={error} onRetry={runAssessment} />}
        {status === 'done' && result && <ResultCard claim={result.claim} assessment={result.assessment} />}
      </section>
    </div>
  );
}
