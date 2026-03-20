import { useAuth } from '../../context/AuthContext';
import { UserCircle } from 'lucide-react';

export default function Navbar() {
  const { userRole, user } = useAuth();
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="font-medium text-gray-700 capitalize">
        {userRole} Portal
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
        <UserCircle className="h-8 w-8 text-gray-400" />
      </div>
    </header>
  );
}
