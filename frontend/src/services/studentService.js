import { supabase } from '../lib/supabaseClient';

import api from './api';

export const studentService = {
  /**
   * Fetches the student's unified profile (Personal + Academics + Class)
   */
  async getProfile() {
    try {
      // First ensure auth user exists
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch from explicit backend API which fetches new columns reliably
      const response = await api.get('/student/profile');
      const data = response.data.data;

      // Extract academics and class records correctly (Supabase often returns arrays for joins)
      const aca = Array.isArray(data.student_academics) ? data.student_academics[0] : data.student_academics;
      const cls = Array.isArray(data.class) ? data.class[0] : data.class;

      // Map to flattened view format that components expect
      const firstName = data.first_name || user.user_metadata?.name?.split(' ')[0] || '';
      const lastName = data.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '';
      const fullName = data.full_name || user.user_metadata?.name || `${firstName} ${lastName}`.trim() || 'Student';

      return {
        ...data,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        department: data.department || cls?.department || 'Not Assigned Yet',
        college_id: data.college_id || 'N/A',
        degree_program: cls?.degree_program,
        class_year: cls?.year,
        division: cls?.division,
        advisor_id: cls?.advisor_id || cls?.class_advisor?.advisor_id || null,
        advisor_name: cls?.class_advisor?.name,
        year_of_study: aca?.year_of_study,
        cgpa: aca?.cgpa,
        family_annual_income: aca?.family_annual_income,
        distance_from_college: aca?.distance_from_college,
        bpl_status: aca?.bpl_status || false,
        pwd_status: aca?.pwd_status || false,
        sc_st_status: aca?.sc_st_status || false
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Fallback for newly registered users whose student record is missing
        const { data: { user } } = await supabase.auth.getUser();
        const authName = user?.user_metadata?.name || 'Student';
        return { 
          email: user?.email, 
          full_name: authName,
          first_name: authName.split(' ')[0], 
          last_name: authName.split(' ').slice(1).join(' ') 
        };
      }
      throw error;
    }
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
  },

  /**
   * Fetches system configuration (academic year, application deadline, etc.)
   */
  async getSystemConfig() {
    const response = await api.get('/student/config');
    return response.data.data;
  }
};
