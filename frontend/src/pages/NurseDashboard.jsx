import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNurseDashboard } from '../services/dashboardService';
import { getAllPredictions } from '../services/predictionService';
import { getNurseTasks, updateNurseTask, createPatient } from '../services/api';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';
import RecentHistoryWidget from '../components/RecentHistoryWidget';
import { SkeletonCard } from '../components/SkeletonLoader';
import Spinner from '../components/Spinner';

const PRIORITY_BORDER = {
  critical: 'border-red-400 bg-red-50/30',
  high:     'border-orange-400 bg-orange-50/30',
  medium:   'border-yellow-400 bg-yellow-50/20',
  low:      'border-slate-300 bg-slate-50/20',
};
const PRIORITY_DOT = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-slate-400',
};
const PRIORITY_BADGE = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-slate-100 text-slate-600',
};

export default function NurseDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [tasks, setTasks] = useState([]);
  const [taskNotes, setTaskNotes] = useState({});
  const [completingTask, setCompletingTask] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [completedCount, setCompletedCount] = useState(0);

  const [toast, setToast] = useState({ msg: '', ok: true });
  const [addPatientModal, setAddPatientModal] = useState(false);
  const [patientForm, setPatientForm] = useState({ patient_code: '', age: '', gender: 'Male', bmi: '' });
  const [addingPatient, setAddingPatient] = useState(false);
  const [addPatientError, setAddPatientError] = useState('');

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3000);
  };

  const fetchData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [dashRes, histRes, tasksRes] = await Promise.all([
        getNurseDashboard(),
        getAllPredictions(),
        getNurseTasks().catch(() => ({ data: [] })),
      ]);
      setData(dashRes?.data || dashRes);
      setRecentHistory(histRes?.data?.predictions || histRes?.predictions || histRes?.data || []);
      const raw = tasksRes?.data || [];
      setTasks(raw);
      setLastUpdated(new Date());
    } catch {
      // silent on poll
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

  const handleCompleteTask = async (taskId) => {
    setCompletingTask(taskId);
    try {
      await updateNurseTask(taskId, {
        task_status: 'completed',
        notes: taskNotes[taskId] || 'Completed by nurse',
      });
      setCompletedIds((prev) => new Set([...prev, taskId]));
      setCompletedCount((c) => c + 1);
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCompletedIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
      }, 1800);
      showToast('Task marked as complete ✓', true);
    } catch {
      showToast('Failed to complete task', false);
    } finally {
      setCompletingTask(null);
    }
  };

  const handleAddPatient = async () => {
    if (!patientForm.patient_code.trim()) {
      setAddPatientError('Patient code is required');
      return;
    }
    setAddingPatient(true);
    setAddPatientError('');
    try {
      await createPatient({
        patient_code: patientForm.patient_code.trim(),
        age: patientForm.age ? parseInt(patientForm.age) : null,
        gender: patientForm.gender,
        bmi: patientForm.bmi ? parseFloat(patientForm.bmi) : null,
      });
      setAddPatientModal(false);
      setPatientForm({ patient_code: '', age: '', gender: 'Male', bmi: '' });
      showToast('Patient added successfully ✓', true);
      fetchData();
    } catch (err) {
      setAddPatientError(err.response?.data?.detail || 'Failed to add patient');
    } finally {
      setAddingPatient(false);
    }
  };

  if (loading) return <SkeletonCard count={3} />;

  const patientVitals = data?.patient_vitals || [];
  const activeAlerts = data?.active_alerts || [];
  const monitoringCount = data?.monitoring_count ?? patientVitals.length;
  const criticalCount = patientVitals.filter(
    (pv) => pv.latest_risk?.risk_level?.includes('HIGH')
  ).length;
  const pendingTasks = tasks.filter((t) => !completedIds.has(t.id));

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
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Patient Monitoring</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time vitals and patient status tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddPatientModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </button>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 border-r border-slate-100 pr-3">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Updated:</span>
              <span className="text-xs font-bold text-slate-700">{lastUpdated.toLocaleTimeString()}</span>
              {isRefreshing && (
                <svg className="w-3.5 h-3.5 text-primary-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Active Patients" value={monitoringCount} accent="primary"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard label="Critical Patients" value={criticalCount} accent="danger" sub="Needs immediate care"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard label="Completed Today" value={completedCount} accent="success"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* History + Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-72">
          <RecentHistoryWidget title="Recently Monitored Patients" data={recentHistory} loading={isRefreshing && recentHistory.length === 0} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-72">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse"></div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Live Alerts</h2>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {activeAlerts.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState title="No active alerts" message="No critical alerts currently triggered." />
              </div>
            ) : (
              activeAlerts.map((a, i) => (
                <AlertCard key={i} type={a.alert_level === 'critical' ? 'critical' : 'warning'}
                  title={`Patient ${a.patient_id}`} message={a.alert_message} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vitals Monitor Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Patient Vitals Monitor</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Click Update to enter vitals and run risk assessment</p>
        </div>
        {patientVitals.length === 0 ? (
          <EmptyState title="No patients" message="No patients are currently being monitored." />
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="bg-slate-50/80 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">Heart Rate</th>
                  <th className="px-6 py-3.5">Blood Pressure</th>
                  <th className="px-6 py-3.5">SpO2</th>
                  <th className="px-6 py-3.5">Temperature</th>
                  <th className="px-6 py-3.5">Risk Level</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patientVitals.map((pv, i) => {
                  const riskLevel = pv.latest_risk?.risk_level || '';
                  const isHigh = riskLevel.includes('HIGH');
                  const isMed = riskLevel.includes('MEDIUM');
                  const statusStyle = isHigh ? 'text-danger-600 bg-red-50' : isMed ? 'text-warning-600 bg-amber-50' : 'text-success-600 bg-emerald-50';
                  const statusLabel = isHigh ? 'Critical' : isMed ? 'Watch' : 'Stable';
                  return (
                    <tr key={i} className={`transition-colors ${isHigh ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50/60'}`}>
                      <td className="px-6 py-4 font-bold text-slate-800">{pv.patient_code || pv.patient_id}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{pv.heart_rate ?? '—'} <span className="text-[10px] font-bold text-slate-400">bpm</span></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{pv.blood_pressure ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{pv.spo2 ?? '—'}<span className="text-[10px] font-bold text-slate-400">%</span></td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{pv.temperature ?? '—'}<span className="text-[10px] font-bold text-slate-400">°C</span></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/nurse/update-vitals', { state: { patient: pv } })}
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

      {/* Assigned Tasks */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Assigned Tasks</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Tasks assigned by doctor</p>
          </div>
          {pendingTasks.length > 0 && (
            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg">
              {pendingTasks.length} Pending
            </span>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-600">No tasks assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">Doctor interventions will appear here</p>
          </div>
        ) : (
          <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => {
              const inv = task.intervention || {};
              const pri = inv.priority || 'medium';
              const isCompleted = completedIds.has(task.id);
              const isCompleting = completingTask === task.id;

              return (
                <div
                  key={task.id}
                  className={`rounded-xl border-2 p-4 transition-all duration-700 ${
                    isCompleted
                      ? 'border-emerald-400 bg-emerald-50'
                      : (PRIORITY_BORDER[pri] || 'border-slate-200 bg-white')
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[pri] || 'bg-slate-400'}`}></div>
                      <span className="font-extrabold text-slate-800 text-sm">{task.patient_code || 'Unknown'}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${PRIORITY_BADGE[pri] || 'bg-slate-100 text-slate-600'}`}>
                      {pri}
                    </span>
                  </div>

                  {inv.infection_type && (
                    <span className="inline-block text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-md mb-2 uppercase tracking-wider">
                      {inv.infection_type}
                    </span>
                  )}

                  <p className="text-sm text-slate-700 font-medium mb-3 leading-relaxed">
                    {inv.action_text || 'No action specified'}
                  </p>

                  <div className="mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isCompleted ? 'Completed ✓' : 'Pending'}
                    </span>
                  </div>

                  {!isCompleted && (
                    <>
                      <input
                        type="text"
                        placeholder="Add notes (optional)..."
                        value={taskNotes[task.id] || ''}
                        onChange={(e) => setTaskNotes((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        className="w-full px-3 py-2 mb-3 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                      />
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={isCompleting}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isCompleting ? <><Spinner size="sm" /> Completing...</> : 'Mark Complete ✓'}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {addPatientModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setAddPatientModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-800">Add New Patient</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Register a new ICU patient</p>
            </div>
            <div className="p-6 space-y-4">
              {addPatientError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">{addPatientError}</div>
              )}
              {[
                { key: 'patient_code', label: 'Patient Code (e.g. ICU_204)', type: 'text' },
                { key: 'age', label: 'Age', type: 'number' },
                { key: 'bmi', label: 'BMI (optional)', type: 'number' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={patientForm[f.key] || ''}
                    onChange={(e) => setPatientForm({ ...patientForm, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Gender</label>
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={handleAddPatient}
                disabled={addingPatient}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                {addingPatient ? 'Adding...' : 'Add Patient'}
              </button>
              <button
                onClick={() => { setAddPatientModal(false); setAddPatientError(''); }}
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
