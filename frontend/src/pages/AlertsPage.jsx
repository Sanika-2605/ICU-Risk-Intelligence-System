import { useState, useEffect } from 'react';
import { getAlerts } from '../services/alertService';
import AlertCard from '../components/AlertCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { formatTimestamp } from '../utils/helpers';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    getAlerts()
      .then((res) => {
        const data = res?.data?.alerts || res?.alerts || res?.data || res || [];
        setAlerts(Array.isArray(data) ? data : []);
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.alert_level === filter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Alerts</h1>
          <p className="text-sm text-slate-400 mt-1">Emergency notifications and clinical warnings</p>
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
          <EmptyState title="No active alerts" message={`No ${filter !== 'all' ? filter : ''} alerts found at this time.`} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filteredAlerts.map((a, i) => {
              const level = a.alert_level || 'info';
              return (
                <div key={i} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 w-full max-w-3xl">
                    <AlertCard
                      type={level}
                      title={`Patient ${a.patient_id}`}
                      message={a.alert_message || 'Clinical condition threshold triggered.'}
                    />
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold text-slate-400">TIMESTAMP</p>
                    <p className="text-sm font-semibold text-slate-600 mt-0.5">
                      {formatTimestamp(a.created_at || a.timestamp)}
                    </p>
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
