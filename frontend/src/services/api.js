import axios from 'axios';
import { supabase } from '../lib/supabaseClient'; // Pull in Supabase to grab the live token

// Force the base URL to include the versioning prefix
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const sanitizedBase = rawBaseURL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
const baseURL = `${sanitizedBase}/api/v1`;

console.log("🚀 API Initialized at:", baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Intercept requests to automatically inject the authentication token
api.interceptors.request.use(async (config) => {
  try {
    // Wait to get the extremely fresh token from Supabase's local storage engine
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error("Session refresh failed during API request:", err.message);
    // If getting session fails due to refresh token error, we don't block the request here,
    // let it fail with 401 and handle it in the response interceptor for a clean redirect.
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call. Attempting to clear session...");
      
      // Clear Supabase session and redirect
      await supabase.auth.signOut();
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
         window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
