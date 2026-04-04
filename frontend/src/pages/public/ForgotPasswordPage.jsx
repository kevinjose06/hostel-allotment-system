import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyErrorMessage } from '../../utils/errorHelpers';

export default function ForgotPasswordPage() {
  const { sendPasswordResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
      toast.success('Password reset link sent to your email!');
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
          <Link to="/login" className="inline-block h-12 w-12 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center mb-10 border border-white/10 transition-colors hover:bg-white/20">
            <span className="font-sans text-xl font-bold text-secondary-container">←</span>
          </Link>
          <h1 className="font-serif text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-6">
            Password Recovery
          </h1>
          <p className="font-sans text-primary-fixed-dim text-lg max-w-sm leading-relaxed">
            Securely regain access to your Institutional Profile.
          </p>
        </div>
      </div>

      {/* Right Pane */}
      <div className="w-full md:w-7/12 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 relative">
        <div className="w-full max-w-md relative z-10">
          
          <div className="md:hidden mb-12">
            <Link to="/login" className="text-secondary hover:underline text-sm font-medium mb-4 inline-block tracking-widest uppercase">
              ← Back to Login
            </Link>
            <h1 className="font-serif text-3xl text-primary tracking-tight">Password Recovery</h1>
          </div>

          <div className="card">
            <div className="h-14 w-14 bg-surface-container flex items-center justify-center rounded-md mb-8">
              {sent ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Lock className="w-6 h-6 text-primary" />}
            </div>
            
            <h2 className="font-serif text-2xl text-primary mb-3">
              {sent ? "Check Your Email" : "Reset Password"}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
              {sent 
                ? `A password recovery link has been sent to ${email}. Please follow the link to securely reset your credentials.`
                : "Enter your registered email address and we will send you a secure link to reset your credentials."}
            </p>

            {!sent ? (
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input pl-11" 
                      placeholder="e.g. student@rit.ac.in" 
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setSent(false)} 
                className="w-full py-3 border border-outline-variant rounded-md text-sm font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Send Again
              </button>
            )}

            <div className="mt-8 pt-6 border-t border-surface-container-highest text-center">
               <Link to="/login" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                Return to Portal Access
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
