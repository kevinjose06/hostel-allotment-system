import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function StudentProfile() {
  const { user } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => studentService.getProfile()
  });

  if (isLoading) return <LoadingSpinner />;
  
  const s = profile || { first_name: 'Not', last_name: 'Found', college_id: 'N/A', email: user?.email };

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
            {s.first_name?.[0]}{s.middle_name?.[0] || ''}{s.last_name?.[0]}
          </div>
          <div className="text-center md:text-left">
            <h2 className="font-serif text-3xl text-primary mb-2">{s.full_name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-on-surface-variant text-sm font-medium">
              <span className="font-mono tracking-wider">{s.college_id || 'NOT_ASSIGNED'}</span>
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
              <p className="font-mono text-on-surface text-base">{s.college_id || 'Not Assigned'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</p>
              <p className="text-on-surface text-base">{s.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Gender</p>
              <p className="text-on-surface text-base">{s.gender || 'Not Specified'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Contact Number</p>
              <p className="text-on-surface text-base">{s.contact_number || 'Not Provided'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Department</p>
              <p className="text-on-surface text-base">
                {s.department || 'Not Assigned Yet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
