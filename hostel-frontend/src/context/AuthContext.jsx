import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for mock session on load
    const storedRole = localStorage.getItem('mockRole');
    if (storedRole) {
      setUser({ email: `${storedRole}@rgit.ac.in`, role: storedRole });
      setUserRole(storedRole);
    }
    setLoading(false);
  }, []);

  const signInAs = async (role) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setUser({ email: `${role}@rgit.ac.in`, role });
    setUserRole(role);
    localStorage.setItem('mockRole', role);
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setUserRole(null);
    localStorage.removeItem('mockRole');
    setLoading(false);
  };

  const getRedirectPath = (role) => {
    const paths = {
      admin: '/admin/dashboard',
      advisor: '/advisor/dashboard',
      student: '/student/dashboard',
      warden: '/warden/dashboard'
    };
    return paths[role] || '/login';
  };

  return (
    <AuthContext.Provider value={{
      user, userRole, loading, signInAs, signOut, getRedirectPath
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
