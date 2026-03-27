import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const schema = z.object({
  academic_year:         z.coerce.number().int().min(2020).max(2035),
  family_annual_income:  z.coerce.number().min(0, 'Must be 0 or more'),
  distance_from_college: z.coerce.number().min(0, 'Must be 0 or more'),
  bpl_status:            z.boolean().default(false),
  pwd_status:            z.boolean().default(false),
  sc_st_status:          z.boolean().default(false),
});

export default function ApplicationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();

  // Check if already applied
  const { data: existing, isLoading } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => api.get('/application/my').then(r => r.data.data)
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { academic_year: currentYear }
  });

  if (isLoading) return <LoadingSpinner />;

  if (existing && ['Pending', 'Under_Review', 'Approved', 'Waitlisted'].includes(existing.status)) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white border border-yellow-200 rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⏳
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Application Already Submitted</h2>
        <p className="text-gray-500 mb-8">You have already submitted an application for this academic year. You cannot submit another one until your current one is resolved or canceled.</p>
        <button onClick={() => navigate('/student/status')} className="btn-primary py-3 px-8 text-lg w-full sm:w-auto">
          View Application Status
        </button>
      </div>
    );
  }

  const onSubmit = async (data) => {
    try {
      await api.post('/application', data);
      toast.success('Application submitted successfully!');
      qc.invalidateQueries(['my-application']);
      navigate('/student/status');
    } catch (err) {
      toast.error('Failed to submit application');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-primary tracking-tight">Hostel Registration</h1>
        <p className="font-sans text-on-surface-variant mt-3 text-base leading-relaxed">
          Submit your official hostel application for Academic Year {currentYear}–{currentYear + 1}.
          Please ensure all your provided documents and profile details are accurate before proceeding, as your Class Advisor will review and verify them.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="form-label">Academic Year <span className="text-error">*</span></label>
            <input {...register('academic_year')} type="number" className="input bg-surface-container text-on-surface-variant pointer-events-none" readOnly />
          </div>
          
          <div className="pt-6 border-t border-surface-container">
            <label className="form-label">Family Annual Income (₹) <span className="text-error">*</span></label>
            <input {...register('family_annual_income')} type="number" className="input text-lg py-3" placeholder="Enter total family income" />
            {errors.family_annual_income && <p className="form-error">{errors.family_annual_income.message}</p>}
            <p className="text-xs text-on-surface-variant mt-2 font-medium tracking-wide">
              This value will be used for merit score calculation. Upload income certificate under 'My Documents'.
            </p>
          </div>
          
          <div className="pt-6 border-t border-surface-container">
            <label className="form-label">Distance from Home to College (km) <span className="text-error">*</span></label>
            <input {...register('distance_from_college')} type="number" step="0.1" className="input text-lg py-3" placeholder="e.g. 85.5" />
            {errors.distance_from_college && <p className="form-error">{errors.distance_from_college.message}</p>}
          </div>

          <div className="pt-6 border-t border-surface-container space-y-4">
            <label className="form-label mb-4">Reservation & Priority Categories</label>
            
            <label className="flex items-center gap-4 p-4 bg-surface-container-low rounded-md border border-outline-variant/10 cursor-pointer hover:bg-surface-container transition-colors">
              <input {...register('pwd_status')} type="checkbox" className="w-5 h-5 accent-primary" />
              <div>
                <span className="block font-semibold text-on-surface text-sm tracking-wide">Persons with Disability (PWD)</span>
                <span className="text-xs text-on-surface-variant">Priority allocation for verified disability status.</span>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 bg-surface-container-low rounded-md border border-outline-variant/10 cursor-pointer hover:bg-surface-container transition-colors">
              <input {...register('bpl_status')} type="checkbox" className="w-5 h-5 accent-secondary" />
              <div>
                <span className="block font-semibold text-on-surface text-sm tracking-wide">Below Poverty Line (BPL)</span>
                <span className="text-xs text-on-surface-variant">Allocated within the reserved seat quota.</span>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 bg-surface-container-low rounded-md border border-outline-variant/10 cursor-pointer hover:bg-surface-container transition-colors">
              <input {...register('sc_st_status')} type="checkbox" className="w-5 h-5 accent-primary" />
              <div>
                <span className="block font-semibold text-on-surface text-sm tracking-wide">SC / ST Category</span>
                <span className="text-xs text-on-surface-variant">Priority based on community reservation guidelines.</span>
              </div>
            </label>
          </div>

          <div className="bg-surface-container-low border border-surface-container rounded-md p-6 mt-8">
            <h4 className="font-sans font-semibold text-primary mb-2 text-sm uppercase tracking-wider">Merit Score Calculation Guide</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Your merit score is calculated dynamically based on your family annual income and distance from the college. 
              Lower income and higher distances result in a proportionally higher score. Providing false data will result in immediate institutional rejection.
            </p>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-base mt-4">
            {isSubmitting ? 'Submitting Application...' : 'Submit Official Form'}
          </button>
        </form>
      </div>
    </div>
  );
}
