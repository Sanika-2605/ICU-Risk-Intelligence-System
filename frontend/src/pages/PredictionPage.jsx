import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPrediction } from '../services/predictionService';
import { getAllPatients, addPatient, updatePatient } from '../services/patientService';
import { validateVital } from '../utils/validators';
import Spinner from '../components/Spinner';

const initialForm = {
  patient_id: '',
  age: '',
  heart_rate: '',
  systolic_bp: '',
  diastolic_bp: '',
  spo2: '',
  temperature: '',
  respiratory_rate: '',
};

const fields = [
  { key: 'patient_id', label: 'Patient ID', type: 'text', placeholder: 'e.g. ICU-001' },
  { key: 'age', label: 'Age', type: 'number', placeholder: '0 – 120' },
  { key: 'heart_rate', label: 'Heart Rate (bpm)', type: 'number', placeholder: '20 – 250' },
  { key: 'systolic_bp', label: 'Systolic BP (mmHg)', type: 'number', placeholder: '50 – 300' },
  { key: 'diastolic_bp', label: 'Diastolic BP (mmHg)', type: 'number', placeholder: '20 – 200' },
  { key: 'spo2', label: 'SpO2 (%)', type: 'number', placeholder: '50 – 100' },
  { key: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: '30 – 45' },
  { key: 'respiratory_rate', label: 'Respiratory Rate', type: 'number', placeholder: '5 – 60' },
];

export default function PredictionPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.patient_id.trim()) errs.patient_id = 'Patient ID is required';
    fields.forEach((f) => {
      if (f.key === 'patient_id') return;
      if (!form[f.key]) {
        errs[f.key] = `${f.label} is required`;
      } else {
        const vErr = validateVital(f.key, form[f.key]);
        if (vErr) errs[f.key] = vErr;
      }
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    
    setLoading(true);
    setApiError('');
    
    try {
      // 1. Check if patient exists
      const patientsRes = await getAllPatients();
      const patients = patientsRes?.data?.patients || patientsRes?.patients || [];
      const existingPatient = patients.find(p => p.patient_id === form.patient_id);

      const bloodPressure = `${form.systolic_bp}/${form.diastolic_bp}`;
      const patientData = {
        patient_id: form.patient_id,
        age: parseInt(form.age),
        heart_rate: parseFloat(form.heart_rate),
        blood_pressure: bloodPressure,
        spo2: parseFloat(form.spo2),
        temperature: parseFloat(form.temperature),
        respiratory_rate: parseFloat(form.respiratory_rate)
      };

      let dbId;
      if (existingPatient) {
        // Update existing patient vitals
        await updatePatient(existingPatient.id, patientData);
        dbId = existingPatient.id;
      } else {
        // Add new patient profile
        const addRes = await addPatient(patientData);
        const newPatient = addRes?.data || addRes;
        dbId = newPatient.id;
      }

      // 2. Submit ML Prediction using the integer primary key
      const predRes = await submitPrediction({ patient_id: dbId });
      const prediction = predRes?.data || predRes;

      navigate('/predictions/result', { state: { prediction, vitals: patientData } });
      
    } catch (err) {
      console.error('Prediction Error:', err);
      setApiError(err.response?.data?.message || err.response?.data?.error || 'Prediction calculation failed. Please verify vitals and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">ICU Risk Prediction</h1>
        <p className="text-sm text-slate-400 mt-1">Submit patient vitals to generate a machine learning risk assessment</p>
      </div>

      {apiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-danger-700 text-sm font-semibold flex items-center gap-3">
           <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8">
        
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-700 tracking-wide uppercase">Patient Vitals Profile</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-x-6 gap-y-5">
          {fields.map((f) => (
            <div key={f.key} className={f.key === 'patient_id' ? 'md:col-span-2' : ''}>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
              <input
                type={f.type}
                name={f.key}
                value={form[f.key]}
                onChange={handleChange}
                placeholder={f.placeholder}
                step={f.type === 'number' ? 'any' : undefined}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                  errors[f.key] ? 'border-danger-400 focus:ring-danger-500' : 'border-slate-200 hover:border-slate-300'
                }`}
              />
              {errors[f.key] && <p className="text-xs font-semibold text-danger-500 mt-1.5">{errors[f.key]}</p>}
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-end pt-6 border-t border-slate-50">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm shadow-lg shadow-primary-500/30 tracking-wide uppercase"
          >
            {loading ? <><Spinner size="sm" /> Processing ML Model...</> : 'Run ML Prediction'}
          </button>
        </div>
      </form>
    </div>
  );
}
