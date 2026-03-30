import { useState, useEffect } from 'react';
import { Building2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

export default function ManageHostelsPage() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const data = await adminService.getHostels();
      setHostels(data || []);
    } catch (err) {
      toast.error('Failed to load hostel data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    toast.success('Add Hostel form coming soon!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl text-primary tracking-tight">Manage Hostels</h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">View all hostels, their capacity, availability, and assigned wardens.</p>
        </div>
        <button onClick={handleCreateNew} className="btn-primary py-3 px-6 shrink-0">
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
             <p className="max-w-xl mx-auto text-on-surface-variant leading-relaxed">No hostel records exist in the database. Click "Add Hostel" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Hostel Name</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Type</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Total Seats</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Available</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Reserved</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase">Warden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {hostels.map((h) => {
                  const pct = Math.round((h.current_occupancy / h.total_capacity) * 100);
                  const isAlmostFull = pct >= 80;
                  return (
                    <tr key={h.hostel_id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4 font-medium text-on-surface">{h.hostel_name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${h.hostel_type === 'LH' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {h.hostel_type === 'LH' ? "Ladies" : "Mens"}
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
                        {h.warden_name ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{h.warden_name}</span>
                            <span className="text-xs text-outline">{h.warden_contact_no || ''}</span>
                          </div>
                        ) : (
                          <span className="text-outline italic">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
