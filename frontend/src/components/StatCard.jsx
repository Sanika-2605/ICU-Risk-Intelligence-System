export default function StatCard({ label, value, sub, icon, accent = 'primary', className = '' }) {
  const config = {
    primary: { bg: 'bg-blue-50', iconBg: 'bg-primary-500', text: 'text-primary-500', border: 'border-blue-100' },
    danger:  { bg: 'bg-red-50',  iconBg: 'bg-danger-500',  text: 'text-danger-500',  border: 'border-red-100' },
    success: { bg: 'bg-emerald-50', iconBg: 'bg-success-500', text: 'text-success-500', border: 'border-emerald-100' },
    warning: { bg: 'bg-amber-50', iconBg: 'bg-warning-500', text: 'text-warning-500', border: 'border-amber-100' },
    cyan:    { bg: 'bg-teal-50', iconBg: 'bg-cyan-med',    text: 'text-cyan-med',    border: 'border-teal-100' },
  };
  const c = config[accent] || config.primary;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${c.border} p-6 hover:shadow-md transition-shadow duration-300 animate-fade-in ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
          <p className={`text-3xl font-extrabold ${c.text} tracking-tight`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-2xl ${c.iconBg} text-white flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
