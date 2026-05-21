import { useState } from 'react';
import { addPatient } from '../services/patientService';
import Spinner from '../components/Spinner';

const initialForm = {
  patient_id: '', heart_rate: '', systolic_bp: '', diastolic_bp: '', spo2: '', temperature: '', respiratory_rate: '',
};

export default function UpdateVitalsPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(''); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id.trim()) { setError('Patient ID is required'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await addPatient({
        patient_id: form.patient_id,
        heart_rate: parseFloat(form.heart_rate),
        systolic_bp: parseFloat(form.systolic_bp),
        diastolic_bp: parseFloat(form.diastolic_bp),
        spo2: parseFloat(form.spo2),
        temperature: parseFloat(form.temperature),
        respiratory_rate: parseFloat(form.respiratory_rate),
      });
      setSuccess('Vitals updated successfully.');
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vitals.');
    }
    setLoading(false);
  };

  const fields = [
    { key: 'patient_id', label: 'Patient ID', type: 'text' },
    { key: 'heart_rate', label: 'Heart Rate (bpm)', type: 'number' },
    { key: 'systolic_bp', label: 'Systolic BP', type: 'number' },
    { key: 'diastolic_bp', label: 'Diastolic BP', type: 'number' },
    { key: 'spo2', label: 'SpO2 (%)', type: 'number' },
    { key: 'temperature', label: 'Temperature (°C)', type: 'number' },
    { key: 'respiratory_rate', label: 'Respiratory Rate', type: 'number' },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Update Patient Vitals</h1>
        <p className="text-sm text-surface-500 mt-1">Enter or update vitals for a patient record</p>
      </div>
      {success && <div className="mb-4 p-3 bg-green-50 border border-success-400 text-success-600 text-sm rounded-xl">{success}</div>}
      {error && <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-600 text-sm rounded-xl">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 lg:p-8 space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">{f.label}</label>
            <input type={f.type} name={f.key} value={form[f.key]} onChange={handleChange} step="any"
              className="w-full px-4 py-2.5 rounded-lg border border-surface-200 text-sm bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all" />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-4">
          {loading ? <Spinner size="sm" /> : 'Submit Vitals'}
        </button>
      </form>
    </div>
  );
}
