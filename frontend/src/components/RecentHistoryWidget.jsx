import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { getRiskLevel, formatTimestamp } from '../utils/helpers';
import EmptyState from './EmptyState';

export default function RecentHistoryWidget({ title, data = [], loading = false }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
          {title || 'Recent Patient History'}
        </h2>
        <button
          onClick={() => navigate('/history')}
          className="text-xs font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
        >
          View Full History
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <EmptyState title="No recent history" message="No recent records were found for this criteria." />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-sm z-10 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Patient ID</th>
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Alert Status</th>
                <th className="px-5 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.slice(0, 5).map((p, i) => {
                const riskLevel = (p.risk_category || p.risk_level || getRiskLevel(p.risk_score || 0)).toUpperCase();
                const scoreMultiplier = (p.risk_score || 0) <= 1 ? 100 : 1;
                const finalScore = ((p.risk_score || 0) * scoreMultiplier).toFixed(1);
                const isHigh = riskLevel.includes('HIGH');

                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-800">{p.patient_id || p.id}</td>
                    <td className="px-5 py-4">
                      <span className={`font-extrabold ${isHigh ? 'text-danger-600' : riskLevel.includes('MEDIUM') ? 'text-warning-600' : 'text-success-600'}`}>
                        {finalScore}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge level={riskLevel.replace(' RISK', '')} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      {isHigh ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-danger-50 text-danger-500 rounded-full">
                           <svg className="w-4 h-4 animate-pulse-red" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {formatTimestamp(p.timestamp || p.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
