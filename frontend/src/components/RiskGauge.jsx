export default function RiskGauge({ score = 0 }) {
  const clampedScore = Math.min(100, Math.max(0, score));

  const getColor = (s) => {
    if (s >= 75) return '#ef4444';
    if (s >= 40) return '#eab308';
    return '#22c55e';
  };

  const getLabel = (s) => {
    if (s >= 75) return 'HIGH RISK';
    if (s >= 40) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  const color = getColor(clampedScore);
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d="M 10 110 A 80 80 0 0 1 190 110"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d="M 10 110 A 80 80 0 0 1 190 110"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
        />
        {/* Score text */}
        <text x="100" y="90" textAnchor="middle" fontSize="32" fontWeight="700" fill={color}>
          {clampedScore}%
        </text>
        <text x="100" y="112" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
          {getLabel(clampedScore)}
        </text>
      </svg>
    </div>
  );
}
