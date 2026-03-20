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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 overflow-hidden relative">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg shadow-blue-200">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hostel Portal</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Rajiv Gandhi Institute of Technology</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800 text-center font-medium leading-relaxed">
            Welcome to the demo environment. Please select a role to sign in instantly.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleLogin('student')}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all text-left group"
          >
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Student Sign In</p>
              <p className="text-xs text-gray-500 font-medium">Apply & track applications</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin('advisor')}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white hover:border-purple-200 hover:shadow-md transition-all text-left group"
          >
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Class Advisor Sign In</p>
              <p className="text-xs text-gray-500 font-medium">Review student applications</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin('warden')}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white hover:border-orange-200 hover:shadow-md transition-all text-left group"
          >
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Warden Sign In</p>
              <p className="text-xs text-gray-500 font-medium">Run allotment algorithm</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin('admin')}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-md transition-all text-left group"
          >
            <div className="bg-gray-200 text-gray-700 p-2 rounded-lg group-hover:bg-gray-800 group-hover:text-white transition-colors">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Admin Sign In</p>
              <p className="text-xs text-gray-500 font-medium">Manage master data</p>
            </div>
          </button>
        </div>
        
        <div className="mt-8 text-center text-sm font-medium">
          <p className="text-gray-500 mb-2">New student?</p>
          <a href="/register" className="text-blue-600 hover:text-blue-700 hover:underline inline-block pb-1">Create an account</a>
          <span className="mx-2 text-gray-300">|</span>
          <a href="/forgot-password" className="text-gray-500 hover:text-gray-700 hover:underline inline-block pb-1">Forgot password</a>
        </div>
      </div>
    </div>
  );
}
