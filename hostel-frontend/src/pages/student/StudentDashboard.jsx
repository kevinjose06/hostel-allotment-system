import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { FileText, Clock, User, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/shared/StatusBadge';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: app } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => api.get('/application/my').then(r => r.data.data)
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome Academic Year 2024</h1>
        <p className="text-blue-100 max-w-2xl">
          Apply for hostel accommodation, track your application status, and manage your profile details all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Application Status Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            {app && <StatusBadge status={app.status} />}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Application Status</h2>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            {app 
              ? `Your application #${app.application_id} was submitted on ${new Date(app.application_date).toLocaleDateString()}.`
              : "You haven't submitted a hostel application for the current academic year yet."}
          </p>
          <Link 
            to={app ? "/student/status" : "/student/apply"}
            className="w-full text-center py-2.5 bg-gray-50 hover:bg-gray-100 text-blue-600 font-semibold rounded-xl text-sm transition-colors border border-gray-200"
          >
            {app ? "Track Status" : "Start Application"}
          </Link>
        </div>

        {/* Documents Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">My Documents</h2>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Upload and manage your supporting documents (Income Certificate, Caste Certificate, PWD).
          </p>
          <Link 
            to="/student/documents"
            className="w-full text-center py-2.5 bg-gray-50 hover:bg-gray-100 text-purple-600 font-semibold rounded-xl text-sm transition-colors border border-gray-200"
          >
            Manage Documents
          </Link>
        </div>

        {/* Profile Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <User className="h-6 w-6" />
            </div>
            <StatusBadge status="Active" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">My Profile</h2>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Ensure your profile details (address, class, phone number) are up to date before applying.
          </p>
          <Link 
            to="/student/profile"
            className="w-full text-center py-2.5 bg-gray-50 hover:bg-gray-100 text-green-600 font-semibold rounded-xl text-sm transition-colors border border-gray-200"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
