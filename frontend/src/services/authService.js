import { supabase } from '../lib/supabaseClient';

export const authService = {
  /**
   * Registers a new student 
   * 1. Creates a Supabase Auth User
   * 2. Inserts profile record into public.student table
   */
  async registerStudent(data) {
    const { 
      email, 
      password, 
      college_id, 
      first_name, 
      middle_name = '', 
      last_name, 
      gender, 
      date_of_birth, 
      contact_number, 
      class_id,
      department
    } = data;

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'student',
          full_name: `${first_name} ${middle_name ? middle_name + ' ' : ''}${last_name}`.trim()
        }
      }
    });

    if (authError) throw authError;

    const user = authData.user;
    if (!user) throw new Error('Auth user creation failed');

    // 2. Insert into public.student table
    const { error: profileError } = await supabase
      .from('student')
      .insert({
        college_id,
        first_name,
        middle_name: middle_name || '',
        last_name,
        gender,
        date_of_birth,
        contact_number,
        email,
        class_id: class_id || null,
        department: department || null,
        auth_uid: user.id
      });

    if (profileError) {
      // If profile creation fails, we might want to delete the auth user, 
      // but Supabase doesn't easily allow this from frontend. 
      // Admin intervention might be needed or handled via DB triggers.
      throw profileError;
    }

    return { user, message: 'Registration successful' };
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
