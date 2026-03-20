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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Apply for Hostel</h1>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          Submit your hostel application for Academic Year {currentYear}–{currentYear + 1}.
          Please ensure all your provided documents and profile details are accurate before proceeding, as your class advisor will review and verify them.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="form-label font-semibold text-gray-800">Academic Year *</label>
            <input {...register('academic_year')} type="number" className="input bg-gray-50 text-gray-500 pointer-events-none" readOnly />
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <label className="form-label font-semibold text-gray-800">Family Annual Income (₹) *</label>
            <input {...register('family_annual_income')} type="number" className="input text-lg py-3" placeholder="Enter total family income" />
            {errors.family_annual_income && <p className="form-error">{errors.family_annual_income.message}</p>}
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              This value will be used for merit score calculation. Upload income certificate under 'My Documents'.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <label className="form-label font-semibold text-gray-800">Distance from Home to College (km) *</label>
            <input {...register('distance_from_college')} type="number" step="0.1" className="input text-lg py-3" placeholder="e.g. 85.5" />
            {errors.distance_from_college && <p className="form-error">{errors.distance_from_college.message}</p>}
          </div>

          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-5 mt-6">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Merit Score Calculation Guide</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Your merit score is calculated dynamically based on your family annual income and distance from the college. 
              Lower income and higher distances result in a proportionally higher score. Providing false data will result in immediate rejection.
            </p>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3.5 text-base shadow-md mt-4">
            {isSubmitting ? 'Submitting Application...' : 'Submit Application Form'}
          </button>
        </form>
      </div>
    </div>
  );
}
