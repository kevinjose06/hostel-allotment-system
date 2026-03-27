import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, User, Users, Shield, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { signInAs, getRedirectPath, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (role) => {
    await signInAs(role);
    navigate(getRedirectPath(role));
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Left Asymmetrical Pane - The "Monolith" */}
      <div className="hidden md:flex md:w-5/12 bg-primary text-white flex-col justify-between p-12 lg:p-20 relative overflow-hidden">
        {/* Subtle background texture/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        
        <div className="relative z-10">
          <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center mb-10 border border-white/10">
            <Building2 className="h-8 w-8 text-secondary-container" />
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl text-white tracking-tight leading-tight mb-6">
            Rajiv Gandhi Institute of Technology
          </h1>
          <p className="font-sans text-primary-fixed-dim text-lg max-w-sm leading-relaxed">
            Centralized Hostel Allotment and Management Portal.
          </p>
        </div>
        
        <div className="relative z-10">
          <div className="w-12 h-1 bg-secondary-container mb-6"></div>
          <p className="font-serif text-sm text-primary-fixed-dim tracking-widest uppercase">
            The Digital Secretariat
          </p>
        </div>
      </div>

      {/* Right Login Pane */}
      <div className="w-full md:w-7/12 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 relative">
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Header */}
          <div className="md:hidden mb-12 text-center">
            <div className="h-14 w-14 bg-primary rounded-md flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-7 w-7 text-secondary-container" />
            </div>
            <h1 className="font-serif text-3xl text-primary tracking-tight">RGIT Portal</h1>
            <p className="font-sans text-sm text-on-surface-variant mt-2">Hostel Allotment System</p>
          </div>

          <div className="mb-10 lg:mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-primary mb-3">Portal Access</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">
              Welcome to the demo environment. Select your designated role to continue to the respective dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('student')}
              disabled={loading}
              className="w-full flex items-center gap-5 p-5 rounded-md bg-surface-container-low hover:bg-surface-container-highest hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-primary-fixed/50 text-left group"
            >
              <div className="bg-surface-container-highest group-hover:bg-primary text-primary group-hover:text-white p-3 rounded-md transition-colors">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans font-semibold text-on-surface text-base">Student Sign In</p>
                <p className="font-sans text-sm text-on-surface-variant mt-0.5">Apply for hostels & track status</p>
              </div>
            </button>

            <button
              onClick={() => handleLogin('advisor')}
              disabled={loading}
              className="w-full flex items-center gap-5 p-5 rounded-md bg-surface-container-low hover:bg-surface-container-highest hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-primary-fixed/50 text-left group"
            >
              <div className="bg-surface-container-highest group-hover:bg-primary text-primary group-hover:text-white p-3 rounded-md transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans font-semibold text-on-surface text-base">Class Advisor Sign In</p>
                <p className="font-sans text-sm text-on-surface-variant mt-0.5">Review and verify applications</p>
              </div>
            </button>

            <button
              onClick={() => handleLogin('warden')}
              disabled={loading}
              className="w-full flex items-center gap-5 p-5 rounded-md bg-surface-container-low hover:bg-surface-container-highest hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-primary-fixed/50 text-left group"
            >
              <div className="bg-surface-container-highest group-hover:bg-primary text-primary group-hover:text-white p-3 rounded-md transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans font-semibold text-on-surface text-base">Warden Sign In</p>
                <p className="font-sans text-sm text-on-surface-variant mt-0.5">Manage rooms & run allotments</p>
              </div>
            </button>

            <button
              onClick={() => handleLogin('admin')}
              disabled={loading}
              className="w-full flex items-center gap-5 p-5 rounded-md bg-surface-container-low hover:bg-surface-container-highest hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-primary-fixed/50 text-left group"
            >
              <div className="bg-surface-container-highest group-hover:bg-primary text-primary group-hover:text-white p-3 rounded-md transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="font-sans font-semibold text-on-surface text-base">System Admin Sign In</p>
                <p className="font-sans text-sm text-on-surface-variant mt-0.5">Configure master data</p>
              </div>
            </button>
          </div>
          
          <div className="mt-12 flex items-center justify-between text-sm font-medium pt-8 border-t border-surface-container-highest">
            <a href="/register" className="text-secondary hover:text-secondary-container hover:underline underline-offset-4 transition-colors">Create new account</a>
            <a href="/forgot-password" className="text-on-surface-variant hover:text-primary transition-colors">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
