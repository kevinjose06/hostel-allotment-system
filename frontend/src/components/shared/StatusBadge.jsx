const STATUS_COLORS = {
  Pending:      'bg-secondary/10 text-secondary border-secondary/20',
  Under_Review: 'bg-primary/10 text-primary border-primary/20',
  Approved:     'bg-green-600/10 text-green-700 border-green-600/20',
  Rejected:     'bg-error/10 text-error border-error/20',
  Returned:     'bg-secondary/10 text-secondary border-secondary/20',
  Waitlisted:   'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  Active:       'bg-green-600/10 text-green-700 border-green-600/20',
  Cancelled:    'bg-surface-container-highest text-on-surface-variant border-outline-variant/30',
  Vacated:      'bg-amber-500/10 text-amber-700 border-amber-500/20',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase border ${STATUS_COLORS[status] || 'bg-surface-container border-outline-variant/30 text-on-surface'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
