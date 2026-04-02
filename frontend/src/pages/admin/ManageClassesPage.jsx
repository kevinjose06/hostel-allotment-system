import { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';

const DEPARTMENTS = [
  'Computer Science', 'Electrical and Electronics',
  'Electronics and Communication', 'Civil', 'Mechanical', 'Robotics', 'Architecture'
];
const DEGREES = ['BTech', 'MTech', 'MCA', 'BArch'];

const emptyForm = {
  degree_program: 'BTech',
  department: DEPARTMENTS[0],
  year: 1,
  division: 'A',
  advisor_id: '',
  academic_year: new Date().getFullYear()
};

export default function ManageClassesPage() {
  const [classes, setClasses] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cls, adv] = await Promise.all([
        adminService.getClasses(),
        adminService.getAdvisors()
      ]);
      setClasses(cls || []);
      setAdvisors(adv || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingClass(null);
    setForm({ ...emptyForm, advisor_id: advisors[0]?.advisor_id || '' });
    setIsModalOpen(true);
  };

  const openEdit = (cls) => {
    setEditingClass(cls);
    setForm({
      degree_program: cls.degree_program,
      department: cls.department,
      year: cls.year,
      division: cls.division,
      advisor_id: cls.advisor_id || cls.class_advisor?.advisor_id || '',
      academic_year: cls.academic_year
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      year: parseInt(form.year),
      advisor_id: parseInt(form.advisor_id),
      academic_year: parseInt(form.academic_year)
    };
    try {
      if (editingClass) {
        await adminService.updateClass(editingClass.class_id, payload);
        toast.success('Class updated successfully!');
      } else {
        await adminService.createClass(payload);
        toast.success('Class created!');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete ${cls.degree_program} ${cls.department} Yr${cls.year} ${cls.division}? This cannot be undone.`)) return;
    try {
      await adminService.deleteClass(cls.class_id);
      toast.success('Class deleted.');
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Deletion failed. Class may have students assigned.');
    }
  };

  const inputClass = "w-full border border-outline-variant rounded-md px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <button onClick={openCreate} className="btn-primary py-3 px-6 shrink-0">
          <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Class</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-on-surface-variant flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <BookOpen className="w-16 h-16 text-outline mb-6" />
            <p className="font-serif font-bold text-2xl text-on-surface mb-3">No Classes Found</p>
            <p className="max-w-xl mx-auto text-on-surface-variant leading-relaxed">No academic classes are configured yet. Click "Add Class" to register one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Degree</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Department</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Year</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Division</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Class Advisor</th>
                  <th className="p-4 font-bold text-xs text-on-surface-variant uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {classes.map((cls) => (
                  <tr key={cls.class_id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="p-4 font-medium text-on-surface">{cls.degree_program}</td>
                    <td className="p-4 text-on-surface-variant text-sm">{cls.department}</td>
                    <td className="p-4 text-on-surface-variant font-bold">Year {cls.year}</td>
                    <td className="p-4 text-on-surface-variant">{cls.division}</td>
                    <td className="p-4 text-on-surface-variant">
                      {cls.class_advisor ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{cls.class_advisor.name}</span>
                          <span className="text-xs text-outline">{cls.class_advisor.email}</span>
                        </div>
                      ) : <span className="text-outline italic">Unassigned</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(cls)} className="p-2 rounded hover:bg-primary/10 text-primary transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cls)} className="p-2 rounded hover:bg-red-100 text-red-500 transition-colors" title="Delete">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClass ? 'Edit Class' : 'Add New Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Degree Program *</label>
              <select name="degree_program" value={form.degree_program} onChange={handleChange} required className={inputClass}>
                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Year *</label>
              <select name="year" value={form.year} onChange={handleChange} required className={inputClass}>
                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Department *</label>
            <select name="department" value={form.department} onChange={handleChange} required className={inputClass}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Division *</label>
              <input name="division" value={form.division} onChange={handleChange} required maxLength={5}
                placeholder="e.g. A, B" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Assign Class Advisor *</label>
              <select name="advisor_id" value={form.advisor_id} onChange={handleChange} required className={inputClass}>
                <option value="">-- Select Advisor --</option>
                {advisors.map(a => <option key={a.advisor_id} value={a.advisor_id}>{a.name} ({a.department})</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2 text-sm flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingClass ? 'Save Changes' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
