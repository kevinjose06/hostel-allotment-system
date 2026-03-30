import api from './api';

export const adminService = {
  // ── Advisors ────────────────────────────────────────────────────────────────
  async getAdvisors() {
    const response = await api.get('/admin/advisors');
    return response.data.data;
  },
  async createAdvisor(advisorData) {
    const response = await api.post('/admin/advisor', advisorData);
    return response.data.data;
  },
  async updateAdvisor(advisorId, updates) {
    const response = await api.put(`/admin/advisor/${advisorId}`, updates);
    return response.data.data;
  },
  async deleteAdvisor(advisorId) {
    const response = await api.delete(`/admin/advisor/${advisorId}`);
    return response.data;
  },

  // ── Classes ──────────────────────────────────────────────────────────────────
  async getClasses() {
    const response = await api.get('/admin/classes');
    return response.data.data;
  },
  async createClass(classData) {
    const response = await api.post('/admin/class', classData);
    return response.data.data;
  },
  async updateClass(classId, updates) {
    const response = await api.put(`/admin/class/${classId}`, updates);
    return response.data.data;
  },

  // ── Hostels ──────────────────────────────────────────────────────────────────
  async getHostels() {
    const response = await api.get('/hostel/');
    return response.data.data;
  },
  async createHostel(hostelData) {
    const response = await api.post('/admin/hostel', hostelData);
    return response.data.data;
  },
  async updateHostel(hostelId, updates) {
    const response = await api.put(`/admin/hostel/${hostelId}`, updates);
    return response.data.data;
  },
};
