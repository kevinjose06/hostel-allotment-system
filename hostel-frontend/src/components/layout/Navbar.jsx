import { useAuth } from '../../context/AuthContext';
import { UserCircle } from 'lucide-react';

export default function Navbar() {
  const { userRole, user } = useAuth();
  
  return (
    <header className="h-20 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-10 shadow-sm shadow-primary/5">
      <div className="font-serif text-2xl text-primary font-medium tracking-tight">
        {userRole === 'admin' ? 'System Administration' : 
         userRole === 'advisor' ? 'Class Advisor Portal' : 
         userRole === 'warden' ? 'Warden Command Center' : 
         'Student Dashboard'}
      </div>
      
      <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-md border border-outline-variant/20">
        <div className="text-right hidden sm:block">
          <p className="font-sans text-sm font-semibold text-primary">{user?.email}</p>
          <p className="font-sans text-xs font-medium text-on-surface-variant tracking-wider uppercase mt-0.5">{userRole}</p>
        </div>
        <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <UserCircle className="h-6 w-6" />
        </div>
      </div>
    </header>
  );
}
