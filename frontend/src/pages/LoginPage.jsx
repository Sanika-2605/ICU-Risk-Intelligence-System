import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const QUICK_ACCOUNTS = [
  { label: 'Doctor (Dr. Sharma)',  role: 'DOCTOR', email: 'doctor@icu.com', password: 'doctor123' },
  { label: 'Nurse (Nurse Priya)',  role: 'NURSE',  email: 'nurse@icu.com',  password: 'nurse123'  },
  { label: 'Admin (Admin Raj)',    role: 'ADMIN',  email: 'admin@icu.com',  password: 'admin123'  },
];

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    setLoading(true);
    try {
      await login(account.email, account.password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
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

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="doctor@icu.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm tracking-wide mt-4 shadow-lg shadow-primary-600/25"
        >
          {loading ? <Spinner size="sm" /> : 'AUTHENTICATE SESSION'}
        </button>
      </form>

      {/* Quick Select */}
      <div className="pt-4 border-t border-slate-800">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">
          Quick Select Clinical Accounts
        </p>
        <div className="space-y-1.5">
          {QUICK_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={loading}
              onClick={() => handleQuickSelect(account)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 hover:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-left text-xs text-slate-400 hover:text-white border border-slate-800/60 transition-all"
            >
              <span>{account.label}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">
                {account.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
