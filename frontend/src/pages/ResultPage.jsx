import { useLocation, Link } from 'react-router-dom';
import Badge from '../components/Badge';
import AlertCard from '../components/AlertCard';

const FEATURE_LABELS = {
  ventilator_duration:   'Ventilator Duration',
  catheter_duration:     'Catheter Duration',
  central_line_duration: 'Central Line Duration',
  fio2:                  'FiO₂ (Oxygen Fraction)',
  peep:                  'PEEP',
  wbc_count:             'WBC Count',
  temperature:           'Temperature',
  heart_rate:            'Heart Rate',
  creatinine:            'Creatinine',
  lactate:               'Lactate',
  spo2:                  'SpO₂',
  respiratory_rate:      'Respiratory Rate',
  blood_pressure_sys:    'Systolic BP',
  glucose:               'Glucose',
  platelet_count:        'Platelet Count',
};

const INFECTION_META = {
  vap:    { label: 'VAP',    full: 'Ventilator-Associated Pneumonia',      color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  clabsi: { label: 'CLABSI', full: 'Central Line Bloodstream Infection',   color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  cauti:  { label: 'CAUTI',  full: 'Catheter-Associated UTI',              color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
};

function RiskBar({ score, level }) {
  const color = level === 'HIGH' ? 'bg-red-500' : level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{(score * 100).toFixed(1)}% probability</span>
        <span className={`font-bold ${level === 'HIGH' ? 'text-red-600' : level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}`}>{level}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score * 100}%` }} />
      </div>
    </div>
  );
}

function ShapFeatures({ shap }) {
  if (!shap) return null;
  const features = Object.values(shap);
  return (
    <div className="mt-3 space-y-1.5">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className={`font-bold text-lg leading-none ${f.direction === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
            {f.direction === 'up' ? '↑' : '↓'}
          </span>
          <span className="font-semibold text-slate-700">{FEATURE_LABELS[f.name] || f.name}</span>
          <span className="text-slate-400">= {f.value}</span>
          <span className={`ml-auto font-bold ${f.direction === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
            {f.direction === 'up' ? '+' : ''}{(f.shap * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ResultPage() {
  const { state } = useLocation();
  const prediction = state?.prediction;
  const vitals     = state?.vitals;

  if (!prediction) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <p className="text-slate-500 mb-4">No prediction data found.</p>
        <Link to="/prediction" className="text-primary-600 font-medium hover:underline">Run a new prediction</Link>
      </div>
    );
  }

  const overallRisk = prediction.overall_risk || 'LOW';
  const isHigh = overallRisk === 'HIGH';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prediction Result</h1>
          <p className="text-sm text-slate-500 mt-1">ICU Infection Risk Assessment</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase">Overall Risk</span>
          <Badge level={overallRisk} />
        </div>
      </div>

      {isHigh && (
        <AlertCard
          type="critical"
          title="Immediate Attention Required"
          message="This patient shows high risk for ICU-acquired infection. Clinical intervention recommended."
        />
      )}

      {/* Infection Score Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {['vap', 'clabsi', 'cauti'].map((inf) => {
          const meta  = INFECTION_META[inf];
          const score = prediction[`${inf}_score`] ?? 0;
          const level = prediction[`${inf}_level`] || 'LOW';
          const shap  = prediction[`shap_${inf}`];
          return (
            <div key={inf} className={`rounded-2xl border ${meta.border} ${meta.bg} p-5`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className={`text-lg font-extrabold ${meta.color}`}>{meta.label}</p>
                  <p className="text-[11px] text-slate-500 font-semibold">{meta.full}</p>
                </div>
                <span className={`text-2xl font-extrabold ${meta.color}`}>{(score * 100).toFixed(0)}%</span>
              </div>
              <RiskBar score={score} level={level} />
              {shap && (
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Top Contributing Factors</p>
                  <ShapFeatures shap={shap} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submitted vitals */}
      {vitals && Object.keys(vitals).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Submitted Vitals</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(vitals).map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{FEATURE_LABELS[k] || k.replace(/_/g, ' ')}</p>
                <p className="text-base font-extrabold text-slate-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          to="/prediction"
          className="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors"
        >
          New Prediction
        </Link>
        <Link
          to="/history"
          className="px-6 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-300 hover:border-primary-400 transition-colors"
        >
          View History
        </Link>
      </div>
    </div>
  );
}
