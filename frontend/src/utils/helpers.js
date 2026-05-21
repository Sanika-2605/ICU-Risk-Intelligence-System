export function getRiskLevel(score) {
  if (score >= 75) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function getRiskColor(level) {
  switch (level) {
    case 'HIGH':   return { bg: 'bg-danger-500', text: 'text-white', border: 'border-danger-500', dot: 'bg-danger-500' };
    case 'MEDIUM': return { bg: 'bg-warning-500', text: 'text-surface-900', border: 'border-warning-500', dot: 'bg-warning-500' };
    case 'LOW':    return { bg: 'bg-success-500', text: 'text-white', border: 'border-success-500', dot: 'bg-success-500' };
    default:       return { bg: 'bg-surface-400', text: 'text-white', border: 'border-surface-400', dot: 'bg-surface-400' };
  }
}

export function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
