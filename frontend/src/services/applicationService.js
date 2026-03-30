import { supabase } from '../lib/supabaseClient';
import { studentService } from './studentService';

export const applicationService = {
  /**
   * Helper function to calculate a merit score based on input variables
   * (Weighted by distance and annual income)
   */
  calculateMeritScore(income, distance) {
    // Basic normalized merit logic example:
    // 1. Convert income to a score: Lower income => higher points (max 50)
    // 2. Convert distance to a score: Higher distance => higher points (max 50)
    
    let incomePoints = Math.max(0, 50 - (income / 100000) * 5); // Example
    let distancePoints = Math.min(50, (distance / 500) * 50); // Example (Max 50 points if distance > 500km)
    
    return parseFloat((incomePoints + distancePoints).toFixed(2));
  },

  /**
   * Submits a new hostel application for the current student
   */
  async submitApplication(applicationData) {
    const student = await studentService.getProfile();
    
    if (!student.student_id) {
       throw new Error('Student profile not found. Please update your profile first.');
    }

    // Capture the merit score
    const merit_score = this.calculateMeritScore(
      applicationData.family_annual_income,
      applicationData.distance_from_college
    );

    const { data, error } = await supabase
      .from('application')
      .insert({
        student_id: student.student_id,
        academic_year: applicationData.academic_year,
        merit_score,
        family_annual_income: applicationData.family_annual_income,
        distance_from_college: applicationData.distance_from_college,
        bpl_status: applicationData.bpl_status || false,
        pwd_status: applicationData.pwd_status || false,
        sc_st_status: applicationData.sc_st_status || false,
        home_address: applicationData.home_address,
        guardian_name: applicationData.guardian_name,
        guardian_contact: applicationData.guardian_contact,
        status: 'Pending',
        advisor_id: student.advisor_id
      })
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Retrieves the current student's application for the current academic year
   */
  async getMyApplication() {
    const student = await studentService.getProfile();
    const currentYear = new Date().getFullYear();

    const { data, error } = await supabase
      .from('application')
      .select('*')
      .eq('student_id', student.student_id)
      .eq('academic_year', currentYear)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Retrieves a full application status view for the current student
   */
  async getApplicationDashboard() {
    const student = await studentService.getProfile();

    const { data, error } = await supabase
      .from('v_application_dashboard')
      .select('*')
      .eq('college_id', student.college_id);

    if (error) throw error;
    return data;
  }
};
