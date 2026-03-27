export default function MeritScoreBar({ score }) {
  const pct = Math.round((score || 0));
  const color = pct >= 70 ? 'bg-primary' : pct >= 40 ? 'bg-secondary' : 'bg-error';

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-3 bg-surface-container rounded-sm overflow-hidden border border-outline-variant/10 shadow-inner">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-base font-mono font-medium text-primary w-14 text-right">
        {score?.toFixed(2) ?? 'N/A'}
      </span>
    </div>
  );
}
