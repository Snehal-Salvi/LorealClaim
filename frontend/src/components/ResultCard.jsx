import ConfidenceRing from './ConfidenceRing.jsx';
import { CHECKS } from './StatePanels.jsx';

const LABELS = Object.fromEntries(CHECKS.map((c) => [c.name, c.label]));
const TYPE_LABELS = {
  EFFICACY: 'Efficacy claim',
  CONSUMER_PERCEPTION: 'Consumer perception claim',
  SENSORY: 'Sensory claim',
  SAFETY: 'Safety claim',
};

// One assessment: verdict, confidence, reasoning and the five checks.
export default function ResultCard({ claim, assessment }) {
  const { justified, confidence, reasoning, criteria, model, promptVersion, createdAt } = assessment;
  const applicable = criteria.filter((c) => c.applicable);
  const passed = applicable.filter((c) => c.met).length;

  return (
    <article className={`panel result ${justified ? 'is-justified' : 'is-not-justified'}`}>
      <header className="result-head">
        <p className="result-product">{claim.productName}, {TYPE_LABELS[claim.claimType].toLowerCase()}</p>
        <p className="quoted">“{claim.claimText}”</p>
      </header>

      <div className="verdict">
        <ConfidenceRing value={confidence} />
        <div>
          <p className="verdict-word">{justified ? 'Justified' : 'Not justified'}</p>
          <p className="verdict-sub">
            {passed} of {applicable.length} checks passed
            {applicable.length < criteria.length && ` (${criteria.length - applicable.length} not applicable)`}
          </p>
        </div>
      </div>

      <p className="reasoning">{reasoning}</p>

      <ul className="checks">
        {criteria.map((c) => {
          const state = !c.applicable ? 'na' : c.met ? 'pass' : 'fail';
          return (
            <li key={c.name} className={state}>
              <span className="check-mark" aria-label={state === 'pass' ? 'Passed' : state === 'fail' ? 'Failed' : 'Not applicable'}>
                {state === 'pass' ? '✓' : state === 'fail' ? '✕' : '–'}
              </span>
              <div>
                <p className="check-name">{LABELS[c.name] ?? c.name}{state === 'na' && <span> (not applicable)</span>}</p>
                <p className="check-detail">{c.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="provenance">
        AI recommendation from {model}, prompt {promptVersion}, on {new Date(createdAt).toLocaleString()}. The final decision rests with the evaluator.
      </p>
    </article>
  );
}
