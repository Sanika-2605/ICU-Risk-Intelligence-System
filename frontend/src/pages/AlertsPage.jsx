import { useState, useEffect } from 'react';
import { getAlerts } from '../services/alertService';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const LEVEL_STYLE = {
  critical: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border border-red-200',    icon: '🔴', label: 'CRITICAL' },
  warning:  { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border border-orange-200', icon: '🟠', label: 'WARNING'  },
  info:     { bar: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700 border border-blue-200',  icon: '🔵', label: 'INFO'     },
};

const INF_STYLE = {
  VAP:    'bg-red-50 text-red-700 border border-red-200',
  CLABSI: 'bg-orange-50 text-orange-700 border border-orange-200',
  CAUTI:  'bg-purple-50 text-purple-700 border border-purple-200',
};

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    getAlerts()
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredAlerts = alerts.filter((a) =>
    filter === 'all' ? true : a.alert_level === filter
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Alerts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Interventions and clinical warnings — {alerts.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          {['all', 'critical', 'warning', 'info'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === f
                  ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10">
          <EmptyState
            title="No active alerts"
            message={`No ${filter !== 'all' ? filter : ''} alerts found at this time.`}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filteredAlerts.map((a, i) => {
              const lvl = LEVEL_STYLE[a.alert_level] || LEVEL_STYLE.info;
              const infStyle = INF_STYLE[a.infection_type] || 'bg-slate-50 text-slate-600 border border-slate-200';
              return (
                <div key={i} className="flex items-stretch hover:bg-slate-50/40 transition-colors">
                  {/* Left accent bar */}
                  <div className={`w-1 flex-shrink-0 rounded-l-sm ${lvl.bar}`}></div>

                  <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: patient + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-extrabold text-slate-800 text-sm">
                          Patient {a.patient_id}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${lvl.badge}`}>
                          {lvl.label}
                        </span>
                        {a.infection_type && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${infStyle}`}>
                            {a.infection_type}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          a.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {a.status || 'pending'}
                        </span>
                      </div>

                      {/* Action text */}
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        {a.alert_message || 'Clinical condition threshold triggered.'}
                      </p>
                    </div>

                    {/* Right: time */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TIME</p>
                      <p className="text-sm font-semibold text-slate-600 mt-0.5">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
