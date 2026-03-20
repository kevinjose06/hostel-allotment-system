import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const onSubmit = (e) => {
    e.preventDefault();
    toast.success('Demo: Password reset link sent to your email!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center border border-gray-100">
        <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-500 text-sm mb-8 px-4">
          Enter your registered email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={onSubmit} className="space-y-6 text-left">
          <div>
            <label className="form-label">Email Address</label>
            <input type="email" required className="input" placeholder="student@rgit.ac.in" />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Send Reset Link
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
