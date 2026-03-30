import { useState, useEffect } from 'react';
import { Building2, Plus, Loader2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';

const emptyForm = { hostel_name: '', hostel_type: 'MH', total_capacity: '', reserved_seats: '' };

export default function ManageHostelsPage() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchHostels(); }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      setHostels(await adminService.getHostels() || []);
    } catch {
      toast.error('Failed to load hostel data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingHostel(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (h) => {
    setEditingHostel(h);
    setForm({
      hostel_name: h.hostel_name,
      hostel_type: h.hostel_type,
      total_capacity: h.total_capacity,
      reserved_seats: h.reserved_seats
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      hostel_name: form.hostel_name,
      hostel_type: form.hostel_type,
      total_capacity: parseInt(form.total_capacity),
      reserved_seats: parseInt(form.reserved_seats)
    };
    try {
      if (editingHostel) {
        await adminService.updateHostel(editingHostel.hostel_id, payload);
        toast.success('Hostel updated successfully!');
      } else {
        await adminService.createHostel(payload);
        toast.success('Hostel created!');
      }
      setIsModalOpen(false);
      fetchHostels();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-outline-variant rounded-md px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <button onClick={openCreate} className="btn-primary py-3 px-6 shrink-0">
          <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Hostel</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-on-surface-variant flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading hostel data...</p>
          </div>
        ) : hostels.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <Building2 className="w-16 h-16 text-outline mb-6" />
            <p className="font-serif font-bold text-2xl text-on-surface mb-3">No Hostels Found</p>
            <p className="max-w-xl mx-auto text-on-surface-variant leading-relaxed">No hostel records exist yet. Click "Add Hostel" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Hostel Name</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Type</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Total Seats</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Available</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Reserved</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Warden</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {hostels.map((h) => {
                  const pct = h.total_capacity > 0 ? Math.round((h.current_occupancy / h.total_capacity) * 100) : 0;
                  const isAlmostFull = pct >= 80;
                  return (
                    <tr key={h.hostel_id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="p-4 font-medium text-on-surface">{h.hostel_name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${h.hostel_type === 'LH' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {h.hostel_type === 'LH' ? 'Ladies' : 'Mens'}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{h.total_capacity}</td>
                      <td className="p-4">
                        <span className={`font-bold ${isAlmostFull ? 'text-red-500' : 'text-green-600'}`}>
                          {h.available_seats}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{h.reserved_seats}</td>
                      <td className="p-4 text-on-surface-variant">
                        {h.warden_name
                          ? <div className="flex flex-col"><span className="font-medium text-sm">{h.warden_name}</span><span className="text-xs text-outline">{h.warden_contact_no || ''}</span></div>
                          : <span className="text-outline italic">Unassigned</span>}
                      </td>
                      <td className="p-4">
                        <button onClick={() => openEdit(h)} className="p-2 rounded hover:bg-primary/10 text-primary transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHostel ? 'Edit Hostel' : 'Add New Hostel'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Hostel Name *</label>
            <input name="hostel_name" value={form.hostel_name} onChange={handleChange} required
              placeholder="e.g. MH 1, Ladies Hostel 1" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Hostel Type *</label>
            <select name="hostel_type" value={form.hostel_type} onChange={handleChange} required className={inputClass}>
              <option value="MH">MH — Mens Hostel</option>
              <option value="LH">LH — Ladies Hostel</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Total Capacity *</label>
              <input name="total_capacity" type="number" min="1" value={form.total_capacity} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Reserved Seats *</label>
              <input name="reserved_seats" type="number" min="0" value={form.reserved_seats} onChange={handleChange} required className={inputClass} />
              <p className="text-xs text-outline mt-1">Seats reserved for SC/ST, BPL, PWD categories.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2 text-sm flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingHostel ? 'Save Changes' : 'Create Hostel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
