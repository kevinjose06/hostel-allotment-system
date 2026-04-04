import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { Plus, Edit2, Trash2, Search, User, Mail, Phone, Building2 } from 'lucide-react';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function ManageWardensPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarden, setEditingWarden] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_no: '',
    hostel_id: '',
    temp_password: 'TempPass@1234'
  });

  const { data: wardens = [], isLoading: isWardensLoading } = useQuery({
    queryKey: ['wardens'],
    queryFn: adminService.getWardens
  });

  const { data: hostels = [], isLoading: isHostelsLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: adminService.getHostels
  });

  const createMutation = useMutation({
    mutationFn: adminService.createWarden,
    onSuccess: () => {
      qc.invalidateQueries(['wardens']);
      toast.success('Warden created successfully');
      closeModal();
    },
    onError: (err) => toast.error(formatBackendError(err))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateWarden(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['wardens']);
      toast.success('Warden updated successfully');
      closeModal();
    },
    onError: (err) => toast.error(formatBackendError(err))
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteWarden,
    onSuccess: () => {
      qc.invalidateQueries(['wardens']);
      toast.success('Warden deleted');
    },
    onError: (err) => toast.error(formatBackendError(err) || 'Failed to delete warden')
  });

  const openCreate = () => {
    setEditingWarden(null);
    setFormData({ name: '', email: '', contact_no: '', hostel_id: '', temp_password: 'TempPass@1234' });
    setIsModalOpen(true);
  };

  const openEdit = (warden) => {
    setEditingWarden(warden);
    setFormData({
      name: warden.name,
      email: warden.email,
      contact_no: warden.contact_no || '',
      hostel_id: warden.hostel_id || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWarden(null);
  };

  const validateForm = () => {
    if (formData.name.trim().length < 3) return "Name must be at least 3 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid institutional email address.";
    if (formData.contact_no && !/^\d{10}$/.test(formData.contact_no)) return "Contact number must be exactly 10 digits.";
    if (!formData.hostel_id) return "Please select a hostel assignment.";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Client-side validation
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    // 2. Sanitize and prepare payload
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      hostel_id: parseInt(formData.hostel_id),
      // Convert empty contact_no to null for backend Compatibility
      contact_no: formData.contact_no.trim() || null
    };

    if (!editingWarden && formData.temp_password) {
      payload.temp_password = formData.temp_password;
    }

    if (editingWarden) {
      updateMutation.mutate({ id: editingWarden.warden_id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this warden? This action will remove their account access.')) {
      deleteMutation.mutate(id);
    }
  };

  const formatBackendError = (err) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
    }
    return typeof detail === 'string' ? detail : 'Operation failed. Please try again.';
  };

  const filtered = wardens.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isWardensLoading || isHostelsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
           <h1 className="font-serif text-4xl text-primary tracking-tight">Manage Wardens</h1>
           <p className="font-sans text-on-surface-variant mt-2 text-base">Register and manage hostel wardens and their assignments.</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-3 px-6 shrink-0">
          <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Warden</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant/10 shadow-ambient">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-12 h-12 w-full text-base"
            placeholder="Search by name or email..."
          />
        </div>
      </div>

      {/* Warden Table */}
      <div className="bg-surface-container-lowest rounded-md border border-outline-variant/10 overflow-hidden shadow-ambient">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-low border-b border-surface-container text-primary uppercase text-[11px] font-bold tracking-widest">
              <tr>
                <th className="px-8 py-5">Warden Details</th>
                <th className="px-8 py-5">Contact</th>
                <th className="px-8 py-5">Assigned Hostel</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filtered.map(warden => (
                <tr key={warden.warden_id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary font-bold">
                        {warden.name[0]}
                      </div>
                      <div>
                        <p className="font-serif font-bold text-primary text-base">{warden.name}</p>
                        <p className="text-on-surface-variant flex items-center gap-1.5 mt-0.5"><Mail className="w-3.5 h-3.5" /> {warden.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-on-surface-variant font-medium">
                    <div className="flex items-center gap-2">
                       <Phone className="w-4 h-4 text-on-surface-variant/40" />
                       {warden.contact_no || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {warden.hostel ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-sm w-fit">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-primary">{warden.hostel.hostel_name}</span>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant/40 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(warden)} className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-surface rounded-sm transition-colors border border-transparent hover:border-outline-variant/30">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(warden.warden_id)} className="p-2.5 text-error/60 hover:text-error hover:bg-error/10 rounded-sm transition-colors border border-transparent hover:border-error/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-16 text-center text-on-surface-variant italic">No wardens found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingWarden ? 'Edit Warden' : 'Add New Warden'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-primary">Full Name</label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input w-full px-4 h-12"
              placeholder="e.g., Dr. Rajesh Kumar"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-primary">Email Address</label>
            <input
              required
              disabled={!!editingWarden}
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="input w-full px-4 h-12 disabled:bg-surface-container-low"
              placeholder="e.g., warden@rit.ac.in"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary">Contact Number</label>
              <input
                value={formData.contact_no}
                onChange={e => setFormData({ ...formData, contact_no: e.target.value })}
                className="input w-full px-4 h-12"
                placeholder="10-digit number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary">Assigned Hostel</label>
              <select
                required
                value={formData.hostel_id}
                onChange={e => setFormData({ ...formData, hostel_id: e.target.value })}
                className="input w-full px-4 h-12 bg-white"
              >
                <option value="">Select Assignment...</option>
                {hostels.map(h => (
                  <option key={h.hostel_id} value={h.hostel_id}>
                    Assign to: {h.hostel_name} ({h.hostel_type === 'MH' ? "Mens" : "Ladies"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!editingWarden && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary">Temporary Password</label>
              <input
                value={formData.temp_password}
                onChange={e => setFormData({ ...formData, temp_password: e.target.value })}
                className="input w-full px-4 h-12"
                placeholder="Login first-time with this"
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary flex-1 py-4 uppercase tracking-widest font-bold text-xs"
            >
              {editingWarden ? 'Update Warden' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary flex-1 py-4 uppercase tracking-widest font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
