import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import HostelOccupancyCard from '../../components/shared/HostelOccupancyCard';
import { Building2, FileText, CheckSquare, ListOrdered } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function WardenDashboard() {
  const { data: hostels = [], isLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => api.get('/hostel').then(r => r.data.data)
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-10">
      <div className="bg-primary rounded-md p-8 md:p-12 text-white shadow-ambient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        <div className="relative z-10">
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mb-4 text-white">Warden Dashboard</h1>
          <p className="font-sans text-primary-fixed-dim max-w-2xl leading-relaxed text-lg">
            Manage your hostel, run allotment for your assigned building, and review room assignment results.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-8 flex flex-col items-center text-center hover:border-outline-variant/30 transition-colors">
          <div className="p-5 bg-secondary/10 text-secondary border border-secondary/20 rounded-md mb-6 shrink-0">
             <ListOrdered className="w-8 h-8" />
          </div>
          <p className="font-serif text-2xl font-bold text-primary mb-2">Run Allotment</p>
          <p className="text-sm text-on-surface-variant mb-6 px-4 leading-relaxed">Assign available rooms to eligible students based on their merit score for the current academic year.</p>
          <a href="/warden/allotment" className="btn-primary w-full py-3">Run Engine</a>
        </div>
        
        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-8 flex flex-col items-center text-center hover:border-outline-variant/30 transition-colors">
          <div className="p-5 bg-primary/10 text-primary border border-primary/20 rounded-md mb-6 shrink-0">
             <FileText className="w-8 h-8" />
          </div>
          <p className="font-serif text-2xl font-bold text-primary mb-2">View Results</p>
          <p className="text-sm text-on-surface-variant mb-6 px-4 leading-relaxed">See the full list of room assignments, category-wise allocation results, and individual student details.</p>
          <Link to="/warden/applications" className="font-bold uppercase tracking-widest text-[11px] w-full py-3.5 bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/30 rounded-md transition-colors block">
            Review Documents
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-8 flex flex-col items-center text-center">
           <div className="mt-auto mb-auto w-full">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Auth Queue</span>
                 <span className="text-xs font-bold uppercase tracking-widest text-secondary">Cleared</span>
               </div>
               <div className="w-full bg-surface-container rounded-sm h-3 border border-outline-variant/10 shadow-inner">
                 <div className="h-full bg-secondary rounded-sm w-full" />
               </div>
               
               <p className="text-sm text-on-surface-variant mt-8 font-medium">
                 No pending tasks at this moment.
               </p>
           </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between border-b border-surface-container pb-4 mb-8">
          <h2 className="font-sans font-bold text-primary uppercase tracking-widest text-xs">Hostel Overview</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {hostels.map(h => <HostelOccupancyCard key={h.hostel_id} hostel={h} />)}
        </div>
      </div>
    </div>
  );
}
