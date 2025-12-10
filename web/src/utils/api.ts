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
    if (error.response) {
      const status = error.response.status;
      const currentPath = window.location.pathname;
      
      // Nie wywołuj logout dla 403 na stronie verify lub login (to może być błąd weryfikacji konta)
      if (status === 403 && (currentPath === '/verify' || currentPath === '/login')) {
        return Promise.reject(error);
      }
      
      // Dla 401 zawsze wyczyść sesję (token wygasł lub nieprawidłowy)
      if (status === 401) {
        // Nie wywołuj logout jeśli jesteśmy już na stronie login
        if (currentPath !== '/login') {
          localStorage.setItem('authError', 'Sesja wygasła. Zaloguj się ponownie.');
          logout(); // wyczyść tokeny i trigger event
        }
      }
      
      // Dla innych błędów 403 (nie na verify/login) - wyczyść sesję
      if (status === 403 && currentPath !== '/verify' && currentPath !== '/login') {
        localStorage.setItem('authError', 'Brak uprawnień. Zaloguj się ponownie.');
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default API;
