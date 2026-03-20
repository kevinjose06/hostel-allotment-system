import { useQuery } from '@tanstack/react-query';
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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Warden Dashboard</h1>
        <p className="text-orange-100 max-w-2xl">
          Oversee your managed institutions, trigger merit-based allotments, and view the final result manifest.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:border-orange-200 transition-colors">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-4 shrink-0">
             <ListOrdered className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1">Trigger Allotment</p>
          <p className="text-xs text-gray-500 mb-4 px-4">Run the merit list algorithm for the assigned academic year.</p>
          <a href="/warden/allotment" className="btn-primary w-full py-2.5 bg-orange-600 hover:bg-orange-700">Run Engine</a>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:border-blue-200 transition-colors">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4 shrink-0">
             <FileText className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1">View Results</p>
          <p className="text-xs text-gray-500 mb-4 px-4">Access the generated merit list and specific student bed allocations.</p>
          <a href="/warden/results" className="text-blue-600 font-semibold border border-blue-200 bg-blue-50 py-2.5 w-full rounded-lg hover:bg-blue-100 transition-colors">View Manifest</a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
           <div className="mt-auto mb-auto w-full">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm text-gray-500 font-medium">Approval Queue</span>
                 <span className="text-sm font-bold text-green-600">All cleared ✓</span>
               </div>
               <div className="w-full bg-gray-100 rounded-full h-2">
                 <div className="h-full bg-green-500 rounded-full w-full" />
               </div>
               
               <p className="text-xs text-gray-400 mt-6">
                 No pending tasks at this moment.
               </p>
           </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Monitored Institutions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hostels.map(h => <HostelOccupancyCard key={h.hostel_id} hostel={h} />)}
        </div>
      </div>
    </div>
  );
}
