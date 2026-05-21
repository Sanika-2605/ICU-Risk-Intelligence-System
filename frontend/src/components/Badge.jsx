import { getRiskColor } from '../utils/helpers';

export default function Badge({ level, className = '' }) {
  const colors = getRiskColor(level);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${colors.bg} ${colors.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {level?.includes('RISK') ? level : `${level} RISK`}
    </span>
  );
}
