export const CHECKS = [
  { name: 'RIGHT_PROOF', label: 'Right type of proof', question: 'Is this the kind of study this claim needs?' },
  { name: 'ENDPOINT', label: 'What was measured', question: 'Did the study measure what the claim talks about?' },
  { name: 'MAGNITUDE', label: 'How much', question: 'Does the result reach the number in the claim?' },
  { name: 'DURATION', label: 'How long', question: 'Did the study run as long as the claim says?' },
  { name: 'RELIABILITY', label: 'How reliable', question: 'Enough people, a placebo, a significant result?' },
];

export function IdlePanel() {
  return (
    <div className="panel idle">
      <h2>Five questions, one verdict</h2>
      <p className="panel-lede">Every claim is checked against the same criteria, so each verdict can be explained and audited.</p>
      <ul className="criteria">
        {CHECKS.map((c) => (
          <li key={c.name}>
            <span className="criteria-label">{c.label}</span>
            <span className="criteria-question">{c.question}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LoadingPanel({ claimText }) {
  return (
    <div className="panel loading" role="status">
      <div className="loader" aria-hidden />
      <h2>Reading the study</h2>
      {claimText && <p className="quoted">“{claimText}”</p>}
      <p className="panel-lede">The AI is answering the five checks. This usually takes 5 to 20 seconds.</p>
      <ul className="skeleton">
        {CHECKS.map((c) => (
          <li key={c.name}><span>{c.label}</span><i /></li>
        ))}
      </ul>
    </div>
  );
}

const ERROR_COPY = {
  unavailable: {
    title: 'The AI service didn’t answer',
    body: 'The model is busy or slow right now. Your claim has been saved, so nothing is lost. Try again in a moment.',
    retry: true,
  },
  offline: {
    title: 'LorealClaim server not reachable',
    body: 'Check that the backend is running on port 3000, then try again.',
    retry: true,
  },
  validation: {
    title: 'Some details need attention',
    body: null,
    retry: false,
  },
  unknown: {
    title: 'Something went wrong',
    body: null,
    retry: true,
  },
};

export function ErrorPanel({ error, onRetry }) {
  const copy = ERROR_COPY[error?.kind] ?? ERROR_COPY.unknown;
  return (
    <div className={`panel error ${error?.kind ?? 'unknown'}`} role="alert">
      <svg className="error-mark" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r="30" />
        <path d="M32 18v18M32 44v2" />
      </svg>
      <h2>{copy.title}</h2>
      <p className="panel-lede">{copy.body ?? error?.message}</p>
      {copy.retry && (
        <button type="button" className="btn btn-outline retry" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}
