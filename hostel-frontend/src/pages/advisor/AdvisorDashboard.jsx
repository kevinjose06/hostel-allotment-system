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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Class Advisor Dashboard</h1>
        <p className="text-purple-100 max-w-2xl">
          Review, approve, or return applications submitted by students in your assigned class.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm font-medium text-gray-500">Total Applications</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm font-medium text-gray-500">Pending Review</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
            <p className="text-sm font-medium text-gray-500">Approved by You</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{stats.returned}</p>
            <p className="text-sm font-medium text-gray-500">Returned / Clarification</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Application Review Queue</h2>
          <p className="text-sm text-gray-500 mt-1">
            You have {stats.pending} applications waiting for your approval. Please verify student income and distance before approving.
          </p>
        </div>
        <Link to="/advisor/applications" className="btn-primary whitespace-nowrap px-6 py-2.5 shadow-sm">
          Go to Applications
        </Link>
      </div>
    </div>
  );
}
