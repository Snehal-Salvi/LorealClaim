import ClaimAssessment from './components/ClaimAssessment.jsx';

export default function App() {
  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-inner">
          <p className="wordmark">LorealClaim</p>
          <p className="tagline">Does the study prove the claim?</p>
        </div>
      </header>
      <main>
        <ClaimAssessment />
      </main>
      <footer className="colophon">
        Part of the L'Oréal Claims Intelligence Engine. The AI recommends; the evaluator decides.
      </footer>
    </div>
  );
}
