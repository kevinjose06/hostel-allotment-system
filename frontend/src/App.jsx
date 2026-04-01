import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import ApplicationPage from './pages/student/ApplicationPage';
import ApplicationStatus from './pages/student/ApplicationStatus';


import AdvisorDashboard from './pages/advisor/AdvisorDashboard';
import ApplicationsListPage from './pages/advisor/ApplicationsListPage';
import ApplicationDetailPage from './pages/advisor/ApplicationDetailPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageAdvisorsPage from './pages/admin/ManageAdvisorsPage';
import ManageClassesPage from './pages/admin/ManageClassesPage';
import ManageHostelsPage from './pages/admin/ManageHostelsPage';
import ManageWardensPage from './pages/admin/ManageWardensPage';

import WardenDashboard from './pages/warden/WardenDashboard';
import AllotmentPage from './pages/warden/AllotmentPage';
import AllotmentResultsPage from './pages/warden/AllotmentResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/apply" element={<ApplicationPage />} />
            <Route path="/student/status" element={<ApplicationStatus />} />

          </Route>

          {/* Advisor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['advisor']} />}>
            <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />
            <Route path="/advisor/applications" element={<ApplicationsListPage />} />
            <Route path="/advisor/application/:id" element={<ApplicationDetailPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/advisors" element={<ManageAdvisorsPage />} />
            <Route path="/admin/classes" element={<ManageClassesPage />} />
            <Route path="/admin/hostels" element={<ManageHostelsPage />} />
            <Route path="/admin/wardens" element={<ManageWardensPage />} />
            <Route path="/admin/applications" element={<ApplicationsListPage isAdmin />} />
          </Route>

          {/* Warden Routes */}
          <Route element={<ProtectedRoute allowedRoles={['warden', 'admin']} />}>
            <Route path="/warden/dashboard" element={<WardenDashboard />} />
            <Route path="/warden/allotment" element={<AllotmentPage />} />
            <Route path="/warden/results" element={<AllotmentResultsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
