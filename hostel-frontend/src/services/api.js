import axios from 'axios';
import { mockDataStore } from './mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

// Since the backend is not ready, we intercept the request and return mock promises
api.interceptors.request.use(async (config) => {
  console.log(`[MOCK API] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Determine mock response based on URL
  let mockRes = { data: { data: {} } };

  if (config.url.includes('/application/my')) {
    mockRes.data.data = mockDataStore.applications.find(a => a.student_id === 1) || null;
  } else if (config.url.includes('/advisor/applications')) {
    mockRes.data.data = mockDataStore.applications;
  } else if (config.url.includes('/advisor/application/')) {
    const id = parseInt(config.url.split('/').pop());
    mockRes.data.data = mockDataStore.applications.find(a => a.application_id === id);
  } else if (config.url.includes('/admin/stats')) {
    mockRes.data.data = {
      applications: mockDataStore.applications,
      allocations: []
    };
  } else if (config.url === '/hostel') {
    mockRes.data.data = mockDataStore.hostels;
  } else if (config.url === '/allotment/run') {
    mockRes.data.data = {
      hostel_name: 'Mens Hostel 1',
      academic_year: config.data?.academic_year || new Date().getFullYear(),
      total_allocated: 12,
      reserved_allocated: 4,
      general_allocated: 8
    };
  }

  // Reject the request with a special property to short-circuit Axios 
  // and force it to resolve our mock result instead.
  // We use a custom adapter to return mock responses without hitting a real server.
  return config;
});

// A custom adapter overrides Axios's default XHR behavior
api.defaults.adapter = async (config) => {
  console.log(`[MOCK API] ${config.method.toUpperCase()} ${config.url}`);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let data = null;
  
  // 1. Student routes
  if (config.url === '/application/my') {
     data = mockDataStore.applications.find(a => a.student_id === 1);
  } else if (config.url === '/application' && config.method === 'post') {
     // Create dummy application
     const newApp = {
       application_id: Math.floor(Math.random() * 1000) + 100,
       academic_year: JSON.parse(config.data).academic_year,
       family_annual_income: JSON.parse(config.data).family_annual_income,
       distance_from_college: JSON.parse(config.data).distance_from_college,
       status: 'Pending',
       application_date: new Date().toISOString(),
       merit_score: 95.5,
       student_id: 1,
       student: mockDataStore.student
     };
     mockDataStore.applications.push(newApp);
     data = newApp;
  }
  
  // 2. Advisor routes
  else if (config.url === '/advisor/applications') {
     data = mockDataStore.applications;
  } else if (config.url.startsWith('/advisor/application/')) {
     const idMatched = config.url.match(/\/advisor\/application\/(\d+)/);
     const isAction = config.url.match(/\/advisor\/application\/(\d+)\/(approve|reject|return)/);
     
     if (isAction) {
       const id = parseInt(isAction[1]);
       const action = isAction[2];
       const app = mockDataStore.applications.find(a => a.application_id === id);
       if (app) {
         if (action === 'approve') app.status = 'Approved';
         if (action === 'reject') app.status = 'Rejected';
         if (action === 'return') app.status = 'Returned';
         app.remarks = JSON.parse(config.data || '{}').remarks || '';
       }
       data = app;
     } else if (idMatched) {
       data = mockDataStore.applications.find(a => a.application_id === parseInt(idMatched[1]));
     }
  }
  
  // 3. Admin routes
  else if (config.url === '/admin/stats') {
     data = { applications: mockDataStore.applications, allocations: [] };
  } 
  
  // 4. Warden / Hostel routes
  else if (config.url === '/hostel') {
     data = mockDataStore.hostels;
  } else if (config.url === '/allotment/run') {
     data = {
       hostel_name: 'Mens Hostel 1',
       academic_year: JSON.parse(config.data).academic_year,
       total_allocated: Math.floor(Math.random() * 20),
       reserved_allocated: 4,
       general_allocated: 8
     };
  }

  // Auth routes (mock login)
  else if (config.url === '/auth/register/student') {
     data = { message: 'Registered successfully' };
  }

  return {
    data: { data },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: {}
  };
};

export default api;
