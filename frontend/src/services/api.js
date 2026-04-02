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
  // Wait to get the extremely fresh token from Supabase's local storage engine
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
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
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login, clear local storage)
      console.warn("Unauthorized API call. Token is likely expired.");
      // Optional: window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
