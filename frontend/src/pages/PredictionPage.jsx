import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients, runPrediction } from '../services/api';
import Spinner from '../components/Spinner';

const VITALS_FIELDS = [
  { key: 'heart_rate',          label: 'Heart Rate (bpm)',         placeholder: '60 – 120' },
  { key: 'temperature',         label: 'Temperature (°C)',          placeholder: '36 – 38' },
  { key: 'spo2',                label: 'SpO₂ (%)',                  placeholder: '95 – 100' },
  { key: 'respiratory_rate',    label: 'Respiratory Rate (/min)',   placeholder: '12 – 20' },
  { key: 'blood_pressure_sys',  label: 'Systolic BP (mmHg)',        placeholder: '90 – 140' },
  { key: 'wbc_count',           label: 'WBC Count (×10³/µL)',       placeholder: '4 – 11' },
  { key: 'creatinine',          label: 'Creatinine (mg/dL)',        placeholder: '0.6 – 1.2' },
  { key: 'lactate',             label: 'Lactate (mmol/L)',          placeholder: '0.5 – 2' },
  { key: 'glucose',             label: 'Glucose (mg/dL)',           placeholder: '70 – 140' },
  { key: 'platelet_count',      label: 'Platelet Count (×10³/µL)', placeholder: '150 – 400' },
  { key: 'fio2',                label: 'FiO₂ (0–1 fraction)',      placeholder: '0.21 – 1.0' },
  { key: 'peep',                label: 'PEEP (cmH₂O)',             placeholder: '0 – 20' },
  { key: 'ventilator_duration', label: 'Ventilator Duration (hrs)', placeholder: '0 – 720' },
  { key: 'catheter_duration',   label: 'Catheter Duration (hrs)',   placeholder: '0 – 720' },
  { key: 'central_line_duration', label: 'Central Line Duration (hrs)', placeholder: '0 – 720' },
];

export default function PredictionPage() {
  const [patients, setPatients]   = useState([]);
  const [patientId, setPatientId] = useState('');
  const [form, setForm]           = useState({});
  const [apiError, setApiError]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getPatients()
      .then((res) => setPatients(res.data || []))
      .catch(() => setApiError('Failed to load patients.'))
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) { setApiError('Please select a patient.'); return; }

    setLoading(true);
    setApiError('');

    try {
      const vitals = {};
      VITALS_FIELDS.forEach(({ key }) => {
        const v = form[key];
        if (v !== '' && v !== undefined) vitals[key] = parseFloat(v);
      });

      const res = await runPrediction({ patient_id: patientId, ...vitals });
      navigate('/predictions/result', { state: { prediction: res.data.prediction, vitals } });
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">ICU Risk Prediction</h1>
        <p className="text-sm text-slate-400 mt-1">
          Select a patient, enter available vitals, and run the ML model (VAP · CLABSI · CAUTI)
        </p>
      </div>

      {apiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-danger-700 text-sm font-semibold flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6">

        {/* Patient selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Patient
          </label>
          {fetching ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><Spinner size="sm" /> Loading patients…</div>
          ) : (
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="">— Choose a patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patient_code} · Age {p.age} · {p.gender}
                  {p.latest_prediction ? ` · Last risk: ${p.latest_prediction.overall_risk}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Vitals grid */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Patient Vitals</h2>
            <span className="text-xs text-slate-400 font-semibold">(all fields optional — missing values use training medians)</span>
          </div>
          <div className="grid md:grid-cols-3 gap-x-5 gap-y-4">
            {VITALS_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                <input
                  type="number"
                  name={key}
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  placeholder={placeholder}
                  step="any"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-50">
          <button
            type="submit"
            disabled={loading || fetching}
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm shadow-lg shadow-primary-500/30 tracking-wide uppercase"
          >
            {loading ? <><Spinner size="sm" /> Running ML Models…</> : 'Run ML Prediction'}
          </button>
        </div>
      </form>
    </div>
  );
}
