import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { User, MapPin, IndianRupee, HandHeart, Check, X, RotateCcw, FileText, ExternalLink } from 'lucide-react';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [remarks, setRemarks] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/advisor/application/${id}`).then(r => r.data.data)
  });

  const { data: docs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['application-docs', id],
    queryFn: () => api.get(`/advisor/application/${id}/documents`).then(r => r.data.data),
    enabled: !!id
  });

  const mutationOptions = (action) => ({
    mutationFn: () => api.patch(`/advisor/application/${id}/${action}`, { remarks }),
    onSuccess: () => {
      toast.success(`Application updated successfully`);
      qc.invalidateQueries(['advisor-applications']);
      navigate('/advisor/applications');
    },
    onError: (err) => toast.error('Action failed')
  });

  const approveMutation = useMutation(mutationOptions('approve'));
  const rejectMutation  = useMutation(mutationOptions('reject'));
  const returnMutation  = useMutation(mutationOptions('return'));

  if (isLoading) return <LoadingSpinner />;
  if (!app) return <div>Application not found</div>;

  const s = Array.isArray(app.student) ? app.student[0] : app.student;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="font-serif text-4xl text-primary tracking-tight">
            Application <span className="text-secondary font-mono text-3xl ml-2">#{id}</span>
          </h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">Review the student's details before approving or rejecting.</p>
        </div>
        <div className="shrink-0">
          <StatusBadge status={app.status} />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        {/* Student Header */}
        <div className="bg-surface-container-low px-8 py-6 border-b border-surface-container flex sm:items-center justify-between gap-6 flex-col sm:flex-row">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-primary shadow-inner rounded-sm flex items-center justify-center font-serif text-2xl text-white">
              {s?.first_name?.[0]}{s?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-serif text-primary">{s?.first_name} {s?.middle_name ? s.middle_name + ' ' : ''}{s?.last_name}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-mono rounded-sm font-semibold tracking-wider text-[11px]">{s?.college_id}</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">{s?.class?.department}</span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
             <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Date of Submission</p>
             <p className="font-mono text-primary text-base">{new Date(app.application_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Personal Details */}
          <div>
            <div className="flex items-center justify-between border-b border-surface-container pb-4 mb-6">
               <h3 className="font-sans font-bold text-primary uppercase tracking-widest text-xs">Student Details</h3>
               <User className="w-4 h-4 text-on-surface-variant/50" />
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">Gender</dt>
                <dd className="font-medium text-on-surface text-base">{s?.gender}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">Date of Birth</dt>
                <dd className="font-medium text-on-surface text-base">{s?.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">Email</dt>
                <dd className="font-medium text-on-surface text-base">{s?.email}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">Phone Number</dt>
                <dd className="font-medium text-on-surface text-base">{s?.contact_number}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider min-w-[120px]">Home Address</dt>
                <dd className="font-medium text-on-surface text-sm text-right leading-relaxed max-w-[200px]">{app?.home_address || 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">Guardian Name</dt>
                <dd className="font-medium text-on-surface text-base">{app?.guardian_name || 'N/A'}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">Guardian Contact</dt>
                <dd className="font-medium text-on-surface text-base">{app?.guardian_contact || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Assessment Details */}
          <div>
            <div className="flex items-center justify-between border-b border-surface-container pb-4 mb-6">
               <h3 className="font-sans font-bold text-primary uppercase tracking-widest text-xs">Assessment Details</h3>
               <HandHeart className="w-4 h-4 text-on-surface-variant/50" />
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  Declared Income <IndianRupee className="w-3.5 h-3.5"/>
                </dt>
                <dd className="font-semibold text-primary text-lg">₹{app?.family_annual_income?.toLocaleString('en-IN')}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-surface-container-low">
                <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  Distance from College <MapPin className="w-3.5 h-3.5"/>
                </dt>
                <dd className="font-semibold text-primary text-base">{app?.distance_from_college} km</dd>
              </div>
              
              <div className="pt-4">
                 <dt className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-widest mb-4">Categories</dt>
                 <dd className="flex flex-col gap-3">
                   <div className="flex items-center justify-between bg-surface-container p-3.5 rounded-sm border border-outline-variant/10">
                      <span className="font-medium text-on-surface text-sm">Persons with Disability (PWD)</span>
                      {app?.pwd_status ? <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] tracking-widest rounded-sm uppercase">Yes</span> : <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">No</span>}
                   </div>
                   <div className="flex items-center justify-between bg-surface-container p-3.5 rounded-sm border border-outline-variant/10">
                      <span className="font-medium text-on-surface text-sm">Below Poverty Line (BPL)</span>
                      {app?.bpl_status ? <span className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 font-bold text-[10px] tracking-widest rounded-sm uppercase">Yes</span> : <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">No</span>}
                   </div>
                   <div className="flex items-center justify-between bg-surface-container p-3.5 rounded-sm border border-outline-variant/10">
                      <span className="font-medium text-on-surface text-sm">SC / ST Reservation</span>
                      {app?.sc_st_status ? <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] tracking-widest rounded-sm uppercase">Yes</span> : <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">No</span>}
                   </div>
                 </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Documents Card */}
      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="bg-surface-container-low px-8 py-5 border-b border-surface-container flex items-center justify-between">
          <h3 className="font-sans font-bold text-primary uppercase tracking-widest text-xs">Submitted Documents</h3>
          <FileText className="w-4 h-4 text-on-surface-variant/50" />
        </div>
        <div className="p-6">
          {docsLoading ? (
            <p className="text-sm text-on-surface-variant">Loading documents…</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic">No documents uploaded for this application.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docs.map((doc) => {
                const statusColor = doc.verification_status === 'Verified'
                  ? 'bg-secondary/10 text-secondary border-secondary/20'
                  : doc.verification_status === 'Rejected'
                  ? 'bg-error/10 text-error border-error/20'
                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20';
                return (
                  <div key={doc.document_id} className="flex items-center justify-between gap-4 bg-surface-container p-4 rounded-sm border border-outline-variant/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-on-surface truncate">{doc.document_type?.replace(/_/g, ' ')}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${statusColor}`}>
                          {doc.verification_status}
                        </span>
                      </div>
                    </div>
                    {doc.signed_url ? (
                      <a
                        href={doc.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current Remarks Display */}
      {app.remarks && (
        <div className="bg-surface-container-low border border-surface-container rounded-md p-8 md:p-10 flex gap-6 items-start">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Historical Review Remarks</h4>
            <p className="text-on-surface font-sans text-base leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
              "{app.remarks}"
            </p>
          </div>
        </div>
      )}

      {app.status === 'Pending' && (
        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
          <h3 className="font-serif text-2xl text-primary mb-8 pl-4">Action Panel</h3>

          {!showRejectForm && !showReturnForm ? (
            <div className="flex gap-4 flex-col sm:flex-row pl-4">
              <button 
                onClick={() => approveMutation.mutate()} 
                disabled={approveMutation.isPending}
                className="flex-1 py-4 bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container rounded-md font-bold tracking-widest uppercase text-xs transition-colors shadow-sm border border-secondary flex justify-center items-center gap-2"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button 
                onClick={() => setShowReturnForm(true)}
                className="flex-1 py-4 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-md font-bold tracking-widest uppercase text-xs transition-colors shadow-sm border border-outline-variant/30 flex justify-center items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Return to Student
              </button>
              <button 
                onClick={() => setShowRejectForm(true)}
                className="flex-1 py-4 bg-error text-white hover:bg-error/90 rounded-md font-bold tracking-widest uppercase text-xs transition-colors shadow-sm flex justify-center items-center gap-2"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          ) : (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200 pl-4">
              <label className="block text-xs font-bold uppercase tracking-widest text-primary">
                 {showRejectForm ? 'Reason for Rejection' : 'Reason for Return'} <span className="text-error">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={4}
                autoFocus
                className="input w-full text-base p-5"
                placeholder={showRejectForm ? 'Explain why this application is being rejected...' : 'Explain what needs to be fixed...'}
              />
              <div className="flex gap-4 pt-2">
                <button
                  disabled={!remarks.trim()}
                  onClick={() => showRejectForm ? rejectMutation.mutate() : returnMutation.mutate()}
                  className={`flex-1 py-4 text-white rounded-md font-bold uppercase tracking-widest text-xs transition-all shadow-sm ${
                    showRejectForm ? 'bg-error hover:bg-error/90 disabled:bg-error/50' : 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300'
                  }`}
                >
                  Confirm {showRejectForm ? 'Rejection' : 'Return'}
                </button>
                <button 
                  onClick={() => { setShowRejectForm(false); setShowReturnForm(false); }}
                  className="flex-1 py-4 bg-surface-container text-on-surface hover:bg-surface-container-high font-bold uppercase tracking-widest text-xs rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
