import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import HostelOccupancyCard from '../../components/shared/HostelOccupancyCard';
import { Users, FileText, Building2, CheckSquare, Settings, ChevronRight, Calculator, Calendar, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data)
  });

  const { data: configs } = useQuery({
    queryKey: ['system-configs'],
    queryFn: () => api.get('/admin/config').then(r => r.data.data)
  });

  if (isLoading) return <LoadingSpinner />;

  const hostels = stats?.hostels || [];

  const statusCounts = {};
  stats?.applications?.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="bg-primary rounded-md p-8 md:p-12 text-white shadow-ambient relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        <div className="relative z-10">
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mb-4 text-white">Admin Dashboard</h1>
          <p className="font-sans text-primary-fixed-dim max-w-xl leading-relaxed text-lg">
            System overview and core configurations for the hostel allotment process.
          </p>
        </div>
        <Link 
          to="/admin/settings" 
          className="relative z-10 flex items-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-md border border-white/20 transition-all group shrink-0"
        >
          <div className="p-3 rounded-md bg-white/10">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm tracking-widest uppercase mb-1">System Settings</p>
            <p className="text-white/60 text-xs">Manage Deadlines & Categories</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Global Config Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-md p-4 flex items-center gap-4">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Year</p>
            <p className="font-serif font-bold text-primary">{configs?.academic_year || 'Not Set'}</p>
          </div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-md p-4 flex items-center gap-4">
          <Calculator className="h-5 w-5 text-secondary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Reservation</p>
            <p className="font-serif font-bold text-primary">{configs?.reservation_percentage || '20'}%</p>
          </div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-md p-4 flex items-center gap-4">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Deadline</p>
            <p className="font-serif font-bold text-primary">
              {configs?.application_deadline ? new Date(configs.application_deadline).toLocaleDateString() : 'No Deadline'}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Applications', value: stats?.applications?.length ?? 0, icon: FileText, color: 'primary' },
          { label: 'Pending Action', value: statusCounts['Pending'] ?? 0, icon: Users, color: 'secondary' },
          { label: 'Ready for Allotment', value: statusCounts['Approved'] ?? 0, icon: CheckSquare, color: 'primary' },
          { label: 'Total Capacity', value: hostels.reduce((acc, h) => acc + h.total_capacity, 0), icon: Building2, color: 'secondary' },
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
          <h2 className="font-sans font-bold text-primary uppercase tracking-widest text-xs">Current Hostel Occupancy</h2>
        </div>
        
        {hostels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {hostels.map(h => <HostelOccupancyCard key={h.hostel_id} hostel={h} />)}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-md border border-outline-variant/10 shadow-ambient p-16 text-center">
             <Building2 className="w-12 h-12 text-outline-variant/50 mx-auto mb-6" />
             <p className="text-on-surface-variant font-bold text-lg">No hostels have been created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
