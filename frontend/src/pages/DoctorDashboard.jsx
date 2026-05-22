import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorDashboard } from '../services/dashboardService';
import { getHighRiskPredictions } from '../services/predictionService';
import { createIntervention } from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import RecentHistoryWidget from '../components/RecentHistoryWidget';
import { SkeletonCard } from '../components/SkeletonLoader';
import { formatTimestamp } from '../utils/helpers';

const INTERVENTION_ACTIONS = {
  VAP: [
    'Increase ventilator hygiene monitoring',
    'Reposition patient (head elevation 30-45°)',
    'Review ventilator settings',
    'Schedule chest physiotherapy',
  ],
  CLABSI: [
    'Inspect central line insertion site',
    'Change central line dressing',
    'Review catheter necessity',
    'Blood culture collection',
  ],
  CAUTI: [
    'Catheter care protocol',
    'Review catheter necessity',
    'Urine culture collection',
    'Increase fluid intake monitoring',
  ],
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Intervention modal
  const [interventionModal, setInterventionModal] = useState(null);
  const [infectionType, setInfectionType] = useState('VAP');
  const [selectedAction, setSelectedAction] = useState(INTERVENTION_ACTIONS.VAP[0]);
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: '', ok: true });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3000);
  };

  const fetchData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [dashRes, histRes] = await Promise.all([
        getDoctorDashboard(),
        getHighRiskPredictions(),
      ]);
      setData(dashRes?.data || dashRes);
      setHistoryData(histRes?.data?.predictions || histRes?.predictions || histRes?.data || []);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      if (!isPoll) setError('Failed to load dashboard');
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

  const openInterventionModal = (patient) => {
    setInterventionModal(patient);
    setInfectionType('VAP');
    setSelectedAction(INTERVENTION_ACTIONS.VAP[0]);
    setPriority('medium');
    setNotes('');
  };

  const handleActionSelect = (e, patient) => {
    const val = e.target.value;
    e.target.value = '';
    if (val === 'run_prediction') navigate('/prediction');
    else if (val === 'assign_intervention') openInterventionModal(patient);
  };

  const handleInfectionChange = (type) => {
    setInfectionType(type);
    setSelectedAction(INTERVENTION_ACTIONS[type][0]);
  };

  const handleAssign = async () => {
    if (!interventionModal) return;
    setSubmitting(true);
    try {
      const actionText = notes.trim()
        ? `${selectedAction} — ${notes.trim()}`
        : selectedAction;
      await createIntervention({
        patient_id: interventionModal.id,
        action_text: actionText,
        infection_type: infectionType,
        priority,
      });
      setInterventionModal(null);
      showToast('Intervention assigned to nurse ✓', true);
    } catch {
      showToast('Failed to assign intervention', false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonCard count={3} />;
  if (error) return <div className="text-danger-600 text-center py-10 font-semibold">{error}</div>;

  const totalPatients = data?.total_patients ?? 0;
  const highRisk = data?.high_risk_count ?? 0;
  const alerts = data?.recent_alerts || [];
  const priorityPatients = (data?.priority_patients || []).sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.risk_level] ?? 3) - (order[b.risk_level] ?? 3);
  });
  const featureContributions = [
    { label: 'SpO2 Level', pct: 40, color: 'bg-danger-500' },
    { label: 'Heart Rate', pct: 25, color: 'bg-warning-500' },
    { label: 'Temperature', pct: 15, color: 'bg-primary-500' },
    { label: 'Respiratory Rate', pct: 10, color: 'bg-cyan-med' },
    { label: 'Blood Pressure', pct: 10, color: 'bg-success-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in ${
          toast.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Clinical Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Fast clinical decision support dashboard</p>
        </div>
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
        <StatCard label="Total Patients" value={totalPatients} accent="primary"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard label="High Risk Patients" value={highRisk} accent="danger" sub="Requires immediate attention"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard label="Critical Alerts" value={alerts.length} accent="warning"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
      </div>

      {/* History + Risk Factors */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <RecentHistoryWidget title="Recent High-Risk History" data={historyData} loading={isRefreshing && historyData.length === 0} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-1">Risk Factor Weights</h2>
          <p className="text-[11px] font-bold text-slate-400 mb-5 uppercase tracking-widest">Model importance</p>
          <div className="space-y-4 flex-1">
            {featureContributions.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">{f.label}</span>
                  <span className="text-xs font-extrabold text-slate-500">{f.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${f.color} transition-all duration-1000`} style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Live Priority Patients</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Sorted by highest risk — use Action to assign interventions</p>
        </div>
        {priorityPatients.length === 0 ? (
          <EmptyState title="No priority patients" message="No patients currently require attention." />
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="bg-slate-50/80 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">Risk Score</th>
                  <th className="px-6 py-3.5">Risk Level</th>
                  <th className="px-6 py-3.5">Heart Rate</th>
                  <th className="px-6 py-3.5">Blood Pressure</th>
                  <th className="px-6 py-3.5">SpO2</th>
                  <th className="px-6 py-3.5">Last Updated</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {priorityPatients.map((item, i) => {
                  const riskScore = item.risk_score ?? 0;
                  const riskLevel = item.risk_level || 'LOW';
                  const isHigh = riskLevel === 'HIGH';
                  const isMed = riskLevel === 'MEDIUM';
                  const rowBg = isHigh ? 'bg-red-50/40 hover:bg-red-50/80' : isMed ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/60';
                  return (
                    <tr key={i} className={`transition-colors ${rowBg}`}>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.patient_code || item.patient_id}</td>
                      <td className="px-6 py-4">
                        <span className={`font-extrabold ${isHigh ? 'text-danger-600' : isMed ? 'text-warning-600' : 'text-success-600'}`}>
                          {(riskScore * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4"><Badge level={riskLevel} /></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{item.heart_rate ?? '—'} <span className="text-[10px] font-bold text-slate-400">bpm</span></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{item.blood_pressure ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{item.spo2 ?? '—'}<span className="text-[10px] font-bold text-slate-400">%</span></td>
                      <td className="px-6 py-4 text-slate-500 font-semibold text-xs">{formatTimestamp(item.timestamp)}</td>
                      <td className="px-6 py-4 text-right">
                        <select
                          onChange={(e) => handleActionSelect(e, item)}
                          defaultValue=""
                          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer shadow-sm"
                        >
                          <option value="" disabled>Select Action</option>
                          <option value="run_prediction">Run Prediction</option>
                          <option value="assign_intervention">Assign Intervention</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Intervention Modal */}
      {interventionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setInterventionModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-800">Assign Intervention</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Patient: <span className="font-bold text-primary-600">{interventionModal.patient_code || interventionModal.patient_id}</span>
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Infection Type */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Infection Type</label>
                <div className="flex gap-2">
                  {['VAP', 'CLABSI', 'CAUTI'].map((type) => (
                    <button key={type} type="button" onClick={() => handleInfectionChange(type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                        infectionType === type
                          ? 'bg-primary-50 border-primary-400 text-primary-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Action</label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                >
                  {(INTERVENTION_ACTIONS[infectionType] || []).map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Priority</label>
                <div className="flex gap-2">
                  {[
                    { val: 'low',      label: 'Low',      active: 'border-slate-400 text-slate-700 bg-slate-50' },
                    { val: 'medium',   label: 'Medium',   active: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
                    { val: 'high',     label: 'High',     active: 'border-orange-400 text-orange-700 bg-orange-50' },
                    { val: 'critical', label: 'Critical', active: 'border-red-500 text-red-700 bg-red-50' },
                  ].map((p) => (
                    <button key={p.val} type="button" onClick={() => setPriority(p.val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                        priority === p.val ? p.active : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Custom Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional instructions for nurse..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={handleAssign}
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-primary-600/25 cursor-pointer"
              >
                {submitting ? 'Assigning...' : 'Assign to Nurse'}
              </button>
              <button
                onClick={() => setInterventionModal(null)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
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
