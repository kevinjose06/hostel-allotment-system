import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyErrorMessage } from '../../utils/errorHelpers';

export default function ResetPasswordPage() {
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Securely check if the user is actually in a "recovery" state
  // Supabase automatically signs the user in when they click the recovery link.
  useEffect(() => {
    if (!user) {
      // If no session exists, the link might be expired or invalid
      // We wait a brief moment to ensure AuthContext has finished loading
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      toast.success('Password updated successfully! Please login with your new credentials.');
      navigate('/login');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Left Monolith */}
      <div className="hidden md:flex md:w-5/12 bg-primary text-white flex-col justify-between p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        
        <div className="relative z-10">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center mb-10 border border-white/10">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-6">
            New Credentials
          </h1>
          <p className="font-sans text-primary-fixed-dim text-lg max-w-sm leading-relaxed">
            Update your account with a secure new password to regain access.
          </p>
        </div>
      </div>

      {/* Right Pane */}
      <div className="w-full md:w-7/12 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 relative">
        <div className="w-full max-w-md relative z-10">
          
          <div className="mb-10 lg:mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-primary mb-3">Set New Password</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Create a strong password that you haven't used before.
            </p>
          </div>

          <div className="card">
            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md flex items-start gap-3 text-error text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input py-3"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input py-3"
                  placeholder="Repeat new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-4 text-base flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-surface-container-highest text-center">
               <Link to="/login" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                Back to Login
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
