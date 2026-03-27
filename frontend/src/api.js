import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const getStudents = () => api.get('/api/students');

export const createStudent = (data) => api.post('/api/students', data);

export const uploadStudentPhotos = (studentId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  return api.post(`/api/students/${studentId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getClasses = () => api.get('/api/classes');

export const createClass = (data) => api.post('/api/classes', data);

export const createAttendanceSession = (formData) =>
  api.post('/api/attendance/sessions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getSessions = (params) => api.get('/api/attendance/sessions', { params });

export const getSession = (id) => api.get(`/api/attendance/sessions/${id}`);

export const updateRecord = (sessionId, recordId, data) =>
  api.put(`/api/attendance/sessions/${sessionId}/records/${recordId}`, data);

export const confirmSession = (sessionId) =>
  api.post(`/api/attendance/sessions/${sessionId}/confirm`);

export const exportAttendance = (params) =>
  api.get('/api/attendance/export', { params, responseType: 'blob' });

export default api;
