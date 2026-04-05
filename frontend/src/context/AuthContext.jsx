import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for current session on load
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setUser(session.user);
          setUserRole(session.user.user_metadata?.role || 'student');
        }
      } catch (err) {
        console.error("Critical Auth Error during initial load:", err.message);
        // If the session is corrupted/expired, clear it to allow fresh login
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Listen for auth state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setUserRole(session.user.user_metadata?.role || 'student');
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAs = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
      throw error;
    }
    
    // Auth state listener handles setting user/role
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    qc.clear(); // Complete cache purge for security
    setUser(null);
    setUserRole(null);
    setLoading(false);
  };

  const sendPasswordResetEmail = async (email) => {
    // We use the centralized API service which already handles the base URL and versioning
    try {
      const { data } = await api.post('/auth/request-reset', { email });
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
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
      user, userRole, loading, signInAs, signOut, getRedirectPath, sendPasswordResetEmail, updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
