import { supabase } from '../lib/supabaseClient';

export const documentService = {
  /**
   * Uploads a file to Supabase Storage and records it in the database
   * @param {File} file - The file object from a file input
   * @param {string} documentType - ENUM value (e.g., 'Income_Certificate')
   * @param {number} studentId - The ID of the student
   */
  async uploadDocument(file, documentType, studentId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Define the storage path: student-documents/{auth_id}/{timestamp}_{filename}
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${documentType}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // 2. Upload to Storage bucket 'student-documents'
    const { error: uploadError } = await supabase.storage
      .from('student-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 3. Record the link in the student_documents table
    const { data, error: dbError } = await supabase
      .from('student_documents')
      .insert({
        student_id: studentId,
        document_type: documentType,
        file_path: filePath,
        verification_status: 'Pending'
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  /**
   * Fetches all documents for the current student
   */
  async getMyDocuments(studentId) {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;
    return data;
  },

  /**
   * Generates a signed URL for a private document
   * (Links expire after 60 seconds for security)
   */
  async getDocumentPreviewUrl(filePath) {
    const { data, error } = await supabase.storage
      .from('student-documents')
      .createSignedUrl(filePath, 60);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Deletes a document from both Storage and Database
   */
  async deleteDocument(documentId, filePath) {
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from('student-documents')
      .remove([filePath]);

    if (storageError) throw storageError;

    // 2. Delete from Database
    const { error: dbError } = await supabase
      .from('student_documents')
      .delete()
      .eq('document_id', documentId);

    if (dbError) throw dbError;
    
    return { success: true };
  }
};
