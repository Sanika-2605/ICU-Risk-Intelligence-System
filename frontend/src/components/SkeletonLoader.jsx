export default function SkeletonLoader({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ count = 3 }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="h-3 bg-slate-200 rounded-lg w-1/3 mb-4" />
            <div className="h-9 bg-slate-200 rounded-lg w-1/2 mb-3" />
            <div className="h-3 bg-slate-200 rounded-lg w-2/3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
        <div className="h-4 bg-slate-200 rounded-lg w-1/4 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
