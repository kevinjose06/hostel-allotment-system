import { supabase } from '../lib/supabaseClient';

export const studentService = {
  /**
   * Fetches the student's unified profile (Personal + Academics + Class)
   * This uses the v_student_profile database view.
   */
  async getProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { data: profile, error } = await supabase
      .from('v_student_profile')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (error) throw error;
    
    // Fallback for newly registered users who don't have academics/class yet
    return profile || { email: user.email, full_name: user.user_metadata?.full_name || 'Student' };
  },

  /**
   * Updates student personal biographical information
   */
  async updatePersonalInfo(studentId, updateData) {
    const { data, error } = await supabase
      .from('student')
      .update(updateData)
      .eq('student_id', studentId)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Updates student academic and socioeconomic information
   */
  async updateAcademics(studentId, academicData) {
    const { data, error } = await supabase
      .from('student_academics')
      .upsert({ ...academicData, student_id: studentId })
      .select();

    if (error) throw error;
    return data;
  }
};
