export default function AlertCard({ title, message, type = 'critical', className = '' }) {
  const config = {
    critical: {
      border: 'border-l-danger-500',
      bg: 'bg-red-50/80',
      iconBg: 'bg-danger-500',
      titleColor: 'text-danger-700',
      msgColor: 'text-danger-600',
      label: 'CRITICAL',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    warning: {
      border: 'border-l-warning-500',
      bg: 'bg-amber-50/80',
      iconBg: 'bg-warning-500',
      titleColor: 'text-amber-800',
      msgColor: 'text-amber-700',
      label: 'WARNING',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
      ),
    },
    info: {
      border: 'border-l-primary-500',
      bg: 'bg-blue-50/80',
      iconBg: 'bg-primary-500',
      titleColor: 'text-primary-700',
      msgColor: 'text-primary-600',
      label: 'INFO',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      border: 'border-l-success-500',
      bg: 'bg-emerald-50/80',
      iconBg: 'bg-success-500',
      titleColor: 'text-emerald-800',
      msgColor: 'text-emerald-700',
      label: 'RESOLVED',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  };
  const c = config[type] || config.info;

  return (
    <div className={`border-l-4 ${c.border} ${c.bg} rounded-xl p-4 ${type === 'critical' ? 'animate-pulse-red' : ''} ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
          {c.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-bold tracking-widest uppercase ${c.titleColor} opacity-70 mb-0.5`}>
            {c.label}
          </p>
          {title && <p className={`font-semibold text-sm ${c.titleColor}`}>{title}</p>}
          {message && <p className={`text-sm ${c.msgColor} opacity-80 mt-0.5`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}
