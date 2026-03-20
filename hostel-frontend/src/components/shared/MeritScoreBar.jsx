export default function MeritScoreBar({ score }) {
  const pct = Math.round((score || 0));
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-mono font-medium text-gray-700 w-12 text-right">{score?.toFixed(2) ?? 'N/A'}</span>
    </div>
  );
}
