import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/shared/StatusBadge';
import MeritScoreBar from '../../components/shared/MeritScoreBar';
import { Search } from 'lucide-react';

const STATUSES = ['All', 'Pending', 'Approved', 'Rejected', 'Returned'];

export default function ApplicationsListPage({ isAdmin = false }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const endpoint = isAdmin ? '/admin/stats' : '/advisor/applications';
  
  const { data: rawApps = [], isLoading } = useQuery({
    queryKey: [isAdmin ? 'admin-applications' : 'advisor-applications', statusFilter],
    queryFn: () => api.get(endpoint, {
      params: statusFilter !== 'All' ? { status: statusFilter } : {}
    }).then(r => isAdmin ? r.data.data?.applications || [] : r.data.data)
  });

  const filtered = rawApps.filter(a =>
    a.student?.college_id?.toLowerCase().includes(search.toLowerCase()) ||
    (a.student?.first_name + ' ' + a.student?.last_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isAdmin ? 'All Applications' : 'Class Applications'}
          </h1>
          <p className="text-gray-500 mt-1">Review student applications for hostel accommodation.</p>
        </div>
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium text-sm">
          {filtered.length} total
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 h-11 w-full"
            placeholder="Search by student name or college ID..."
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 font-semibold transition-colors rounded-lg text-sm whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="th">Student Name</th>
                <th className="th">College ID</th>
                <th className="th hidden md:table-cell">Department</th>
                <th className="th hidden lg:table-cell">Category</th>
                <th className="th hidden sm:table-cell">Algorithm Score</th>
                <th className="th">Status</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((app, i) => (
                <tr key={app.application_id || i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="td font-bold text-gray-900">
                    {app.student?.first_name} {app.student?.last_name}
                  </td>
                  <td className="td font-mono text-gray-600 font-medium">{app.student?.college_id}</td>
                  <td className="td hidden md:table-cell text-gray-500">{app.student?.class?.department}</td>
                  <td className="td hidden lg:table-cell">
                    <div className="flex gap-1.5 flex-wrap">
                      {app.student?.pwd_status && <span className="category-tag bg-purple-100 text-purple-700 border border-purple-200">PWD</span>}
                      {app.student?.bpl_status && <span className="category-tag bg-red-100 text-red-700 border border-red-200">BPL</span>}
                      {app.student?.sc_st_status && <span className="category-tag bg-orange-100 text-orange-700 border border-orange-200">SC/ST</span>}
                      {!app.student?.pwd_status && !app.student?.bpl_status && !app.student?.sc_st_status &&
                        <span className="category-tag bg-gray-100 text-gray-500 border border-gray-200">General</span>}
                    </div>
                  </td>
                  <td className="td hidden sm:table-cell w-40">
                    <MeritScoreBar score={app.merit_score} />
                  </td>
                  <td className="td">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="td text-right">
                    {isAdmin ? (
                      <span className="text-gray-400 text-xs italic">View Only</span>
                    ) : (
                      <Link
                        to={`/advisor/application/${app.application_id}`}
                        className="inline-flex font-semibold text-blue-600 hover:text-blue-800 hover:underline px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center mb-3">
                      <Search className="h-8 w-8 text-gray-300" />
                    </div>
                    No applications found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
