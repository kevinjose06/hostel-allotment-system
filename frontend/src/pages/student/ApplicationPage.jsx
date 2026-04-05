import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { studentService } from '../../services/studentService';
import toast from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../../utils/errorHelpers';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { User, Home, ShieldAlert, FileCheck, UploadCloud, Clock } from 'lucide-react';
import api from '../../services/api';

const schema = z.object({
  academic_year:         z.string().min(4, 'Academic Year is required'),
  family_annual_income:  z.coerce.number().min(1, 'Please enter a valid income amount'),
  distance_from_college: z.coerce.number().min(0.1, 'Please enter a valid distance'),
  bpl_status:            z.boolean().default(false),
  pwd_status:            z.boolean().default(false),
  sc_st_status:          z.boolean().default(false),
  home_address:          z.string().min(10, 'Please provide a full permanent address'),
  guardian_name:         z.string().min(2, 'Name is required'),
  guardian_contact:      z.string().length(10, 'Contact must be 10 digits'),
  declaration:           z.boolean().refine(val => val === true, 'You must accept the declaration'),
  
  income_certificate:    z.any().refine((files) => files && files.length > 0, 'Income Certificate is mandatory'),
  residential_certificate: z.any().refine((files) => files && files.length > 0, 'Residential Certificate is mandatory'),
  
  pwd_certificate:       z.any().optional(),
  bpl_certificate:       z.any().optional(),
  sc_st_certificate:     z.any().optional(),
  selected_category_ids: z.array(z.number()).default([]),
  dynamic_certificates:  z.record(z.any()).optional(),
}).superRefine((data, ctx) => {
  if (data.pwd_status && (!data.pwd_certificate || data.pwd_certificate.length === 0)) {
    ctx.addIssue({
      path: ['pwd_certificate'],
      message: 'Upload PWD valid certificate',
      code: z.ZodIssueCode.custom,
    });
  }
  if (data.bpl_status && (!data.bpl_certificate || data.bpl_certificate.length === 0)) {
    ctx.addIssue({
      path: ['bpl_certificate'],
      message: 'Upload BPL valid certificate',
      code: z.ZodIssueCode.custom,
    });
  }
  if (data.sc_st_status && (!data.sc_st_certificate || data.sc_st_certificate.length === 0)) {
    ctx.addIssue({
      path: ['sc_st_certificate'],
      message: 'Upload SC/ST valid certificate',
      code: z.ZodIssueCode.custom,
    });
  }
});

export default function ApplicationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();

  // 1. Fetch Student Profile for Summary
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => studentService.getProfile()
  });

  // 2. Check for existing application
  const { data: existing, isLoading: loadingApp } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => applicationService.getMyApplication()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['reservation-categories'],
    queryFn: () => api.get('/student/reservation-categories').then(r => r.data.data)
  });

  const { data: configs } = useQuery({
    queryKey: ['system-configs'],
    queryFn: () => api.get('/student/config').then(r => r.data.data)
  });

  const activeCategories = categories.filter(c => c.is_active);

  const isEditing = existing && ['Pending', 'Returned'].includes(existing.status);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    shouldUnregister: false,
    defaultValues: { 
      academic_year: configs?.academic_year || `${currentYear}-${currentYear+1}`,
      bpl_status: profile?.bpl_status || false,
      pwd_status: profile?.pwd_status || false,
      sc_st_status: profile?.sc_st_status || false
    }
  });

  // Pre-fill form when editing an existing application
  useEffect(() => {
    if (isEditing && existing) {
      reset({
        academic_year: existing.academic_year,
        family_annual_income: existing.family_annual_income,
        distance_from_college: existing.distance_from_college,
        bpl_status: existing.bpl_status || false,
        pwd_status: existing.pwd_status || false,
        sc_st_status: existing.sc_st_status || false,
        home_address: existing.home_address || '',
        guardian_name: existing.guardian_name || '',
        guardian_contact: existing.guardian_contact || '',
      });
    }
  }, [isEditing, existing, reset]);

  const pwd_status = watch('pwd_status');
  const bpl_status = watch('bpl_status');
  const sc_st_status = watch('sc_st_status');
  const selected_category_ids = watch('selected_category_ids') || [];

  if (loadingProfile || loadingApp) return <LoadingSpinner />;

  const isRegistrationClosed = configs?.application_deadline && new Date() > new Date(configs.application_deadline);

  // If deadline passed, block NEW applications (Allow 'Returned' for correction)
  if (isRegistrationClosed && (!existing || existing.status !== 'Returned')) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-md shadow-ambient text-center">
        <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          🔒
        </div>
        <h2 className="font-serif text-3xl text-primary mb-3">Registration Closed</h2>
        <p className="font-sans text-on-surface-variant mb-4 leading-relaxed">
          The official submission window for the <span className="font-bold text-primary">{configs?.academic_year}</span> session ended on <span className="font-bold">{new Date(configs.application_deadline).toLocaleDateString()}</span>.
        </p>
        <p className="text-sm text-on-surface-variant/70 mb-8">If you believe this is an error, please contact the Hostel Office.</p>
        <button onClick={() => navigate('/student/dashboard')} className="btn-secondary px-8">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Lock the form only when the application is being reviewed, finalised, or rejected
  if (existing && ['Under_Review', 'Approved', 'Waitlisted', 'Rejected'].includes(existing.status)) {
    const isRejected = existing.status === 'Rejected';
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-surface border border-outline-variant/20 rounded-md shadow-ambient text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl ${isRejected ? 'bg-error/10 text-error' : 'bg-surface-container text-primary'}`}>
          {isRejected ? '❌' : '⏳'}
        </div>
        <h2 className={`font-serif text-2xl mb-2 ${isRejected ? 'text-error' : 'text-primary'}`}>
          {isRejected ? 'Application Rejected' : 'Application Under Review'}
        </h2>
        <p className="font-sans text-on-surface-variant mb-8 leading-relaxed">
          {isRejected 
            ? 'Your application has been thoroughly reviewed and regrettably rejected for this academic year. You may not re-submit.' 
            : 'Your application is currently being processed. Changes cannot be made at this stage.'}
        </p>
        <button onClick={() => navigate('/student/status')} className="btn-primary w-full sm:w-auto">
          View Application Status
        </button>
      </div>
    );
  }

    const loadingToast = toast.loading(isEditing ? 'Updating application...' : 'Uploading documents and submitting...');
    try {
      if (isEditing) {
        await applicationService.updateApplication(existing.application_id, data);
        toast.success('Application updated successfully!', { id: loadingToast });
      } else {
        await applicationService.submitApplication(data);
        toast.success('Your official application has been submitted successfully!', { id: loadingToast });
      }
      qc.invalidateQueries(['my-application']);
      navigate('/student/status');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err), { id: loadingToast });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-3">
        <h1 className="font-serif text-4xl lg:text-5xl text-primary tracking-tight">Hostel Allotment Form</h1>
        <p className="font-sans text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Statutory application for Academic Year {configs?.academic_year || 'Loading...'}.
        </p>
        {configs?.application_deadline && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-widest leading-none">
              Deadline: {new Date(configs.application_deadline).toLocaleDateString('en-IN', { 
                day: 'numeric', month: 'short', year: 'numeric', 
                hour: '2-digit', minute: '2-digit', hour12: true 
              })}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Remark Alert if Returned */}
        {existing?.status === 'Returned' && (
          <div className="bg-error/5 border border-error/20 p-6 rounded-md flex items-start gap-4 shadow-sm animate-pulse-subtle">
            <div className="w-10 h-10 bg-error/10 text-error rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1 pt-0.5">
              <h4 className="text-sm font-bold text-error uppercase tracking-widest">Correction Required from Class Advisor</h4>
              <p className="text-on-surface font-sans text-base leading-relaxed italic border-l-2 border-error/20 pl-4 py-1 mt-3">
                "{existing.remarks || "Please review your application and resubmit with correct details."}"
              </p>
              <p className="text-xs text-on-surface-variant font-medium mt-3">Update the requested data below and click <span className="font-bold">Save Changes</span> to resubmit.</p>
            </div>
          </div>
        )}
        {/* 1. Applicant Profile Summary (Read-Only) */}
        <section className="bg-surface-container-low border border-surface-container rounded-md overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-high flex items-center gap-3 border-b border-surface-container">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg text-primary uppercase tracking-wider text-sm font-bold">Applicant Details</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Full Name</p>
              <p className="font-serif text-lg text-primary">{profile?.full_name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">College ID</p>
              <p className="font-mono text-base text-on-surface">{profile?.college_id}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Department</p>
              <p className="font-sans text-base text-on-surface">{profile?.department || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* 2. Merit Factors (Income & Distance) */}
        <section className="card p-0 overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg text-primary uppercase tracking-wider text-sm font-bold">Evaluation Data</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="form-label">Annual Family Income (Gross INR) <span className="text-error">*</span></label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">₹</span>
                  <input {...register('family_annual_income')} type="number" className="input pl-8 py-3.5 text-lg" placeholder="e.g. 500000" />
                </div>
                {errors.family_annual_income && <p className="form-error">{errors.family_annual_income.message}</p>}
              </div>
              <div>
                <label className="form-label">Distance to College<span className="text-error">*</span></label>
                <div className="relative mt-2">
                  <input {...register('distance_from_college')} type="number" step="0.1" className="input py-3.5 text-lg pr-12" placeholder="e.g. 125.4" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">KM</span>
                </div>
                {errors.distance_from_college && <p className="form-error">{errors.distance_from_college.message}</p>}
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-surface-container/50">
              <label className="form-label mb-4">Reservation Attributes (Optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCategories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-4 p-4 bg-surface rounded-md border border-outline-variant/10 cursor-pointer hover:border-primary transition-all group">
                    <input 
                      type="checkbox" 
                      value={cat.id}
                      checked={selected_category_ids.includes(cat.id)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const current = [...selected_category_ids];
                        if (e.target.checked) {
                          if (!current.includes(val)) current.push(val);
                        } else {
                          const idx = current.indexOf(val);
                          if (idx > -1) current.splice(idx, 1);
                        }
                        reset({ ...watch(), selected_category_ids: current });
                      }}
                      className="w-5 h-5 accent-primary" 
                    />
                    <div>
                      <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors block">{cat.name}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{cat.code}</span>
                    </div>
                  </label>
                ))}

                {activeCategories.length === 0 && (
                  <p className="col-span-full py-4 text-center text-sm text-on-surface-variant italic">
                    No active reservation categories configured.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>


        {/* 3. Statutory Documents & Certificates */}
        <section className="card p-0 overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex items-center gap-3">
            <UploadCloud className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg text-primary uppercase tracking-wider text-sm font-bold">Mandatory Certificates</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="form-label">Income Certificate (PDF/JPG) <span className="text-error">*</span></label>
                <input {...register('income_certificate')} type="file" className="input mt-2 py-3 px-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                {errors.income_certificate && <p className="form-error">{errors.income_certificate.message}</p>}
              </div>
              <div>
                <label className="form-label">Residential Verification (PDF/JPG) <span className="text-error">*</span></label>
                <input {...register('residential_certificate')} type="file" className="input mt-2 py-3 px-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                {errors.residential_certificate && <p className="form-error">{errors.residential_certificate.message}</p>}
              </div>
            </div>

            {(pwd_status || bpl_status || sc_st_status || selected_category_ids.length > 0) && (
              <div className="space-y-4 pt-4 border-t border-surface-container/50">
                <label className="form-label mb-4">Reservation Verification Documents</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Dynamic Category Documents */}
                  {activeCategories.filter(c => selected_category_ids.includes(c.id) && c.requires_doc).map(cat => (
                    <div key={cat.id}>
                      <label className="form-label">{cat.name} Certificate <span className="text-error">*</span></label>
                      <input 
                        type="file" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          const current = watch('dynamic_certificates') || {};
                          reset({ ...watch(), dynamic_certificates: { ...current, [cat.code]: file } });
                        }}
                        className="input mt-2 py-3 px-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                      />
                    </div>
                  ))}
                  
                  {pwd_status && !activeCategories.some(c => c.code === 'PWD' && selected_category_ids.includes(c.id)) && (
                    <div>
                      <label className="form-label">PWD Verification Certificate <span className="text-error">*</span></label>
                      <input {...register('pwd_certificate')} type="file" className="input mt-2 py-3 px-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                      {errors.pwd_certificate && <p className="form-error">{errors.pwd_certificate.message}</p>}
                    </div>
                  )}
                  {bpl_status && !activeCategories.some(c => c.code === 'BPL' && selected_category_ids.includes(c.id)) && (
                    <div>
                      <label className="form-label">BPL Verification Certificate <span className="text-error">*</span></label>
                      <input {...register('bpl_certificate')} type="file" className="input mt-2 py-3 px-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                      {errors.bpl_certificate && <p className="form-error">{errors.bpl_certificate.message}</p>}
                    </div>
                  )}
                  {sc_st_status && !activeCategories.some(c => c.code === 'SCST' && selected_category_ids.includes(c.id)) && (
                    <div>
                      <label className="form-label">SC/ST Verification Certificate <span className="text-error">*</span></label>
                      <input {...register('sc_st_certificate')} type="file" className="input mt-2 py-3 px-4 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                      {errors.sc_st_certificate && <p className="form-error">{errors.sc_st_certificate.message}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4. Residential Details & Guardian */}
        <section className="card p-0 overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex items-center gap-3">
            <Home className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg text-primary uppercase tracking-wider text-sm font-bold">Residential & Emergency Contact</h3>
          </div>
          <div className="p-8 space-y-8">
            <div>
              <label className="form-label">Permanent Home Address <span className="text-error">*</span></label>
              <textarea 
                {...register('home_address')} 
                rows={3} 
                className="input mt-2 resize-none py-4 leading-relaxed" 
                placeholder="Full address (including House No, Pin Code, State)"
              ></textarea>
              {errors.home_address && <p className="form-error">{errors.home_address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="form-label">Guardian Name <span className="text-error">*</span></label>
                <input {...register('guardian_name')} className="input mt-2" placeholder="e.g. Somanath P." />
                {errors.guardian_name && <p className="form-error">{errors.guardian_name.message}</p>}
              </div>
              <div>
                <label className="form-label">Guardian Emergency Contact <span className="text-error">*</span></label>
                <input 
                  {...register('guardian_contact')} 
                  className="input mt-2" 
                  placeholder="10 digit number"
                  maxLength={10} 
                  onInput={(e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)}
                />
                {errors.guardian_contact && <p className="form-error">{errors.guardian_contact.message}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Declaration & Submission */}
        <section className="space-y-8 pt-4">
          <div className="bg-surface-container-low border border-surface-container rounded-md p-8 flex gap-6 items-start">
            <div className="mt-1">
              <input {...register('declaration')} type="checkbox" className="w-6 h-6 accent-primary cursor-pointer shadow-sm border-outline-variant" />
            </div>
            <div className="space-y-4">
              <label className="block font-serif text-lg text-primary leading-tight cursor-pointer">
                Statutory Self-Declaration
              </label>
              <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                I hereby solemnly declare that the information provided in this application is true, 
                complete and accurate to the best of my knowledge. I understand that any discrepancy or false 
                statement found during verification by the Institutional Class Advisor or Warden 
                will result in the immediate <span className="font-bold text-error">cancellation of allotment</span> and disciplinary action as per University norms.
              </p>
              {errors.declaration && <p className="form-error">{errors.declaration.message}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="btn-primary w-full py-5 text-lg font-bold tracking-wider shadow-lg shadow-primary/10 transition-all hover:translate-y-[-2px] disabled:translate-y-0"
          >
            {isSubmitting
              ? (isEditing ? 'Saving Changes...' : 'Processing Statutory Submission...')
              : (isEditing ? 'SAVE CHANGES' : 'SUBMIT FORM FOR OFFICIAL REVIEW')
            }
          </button>
        </section>
      </form>
    </div>
  );
}
