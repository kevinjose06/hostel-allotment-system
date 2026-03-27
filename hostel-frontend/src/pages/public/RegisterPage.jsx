import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const schema = z.object({
  college_id:            z.string().min(5, 'Enter a valid college ID'),
  first_name:            z.string().min(1, 'Required'),
  last_name:             z.string().min(1, 'Required'),
  email:                 z.string().email('Invalid email'),
  password:              z.string().min(8, 'Password > 8 chars'),
  gender:                z.enum(['Male', 'Female', 'Other']),
  date_of_birth:         z.string(),
  contact_number:        z.string().min(10).max(15),
  class_id:              z.coerce.number().int().positive(),
  family_annual_income:  z.coerce.number().min(0),
  distance_from_college: z.coerce.number().min(0),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register/student', data);
      toast.success('Registration simulated successfully! You can mock login now.');
      navigate('/login');
    } catch (err) {
      toast.error('Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Left Asymmetrical Pane - The "Monolith" */}
      <div className="hidden md:flex md:w-4/12 bg-primary text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        {/* Subtle background texture/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        
        <div className="relative z-10 sticky top-16">
          <Link to="/login" className="inline-block h-12 w-12 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center mb-8 border border-white/10 transition-colors hover:bg-white/20">
            <span className="font-sans text-xl font-bold text-secondary-container">←</span>
          </Link>
          <h1 className="font-serif text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-4">
            Student Registration
          </h1>
          <p className="font-sans text-primary-fixed-dim text-base max-w-sm leading-relaxed">
            Create an account to access the Centralized Hostel Allotment Portal. All fields are mandatory unless marked optional.
          </p>
        </div>
        
        <div className="relative z-10 mt-auto pt-24">
          <div className="w-12 h-1 bg-secondary-container mb-6"></div>
          <p className="font-serif text-sm text-primary-fixed-dim tracking-widest uppercase">
            The Digital Secretariat
          </p>
        </div>
      </div>

      {/* Right Pane */}
      <div className="w-full md:w-8/12 p-6 md:p-12 xl:p-20">
        <div className="max-w-3xl mx-auto">
          {/* Mobile Header */}
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
                  <input {...register('college_id')} className="input" placeholder="e.g. KTE24CS079" />
                  {errors.college_id && <p className="form-error">{errors.college_id.message}</p>}
                </div>
                <div>
                  <label className="form-label">Email Address <span className="text-error">*</span></label>
                  <input {...register('email')} type="email" className="input" placeholder="student@rgit.ac.in" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">First Name <span className="text-error">*</span></label>
                  <input {...register('first_name')} className="input" />
                </div>
                <div>
                  <label className="form-label">Last Name <span className="text-error">*</span></label>
                  <input {...register('last_name')} className="input" />
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

                <div>
                  <label className="form-label">Contact Number <span className="text-error">*</span></label>
                  <input {...register('contact_number')} className="input" placeholder="10 digit number" />
                </div>
                <div>
                  <label className="form-label">Class / Semester <span className="text-error">*</span></label>
                  <select {...register('class_id')} className="input cursor-pointer">
                    <option value="">Select class</option>
                    <option value="1">S3 Computer Science</option>
                    <option value="2">S3 Electronics</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Family Annual Income (₹) <span className="text-error">*</span></label>
                  <input {...register('family_annual_income')} type="number" className="input" />
                </div>
                <div>
                  <label className="form-label">Distance from College (km) <span className="text-error">*</span></label>
                  <input {...register('distance_from_college')} type="number" step="0.1" className="input" />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Password <span className="text-error">*</span></label>
                  <input {...register('password')} type="password" className="input" />
                  {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>
              </div>

              <div className="bg-surface-container-low rounded-md p-6 mt-10">
                <h3 className="font-serif text-lg text-primary mb-4">Reservation Categories (Optional)</h3>
                <div className="flex flex-wrap gap-8">
                  <label className="flex items-center gap-3 text-sm font-medium text-on-surface cursor-pointer group">
                    <input type="checkbox" className="rounded-sm border-outline-variant text-primary focus:ring-primary-fixed/30 w-5 h-5 transition-colors cursor-pointer" />
                    BPL (Below Poverty Line)
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-on-surface cursor-pointer group">
                    <input type="checkbox" className="rounded-sm border-outline-variant text-primary focus:ring-primary-fixed/30 w-5 h-5 transition-colors cursor-pointer" />
                    PWD (Person with Disability)
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-on-surface cursor-pointer group">
                    <input type="checkbox" className="rounded-sm border-outline-variant text-primary focus:ring-primary-fixed/30 w-5 h-5 transition-colors cursor-pointer" />
                    SC / ST
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-surface-container">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 text-base"
                >
                  {isSubmitting ? 'Registering...' : 'Create Account'}
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
