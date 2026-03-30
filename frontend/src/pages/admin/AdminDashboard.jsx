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
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="bg-primary rounded-md p-8 md:p-12 text-white shadow-ambient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        <div className="relative z-10">
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mb-4 text-white">Institutional Config Matrix</h1>
          <p className="font-sans text-primary-fixed-dim max-w-2xl leading-relaxed text-lg">
            System overview and top-level infrastructure configuration.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Dossiers', value: stats?.applications?.length ?? 0, icon: FileText, color: 'primary' },
          { label: 'Pending Action', value: statusCounts['Pending'] ?? 0, icon: Users, color: 'secondary' },
          { label: 'Ready for Allotment', value: statusCounts['Approved'] ?? 0, icon: CheckSquare, color: 'primary' },
          { label: 'Max Capacity', value: hostels.reduce((acc, h) => acc + h.total_capacity, 0), icon: Building2, color: 'secondary' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-6 flex items-center gap-5 hover:border-outline-variant/30 transition-colors">
            <div className={`p-4 rounded-md border ${color === 'primary' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary border-secondary/20'} shrink-0`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-serif text-primary leading-none mb-1.5">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hostel Occupancy Cards */}
      <div>
        <div className="flex items-center justify-between border-b border-surface-container pb-4 mb-8">
          <h2 className="font-sans font-bold text-primary uppercase tracking-widest text-xs">Live Institutional Occupancy Matrix</h2>
        </div>
        
        {hostels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {hostels.map(h => <HostelOccupancyCard key={h.hostel_id} hostel={h} />)}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/10 shadow-ambient p-16 text-center">
             <Building2 className="w-12 h-12 text-outline-variant/50 mx-auto mb-6" />
             <p className="text-on-surface-variant font-bold text-lg">No infrastructure mapped yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
