/**
 * Sanitizes technical error messages from Supabase/PostgREST 
 * into formal, user-friendly strings.
 */
export const getFriendlyErrorMessage = (error) => {
  if (!error) return "An unexpected institutional error occurred.";

  const message = error.message || String(error);
  const code = error.code || "";

  // 1. Authentication Errors
  if (message.includes("Invalid login credentials") || message.includes("Invalid credentials")) {
    return "The email or password provided is incorrect. Please verify and try again.";
  }
  if (message.includes("Email not confirmed")) {
    return "Your institutional email address has not been verified yet.";
  }
  if (message.includes("Too many requests") || code === "over_request_rate_limit") {
    return "Too many sign-in attempts. Please wait a few minutes before trying again.";
  }

  // 2. Database Constraint Errors (PostgREST)
  if (code === "23505") {
    if (message.includes("student_college_id_key")) return "A student record with this College ID already exists.";
    if (message.includes("student_email_key")) return "This email address is already registered in the system.";
    return "A record with these unique details already exists in our database.";
  }

  // 3. Null/ForeignKey Violations
  if (code === "23502" || code === "23503") {
    return "Database integrity error: A required field is missing or invalid.";
  }

  // 4. Network / Supabase Connection Issues
  if (message.includes("fetch") || message.includes("NetworkError") || message.includes("Failed to fetch")) {
    return "Infrastructure connectivity error. Please check your internet connection.";
  }

  console.error("[ERROR]:", error);
  return error?.message || error?.error_description || String(error);
};


