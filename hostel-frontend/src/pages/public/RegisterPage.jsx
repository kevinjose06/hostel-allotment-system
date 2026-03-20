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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-6 text-center text-white">
          <h1 className="text-2xl font-bold tracking-tight">Student Registration</h1>
          <p className="text-blue-100 mt-1">Hostel Allotment Portal — RGIT</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">College ID *</label>
                <input {...register('college_id')} className="input" placeholder="e.g. KTE24CS079" />
                {errors.college_id && <p className="form-error">{errors.college_id.message}</p>}
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input {...register('email')} type="email" className="input" placeholder="student@rgit.ac.in" />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              
              <div>
                <label className="form-label">First Name *</label>
                <input {...register('first_name')} className="input" />
              </div>
              <div>
                <label className="form-label">Last Name *</label>
                <input {...register('last_name')} className="input" />
              </div>

              <div>
                <label className="form-label">Gender *</label>
                <select {...register('gender')} className="input bg-white">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="form-label">Date of Birth *</label>
                <input {...register('date_of_birth')} type="date" className="input" />
              </div>

              <div>
                <label className="form-label">Contact Number *</label>
                <input {...register('contact_number')} className="input" placeholder="10 digit number" />
              </div>
              <div>
                <label className="form-label">Class / Semester *</label>
                <select {...register('class_id')} className="input bg-white">
                  <option value="">Select class</option>
                  <option value="1">S3 Computer Science</option>
                  <option value="2">S3 Electronics</option>
                </select>
              </div>

              <div>
                <label className="form-label">Family Annual Income (₹) *</label>
                <input {...register('family_annual_income')} type="number" className="input" />
              </div>
              <div>
                <label className="form-label">Distance from College (km) *</label>
                <input {...register('distance_from_college')} type="number" step="0.1" className="input" />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Password *</label>
                <input {...register('password')} type="password" className="input" />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
            </div>

            <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-5 mt-8">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">Reservation Categories (Optional)</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  BPL (Below Poverty Line)
                </label>
                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  PWD (Person with Disability)
                </label>
                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  SC / ST
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline">Sign in instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
