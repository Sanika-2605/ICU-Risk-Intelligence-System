import { useState, useEffect } from 'react';
import { getNurseDashboard } from '../services/dashboardService';
import { updatePatient } from '../services/patientService';
import { getAllPredictions } from '../services/predictionService';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';
import RecentHistoryWidget from '../components/RecentHistoryWidget';
import { SkeletonCard } from '../components/SkeletonLoader';

export default function NurseDashboard() {
  const [data, setData] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [modal, setModal] = useState(null);
  const [vitalsForm, setVitalsForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [dashRes, histRes] = await Promise.all([
        getNurseDashboard(),
        getAllPredictions()
      ]);
      setData(dashRes?.data || dashRes);
      
      const historyList = histRes?.data?.predictions || histRes?.predictions || histRes?.data || [];
      // For Nurse, just show recent monitored history regardless of risk (latest first)
      setRecentHistory(historyList);
      
      setLastUpdated(new Date());
    } catch {
      // silent fail on poll
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (patient) => {
    setModal(patient);
    setVitalsForm({
      heart_rate: patient.heart_rate || '',
      blood_pressure: patient.blood_pressure || '',
      spo2: patient.spo2 || '',
      temperature: patient.temperature || '',
      respiratory_rate: patient.respiratory_rate || '',
    });
  };

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      await updatePatient(modal.id, vitalsForm);
      setModal(null);
      fetchData(); // Trigger immediate refresh
    } catch { /* silent */ }
    setSaving(false);
  };

  if (loading) return <SkeletonCard count={3} />;

  const patientVitals = data?.patient_vitals || [];
  const activeAlerts = data?.active_alerts || [];
  const monitoringCount = data?.monitoring_count ?? patientVitals.length;
  const criticalCount = patientVitals.filter(
    (pv) => pv.latest_risk && pv.latest_risk.risk_level?.includes('HIGH')
  ).length;
  const updatedToday = data?.recently_updated?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Patient Monitoring</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time vitals and patient status tracking</p>
        </div>
        
        {/* Real-time Indicator */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 border-r border-slate-100 pr-3">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Updated:</span>
            <span className="text-xs font-bold text-slate-700">{lastUpdated.toLocaleTimeString()}</span>
            {isRefreshing && (
              <svg className="w-3.5 h-3.5 text-primary-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Active Patients"
          value={monitoringCount}
          accent="primary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Critical Patients"
          value={criticalCount}
          accent="danger"
          sub="Needs immediate care"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Updates Today"
          value={updatedToday}
          accent="success"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Grid Layout for History Widget & Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Recent Patient History Widget (Takes 2/3 space) */}
        <div className="lg:col-span-2 flex flex-col h-72">
          <RecentHistoryWidget 
            title="Recently Monitored Patients"
            data={recentHistory}
            loading={isRefreshing && recentHistory.length === 0}
          />
        </div>

        {/* Alert Notification Panel (Takes 1/3 space) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-72">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse"></div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Live Alerts</h2>
            </div>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {activeAlerts.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState title="No active alerts" message="No critical alerts currently triggered." />
              </div>
            ) : (
              activeAlerts.map((a, i) => (
                <AlertCard
                  key={i}
                  type={a.alert_level === 'critical' ? 'critical' : 'warning'}
                  title={`Patient ${a.patient_id}`}
                  message={a.alert_message}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* Monitoring Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Patient Vitals Monitor</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Click Update Vitals to modify patient records</p>
          </div>
        </div>
        {patientVitals.length === 0 ? (
          <EmptyState title="No patients" message="No patients are currently being monitored." />
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="bg-slate-50/80 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Patient ID</th>
                  <th className="px-6 py-3.5">Heart Rate</th>
                  <th className="px-6 py-3.5">Blood Pressure</th>
                  <th className="px-6 py-3.5">SpO2</th>
                  <th className="px-6 py-3.5">Temperature</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patientVitals.map((pv, i) => {
                  const p = pv.patient || pv;
                  const risk = pv.latest_risk;
                  const riskLevel = risk?.risk_level || '';
                  const isHigh = riskLevel.includes('HIGH');
                  const isMed = riskLevel.includes('MEDIUM');

                  let status = 'Stable';
                  let statusIcon = '↓';
                  let statusStyle = 'text-success-600 bg-emerald-50';
                  if (isHigh) {
                    status = 'Worsening';
                    statusIcon = '↑';
                    statusStyle = 'text-danger-600 bg-red-50';
                  } else if (isMed) {
                    status = 'Watch';
                    statusIcon = '→';
                    statusStyle = 'text-warning-600 bg-amber-50';
                  }

                  return (
                    <tr key={i} className={`transition-colors ${isHigh ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50/60'}`}>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.patient_id}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.heart_rate ?? '—'} <span className="text-[10px] font-bold text-slate-400">bpm</span></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.blood_pressure ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.spo2 ?? '—'}<span className="text-[10px] font-bold text-slate-400">%</span></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.temperature ?? '—'}<span className="text-[10px] font-bold text-slate-400">°C</span></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${statusStyle}`}>
                          <span>{statusIcon}</span> {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openModal(p)}
                          className="text-xs font-extrabold text-cyan-med hover:text-cyan-med-hover bg-cyan-med/10 hover:bg-cyan-med/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Vitals Modal */}
      {modal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Update Patient Vitals</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Patient: <span className="font-bold text-primary-600">{modal.patient_id}</span></p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'heart_rate', label: 'Heart Rate (bpm)' },
                { key: 'blood_pressure', label: 'Blood Pressure (e.g. 120/80)' },
                { key: 'spo2', label: 'SpO2 (%)' },
                { key: 'temperature', label: 'Temperature (°C)' },
                { key: 'respiratory_rate', label: 'Respiratory Rate' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{f.label}</label>
                  <input
                    type={f.key === 'blood_pressure' ? 'text' : 'number'}
                    value={vitalsForm[f.key] || ''}
                    step="any"
                    onChange={(e) => setVitalsForm({ ...vitalsForm, [f.key]: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-med/50 focus:border-cyan-med transition-all shadow-sm"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-cyan-med hover:bg-cyan-med-hover disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors cursor-pointer shadow-lg shadow-cyan-med/25"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
