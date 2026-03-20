import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { User, MapPin, IndianRupee, HandHeart, Check, X, RotateCcw } from 'lucide-react';

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

  const s = app.student;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            Review Application <span className="text-blue-600 font-mono">#{id}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Verify details before approving or rejecting.</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Student Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-6 border-b border-gray-200 flex sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white shadow-sm border border-gray-200 rounded-full flex items-center justify-center font-bold text-2xl text-blue-600">
              {s?.first_name?.[0]}{s?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{s?.first_name} {s?.last_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-mono rounded font-semibold">{s?.college_id}</span>
                <span className="text-sm text-gray-500">{s?.class?.department}</span>
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
             <p className="text-gray-500">Applied on</p>
             <p className="font-semibold text-gray-900">{new Date(app.application_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Personal Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
               <User className="w-5 h-5 text-gray-400" />
               <h3 className="font-bold text-gray-900 text-lg">Personal Details</h3>
            </div>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-500 font-medium">Gender</dt>
                <dd className="font-semibold text-gray-900">{s?.gender}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-500 font-medium">Email</dt>
                <dd className="font-semibold text-gray-900">{s?.email}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-500 font-medium">Contact</dt>
                <dd className="font-semibold text-gray-900">{s?.contact_number}</dd>
              </div>
            </dl>
          </div>

          {/* Assessment Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
               <IndianRupee className="w-5 h-5 text-gray-400" />
               <h3 className="font-bold text-gray-900 text-lg">Assessment Profile</h3>
            </div>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-500 font-medium flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5"/> Annual Income</dt>
                <dd className="font-bold text-blue-600 text-base">₹{app?.family_annual_income?.toLocaleString('en-IN')}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-500 font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Distance</dt>
                <dd className="font-bold text-gray-900">{app?.distance_from_college} km</dd>
              </div>
              
              <div className="pt-2">
                 <dt className="text-gray-500 font-medium mb-3 flex items-center gap-1.5"><HandHeart className="w-4 h-4" /> Category Flags</dt>
                 <dd className="flex flex-col gap-2">
                   <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700">Persons with Disability (PWD)</span>
                      {s?.pwd_status ? <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold text-xs rounded uppercase">Yes</span> : <span className="text-gray-400 text-xs font-semibold uppercase">No</span>}
                   </div>
                   <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700">Below Poverty Line (BPL)</span>
                      {s?.bpl_status ? <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold text-xs rounded uppercase">Yes</span> : <span className="text-gray-400 text-xs font-semibold uppercase">No</span>}
                   </div>
                   <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700">SC / ST Reservation</span>
                      {s?.sc_st_status ? <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold text-xs rounded uppercase">Yes</span> : <span className="text-gray-400 text-xs font-semibold uppercase">No</span>}
                   </div>
                 </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {app.status === 'Pending' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 className="font-bold text-gray-900 text-lg mb-6 leading-tight">Advisor Actions</h3>

          {!showRejectForm && !showReturnForm ? (
            <div className="flex gap-4 flex-col sm:flex-row">
              <button 
                onClick={() => approveMutation.mutate()} 
                disabled={approveMutation.isPending}
                className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm flex justify-center items-center gap-2"
              >
                <Check className="w-5 h-5" /> Approve Application
              </button>
              <button 
                onClick={() => setShowReturnForm(true)}
                className="flex-1 py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-sm flex justify-center items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Return to Student
              </button>
              <button 
                onClick={() => setShowRejectForm(true)}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-sm flex justify-center items-center gap-2"
              >
                <X className="w-5 h-5" /> Reject Outright
              </button>
            </div>
          ) : (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <label className="block text-sm font-bold text-gray-700">
                 {showRejectForm ? 'Reason for Rejection' : 'Clarification Required (Sends back to student)'} *
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={4}
                autoFocus
                className="input w-full text-base p-4"
                placeholder={showRejectForm ? 'Please detail why this application is being rejected...' : 'Tell the student what they need to fix or clarify...'}
              />
              <div className="flex gap-3 pt-2">
                <button
                  disabled={!remarks.trim()}
                  onClick={() => showRejectForm ? rejectMutation.mutate() : returnMutation.mutate()}
                  className={`flex-1 py-3.5 text-white rounded-xl font-bold transition-all shadow-sm ${
                    showRejectForm ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300' : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
                  }`}
                >
                  Confirm {showRejectForm ? 'Rejection' : 'Return'}
                </button>
                <button 
                  onClick={() => { setShowRejectForm(false); setShowReturnForm(false); }}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors"
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
