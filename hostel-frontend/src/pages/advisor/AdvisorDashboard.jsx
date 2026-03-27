import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, FileText, CheckSquare, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdvisorDashboard() {
  const { data: apps = [] } = useQuery({
    queryKey: ['advisor-applications'],
    queryFn: () => api.get('/advisor/applications').then(r => r.data.data)
  });

  const stats = {
    total: apps.length,
    pending: apps.filter(a => a.status === 'Pending').length,
    approved: apps.filter(a => a.status === 'Approved').length,
    returned: apps.filter(a => a.status === 'Returned').length,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-primary rounded-md p-8 md:p-12 text-white shadow-ambient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        <div className="relative z-10">
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mb-4 text-white">Class Advisor Dashboard</h1>
          <p className="font-sans text-primary-fixed-dim max-w-2xl leading-relaxed text-lg">
            Review, approve, or return applications submitted by students in your assigned institutional class.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-6 flex items-center gap-5 hover:border-outline-variant/30 transition-colors">
          <div className="p-4 bg-surface-container-low text-primary rounded-md">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-serif text-primary mb-1">{stats.total}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex gap-2 items-center">Total <span>•</span> Dossiers</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-6 flex items-center gap-5 hover:border-outline-variant/30 transition-colors">
          <div className="p-4 bg-secondary/10 text-secondary border border-secondary/20 rounded-md">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-serif text-primary mb-1">{stats.pending}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex gap-2 items-center">Pending <span>•</span> Action</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-6 flex items-center gap-5 hover:border-outline-variant/30 transition-colors">
          <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-md">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-serif text-primary mb-1">{stats.approved}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex gap-2 items-center">Officially <span>•</span> Approved</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-6 flex items-center gap-5 hover:border-outline-variant/30 transition-colors">
          <div className="p-4 bg-secondary-container-lowest border-secondary-container/30 text-secondary rounded-md">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-serif text-primary mb-1">{stats.returned}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex gap-2 items-center">Returned <span>•</span> Student</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-md border border-surface-container p-8 flex flex-col sm:flex-row items-center justify-between gap-6 mt-10">
        <div>
          <h2 className="font-serif text-2xl text-primary mb-2">Application Review Queue</h2>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed max-w-2xl">
            You have <span className="font-bold text-secondary">{stats.pending}</span> applications waiting for your official approval. Please verify student documentation, institutional income records, and distance metric before proceeding.
          </p>
        </div>
        <Link to="/advisor/applications" className="btn-primary whitespace-nowrap px-8 py-3.5 mt-4 sm:mt-0">
          Go to Queue
        </Link>
      </div>
    </div>
  );
}
