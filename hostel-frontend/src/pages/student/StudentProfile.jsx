import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function StudentProfile() {
  const { user } = useAuth();
  
  // Note: For mock data, we get the profile by fetching the app. 
  // In real implementation this would be `/student/my`
  const { data: app, isLoading } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => api.get('/application/my').then(r => r.data.data)
  });

  if (isLoading) return <LoadingSpinner />;
  
  const s = app?.student || { first_name: 'John', last_name: 'Doe', college_id: 'KTE24CS079', email: user?.email };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-gray-500 mt-2">Manage your student metadata and contact info.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white flex items-center gap-6">
          <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center font-bold text-4xl border-2 border-white/40 shadow-inner">
            {s.first_name?.[0]}{s.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{s.first_name} {s.last_name}</h2>
            <div className="flex items-center gap-3 text-blue-100 text-sm font-medium">
              <span className="font-mono">{s.college_id}</span>
              <span>•</span>
              <span>{s.email}</span>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Personal details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">College ID</p>
              <p className="font-mono text-gray-900">{s.college_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Email Address</p>
              <p className="text-gray-900">{s.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Gender</p>
              <p className="text-gray-900">{s.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Contact Number</p>
              <p className="text-gray-900">{s.contact_number || 'N/A'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-gray-500 mb-1">Department & Class</p>
              <p className="text-gray-900">{s.class?.department || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
