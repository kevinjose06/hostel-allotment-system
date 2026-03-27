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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-primary tracking-tight">Institutional Profile</h1>
        <p className="font-sans text-on-surface-variant mt-2 text-base">Manage your student metadata and contact information.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-surface-container-low px-8 md:px-12 py-10 flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-surface-container">
          <div className="h-24 w-24 bg-primary text-white rounded-md flex items-center justify-center font-serif text-4xl shadow-sm">
            {s.first_name?.[0]}{s.last_name?.[0]}
          </div>
          <div className="text-center md:text-left">
            <h2 className="font-serif text-3xl text-primary mb-2">{s.first_name} {s.last_name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-on-surface-variant text-sm font-medium">
              <span className="font-mono tracking-wider">{s.college_id}</span>
              <span className="hidden md:inline">•</span>
              <span>{s.email}</span>
            </div>
          </div>
        </div>
        
        {/* Profile Details */}
        <div className="p-8 md:p-12">
          <h3 className="font-sans font-semibold text-primary uppercase tracking-[0.1em] text-xs border-b border-surface-container pb-4 mb-8">
            Personal Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">College ID</p>
              <p className="font-mono text-on-surface text-base">{s.college_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</p>
              <p className="text-on-surface text-base">{s.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Gender</p>
              <p className="text-on-surface text-base">{s.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Contact Number</p>
              <p className="text-on-surface text-base">{s.contact_number || 'N/A'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Department & Class</p>
              <p className="text-on-surface text-base">{s.class?.department || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
