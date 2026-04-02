import api from './api';
import { supabase } from '../lib/supabaseClient';
import { studentService } from './studentService';

export const applicationService = {
  /**
   * Calculates merit score from income and distance only.
   * BPL/PWD/SC-ST students get reserved seats (20%) during allotment — not bonus points here.
   */
  calculateMeritScore(income, distance) {
    const incomePoints   = Math.max(0, 50 - (income / 100000) * 5);
    const distancePoints = Math.min(50, (distance / 500) * 50);
    return parseFloat((incomePoints + distancePoints).toFixed(2));
  },

  /**
   * Uploads a single file to Supabase Storage and returns its public path.
   */
  async uploadDocument(authUid, fieldName, file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type for ${fieldName}. Only PDF, JPG, and PNG files are allowed.`);
    }
    const ext = file.name.split('.').pop();
    const path = `${authUid}/${fieldName}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('student-documents')
      .upload(path, file, { upsert: true });
    if (error) throw new Error(`Upload failed for ${fieldName}: ${error.message}`);
    return { path, docType: fieldName };
  },

  /**
   * Submits a new hostel application for the current student,
   * uploading any attached certificates to Supabase Storage first.
   */
  async submitApplication(applicationData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const student = await studentService.getProfile();
    if (!student.student_id) {
      throw new Error('Student profile not found. Please update your profile first.');
    }

    // 1. Upload documents to Supabase Storage
    const docFields = [
      'income_certificate',
      'residential_certificate',
      'pwd_certificate',
      'bpl_certificate',
      'sc_st_certificate',
    ];
    
    // Map frontend field names to DB DocumentType enum values
    const docTypeMap = {
      income_certificate: 'Income_Certificate',
      residential_certificate: 'Distance_Proof', // Residential proof used for distance evaluation
      pwd_certificate: 'PWD_Certificate',
      bpl_certificate: 'BPL_Certificate',
      sc_st_certificate: 'Caste_Certificate'
    };

    const uploadedDocs = [];
    for (const field of docFields) {
      const files = applicationData[field];
      if (files && files.length > 0) {
        const result = await this.uploadDocument(user.id, field, files[0]);
        // Use the mapped DB enum name
        uploadedDocs.push({ ...result, docType: docTypeMap[field] || 'Other' });
      }
    }

    // 2. Submit via Backend API
    const response = await api.post('/application', {
      academic_year: applicationData.academic_year,
      family_annual_income: applicationData.family_annual_income,
      distance_from_college: applicationData.distance_from_college,
      bpl_status: applicationData.bpl_status || false,
      pwd_status: applicationData.pwd_status || false,
      sc_st_status: applicationData.sc_st_status || false,
      home_address: applicationData.home_address,
      guardian_name: applicationData.guardian_name,
      guardian_contact: applicationData.guardian_contact,
    });

    // 3. Save document metadata into student_document table (Internal Upsert)
    if (uploadedDocs.length > 0) {
      const docRows = uploadedDocs.map(d => ({
        student_id: student.student_id,
        document_type: d.docType,
        file_path: d.path,
        verification_status: 'Pending',
      }));
      await supabase.from('student_document').upsert(docRows, { onConflict: 'student_id,document_type' });
    }
  
    // 4. Upsert student_academics from snapshot
    await supabase.from('student_academics').upsert({
      student_id: student.student_id,
      year_of_study: student.class?.year || 1,
      family_annual_income: applicationData.family_annual_income,
      distance_from_college: applicationData.distance_from_college,
      bpl_status: applicationData.bpl_status || false,
      pwd_status: applicationData.pwd_status || false,
      sc_st_status: applicationData.sc_st_status || false,
    }, { onConflict: 'student_id' });

    return response.data.data;
  },

  /**
   * Re-submits a returned application with updated data
   */
  async updateApplication(applicationId, applicationData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const student = await studentService.getProfile();

    // 1. Re-upload any newly attached documents
    const docFields = ['income_certificate', 'residential_certificate', 'pwd_certificate', 'bpl_certificate', 'sc_st_certificate'];
    
    const docTypeMap = {
      income_certificate: 'Income_Certificate',
      residential_certificate: 'Distance_Proof',
      pwd_certificate: 'PWD_Certificate',
      bpl_certificate: 'BPL_Certificate',
      sc_st_certificate: 'Caste_Certificate'
    };

    const uploadedDocs = [];
    for (const field of docFields) {
      const files = applicationData[field];
      if (files && files.length > 0) {
        const result = await this.uploadDocument(user.id, field, files[0]);
        uploadedDocs.push({ ...result, docType: docTypeMap[field] || 'Other' });
      }
    }

    // 2. Update metadata in DB
    if (uploadedDocs.length > 0) {
      const docRows = uploadedDocs.map(d => ({
        student_id: student.student_id,
        document_type: d.docType,
        file_path: d.path,
        verification_status: 'Pending',
      }));
      await supabase.from('student_document').upsert(docRows, { onConflict: 'student_id,document_type' });
    }

    const response = await api.put('/application/my', {
      academic_year: applicationData.academic_year,
      family_annual_income: applicationData.family_annual_income,
      distance_from_college: applicationData.distance_from_college,
      bpl_status: applicationData.bpl_status || false,
      pwd_status: applicationData.pwd_status || false,
      sc_st_status: applicationData.sc_st_status || false,
      home_address: applicationData.home_address,
      guardian_name: applicationData.guardian_name,
      guardian_contact: applicationData.guardian_contact,
    });

    return response.data.data;
  },

  /**
   * Retrieves the current student's application for the current academic year
   */
  async getMyApplication() {
    const student = await studentService.getProfile();
    if (!student || !student.student_id) return null;

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
