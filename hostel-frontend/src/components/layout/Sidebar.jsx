import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, User, Building2,
  Users, BookOpen, CheckSquare, LogOut
} from 'lucide-react';

const NAV_CONFIG = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/student/dashboard' },
    { label: 'My Profile', icon: User, to: '/student/profile' },
    { label: 'Apply for Hostel', icon: FileText, to: '/student/apply' },
    { label: 'Application Status', icon: CheckSquare, to: '/student/status' },
    { label: 'My Documents', icon: BookOpen, to: '/student/documents' },
  ],
  advisor: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/advisor/dashboard' },
    { label: 'Applications', icon: FileText, to: '/advisor/applications' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Advisors', icon: Users, to: '/admin/advisors' },
    { label: 'Classes', icon: BookOpen, to: '/admin/classes' },
    { label: 'Hostels', icon: Building2, to: '/admin/hostels' },
    { label: 'All Applications', icon: FileText, to: '/admin/applications' },
    { label: 'Allotment', icon: CheckSquare, to: '/warden/allotment' },
  ],
  warden: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/warden/dashboard' },
    { label: 'Run Allotment', icon: CheckSquare, to: '/warden/allotment' },
    { label: 'Results', icon: FileText, to: '/warden/results' },
  ]
};

export default function Sidebar() {
  const { userRole, signOut } = useAuth();
  const navItems = NAV_CONFIG[userRole] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            R
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">RGIT Kottayam</p>
            <p className="text-xs text-gray-500">Hostel Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
