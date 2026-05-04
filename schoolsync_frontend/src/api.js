import axios from 'axios';

// Change this to your backend IP address when testing on a physical device
// Example: const API_URL = 'http://192.168.1.5:8000';
const API_URL = 'http://192.168.100.5:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for image URLs
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

export default api;
