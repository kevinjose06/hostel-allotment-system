import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { studentService } from '../../services/studentService';
import { FileText, Clock, User, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/shared/StatusBadge';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: app, isLoading: isAppLoading } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => applicationService.getMyApplication()
  });

  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['student-config'],
    queryFn: () => studentService.getSystemConfig()
  });

  const isLoading = isAppLoading || isConfigLoading;

  if (isLoading) return <LoadingSpinner />;

  const deadline = config?.application_deadline ? new Date(config.application_deadline) : null;
  const isDeadlinePassed = deadline && new Date() > deadline;

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
          {deadline && (
            <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-sm border ${
              isDeadlinePassed ? 'bg-error/10 border-error/20 text-error-container' : 'bg-white/10 border-white/20 text-white'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wider">
                {isDeadlinePassed ? 'Deadline Passed: ' : 'Application Deadline: '}
                {deadline.toLocaleDateString('en-IN', { 
                  day: 'numeric', month: 'short', year: 'numeric', 
                  hour: '2-digit', minute: '2-digit', hour12: true 
                })}
              </span>
            </div>
          )}
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
              disabled={!app && isDeadlinePassed}
              className={`btn-primary flex-1 ${!app ? 'w-full' : ''} ${(!app && isDeadlinePassed) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
              onClick={(e) => (!app && isDeadlinePassed) && e.preventDefault()}
            >
              {app ? "Track Status" : isDeadlinePassed ? "Deadline Closed" : "Start Application"}
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
