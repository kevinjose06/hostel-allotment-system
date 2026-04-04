import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserX, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../context/AuthContext';

function getStudent(row) {
  let app = row.application;
  if (Array.isArray(app)) app = app[0];
  let stu = app?.student;
  if (Array.isArray(stu)) stu = stu[0];
  return { app, stu };
}

export default function ManageResidentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterYear, setFilterYear] = useState('');
  const [hostelId, setHostelId] = useState('');
  const [confirming, setConfirming] = useState(false);

  const { data: hostels = [] } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => api.get('/hostel').then(r => r.data.data),
  });

  const { data: residents = [], isLoading, refetch } = useQuery({
    queryKey: ['residents', hostelId, filterYear],
    queryFn: () => {
      const params = new URLSearchParams();
      if (hostelId) params.set('hostel_id', hostelId);
      if (filterYear) params.set('academic_year', filterYear);
      return api.get(`/allotment/residents?${params}`).then(r => r.data.data);
    },
  });

  const vacateMutation = useMutation({
    mutationFn: (ids) => api.post('/allotment/vacate', ids),
    onSuccess: () => {
      setSelectedIds(new Set());
      setConfirming(false);
      qc.invalidateQueries(['residents']);
      refetch();
    },
  });

  const toggle = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (selectedIds.size === residents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(residents.map(r => r.allocation_id)));
  };

  return (
    <div className="space-y-8">
      <div className="bg-primary rounded-md p-8 text-white shadow-ambient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50" />
        <div className="relative z-10">
          <h1 className="font-serif text-4xl tracking-tight mb-2">Manage Residents</h1>
          <p className="text-primary-fixed-dim">Mark passed-out or leaving students as Vacated to free hostel seats for new allotments.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {isAdmin && (
          <select
            className="border border-outline-variant/30 rounded-md px-4 py-2 bg-surface-container-lowest text-on-surface text-sm"
            value={hostelId}
            onChange={e => { setHostelId(e.target.value); setSelectedIds(new Set()); }}
          >
            <option value="">All Hostels</option>
            {hostels.map(h => <option key={h.hostel_id} value={h.hostel_id}>{h.hostel_name}</option>)}
          </select>
        )}
        <input
          className="border border-outline-variant/30 rounded-md px-4 py-2 bg-surface-container-lowest text-on-surface text-sm"
          placeholder="Filter by academic year e.g. 2024-2025"
          value={filterYear}
          onChange={e => { setFilterYear(e.target.value); setSelectedIds(new Set()); }}
        />
      </div>

      {/* Action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-300 rounded-md px-6 py-4">
          <AlertTriangle className="text-amber-600 w-5 h-5 shrink-0" />
          <span className="text-sm font-medium text-amber-800">{selectedIds.size} student(s) selected</span>
          <button
            className="ml-auto px-4 py-2 rounded-md bg-amber-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors"
            onClick={() => setConfirming(true)}
          >
            Mark as Vacated
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full space-y-4">
            <h2 className="font-serif text-xl text-on-surface font-bold">Confirm Vacate</h2>
            <p className="text-sm text-on-surface-variant">This will mark {selectedIds.size} allocation(s) as <strong>Vacated</strong>. Their hostel seat will be freed for new allotment. This cannot be undone automatically.</p>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={() => vacateMutation.mutate([...selectedIds])} disabled={vacateMutation.isPending}>
                {vacateMutation.isPending ? 'Processing…' : 'Confirm'}
              </button>
              <button className="flex-1 py-2.5 rounded-md border border-outline-variant/30 text-on-surface text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? <LoadingSpinner /> : residents.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">No active residents found for the selected filters.</div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-md overflow-hidden shadow-ambient">
          <table className="w-full text-sm">
            <thead className="bg-surface-container border-b border-outline-variant/10">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <button onClick={toggleAll}>{selectedIds.size === residents.length ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-on-surface-variant" />}</button>
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-on-surface-variant font-bold">Student</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-on-surface-variant font-bold">College ID</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-on-surface-variant font-bold">Academic Year</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-on-surface-variant font-bold">Category</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-on-surface-variant font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {residents.map(row => {
                const { app, stu } = getStudent(row);
                const name = stu ? [stu.first_name, stu.middle_name, stu.last_name].filter(Boolean).join(' ') : '—';
                const year = app?.academic_year ?? '—';
                return (
                  <tr key={row.allocation_id} className={`hover:bg-surface-container/50 transition-colors ${selectedIds.has(row.allocation_id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(row.allocation_id)}>
                        {selectedIds.has(row.allocation_id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-on-surface-variant" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface">{name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{stu?.college_id ?? '—'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{year}</td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">{row.category?.replace('_', ' ') ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
