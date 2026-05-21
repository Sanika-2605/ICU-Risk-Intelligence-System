import { useLocation, Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import RiskGauge from '../components/RiskGauge';
import AlertCard from '../components/AlertCard';
import Badge from '../components/Badge';
import { getRiskLevel } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ResultPage() {
  const { state } = useLocation();
  const prediction = state?.prediction;
  const vitals = state?.vitals;

  if (!prediction) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <p className="text-surface-500 mb-4">No prediction data found.</p>
        <Link to="/prediction" className="text-primary-600 font-medium hover:underline">Run a new prediction</Link>
      </div>
    );
  }

  const score = prediction.risk_score ?? prediction.score ?? 0;
  const riskLevel = prediction.risk_category || prediction.risk_level || getRiskLevel(score);
  const isHighRisk = score >= 75;

  const features = prediction.feature_importance || prediction.features || {
    spo2: 40, heart_rate: 25, temperature: 15, respiratory_rate: 10, systolic_bp: 10,
  };

  const chartData = {
    labels: Object.keys(features).map((k) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())),
    datasets: [{
      label: 'Contribution %',
      data: Object.values(features),
      backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { callback: (v) => v + '%' } },
      y: { grid: { display: false } },
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Prediction Result</h1>
          <p className="text-sm text-surface-500 mt-1">Patient: {vitals?.patient_id || '—'}</p>
        </div>
        <Badge level={riskLevel} />
      </div>

      {isHighRisk && (
        <AlertCard type="critical" title="Immediate Attention Required"
          message="This patient has a high-risk score. Clinical intervention is recommended immediately." />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-4">Risk Score</p>
          <RiskGauge score={score} />
          <div className="w-full mt-6">
            <div className="flex justify-between text-xs text-surface-500 mb-1">
              <span>Risk Probability</span>
              <span className="font-semibold">{score}%</span>
            </div>
            <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${score >= 75 ? 'bg-danger-500' : score >= 40 ? 'bg-warning-500' : 'bg-success-500'}`}
                style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-4">Feature Importance</p>
          <div className="h-64"><Bar data={chartData} options={chartOptions} /></div>
        </div>
      </div>

      {vitals && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-4">Submitted Vitals</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(vitals).filter(([k]) => k !== 'patient_id').map(([k, v]) => (
              <div key={k} className="bg-surface-50 rounded-lg p-3">
                <p className="text-xs text-surface-400">{k.replace(/_/g, ' ')}</p>
                <p className="text-lg font-bold text-surface-800">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/prediction" className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
          New Prediction
        </Link>
        <Link to="/history" className="px-6 py-2.5 bg-white text-surface-700 text-sm font-medium rounded-xl border border-surface-300 hover:border-primary-400 transition-colors">
          View History
        </Link>
      </div>
    </div>
  );
}
