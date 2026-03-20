import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Sparkles, Trophy, Users } from 'lucide-react';

export default function AllotmentPage() {
  const [selectedHostel, setSelectedHostel] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState(null);
  const qc = useQueryClient();

  const { data: hostels = [], isLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => api.get('/hostel').then(r => r.data.data)
  });

  const allotmentMutation = useMutation({
    mutationFn: () => api.post('/allotment/run', {
      hostel_id: parseInt(selectedHostel),
      academic_year: parseInt(academicYear)
    }),
    onSuccess: (res) => {
      setResult(res.data.data);
      toast.success('Merit-based allotment engine complete!');
      qc.invalidateQueries(['hostels']);
    },
    onError: (err) => toast.error('Allotment failed to run')
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Run Hostel Allotment</h1>
        <p className="text-gray-500 mt-2 leading-relaxed">
          Select an institution and an academic year to trigger the backend allotment strategy. 
          Reserved seats are processed sequentially (PWD → BPL → SC/ST) before assessing general merit ranking.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label font-bold text-gray-800">Target Institution *</label>
              <select value={selectedHostel} onChange={e => setSelectedHostel(e.target.value)} className="input py-3">
                <option value="">Select a monitored hostel...</option>
                {hostels.map(h => (
                  <option key={h.hostel_id} value={h.hostel_id}>
                    {h.hostel_name} ({h.hostel_type}) — {h.available_seats} vac.
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label font-bold text-gray-800">Target Academic Year *</label>
              <input
                type="number"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="input py-3"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4 mt-8">
             <div className="mt-0.5 text-amber-500">
               <Trophy className="w-5 h-5" />
             </div>
             <div>
               <h4 className="font-bold text-amber-900 text-sm mb-1">Critical Action Warning</h4>
               <p className="text-sm text-amber-800 leading-relaxed">
                 Triggering the algorithm will irrevocably map applications to available beds. 
                 Ensure all target applications have concluded the advisor review process before proceeding.
               </p>
             </div>
          </div>

          <button
            onClick={() => allotmentMutation.mutate()}
            disabled={!selectedHostel || allotmentMutation.isPending}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-gray-300 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {allotmentMutation.isPending ? 'Running Engine Parameters...' : <><Sparkles className="w-5 h-5" /> Execute Rank Algorithm</>}
          </button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 relative overflow-hidden shadow-sm">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500 opacity-5 rounded-full blur-2xl"></div>
             
             <h2 className="font-bold text-green-900 text-2xl mb-6 flex items-center gap-3 tracking-tight">
                <Users className="w-7 h-7 text-green-600" />
                Allotment Successfully Concluded
             </h2>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm relative z-10">
               <div className="bg-white/60 p-4 rounded-xl border border-green-100 shadow-sm">
                 <span className="text-green-700 font-semibold block uppercase tracking-wider text-[10px] mb-1">Target</span>
                 <strong className="text-gray-900 text-base">{result.hostel_name}</strong>
               </div>
               <div className="bg-white/60 p-4 rounded-xl border border-green-100 shadow-sm">
                 <span className="text-green-700 font-semibold block uppercase tracking-wider text-[10px] mb-1">Year</span>
                 <strong className="text-gray-900 text-base">{result.academic_year}</strong>
               </div>
               <div className="bg-white/60 p-4 rounded-xl border border-green-100 shadow-sm sm:col-span-2">
                 <span className="text-green-700 font-semibold block uppercase tracking-wider text-[10px] mb-1">Allocation Map Breakdown</span>
                 <div className="flex gap-4 items-end mt-1">
                   <div>
                     <span className="text-2xl font-bold text-emerald-600 leading-none">{result.total_allocated}</span>
                     <span className="text-xs text-gray-500 ml-1 font-medium">Beds Filled</span>
                   </div>
                   <div className="h-6 border-l border-green-200"></div>
                   <div className="text-xs text-gray-500 font-medium">
                     <p><strong className="text-gray-800">{result.reserved_allocated}</strong> Reserved</p>
                     <p><strong className="text-gray-800">{result.general_allocated}</strong> Gen. Merit</p>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-green-200/50">
               <a href="/warden/results" className="inline-flex items-center gap-2 text-green-700 font-bold hover:text-green-800 hover:underline">
                 Review Manifest Document →
               </a>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
