import { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

export default function ManageClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await adminService.getClasses();
      setClasses(data || []);
    } catch (err) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    toast.success('Add Class form coming soon!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl text-primary tracking-tight">Manage Classes</h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">View all registered academic classes and their assigned advisors.</p>
        </div>
        <button onClick={handleCreateNew} className="btn-primary py-3 px-6 shrink-0">
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
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Degree</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Department</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Year</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Division</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Class Advisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {classes.map((cls) => (
                  <tr key={cls.class_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4 font-medium text-on-surface">{cls.degree_program}</td>
                    <td className="p-4 text-on-surface-variant">{cls.department}</td>
                    <td className="p-4 text-on-surface-variant font-bold">Year {cls.year}</td>
                    <td className="p-4 text-on-surface-variant">{cls.division}</td>
                    <td className="p-4 text-on-surface-variant">
                      {cls.class_advisor ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{cls.class_advisor.name}</span>
                          <span className="text-xs text-outline">{cls.class_advisor.email}</span>
                        </div>
                      ) : (
                        <span className="text-outline italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
