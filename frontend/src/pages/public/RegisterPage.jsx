import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../../utils/errorHelpers';

const schema = z.object({
  college_id:            z.string().min(5, 'Enter a valid college ID'),
  first_name:            z.string().min(1, 'Required'),
  middle_name:           z.string().optional(),
  last_name:             z.string().min(1, 'Required'),
  email:                 z.string().email('Invalid email'),
  password:              z.string().min(8, 'Password > 8 chars'),
  gender:                z.enum(['Male', 'Female', 'Other']),
  date_of_birth:         z.string(),
  contact_number:        z.string().length(10, 'Contact number must be exactly 10 digits'),
  class_id:              z.coerce.number().min(1, 'Please select your class'),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [fetchingClasses, setFetchingClasses] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    async function fetchClasses() {
      try {
        const { data, error } = await supabase
          .from('class')
          .select('class_id, degree_program, department, year, division')
          .order('degree_program')
          .order('year');
        
        if (error) throw error;
        setClasses(data || []);
      } catch (err) {
        toast.error('Failed to load official classes');
      } finally {
        setFetchingClasses(false);
      }
    }
    fetchClasses();
  }, []);

  const onSubmit = async (data) => {
    try {
      await authService.registerStudent(data);
      toast.success('Registration successful! Please login to continue.');
      navigate('/login');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Left Pane */}
      <div className="hidden md:flex md:w-4/12 bg-primary text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        
        <div className="relative z-10 sticky top-16">
          <Link to="/login" className="inline-block h-12 w-12 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center mb-8 border border-white/10 transition-colors hover:bg-white/20">
            <span className="font-sans text-xl font-bold text-secondary-container">←</span>
          </Link>
          <h1 className="font-serif text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-4">
            Student Registration
          </h1>
          <p className="font-sans text-primary-fixed-dim text-base max-w-sm leading-relaxed">
            Create an account and assign yourself to your official class. Data accuracy is required for hostel eligibility.
          </p>
        </div>
        
        <div className="relative z-10 mt-auto pt-24 text-primary-fixed-dim/60">
          <div className="w-12 h-1 bg-secondary-container mb-6"></div>
        </div>
      </div>

      {/* Right Pane */}
      <div className="w-full md:w-8/12 p-6 md:p-12 xl:p-20 overflow-y-auto max-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="md:hidden mb-8">
            <Link to="/login" className="text-secondary hover:underline text-sm font-medium mb-4 inline-block tracking-widest uppercase">
              ← Back to Login
            </Link>
            <h1 className="font-serif text-3xl text-primary tracking-tight">Student Registration</h1>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="form-label">College ID <span className="text-error">*</span></label>
                  <input {...register('college_id')} className="input uppercase" placeholder="e.g. 24BR12345" />
                  {errors.college_id && <p className="form-error">{errors.college_id.message}</p>}
                </div>
                <div>
                  <label className="form-label">Email Address <span className="text-error">*</span></label>
                  <input {...register('email')} type="email" className="input" placeholder="e.g. 24BR12345@rit.ac.in" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">First Name <span className="text-error">*</span></label>
                  <input {...register('first_name')} className="input" />
                </div>
                <div>
                  <label className="form-label">Middle Name <span className="text-on-surface-variant text-xs">(Optional)</span></label>
                  <input {...register('middle_name')} className="input" />
                </div>
                <div className="md:col-span-1">
                  <label className="form-label">Last Name <span className="text-error">*</span></label>
                  <input {...register('last_name')} className="input" />
                </div>

                <div>
                   <label className="form-label">Class <span className="text-error">*</span></label>
                   <select {...register('class_id')} className="input cursor-pointer" disabled={fetchingClasses}>
                     <option value="">{fetchingClasses ? 'Loading official data...' : 'Select your class'}</option>
                     {classes.map(c => (
                       <option key={c.class_id} value={c.class_id}>
                         {c.degree_program} - {c.department} (Y{c.year}, {c.division})
                       </option>
                     ))}
                   </select>
                   {errors.class_id && <p className="form-error">{errors.class_id.message}</p>}
                </div>

                <div>
                  <label className="form-label">Gender <span className="text-error">*</span></label>
                  <select {...register('gender')} className="input cursor-pointer">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Date of Birth <span className="text-error">*</span></label>
                  <input {...register('date_of_birth')} type="date" className="input" />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Contact Number (10 Digits) <span className="text-error">*</span></label>
                  <input 
                    {...register('contact_number')} 
                    className="input" 
                    placeholder="e.g. 9876543210" 
                    maxLength={10}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    }}
                  />
                  {errors.contact_number && <p className="form-error">{errors.contact_number.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Password <span className="text-error">*</span></label>
                  <input {...register('password')} type="password" className="input" />
                  {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>
              </div>

              <div className="pt-6 mt-10 border-t border-surface-container">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 text-base"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Institutional Enrollment'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm font-medium">
              <span className="text-on-surface-variant">Already have an account? </span>
              <Link to="/login" className="text-secondary hover:text-secondary-container hover:underline underline-offset-4 transition-colors">Sign in instead</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
