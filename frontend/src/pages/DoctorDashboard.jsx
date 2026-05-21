import { useState, useEffect } from 'react';
import { getDoctorDashboard } from '../services/dashboardService';
import { getHighRiskPredictions } from '../services/predictionService';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';
import RecentHistoryWidget from '../components/RecentHistoryWidget';
import { SkeletonCard } from '../components/SkeletonLoader';
import { formatTimestamp } from '../utils/helpers';

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [dashRes, histRes] = await Promise.all([
        getDoctorDashboard(),
        getHighRiskPredictions()
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

  if (loading) return <SkeletonCard count={3} />;
  if (error) return <div className="text-danger-600 text-center py-10 font-semibold">{error}</div>;

  const totalPatients = data?.total_patients ?? 0;
  const highRisk = data?.high_risk_count ?? 0;
  const alerts = data?.recent_alerts || [];
  const priorityPatients = data?.priority_patients || [];
  const featureContributions = [
    { label: 'SpO2 Level', pct: 40, color: 'bg-danger-500' },
    { label: 'Heart Rate', pct: 25, color: 'bg-warning-500' },
    { label: 'Temperature', pct: 15, color: 'bg-primary-500' },
    { label: 'Respiratory Rate', pct: 10, color: 'bg-cyan-med' },
    { label: 'Blood Pressure', pct: 10, color: 'bg-success-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Clinical Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Fast clinical decision support dashboard</p>
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
          label="Total Patients"
          value={totalPatients}
          accent="primary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="High Risk Patients"
          value={highRisk}
          accent="danger"
          sub="Requires immediate attention"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Critical Alerts"
          value={alerts.length}
          accent="warning"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      </div>

      {/* Grid Layout for History Widget & Priority Patients */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Recent Patient History Widget (Takes 2/3 space) */}
        <div className="lg:col-span-2 flex flex-col">
          <RecentHistoryWidget 
            title="Recent High-Risk History"
            data={historyData}
            loading={isRefreshing && historyData.length === 0} 
          />
        </div>

        {/* Feature Contribution Section (Takes 1/3 space) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full">
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
          <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Sorted by highest risk</p>
        </div>
        {priorityPatients.length === 0 ? (
          <EmptyState title="No priority patients" message="No high-risk patients currently require attention." />
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="bg-slate-50/80 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Patient ID</th>
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
                  const p = item.patient || item;
                  const riskScore = item.risk_score ?? p.risk_score ?? 0;
                  const riskLevel = item.risk_level || p.risk_level || 'LOW RISK';
                  const isHigh = riskLevel.includes('HIGH');
                  const isMed = riskLevel.includes('MEDIUM');
                  const rowBg = isHigh ? 'bg-red-50/40 hover:bg-red-50/80' : isMed ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/60';
                  const riskDisplay = riskLevel.includes('HIGH') ? 'HIGH' : riskLevel.includes('MEDIUM') ? 'MEDIUM' : 'LOW';

                  return (
                    <tr key={i} className={`transition-colors ${rowBg}`}>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.patient_id || p.id}</td>
                      <td className="px-6 py-4">
                        <span className={`font-extrabold ${isHigh ? 'text-danger-600' : isMed ? 'text-warning-600' : 'text-success-600'}`}>
                          {(riskScore * (riskScore <= 1 ? 100 : 1)).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4"><Badge level={riskDisplay} /></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.heart_rate ?? '—'} <span className="text-[10px] font-bold text-slate-400">bpm</span></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.blood_pressure ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{p.spo2 ?? '—'}<span className="text-[10px] font-bold text-slate-400">%</span></td>
                      <td className="px-6 py-4 text-slate-500 font-semibold text-xs">{formatTimestamp(item.timestamp || p.updated_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 cursor-pointer shadow-sm">
                          <option>Select Action</option>
                          <option>ICU Admission</option>
                          <option>Monitor Closely</option>
                          <option>Mark Stable</option>
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

    </div>
  );
}
