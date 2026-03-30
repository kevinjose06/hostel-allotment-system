import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ritLogo from '../../assets/ritlnew.png';
import toast from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../../utils/errorHelpers';

export default function LoginPage() {
  const { signInAs, getRedirectPath, loading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const data = await signInAs(email, password);
      const role = data.user.user_metadata?.role || 'student';
      toast.success('Login successful!');
      navigate(getRedirectPath(role));
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Left Asymmetrical Pane - The "Monolith" */}
      <div className="hidden md:flex md:w-5/12 bg-primary text-white flex-col justify-between p-12 lg:p-20 relative overflow-hidden">
        {/* Subtle background texture/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center mb-8 border border-white/10 p-4 inline-block">
            <img src={ritLogo} alt="RIT Kottayam" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-6">
            Rajiv Gandhi Institute of Technology
          </h1>
          <p className="font-sans text-primary-fixed-dim text-lg max-w-sm leading-relaxed">
            Centralized Hostel Allotment and Management System.
          </p>
        </div>
        
        <div className="relative z-10">
          <div className="w-12 h-1 bg-secondary-container mb-6"></div>
          <p className="font-serif text-sm text-primary-fixed-dim tracking-widest uppercase">
            Institutional Allotment Portal
          </p>
        </div>
      </div>

      {/* Right Login Pane */}
      <div className="w-full md:w-7/12 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 relative">
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Header */}
          <div className="md:hidden mb-12 text-center">
            <div className="inline-flex items-center justify-center mx-auto mb-6 bg-primary rounded-md p-4 shadow-md">
              <img src={ritLogo} alt="RIT Kottayam" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="font-serif text-3xl text-primary tracking-tight mt-4">RGIT Housing</h1>
            <p className="font-sans text-sm text-on-surface-variant mt-2">Hostel Allotment System</p>
          </div>

          <div className="mb-10 lg:mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-primary mb-3">Secure Access</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Enter your designated credentials to securely access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="input py-3"
                placeholder="e.g., student@rgit.ac.in"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="input py-3"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-4 text-base shadow-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-12 flex justify-center text-sm font-medium pt-8 border-t border-surface-container-highest">
            <Link to="/register" className="text-secondary hover:text-secondary-container hover:underline underline-offset-4 transition-colors">
              Create new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
