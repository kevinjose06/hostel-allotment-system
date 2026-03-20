import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import HostelOccupancyCard from '../../components/shared/HostelOccupancyCard';
import { Users, FileText, Building2, CheckSquare } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data)
  });

  const { data: hostels = [], isLoading: isHostelsLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => api.get('/hostel').then(r => r.data.data)
  });

  if (isStatsLoading || isHostelsLoading) return <LoadingSpinner />;

  const statusCounts = {};
  stats?.applications?.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and hostel metrics.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats?.applications?.length ?? 0, icon: FileText, color: 'blue' },
          { label: 'Pending Review', value: statusCounts['Pending'] ?? 0, icon: Users, color: 'yellow' },
          { label: 'Approved (Ready to Allot)', value: statusCounts['Approved'] ?? 0, icon: CheckSquare, color: 'green' },
          { label: 'Hostel Capacity', value: hostels.reduce((acc, h) => acc + h.total_capacity, 0), icon: Building2, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:border-gray-200 transition-colors">
            <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 shrink-0`}>
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</p>
              <p className="text-sm font-medium text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hostel Occupancy Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Live Hostel Occupancy</h2>
        </div>
        
        {hostels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hostels.map(h => <HostelOccupancyCard key={h.hostel_id} hostel={h} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
             <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-500 font-medium">No hostels configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
