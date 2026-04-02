import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { FileText, Clock, User, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/shared/StatusBadge';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: app, isLoading, isError } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => applicationService.getMyApplication()
  });

  if (isLoading) return <LoadingSpinner />;
  
  if (isError) {
    return (
      <div className="p-12 text-center card">
        <h2 className="text-xl font-serif text-error mb-4">Dashboard Error</h2>
        <p className="text-on-surface-variant mb-6">We encountered an issue while loading your application status.</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-primary rounded-md p-8 md:p-12 text-white shadow-ambient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
        <div className="relative z-10">
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mb-4 text-white">Welcome to Student Portal</h1>
          <p className="font-sans text-primary-fixed-dim max-w-2xl leading-relaxed text-lg">
            Apply for hostel accommodation, track your application status, and manage your profile details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Application Status Widget */}
        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-8 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-surface-container-low text-primary rounded-md">
              <FileText className="h-6 w-6" />
            </div>
            {app && <StatusBadge status={app.status} />}
          </div>
          <h2 className="font-serif text-2xl text-primary mb-2">Application Status</h2>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed mb-8 flex-1">
            {app 
              ? `Your application #${app.application_id} was submitted on ${new Date(app.application_date).toLocaleDateString()}.`
              : "You haven't submitted a hostel application for the current academic year yet."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            <Link 
              to={app ? "/student/status" : "/student/apply"}
              className={`btn-primary flex-1 ${!app ? 'w-full' : ''}`}
            >
              {app ? "Track Status" : "Start Application"}
            </Link>
            {app && ['Pending', 'Returned'].includes(app.status) && (
              <Link 
                to="/student/apply"
                className="btn-secondary flex-1 border border-outline-variant/20"
              >
                Edit Application
              </Link>
            )}
          </div>
        </div>

        {/* Profile Widget */}
        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-8 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-surface-container-low text-primary rounded-md">
              <User className="h-6 w-6" />
            </div>
            <StatusBadge status="Active" />
          </div>
          <h2 className="font-serif text-2xl text-primary mb-2">My Profile</h2>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed mb-8 flex-1">
            Ensure your profile details (address, class, phone number) are up to date before applying.
          </p>
          <Link 
            to="/student/profile"
            className="btn-secondary w-full border border-outline-variant/20"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
