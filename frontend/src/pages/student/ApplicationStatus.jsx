import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import StatusBadge from '../../components/shared/StatusBadge';
import MeritScoreBar from '../../components/shared/MeritScoreBar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { MapPin, IndianRupee, CalendarDays, CheckCircle2, ChevronRight, XCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ApplicationStatus() {
  const { data: app, isLoading } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => applicationService.getMyApplication()
  });

  if (isLoading) return <LoadingSpinner />;
  
  if (!app) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-12 card p-16">
        <div className="mx-auto w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-primary mb-4">No Active Application</h2>
        <p className="text-on-surface-variant text-base mb-10 max-w-sm mx-auto">You have not submitted a hostel application for this year.</p>
        <Link to="/student/apply" className="btn-primary inline-flex">
          Start New Application
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-primary tracking-tight">Application Tracker</h1>
        <p className="font-sans text-on-surface-variant mt-2 text-base">Track the progress of your hostel application.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-surface-container-low border-b border-surface-container px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-[0.1em] mb-1.5">Application ID</p>
            <p className="font-mono font-bold text-primary text-xl">#{app.application_id}</p>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-[0.1em] whitespace-nowrap">Current Status</span>
             <StatusBadge status={app.status} />
          </div>
        </div>

        <div className="p-8 lg:p-12">
          {/* Progress Flow */}
          <div className="flex items-center justify-between mb-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-container -z-10 -translate-y-1/2 rounded-full"></div>
            
            {steps.map((step, idx) => (
              <div key={step.name} className="flex flex-col items-center bg-surface-container-lowest px-2 relative">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-3 transition-colors ${
                   step.status === 'Approved' ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20' :
                   step.status === 'Rejected' ? 'bg-error border-error text-white shadow-sm shadow-error/20' :
                   'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                 }`}>
                   {step.status === 'Approved' ? <CheckCircle2 className="h-5 w-5" /> : 
                    step.status === 'Rejected' ? <XCircle className="h-5 w-5" /> :
                    <span className="text-sm font-bold font-mono">{idx + 1}</span>}
                 </div>
                 <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                   step.status === 'Approved' ? 'text-primary' : 
                   step.status === 'Rejected' ? 'text-error' : 'text-on-surface-variant'
                 }`}>{step.name}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-10 pb-10 border-b border-surface-container">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-surface-container-low text-primary rounded-md">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-semibold tracking-wider uppercase mb-1.5">Applied For</p>
                <p className="font-semibold text-primary text-lg">Academic Year {app.academic_year}</p>
                <p className="text-xs text-on-surface-variant mt-1.5">{new Date(app.application_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-surface-container-low text-primary rounded-md">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-semibold tracking-wider uppercase mb-1.5">Declared Income</p>
                <p className="font-semibold text-primary text-lg">₹{app.family_annual_income?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-surface-container-low text-primary rounded-md">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-semibold tracking-wider uppercase mb-1.5">Distance from College</p>
                <p className="font-semibold text-primary text-lg">{app.distance_from_college} km</p>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 grid grid-cols-3 gap-4 pt-4 border-t border-surface-container/50">
               <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-sm border ${app.pwd_status ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant/40 border-outline-variant/10'}`}>
                 PWD: {app.pwd_status ? 'Yes' : 'No'}
               </div>
               <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-sm border ${app.bpl_status ? 'bg-secondary/5 border-secondary/20 text-secondary' : 'bg-surface-container text-on-surface-variant/40 border-outline-variant/10'}`}>
                 BPL: {app.bpl_status ? 'Yes' : 'No'}
               </div>
               <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-sm border ${app.sc_st_status ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant/40 border-outline-variant/10'}`}>
                 SC/ST: {app.sc_st_status ? 'Yes' : 'No'}
               </div>
            </div>

            {app.merit_score && (
              <div className="col-span-1 sm:col-span-2 bg-surface-container-low p-6 rounded-md border border-surface-container">
                <p className="text-xs text-primary font-semibold tracking-wider mb-4 uppercase">Merit Score</p>
                <MeritScoreBar score={app.merit_score} />
              </div>
            )}
          </div>

          {/* Remarks/Errors block */}
          {app.remarks && (
            <div className={`rounded-md p-6 mb-8 border ${
              app.status === 'Rejected' 
                ? 'bg-error-container text-on-error-container border-error/20' 
                : 'bg-secondary-container text-on-secondary-container border-secondary/20'
            }`}>
              <div className="flex gap-4">
                <div className="mt-0.5 shrink-0">
                   {app.status === 'Rejected' ? <XCircle className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider mb-2">
                    Remarks ({app.status})
                  </p>
                  <p className="text-sm leading-relaxed">
                    {app.remarks}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Allocation result if allotted */}
          {app.allocation && app.allocation.status === 'Active' && (
            <div className="bg-primary text-white border border-primary-container rounded-md p-8 relative overflow-hidden shadow-ambient">
              <div className="absolute right-0 top-0 w-48 h-48 bg-white opacity-5 rounded-bl-full pointer-events-none"></div>
              <h3 className="text-secondary-container font-serif text-2xl mb-6 flex items-center gap-3 relative z-10">
                <CheckCircle2 className="h-7 w-7 text-secondary" />
                Allotment Confirmed
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-sm border border-white/10">
                  <span className="text-secondary-container/80 block text-xs font-semibold mb-2 uppercase tracking-wider">Allotted Hostel</span>
                  <span className="font-serif text-white text-xl">{app.allocation.hostel.hostel_name}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-sm border border-white/10">
                  <span className="text-secondary-container/80 block text-xs font-semibold mb-2 uppercase tracking-wider">Allotment Category</span>
                  <span className="font-sans font-medium text-white text-lg">{app.allocation.category?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          )}

          {app.status === 'Returned' && (
            <div className="mt-10">
              <Link to="/student/apply" className="block text-center w-full bg-secondary hover:bg-secondary-container text-on-secondary py-4 rounded-md text-sm font-bold uppercase tracking-wider transition-colors border border-secondary">
                Update & Re-submit Application
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
