const STATUS_COLORS = {
  Pending:      'bg-yellow-100 text-yellow-800',
  Under_Review: 'bg-blue-100 text-blue-800',
  Approved:     'bg-green-100 text-green-800',
  Rejected:     'bg-red-100 text-red-800',
  Returned:     'bg-orange-100 text-orange-800',
  Waitlisted:   'bg-purple-100 text-purple-800',
  Active:       'bg-green-100 text-green-800',
  Cancelled:    'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${STATUS_COLORS[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
