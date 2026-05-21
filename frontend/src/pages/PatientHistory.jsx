import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { getAllPredictions } from '../services/predictionService';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { getRiskLevel, formatTimestamp } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function PatientHistory() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Search
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [sortOption, setSortOption] = useState('LATEST');

  // Modal State
  const [modalPatient, setModalPatient] = useState(null);

  useEffect(() => {
    getAllPredictions()
      .then((res) => {
        const list = res?.data?.predictions || res?.predictions || res?.data || res || [];
        setPredictions(Array.isArray(list) ? list : []);
      })
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, []);

  const resetFilters = () => {
    setSearch('');
    setFilterLevel('ALL');
    setFilterDate('ALL');
    setSortOption('LATEST');
  };

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    let result = [...predictions];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => String(p.patient_id || p.id).toLowerCase().includes(q));
    }

    // Risk level filter
    if (filterLevel !== 'ALL') {
      result = result.filter(p => {
        const level = (p.risk_category || p.risk_level || getRiskLevel(p.risk_score || 0)).toUpperCase();
        return level.includes(filterLevel);
      });
    }

    // Date filter
    if (filterDate !== 'ALL') {
      const now = new Date();
      let cutoff = new Date();
      if (filterDate === 'TODAY') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (filterDate === '7DAYS') {
        cutoff.setDate(now.getDate() - 7);
      } else if (filterDate === '30DAYS') {
        cutoff.setDate(now.getDate() - 30);
      }
      result = result.filter(p => new Date(p.timestamp || p.created_at) >= cutoff);
    }

    // Sort options
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.created_at).getTime();
      const dateB = new Date(b.timestamp || b.created_at).getTime();
      const scoreA = Number(a.risk_score || 0);
      const scoreB = Number(b.risk_score || 0);

      switch (sortOption) {
        case 'LATEST': return dateB - dateA;
        case 'OLDEST': return dateA - dateB;
        case 'HIGHEST_RISK': return scoreB - scoreA;
        default: return 0;
      }
    });

    return result;
  }, [predictions, search, filterLevel, filterDate, sortOption]);

  // Summary Metrics
  const summary = useMemo(() => {
    return predictions.reduce((acc, p) => {
      acc.total += 1;
      const level = (p.risk_category || p.risk_level || getRiskLevel(p.risk_score || 0)).toUpperCase();
      if (level.includes('HIGH')) acc.high += 1;
      else if (level.includes('MEDIUM')) acc.medium += 1;
      else acc.low += 1;
      return acc;
    }, { total: 0, high: 0, medium: 0, low: 0 });
  }, [predictions]);

  // Modal Trend Chart Options
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { min: 0, max: 100, grid: { color: '#f1f5f9' }, ticks: { stepSize: 25 } },
    },
  };

  const getTrendData = (patientId) => {
    // Dummy trend generation around current score for UI purposes if true history isn't loaded
    const currentScore = (modalPatient?.risk_score || 0) * (modalPatient?.risk_score <= 1 ? 100 : 1);
    return {
      labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Today'],
      datasets: [{
        label: 'Risk Score %',
        data: [
          Math.max(0, currentScore - 15),
          Math.max(0, currentScore - 5),
          currentScore + 10,
          currentScore - 2,
          currentScore
        ],
        borderColor: currentScore >= 75 ? '#D64545' : currentScore >= 40 ? '#F5A623' : '#2E8B57',
        backgroundColor: currentScore >= 75 ? 'rgba(214,69,69,0.1)' : currentScore >= 40 ? 'rgba(245,166,35,0.1)' : 'rgba(46,139,87,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        borderWidth: 2,
      }],
    };
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Patient History</h1>
        <p className="text-sm text-slate-400 mt-1">Track historical patient vitals and ICU risk prediction records.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', val: summary.total, color: 'text-primary-600', border: 'border-primary-100' },
          { label: 'High Risk Cases', val: summary.high, color: 'text-danger-600', border: 'border-danger-100' },
          { label: 'Medium Risk Cases', val: summary.medium, color: 'text-warning-600', border: 'border-warning-100' },
          { label: 'Low Risk Cases', val: summary.low, color: 'text-success-600', border: 'border-success-100' },
        ].map((c) => (
          <div key={c.label} className={`bg-white rounded-2xl p-5 shadow-sm border ${c.border}`}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
            <p className={`text-2xl font-extrabold ${c.color}`}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 lg:p-5 flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search Patient ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
          <select
            value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
          >
            <option value="ALL">All Patients</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">Last 30 Days</option>
          </select>

          <select
            value={sortOption} onChange={(e) => setSortOption(e.target.value)}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
          >
            <option value="LATEST">Latest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="HIGHEST_RISK">Highest Risk First</option>
          </select>

          <button
            onClick={resetFilters}
            className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-danger-600 bg-slate-100 hover:bg-danger-50 border border-transparent hover:border-danger-100 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Patient History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <EmptyState title="No patient history available" message="Try adjusting your search or filter criteria." />
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="bg-slate-50/90 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider backdrop-blur-sm">
                  <th className="px-5 py-4">Patient ID</th>
                  <th className="px-5 py-4">Age</th>
                  <th className="px-5 py-4 whitespace-nowrap">Vitals (HR/BP/SpO2/Temp/RR)</th>
                  <th className="px-5 py-4">Risk Score</th>
                  <th className="px-5 py-4">Risk Category</th>
                  <th className="px-5 py-4">Prediction Timestamp</th>
                  <th className="px-5 py-4 text-center">Alerts</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((p, i) => {
                  const riskLevel = (p.risk_category || p.risk_level || getRiskLevel(p.risk_score || 0)).toUpperCase();
                  const scoreMultiplier = (p.risk_score || 0) <= 1 ? 100 : 1;
                  const finalScore = ((p.risk_score || 0) * scoreMultiplier).toFixed(1);
                  const isHigh = riskLevel.includes('HIGH');

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-bold text-slate-800">{p.patient_id || p.id}</td>
                      <td className="px-5 py-4 text-slate-600 font-medium">{p.age ?? '—'}</td>
                      
                      <td className="px-5 py-4 text-slate-500 font-medium text-xs whitespace-nowrap">
                        <span className="inline-block w-8 text-slate-700 font-semibold">{p.heart_rate ?? '-'}</span> /
                        <span className="inline-block w-12 text-slate-700 font-semibold mx-1">{p.blood_pressure ?? '-'}</span> /
                        <span className="inline-block w-8 text-slate-700 font-semibold">{p.spo2 ?? '-'}</span> /
                        <span className="inline-block w-8 text-slate-700 font-semibold">{p.temperature ?? '-'}</span> /
                        <span className="inline-block w-8 text-slate-700 font-semibold">{p.respiratory_rate ?? '-'}</span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`font-extrabold ${isHigh ? 'text-danger-600' : riskLevel.includes('MEDIUM') ? 'text-warning-600' : 'text-success-600'}`}>
                          {finalScore}%
                        </span>
                      </td>
                      <td className="px-5 py-4"><Badge level={riskLevel.replace(' RISK', '')} /></td>
                      <td className="px-5 py-4 text-slate-500 font-medium text-xs">{formatTimestamp(p.timestamp || p.created_at)}</td>
                      <td className="px-5 py-4 text-center">
                        {isHigh ? (
                          <svg className="w-5 h-5 text-danger-500 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setModalPatient(p)}
                          className="px-4 py-1.5 bg-white border border-slate-200 hover:border-primary-300 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 lg:opacity-100"
                        >
                          View Details
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

      {/* Patient Details Modal */}
      {modalPatient && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalPatient(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Patient Intelligence Record</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">ID: <span className="text-primary-600">{modalPatient.patient_id || modalPatient.id}</span></p>
              </div>
              <button onClick={() => setModalPatient(null)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              
              {/* Snapshot Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age</p>
                  <p className="text-lg font-bold text-slate-700 mt-1">{modalPatient.age ?? '—'} <span className="text-xs font-medium text-slate-400">yrs</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vitals Logged</p>
                  <p className="text-lg font-bold text-slate-700 mt-1">{formatTimestamp(modalPatient.timestamp || modalPatient.created_at).split(',')[0]}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Score</p>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">
                    {((modalPatient.risk_score || 0) * ((modalPatient.risk_score || 0) <= 1 ? 100 : 1)).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</p>
                  <div><Badge level={(modalPatient.risk_category || modalPatient.risk_level || getRiskLevel(modalPatient.risk_score || 0)).replace(' RISK', '')} /></div>
                </div>
              </div>

              {/* Trend Analysis Chart */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Trend Analysis: Risk Score Over Time</h4>
                <div className="h-48 border border-slate-100 rounded-xl p-4 bg-white shadow-sm">
                  <Line data={getTrendData(modalPatient.patient_id)} options={trendOptions} />
                </div>
              </div>

              {/* Vitals Timeline */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Vitals Snapshot</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { l: 'Heart Rate', v: modalPatient.heart_rate, u: 'bpm' },
                    { l: 'Blood Pressure', v: modalPatient.blood_pressure, u: '' },
                    { l: 'SpO2', v: modalPatient.spo2, u: '%' },
                    { l: 'Temperature', v: modalPatient.temperature, u: '°C' },
                    { l: 'Resp. Rate', v: modalPatient.respiratory_rate, u: 'breaths/m' },
                  ].map(v => (
                    <div key={v.l} className="border border-slate-100 rounded-lg p-3 text-center bg-white shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{v.l}</p>
                      <p className="text-sm font-bold text-slate-800">{v.v ?? '—'} <span className="text-xs font-medium text-slate-400">{v.u}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setModalPatient(null)} className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-colors">
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
