// Gold ring that draws itself to the confidence value when the result appears.
export default function ConfidenceRing({ value }) {
  const percent = Math.round(value * 100);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="ring" role="img" aria-label={`Confidence ${percent} percent`}>
      <svg viewBox="0 0 120 120">
        <circle className="ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={radius}
          style={{ strokeDasharray: circumference, '--ring-offset': circumference * (1 - value), '--ring-full': circumference }}
        />
      </svg>
      <div className="ring-text">
        <span className="ring-number">{percent}<small>%</small></span>
        <span className="ring-label">confidence</span>
      </div>
    </div>
  );
}
