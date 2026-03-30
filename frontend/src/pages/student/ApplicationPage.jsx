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
import { User, Home, ShieldAlert, FileCheck } from 'lucide-react';

const schema = z.object({
  academic_year:         z.coerce.number().int().min(2020).max(2035),
  family_annual_income:  z.coerce.number().min(1, 'Please enter a valid income amount'),
  distance_from_college: z.coerce.number().min(0.1, 'Please enter a valid distance'),
  bpl_status:            z.boolean().default(false),
  pwd_status:            z.boolean().default(false),
  sc_st_status:          z.boolean().default(false),
  home_address:          z.string().min(10, 'Please provide a full permanent address'),
  guardian_name:         z.string().min(2, 'Name is required'),
  guardian_contact:      z.string().length(10, 'Contact must be 10 digits'),
  declaration:           z.boolean().refine(val => val === true, 'You must accept the declaration')
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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { 
      academic_year: currentYear,
      bpl_status: profile?.bpl_status || false,
      pwd_status: profile?.pwd_status || false,
      sc_st_status: profile?.sc_st_status || false
    }
  });

  if (loadingProfile || loadingApp) return <LoadingSpinner />;

  if (existing && ['Pending', 'Under_Review', 'Approved', 'Waitlisted'].includes(existing.status)) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-surface border border-outline-variant/20 rounded-md shadow-ambient text-center">
        <div className="w-16 h-16 bg-surface-container text-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          ⏳
        </div>
        <h2 className="font-serif text-2xl text-primary mb-2">Application Already Active</h2>
        <p className="font-sans text-on-surface-variant mb-8 leading-relaxed">You have an active official hostel application for this academic session. Only one application is permitted per year.</p>
        <button onClick={() => navigate('/student/status')} className="btn-primary w-full sm:w-auto">
          View Application Status
        </button>
      </div>
    );
  }

  const onSubmit = async (data) => {
    try {
      await applicationService.submitApplication(data);
      toast.success('Your official application has been submitted!');
      qc.invalidateQueries(['my-application']);
      navigate('/student/status');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-3">
        <h1 className="font-serif text-4xl lg:text-5xl text-primary tracking-tight">Hostel Allotment Form</h1>
        <p className="font-sans text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Statutory application for Academic Year {currentYear}–{currentYear+1}.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
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

            <div className="space-y-4 pt-4 border-t border-surface-container/50">
              <label className="form-label mb-4">Reservation Attributes</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-4 p-4 bg-surface rounded-md border border-outline-variant/10 cursor-pointer hover:border-primary transition-all group">
                  <input {...register('pwd_status')} type="checkbox" className="w-5 h-5 accent-primary" />
                  <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">PWD Status</span>
                </label>
                <label className="flex items-center gap-4 p-4 bg-surface rounded-md border border-outline-variant/10 cursor-pointer hover:border-secondary transition-all group">
                  <input {...register('bpl_status')} type="checkbox" className="w-5 h-5 accent-secondary" />
                  <span className="text-sm font-semibold text-on-surface group-hover:text-secondary transition-colors">BPL Status</span>
                </label>
                <label className="flex items-center gap-4 p-4 bg-surface rounded-md border border-outline-variant/10 cursor-pointer hover:border-primary transition-all group">
                  <input {...register('sc_st_status')} type="checkbox" className="w-5 h-5 accent-primary" />
                  <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">SC/ST status</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Residential Details & Guardian */}
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
            {isSubmitting ? 'Processing Statutory Submission...' : 'SUBMIT FORM FOR OFFICIAL REVIEW'}
          </button>
        </section>
      </form>
    </div>
  );
}
