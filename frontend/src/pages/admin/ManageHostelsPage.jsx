import { useState, useEffect } from 'react';
import { Building2, Plus, Loader2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';

const emptyForm = { hostel_name: '', hostel_type: 'MH', total_capacity: '', reserved_seats: '', warden_id: '' };

export default function ManageHostelsPage() {
  const [hostels, setHostels] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { 
    fetchHostels(); 
    fetchWardens();
  }, []);

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

  const fetchWardens = async () => {
    try {
      setWardens(await adminService.getWardens() || []);
    } catch {
      console.error('Failed to load wardens');
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
      reserved_seats: h.reserved_seats,
      warden_id: h.warden_id || ''
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
      let hostelId;
      if (editingHostel) {
        hostelId = editingHostel.hostel_id;
        await adminService.updateHostel(hostelId, payload);
      } else {
        const newHostel = await adminService.createHostel(payload);
        hostelId = newHostel.hostel_id;
      }

      // Assign warden if selected
      await adminService.assignWarden(hostelId, form.warden_id || null);
      
      toast.success(editingHostel ? 'Hostel updated!' : 'Hostel created!');
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
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest text-[11px]">Hostel Name</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest text-[11px]">Type</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest text-[11px]">Seats</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest text-[11px]">Available</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest text-[11px]">Reserved</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest text-[11px]">Warden</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {hostels.map((h) => {
                  const pct = h.total_capacity > 0 ? Math.round((h.current_occupancy / h.total_capacity) * 100) : 0;
                  const isAlmostFull = pct >= 80;
                  return (
                    <tr key={h.hostel_id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="p-4 font-serif font-bold text-primary text-base">{h.hostel_name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${h.hostel_type === 'LH' ? 'bg-error/10 text-error border border-error/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                          {h.hostel_type === 'LH' ? 'Ladies' : 'Mens'}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant font-medium">{h.total_capacity}</td>
                      <td className="p-4">
                        <span className={`font-bold ${isAlmostFull ? 'text-error' : 'text-primary'}`}>
                          {h.available_seats}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{h.reserved_seats}</td>
                      <td className="p-4 text-on-surface-variant">
                         {h.warden_name
                           ? <div className="flex flex-col"><span className="font-bold text-primary text-sm">{h.warden_name}</span><span className="text-[10px] uppercase font-mono tracking-tighter">{h.warden_contact_no || ''}</span></div>
                           : <span className="text-on-surface-variant/40 italic text-xs">Unassigned</span>}
                      </td>
                      <td className="p-4">
                        <button onClick={() => openEdit(h)} className="p-2.5 rounded hover:bg-primary/10 text-primary transition-colors border border-transparent hover:border-outline-variant/30" title="Edit">
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
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Hostel Name *</label>
            <input name="hostel_name" value={form.hostel_name} onChange={handleChange} required
              placeholder="e.g. MH 1, Ladies Hostel 1" className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Hostel Type *</label>
            <select name="hostel_type" value={form.hostel_type} onChange={handleChange} required className={inputClass}>
              <option value="MH">MH — Mens Hostel</option>
              <option value="LH">LH — Ladies Hostel</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Total Capacity *</label>
              <input name="total_capacity" type="number" min="1" value={form.total_capacity} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Reserved Seats *</label>
              <input name="reserved_seats" type="number" min="0" value={form.reserved_seats} onChange={handleChange} required className={inputClass} />
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Assign Warden</label>
             <select name="warden_id" value={form.warden_id} onChange={handleChange} className={inputClass}>
               <option value="">No Warden Assigned</option>
               {wardens.map(w => (
                 <option key={w.warden_id} value={w.warden_id}>
                   {w.name} {w.hostel_id && w.hostel_id !== editingHostel?.hostel_id ? `(Currently in ${w.hostel?.hostel_name || 'other'})` : ''}
                 </option>
               ))}
             </select>
             <p className="text-[10px] text-on-surface-variant/60 mt-1 italic">Selecting a warden already in another hostel will reassign them to this one.</p>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 uppercase tracking-widest font-bold text-xs rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-4 uppercase tracking-widest font-bold text-xs flex items-center justify-center gap-2 shadow-ambient">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingHostel ? 'Update Hostel' : 'Create Hostel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
