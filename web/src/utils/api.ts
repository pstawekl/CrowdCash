import axios from 'axios';
import { logout } from './auth';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Dostosuj jeśli backend jest pod innym adresem
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token wygasł lub brak autoryzacji
      localStorage.setItem('authError', 'Sesja wygasła. Zaloguj się ponownie.');
      logout(); // wyczyść tokeny i trigger event
    }
    return Promise.reject(error);
  }
);

export default API;
