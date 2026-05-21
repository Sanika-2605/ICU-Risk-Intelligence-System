import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginUser } from '../services/authService';
import { validateEmail, validatePassword } from '../utils/validators';
import Spinner from '../components/Spinner';

const DEMO_CREDENTIALS = [
  { email: 'doctor@icu.com', password: 'doctor123', label: 'Doctor (Dr. Sarah Chen)' },
  { email: 'nurse@icu.com', password: 'nurse123', label: 'Nurse (Emily Johnson)' },
  { email: 'admin@icu.com', password: 'admin123', label: 'Admin (Lisa Wang)' }
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const selectDemo = (cred) => {
    setForm({ email: cred.email, password: cred.password });
    setErrors({});
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);
    if (emailErr) errs.email = emailErr;
    if (passErr) errs.password = passErr;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] Form submitted with:', form.email);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const responseData = await loginUser(form.email, form.password);
      console.log('[Login] Received response:', responseData);

      // Support either nested envelope 'data' structure or flat structure
      const payload = responseData.data || responseData;
      const token = payload.token || payload.access_token;
      const user = payload.user;

      if (!token || !user || !user.role) {
        console.error('[Login] Invalid response schema:', responseData);
        setApiError('Invalid response from authentication server.');
        setLoading(false);
        return;
      }

      console.log('[Login] Authentication successful. Role:', user.role);
      
      // Store token and user in context & localStorage
      login(user, token);

      // Automatic redirect based on role
      const userRole = user.role.toLowerCase();
      if (userRole === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (userRole === 'nurse') {
        navigate('/nurse/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('[Login] Error caught:', err);
      if (err.code === 'ERR_NETWORK') {
        setApiError('Network issue: Backend server is unavailable.');
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password.';
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">Clinical Login</h2>
        <p className="text-sm text-slate-400 mt-1.5">Access the patient risk prediction platform</p>
      </div>

      {apiError && (
        <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-200 text-sm text-center">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              errors.email ? 'border-red-500' : 'border-slate-800'
            }`}
            placeholder="doctor@hospital.com"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              errors.password ? 'border-red-500' : 'border-slate-800'
            }`}
            placeholder="••••••••"
          />
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm tracking-wide mt-4 shadow-lg shadow-primary-600/25"
        >
          {loading ? <Spinner size="sm" /> : 'AUTHENTICATE SESSION'}
        </button>
      </form>

      {/* Demo Credentials Section */}
      <div className="pt-4 border-t border-slate-800">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Quick Select Clinical Accounts</p>
        <div className="space-y-1.5">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.email}
              type="button"
              onClick={() => selectDemo(cred)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 hover:bg-slate-800/80 rounded-lg text-left text-xs text-slate-400 hover:text-white border border-slate-800/60 transition-all"
            >
              <span>{cred.label}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">
                {cred.email.split('@')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

