import api from './api';

export const adminService = {
  // Advisors
  async getAdvisors() {
    const response = await api.get('/admin/advisors');
    return response.data.data;
  },
  async createAdvisor(advisorData) {
    const response = await api.post('/admin/advisor', advisorData);
    return response.data.data;
  },

  // Classes
  async getClasses() {
    const response = await api.get('/admin/classes');
    return response.data.data;
  },
  async createClass(classData) {
    const response = await api.post('/admin/class', classData);
    return response.data.data;
  },

  // Hostels
  async getHostels() {
    const response = await api.get('/hostel/');
    return response.data.data;
  },
  async createHostel(hostelData) {
    const response = await api.post('/admin/hostel', hostelData);
    return response.data.data;
  }
};
