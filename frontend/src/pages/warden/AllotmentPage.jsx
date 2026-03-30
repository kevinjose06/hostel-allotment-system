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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-primary tracking-tight">System Allotment Engine</h1>
        <p className="font-sans text-on-surface-variant mt-2 leading-relaxed">
          Select structural infrastructure and cohort temporal period to execute the institutional algorithm. 
          Categorized logic runs linearly (PWD → BPL → SC/ST) prior to assessing general merit vectors.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-3">Target Infrastructure Structure <span className="text-error">*</span></label>
              <select value={selectedHostel} onChange={e => setSelectedHostel(e.target.value)} className="input py-4 text-base">
                <option value="">Select monitored infrastructure...</option>
                {hostels.map(h => (
                  <option key={h.hostel_id} value={h.hostel_id}>
                    {h.hostel_name} ({h.hostel_type}) — {h.available_seats} vac.
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-3">Target Academic Session <span className="text-error">*</span></label>
              <input
                type="number"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="input py-4 text-base"
              />
            </div>
          </div>

          <div className="bg-secondary/10 border border-secondary/20 rounded-md p-6 flex gap-5 mt-10">
             <div className="mt-0.5 text-secondary shrink-0">
               <Trophy className="w-6 h-6" />
             </div>
             <div>
               <h4 className="font-sans font-bold text-secondary uppercase tracking-widest text-[11px] mb-2">Critical Action Warning</h4>
               <p className="text-sm text-secondary-container-dark leading-relaxed font-medium">
                 Triggering the algorithmic engine will irrevocably map active applications to available institutional beds. 
                 Ensure all target applicants have concluded the stringent advisor review protocol before officially proceeding.
               </p>
             </div>
          </div>

          <button
            onClick={() => allotmentMutation.mutate()}
            disabled={!selectedHostel || allotmentMutation.isPending}
            className="w-full py-5 bg-primary hover:bg-primary-fixed text-white font-bold uppercase tracking-widest text-sm rounded-md shadow-ambient transition-all disabled:opacity-50 disabled:bg-surface-container disabled:text-on-surface-variant flex items-center justify-center gap-3"
          >
            {allotmentMutation.isPending ? 'Executing Matrix Vectors...' : <><Sparkles className="w-5 h-5" /> Execute Rank Algorithm</>}
          </button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-md p-10 relative overflow-hidden shadow-ambient">
             <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
             
             <h2 className="font-serif font-bold text-primary text-3xl mb-8 flex items-center gap-4 tracking-tight relative z-10">
                <Users className="w-8 h-8 text-secondary" />
                Institutional Allotment Concluded
             </h2>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm relative z-10">
               <div className="bg-surface-container-low p-5 rounded-sm border border-surface-container">
                 <span className="text-on-surface-variant font-bold block uppercase tracking-widest text-[10px] mb-2">Designation</span>
                 <strong className="text-primary font-serif text-xl">{result.hostel_name}</strong>
               </div>
               <div className="bg-surface-container-low p-5 rounded-sm border border-surface-container">
                 <span className="text-on-surface-variant font-bold block uppercase tracking-widest text-[10px] mb-2">Session Year</span>
                 <strong className="text-primary font-serif text-xl">{result.academic_year}</strong>
               </div>
               <div className="bg-surface-container-low p-5 rounded-sm border border-surface-container sm:col-span-2">
                 <span className="text-on-surface-variant font-bold block uppercase tracking-widest text-[10px] mb-2">Allocation Matrix Breakdown</span>
                 <div className="flex gap-5 items-end mt-1">
                   <div>
                     <span className="text-3xl font-serif font-bold text-secondary leading-none">{result.total_allocated}</span>
                     <span className="text-xs text-on-surface-variant ml-2 font-bold uppercase tracking-wider">Beds Filled</span>
                   </div>
                   <div className="h-8 border-l border-surface-container-highest"></div>
                   <div className="text-[11px] text-on-surface font-semibold uppercase tracking-wider space-y-1">
                     <p><strong className="text-primary text-sm mr-1">{result.reserved_allocated}</strong> Reserved Quota</p>
                     <p><strong className="text-primary text-sm mr-1">{result.general_allocated}</strong> General Merit</p>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="mt-10 pt-8 border-t border-surface-container relative z-10">
               <a href="/warden/results" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs hover:text-secondary group transition-colors">
                 Review Manifest Document <span className="group-hover:translate-x-1 transition-transform">→</span>
               </a>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
