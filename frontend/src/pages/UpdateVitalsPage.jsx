import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { runPrediction } from '../services/api';
import Spinner from '../components/Spinner';

const FIELDS = [
  { key: 'heart_rate',            label: 'Heart Rate',               unit: 'bpm',     placeholder: '60–120' },
  { key: 'blood_pressure_sys',    label: 'Blood Pressure Systolic',  unit: 'mmHg',    placeholder: '90–140' },
  { key: 'blood_pressure_dia',    label: 'Blood Pressure Diastolic', unit: 'mmHg',    placeholder: '60–90'  },
  { key: 'temperature',           label: 'Temperature',              unit: '°C',      placeholder: '36–38'  },
  { key: 'spo2',                  label: 'SpO₂',                     unit: '%',       placeholder: '95–100' },
  { key: 'respiratory_rate',      label: 'Respiratory Rate',         unit: '/min',    placeholder: '12–20'  },
  { key: 'wbc_count',             label: 'WBC Count',                unit: '×10³/µL', placeholder: '4–11'   },
  { key: 'creatinine',            label: 'Creatinine',               unit: 'mg/dL',   placeholder: '0.6–1.2'},
  { key: 'lactate',               label: 'Lactate',                  unit: 'mmol/L',  placeholder: '0.5–2'  },
  { key: 'glucose',               label: 'Glucose',                  unit: 'mg/dL',   placeholder: '70–140' },
  { key: 'platelet_count',        label: 'Platelet Count',           unit: '×10³/µL', placeholder: '150–400'},
  { key: 'ventilator_duration',   label: 'Ventilator Duration',      unit: 'hrs',     placeholder: '0–720'  },
  { key: 'fio2',                  label: 'FiO₂',                     unit: '0–1',     placeholder: '0.21–1' },
  { key: 'peep',                  label: 'PEEP',                     unit: 'cmH₂O',  placeholder: '0–20'   },
  { key: 'catheter_duration',     label: 'Catheter Duration',        unit: 'hrs',     placeholder: '0–720'  },
  { key: 'central_line_duration', label: 'Central Line Duration',    unit: 'hrs',     placeholder: '0–720'  },
];

const riskColor = (level) =>
  level === 'HIGH'   ? 'text-red-700 bg-red-50 border-red-200'     :
  level === 'MEDIUM' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                       'text-emerald-700 bg-emerald-50 border-emerald-200';

export default function UpdateVitalsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const patient = state?.patient;

  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <p className="text-slate-500 mb-4">No patient selected. Please go back and click Update on a patient.</p>
        <button onClick={() => navigate('/nurse/dashboard')} className="text-primary-600 font-semibold hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const vitals = { patient_id: patient.id };
      FIELDS.forEach(({ key }) => {
        const v = form[key];
        if (v !== '' && v !== undefined) vitals[key] = parseFloat(v);
      });

      const res = await runPrediction(vitals);
      const prediction = res.data.prediction;
      setResult(prediction);
      setTimeout(() => navigate('/nurse/dashboard'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update vitals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Update Patient Vitals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Patient: <span className="font-bold text-primary-600">{patient.patient_code || patient.patient_id}</span>
          {' '}— Enter any available vitals. Missing fields use training medians.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-danger-700 text-sm font-semibold flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl animate-fade-in">
          <p className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Vitals updated and risk assessed
          </p>
          <div className="flex gap-3 flex-wrap">
            {['vap', 'clabsi', 'cauti'].map((inf) => (
              <div key={inf} className={`px-4 py-2 rounded-xl border text-sm font-bold ${riskColor(result[`${inf}_level`])}`}>
                <span className="uppercase">{inf}</span>: {((result[`${inf}_score`] || 0) * 100).toFixed(1)}%
                <span className="ml-1.5 text-xs opacity-70">({result[`${inf}_level`]})</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Returning to dashboard in 3 seconds…
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Vitals &amp; Device Data</h2>
          <span className="text-xs text-slate-400 font-semibold">(all fields optional)</span>
        </div>

        <div className="grid md:grid-cols-3 gap-x-5 gap-y-4">
          {FIELDS.map(({ key, label, unit, placeholder }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {label} <span className="text-slate-400 normal-case font-semibold">({unit})</span>
              </label>
              <input
                type="number"
                name={key}
                value={form[key] ?? ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                step="any"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <button
            type="button"
            onClick={() => navigate('/nurse/dashboard')}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !!result}
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm shadow-lg shadow-primary-500/30 tracking-wide uppercase"
          >
            {loading ? <><Spinner size="sm" /> Updating…</> : 'Update & Assess Risk'}
          </button>
        </div>
      </form>
    </div>
  );
}
