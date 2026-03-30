import { useState, useEffect } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

export default function ManageAdvisorsPage() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdvisors();
      setAdvisors(data || []);
    } catch (err) {
      toast.error('Failed to load class advisors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    toast.success('Add Advisor form coming soon!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl text-primary tracking-tight">Manage Class Advisors</h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">View and add faculty members who serve as class advisors.</p>
        </div>
        <button onClick={handleCreateNew} className="btn-primary py-3 px-6 shrink-0">
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
             <p className="max-w-xl mx-auto text-on-surface-variant leading-relaxed">There are currently no class advisors assigned in the institutional database. Click "Designate Advisor" to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="p-4 font-bold text-sm tracking-uppercase text-on-surface-variant uppercase">Name</th>
                  <th className="p-4 font-bold text-sm tracking-uppercase text-on-surface-variant uppercase">Department</th>
                  <th className="p-4 font-bold text-sm tracking-uppercase text-on-surface-variant uppercase">Email</th>
                  <th className="p-4 font-bold text-sm tracking-uppercase text-on-surface-variant uppercase">Phone</th>
                  <th className="p-4 font-bold text-sm tracking-uppercase text-on-surface-variant uppercase">Assigned Classes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {advisors.map((adv) => (
                  <tr key={adv.advisor_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4 font-medium text-on-surface">{adv.name}</td>
                    <td className="p-4 text-on-surface-variant">{adv.department}</td>
                    <td className="p-4 text-on-surface-variant text-sm">{adv.email}</td>
                    <td className="p-4 text-on-surface-variant text-sm">{adv.contact_no || 'N/A'}</td>
                    <td className="p-4 text-on-surface-variant text-sm">
                       {adv.class && adv.class.length > 0 
                          ? adv.class.map((c) => `${c.degree_program} ${c.department} S${c.year*2} ${c.division}`).join(', ') 
                          : 'None'}
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
