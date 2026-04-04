import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/shared/StatusBadge';
import MeritScoreBar from '../../components/shared/MeritScoreBar';
import { Search } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const STATUSES = ['All', 'Pending', 'Approved', 'Rejected', 'Returned'];

export default function ApplicationsListPage({ isAdmin = false, isWarden = false }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: wardenProfile } = useQuery({
    queryKey: ['warden-me'],
    queryFn: () => api.get('/admin/warden/me').then(r => r.data.data),
    enabled: isWarden
  });

  const endpoint = (isAdmin || isWarden) ? '/admin/stats' : '/advisor/applications';
  
  const { data: rawApps = [], isLoading } = useQuery({
    queryKey: [isAdmin ? 'admin-applications' : isWarden ? 'warden-applications' : 'advisor-applications', statusFilter, wardenProfile?.hostel_id],
    queryFn: () => {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (isWarden && wardenProfile?.hostel_id) params.hostel_id = wardenProfile.hostel_id;
      
      return api.get(endpoint, { params }).then(r => {
        const apps = (isAdmin || isWarden) ? r.data.data?.applications || [] : r.data.data;
        
        return apps.map(app => {
          // If it's from the Admin dashboard view, it might be flat
          if ((isAdmin || isWarden) && app.student_name) {
            const names = app.student_name.split(' ');
            return {
              ...app,
              student: {
                first_name: names[0],
                last_name: names.slice(1).join(' '),
                college_id: app.college_id,
                class: {
                  department: app.department,
                  degree_program: app.degree_program
                }
              }
            };
          }

          // Fallback if student object doesn't exist but we have IDs
          if (!app.student && app.college_id) {
            return {
              ...app,
              student: {
                first_name: app.first_name || 'Student',
                last_name: app.last_name || '',
                college_id: app.college_id
              }
            };
          }
          
          // Standard advisor relation mapping
          return {
            ...app,
            student: Array.isArray(app.student) ? app.student[0] : app.student
          };
        });
      });
    }
  });

  const filtered = rawApps.filter(a =>
    a.student?.college_id?.toLowerCase().includes(search.toLowerCase()) ||
    (a.student?.first_name + ' ' + a.student?.last_name).toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl text-primary tracking-tight">
            {isAdmin ? 'All Applications' : isWarden ? 'Applicant Review Dashboard' : 'Class Applications'}
          </h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">
            {isWarden ? 'Review merit-based applications for your hostel gender category.' : 'Review student hostel applications.'}
          </p>
        </div>
        <div className="inline-flex items-center px-4 py-1.5 rounded-sm border border-outline-variant/30 bg-surface-container-low text-primary font-bold text-xs uppercase tracking-widest shrink-0">
          Total Count: {filtered.length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-surface-container-lowest p-6 rounded-md border border-outline-variant/10 shadow-ambient">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-12 h-12 w-full text-base"
            placeholder="Search by student name or college ID..."
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 shrink-0">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-5 py-2.5 font-bold uppercase tracking-wider transition-colors rounded-md text-xs whitespace-nowrap border ${
                statusFilter === s
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface border-surface-container hover:text-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-md border border-outline-variant/10 overflow-hidden shadow-ambient">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-low border-b border-surface-container">
              <tr>
                <th className="th">Student Name</th>
                <th className="th">College ID</th>
                <th className="th hidden md:table-cell">Department</th>
                <th className="th hidden lg:table-cell">Category</th>
                <th className="th hidden sm:table-cell">Merit Score</th>
                <th className="th">Status</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filtered.map((app, i) => (
                <tr key={app.application_id || i} className="hover:bg-surface-container/30 transition-colors">
                  <td className="td font-serif font-bold text-primary text-base">
                    {app.student?.first_name} {app.student?.middle_name ? app.student.middle_name + ' ' : ''}{app.student?.last_name}
                  </td>
                  <td className="td font-mono tracking-wide text-on-surface-variant font-medium">{app.student?.college_id}</td>
                  <td className="td hidden md:table-cell text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">{app.student?.class?.department}</td>
                  <td className="td hidden lg:table-cell">
                    <div className="flex gap-2 flex-wrap">
                      {app?.pwd_status && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-primary/10 text-primary border border-primary/20">PWD</span>}
                      {app?.bpl_status && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-secondary/10 text-secondary border border-secondary/20">BPL</span>}
                      {app?.sc_st_status && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-primary/10 text-primary border border-primary/20">SC/ST</span>}
                      {!app?.pwd_status && !app?.bpl_status && !app?.sc_st_status &&
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-surface-container-high text-on-surface-variant border border-outline-variant/30">General</span>}
                    </div>
                  </td>
                  <td className="td hidden sm:table-cell w-48">
                    <MeritScoreBar score={app.merit_score} />
                  </td>
                  <td className="td">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="td text-right">
                    {(isAdmin || isWarden) ? (
                      <Link
                        to={`/advisor/application/${app.application_id}`}
                        className="inline-flex font-bold text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/30 px-3 py-1.5 rounded-sm bg-surface-container-low"
                      >
                        View Details
                      </Link>
                    ) : (
                      <Link
                        to={`/advisor/application/${app.application_id}`}
                        className="inline-flex font-bold text-xs uppercase tracking-widest text-primary hover:text-primary-fixed hover:bg-surface-container border border-transparent hover:border-outline-variant/30 px-4 py-2 rounded-sm transition-colors"
                      >
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-on-surface-variant">
                    <div className="flex justify-center mb-4">
                      <Search className="h-8 w-8 text-outline-variant/50" />
                    </div>
                    <p className="font-sans font-medium text-base">No applications found.</p>
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
