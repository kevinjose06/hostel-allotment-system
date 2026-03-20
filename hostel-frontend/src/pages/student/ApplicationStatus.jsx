import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/shared/StatusBadge';
import MeritScoreBar from '../../components/shared/MeritScoreBar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { MapPin, IndianRupee, CalendarDays, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ApplicationStatus() {
  const { data: app, isLoading } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => api.get('/application/my').then(r => r.data.data)
  });

  if (isLoading) return <LoadingSpinner />;
  
  if (!app) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Application</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">You do not currently have an active hostel application for this year.</p>
        <Link to="/student/apply" className="btn-primary py-3 px-6 shadow-md shadow-blue-200">
          Start Your Application
        </Link>
      </div>
    );
  }

  const steps = [
    { name: 'Submitted', status: 'Approved' },
    { name: 'Advisor Review', status: app.status === 'Pending' ? 'Pending' : (app.status === 'Rejected' ? 'Rejected' : 'Approved') },
    { name: 'Merit List', status: ['Pending', 'Returned', 'Rejected'].includes(app.status) ? 'Pending' : 'Approved' },
    { name: 'Allotment', status: app.allocation ? 'Approved' : 'Pending' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Application Status</h1>
        <p className="text-gray-500 mt-2">Track the live progress of your hostel accommodation request.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Application ID</p>
            <p className="font-mono font-bold text-gray-900 text-lg">#{app.application_id}</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Current Status</span>
             <StatusBadge status={app.status} />
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {/* Progress Flow */}
          <div className="flex items-center justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>
            
            {steps.map((step, idx) => (
              <div key={step.name} className="flex flex-col items-center bg-white px-2 relative">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${
                   step.status === 'Approved' ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-200' :
                   step.status === 'Rejected' ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-200' :
                   'bg-white border-gray-200 text-gray-300'
                 }`}>
                   {step.status === 'Approved' ? <CheckCircle2 className="h-5 w-5" /> : 
                    step.status === 'Rejected' ? <XCircle className="h-5 w-5" /> :
                    <span className="text-sm font-bold">{idx + 1}</span>}
                 </div>
                 <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                   step.status === 'Approved' ? 'text-green-700' : 
                   step.status === 'Rejected' ? 'text-red-600' : 'text-gray-400'
                 }`}>{step.name}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Applied For</p>
                <p className="font-semibold text-gray-900">Academic Year {app.academic_year}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(app.application_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Declared Income</p>
                <p className="font-semibold text-gray-900">₹{app.family_annual_income?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Distance (km)</p>
                <p className="font-semibold text-gray-900">{app.distance_from_college} km</p>
              </div>
            </div>

            {app.merit_score && (
              <div className="col-span-1 sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Calculated Merit Score</p>
                <MeritScoreBar score={app.merit_score} />
              </div>
            )}
          </div>

          {/* Remarks/Errors block */}
          {app.remarks && (
            <div className={`rounded-xl p-5 mb-6 ${app.status === 'Rejected' ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'}`}>
              <div className="flex gap-3">
                <div className={`mt-0.5 ${app.status === 'Rejected' ? 'text-red-500' : 'text-orange-500'}`}>
                   {app.status === 'Rejected' ? <XCircle className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className={`text-sm font-bold mb-1 ${app.status === 'Rejected' ? 'text-red-800' : 'text-orange-800'}`}>
                    Advisor Remarks ({app.status})
                  </p>
                  <p className={`text-sm leading-relaxed ${app.status === 'Rejected' ? 'text-red-700' : 'text-orange-700'}`}>
                    {app.remarks}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Allocation result if allotted */}
          {app.allocation && app.allocation.status === 'Active' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-green-500 opacity-5 rounded-bl-full"></div>
              <h3 className="text-green-800 font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                🎉 Hostel Allotted!
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                <div className="bg-white/60 p-3 rounded-lg border border-green-100">
                  <span className="text-green-700/70 block text-xs font-semibold mb-1 uppercase">Hostel Name</span>
                  <span className="font-bold text-green-900 text-base">{app.allocation.hostel.hostel_name}</span>
                </div>
                <div className="bg-white/60 p-3 rounded-lg border border-green-100">
                  <span className="text-green-700/70 block text-xs font-semibold mb-1 uppercase">Category</span>
                  <span className="font-bold text-green-900 text-base">{app.allocation.category?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          )}

          {app.status === 'Returned' && (
            <div className="mt-8">
              <Link to="/student/apply" className="block text-center w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg shadow-orange-200">
                Update & Re-submit Application
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
