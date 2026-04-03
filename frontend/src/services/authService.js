import { supabase } from '../lib/supabaseClient';
import api from './api';

export const authService = {
  /**
   * Registers a new student 
   * 1. Creates a Supabase Auth User
   * 2. Inserts profile record into public.student table
   */
  async registerStudent(data) {
    const response = await api.post('/auth/register/student', data);
    return response.data;
  },

  /**
   * General Login
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Log out
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get Current Session User
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};
