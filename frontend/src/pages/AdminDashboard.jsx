import { useState, useEffect } from 'react';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { getAdminDashboard } from '../services/dashboardService';
import { getAllPredictions } from '../services/predictionService';
import StatCard from '../components/StatCard';
import RecentHistoryWidget from '../components/RecentHistoryWidget';
import { SkeletonCard } from '../components/SkeletonLoader';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [dashRes, histRes] = await Promise.all([
        getAdminDashboard(),
        getAllPredictions()
      ]);
      setData(dashRes?.data || dashRes);
      setHistoryData(histRes?.data?.predictions || histRes?.predictions || histRes?.data || []);
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

  if (loading) return <SkeletonCard count={4} />;

  const stats = data?.icu_statistics || {};
  const riskDist = data?.risk_distribution || {};
  const trends = data?.daily_trends || [];

  const totalPatients = stats.total_patients ?? 0;
  const highRiskCount = riskDist.high ?? 0;
  const totalAlerts = stats.total_alerts ?? 0;
  const totalUsers = stats.total_users ?? 0;

  // Pie Chart
  const pieData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [riskDist.low ?? 0, riskDist.medium ?? 0, riskDist.high ?? 0],
      backgroundColor: ['#2E8B57', '#F5A623', '#D64545'],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 8,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 'bold' } },
      },
    },
  };

  // Line Chart — daily trends
  const trendLabels = trends.map((t) => {
    const d = new Date(t.date);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }).reverse();

  const lineData = {
    labels: trendLabels.length > 0 ? trendLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Patients',
        data: trends.length > 0 ? [...trends].reverse().map((t) => t.patients) : [5, 8, 6, 12, 10, 15, 11],
        borderColor: '#0F4C81',
        backgroundColor: 'rgba(15,76,129,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#0F4C81',
      },
      {
        label: 'Predictions',
        data: trends.length > 0 ? [...trends].reverse().map((t) => t.predictions) : [2, 4, 3, 6, 5, 8, 6],
        borderColor: '#1BA6B2',
        backgroundColor: 'rgba(27,166,178,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#1BA6B2',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 'bold' } },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
    },
  };

  // Bar Chart — alert frequency
  const barData = {
    labels: trendLabels.length > 0 ? trendLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Alerts',
      data: trends.length > 0 ? [...trends].reverse().map((t) => t.alerts) : [1, 3, 2, 5, 4, 6, 3],
      backgroundColor: 'rgba(214,69,69,0.75)',
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 'bold' } },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, font: { size: 11 } } },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Admin Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">System overview and performance metrics</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          label="High Risk Count"
          value={highRiskCount}
          accent="danger"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Total Alerts"
          value={totalAlerts}
          accent="warning"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
        <StatCard
          label="ICU Staff"
          value={totalUsers}
          accent="cyan"
          sub={`${stats.doctors ?? 0} Doctors · ${stats.nurses ?? 0} Nurses`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Grid Layout for History Widget & Analytics Summary */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Recent Patient History Widget (Takes 2/3 space) */}
        <div className="lg:col-span-2 flex flex-col h-[300px]">
          <RecentHistoryWidget 
            title="Hospital-Wide Prediction Activity"
            data={historyData}
            loading={isRefreshing && historyData.length === 0}
          />
        </div>

        {/* Analytics Overview Cards (Takes 1/3 space) */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Predictions Run</p>
            <p className="text-3xl font-extrabold text-primary-600">{stats.total_predictions ?? 0}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Total ML assessments</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Risk Rate</p>
            <p className="text-3xl font-extrabold text-danger-600">
              {totalPatients > 0 ? ((highRiskCount / Math.max(totalPatients, 1)) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">High-risk percentage</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alert Rate</p>
            <p className="text-3xl font-extrabold text-warning-500">
              {totalPatients > 0 ? (totalAlerts / Math.max(totalPatients, 1)).toFixed(1) : 0}
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Alerts per patient</p>
          </div>
        </div>

      </div>

      {/* Charts Row — Pie + Line */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-1">Risk Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of patient risk categories</p>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-1">Daily Patient Trends</h3>
          <p className="text-xs text-slate-400 mb-4">Patients and predictions over the last 7 days</p>
          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* Bar Chart — Alert Frequency */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-1">Alert Frequency</h3>
        <p className="text-xs text-slate-400 mb-4">Number of alerts triggered per day</p>
        <div className="h-64">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

    </div>
  );
}
