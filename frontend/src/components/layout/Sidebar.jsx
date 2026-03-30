import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, User, Building2,
  Users, BookOpen, CheckSquare, LogOut
} from 'lucide-react';
import ritLogo from '../../assets/ritlnew.png';

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
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col h-screen shrink-0 relative z-20 shadow-ambient shadow-primary-fixed/5">
      {/* Logo */}
      <div className="p-6 border-b border-surface-container flex-shrink-0">
        <div className="flex justify-center bg-primary rounded-md px-4 py-3 shadow-inner">
          <img src={ritLogo} alt="RIT Kottayam" className="h-[44px] w-auto object-contain" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface-container-low text-primary font-semibold shadow-sm shadow-primary/5'
                  : 'text-on-surface-variant hover:bg-surface hover:text-primary hover:shadow-sm'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-surface-container flex-shrink-0">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-error font-medium hover:bg-error/10 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Secure Sign Out
        </button>
      </div>
    </aside>
  );
}
