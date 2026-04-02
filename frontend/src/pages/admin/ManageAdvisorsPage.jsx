import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';

const DEPARTMENTS = [
  'Computer Science', 'Electrical and Electronics',
  'Electronics and Communication', 'Civil', 'Mechanical', 'Robotics', 'Architecture'
];

const emptyForm = { name: '', department: DEPARTMENTS[0], email: '', contact_no: '', temp_password: 'TempPass@1234' };

export default function ManageAdvisorsPage() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null); // null = create mode
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchAdvisors(); }, []);

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      setAdvisors(await adminService.getAdvisors() || []);
    } catch {
      toast.error('Failed to load class advisors');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingAdvisor(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (adv) => {
    setEditingAdvisor(adv);
    setForm({ name: adv.name, department: adv.department, contact_no: adv.contact_no || '', email: adv.email, temp_password: '' });
    setIsModalOpen(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validateForm = () => {
    if (form.name.trim().length < 3) return "Name must be at least 3 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email address.";
    if (form.contact_no && !/^\d{10}$/.test(form.contact_no)) return "Contact number must be exactly 10 digits.";
    if (!form.department) return "Please select a department.";
    return null;
  };

  const formatBackendError = (err) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
    }
    return typeof detail === 'string' ? detail : 'Operation failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    
    // Sanitize payload
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department,
      contact_no: form.contact_no.trim() || null
    };

    if (!editingAdvisor && form.temp_password) {
      payload.temp_password = form.temp_password;
    }

    try {
      if (editingAdvisor) {
        await adminService.updateAdvisor(editingAdvisor.advisor_id, {
          name: payload.name,
          department: payload.department,
          contact_no: payload.contact_no
        });
        toast.success('Advisor updated successfully!');
      } else {
        await adminService.createAdvisor(payload);
        toast.success('Advisor created! A Supabase auth account has been made.');
      }
      setIsModalOpen(false);
      fetchAdvisors();
    } catch (err) {
      toast.error(formatBackendError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adv) => {
    if (!window.confirm(`Are you sure you want to remove ${adv.name}? This cannot be undone.`)) return;
    try {
      await adminService.deleteAdvisor(adv.advisor_id);
      toast.success('Advisor removed.');
      fetchAdvisors();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Deletion failed.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <button onClick={openCreate} className="btn-primary py-3 px-6 shrink-0">
          <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Designate Advisor</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-on-surface-variant flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading registry...</p>
          </div>
        ) : advisors.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <Users className="w-16 h-16 text-outline mb-6" />
            <p className="font-serif font-bold text-2xl text-on-surface mb-3">No Advisors Found</p>
            <p className="max-w-xl mx-auto text-on-surface-variant leading-relaxed">No advisors assigned yet. Click "Designate Advisor" to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Name</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Department</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Email</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Phone</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Assigned Classes</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {advisors.map((adv) => (
                  <tr key={adv.advisor_id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="p-4 font-medium text-on-surface">{adv.name}</td>
                    <td className="p-4 text-on-surface-variant text-sm">{adv.department}</td>
                    <td className="p-4 text-on-surface-variant text-sm">{adv.email}</td>
                    <td className="p-4 text-on-surface-variant text-sm">{adv.contact_no || '—'}</td>
                    <td className="p-4 text-on-surface-variant text-sm text-[12px]">
                      {adv.classes && adv.classes.length > 0
                        ? adv.classes.map((c) => `Yr${c.year} ${c.degree_program} ${c.division}`).join(', ')
                        : <span className="text-outline italic">None</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(adv)} className="p-2 rounded hover:bg-primary/10 text-primary transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(adv)} className="p-2 rounded hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdvisor ? 'Edit Advisor' : 'Designate New Advisor'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border border-outline-variant rounded-md px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Department *</label>
            <select name="department" value={form.department} onChange={handleChange} required
              className="w-full border border-outline-variant rounded-md px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {!editingAdvisor && (
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full border border-outline-variant rounded-md px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Phone Number</label>
            <input name="contact_no" value={form.contact_no} onChange={handleChange}
              className="w-full border border-outline-variant rounded-md px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          {!editingAdvisor && (
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Temporary Password</label>
              <input name="temp_password" value={form.temp_password} onChange={handleChange}
                className="w-full border border-outline-variant rounded-md px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              <p className="text-xs text-outline mt-1">The advisor will use this to log in for the first time.</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="btn-primary px-6 py-2 text-sm flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingAdvisor ? 'Save Changes' : 'Create Advisor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
