import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Funkcja do określenia baseURL w zależności od platformy
export const getBaseURL = () => {
  let baseURL: string;
  
  // Dla Android Emulator użyj 10.0.2.2 (specjalny adres IP wskazujący na localhost hosta)
  if (Platform.OS === 'android') {
    // 10.0.2.2 to specjalny adres IP Android Emulator, który wskazuje na localhost hosta
    baseURL = 'http://10.0.2.2:8000';
  }
  // Dla iOS Simulator można użyć localhost
  else if (Platform.OS === 'ios') {
    baseURL = 'http://localhost:8000';
  }
  // Fallback dla innych platform (np. web)
  else {
    baseURL = 'http://127.0.0.1:8000';
  }
  
  // Logowanie dla debugowania (tylko w trybie deweloperskim)
  if (__DEV__) {
    console.log(`[API] Platform: ${Platform.OS}, BaseURL: ${baseURL}`);
  }
  
  return baseURL;
};

// Funkcja pomocnicza do generowania pełnych URL dla zasobów (obrazy, pliki itp.)
export const getResourceURL = (path: string) => {
  if (!path) return '';
  // Jeśli path już zaczyna się od http/https, zwróć go bez zmian
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // W przeciwnym razie dodaj baseURL
  const baseURL = getBaseURL();
  // Upewnij się, że path zaczyna się od /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}${normalizedPath}`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 sekund timeout
});

// Interceptor request - automatycznie dodaje token do wszystkich żądań
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Funkcja do odświeżania tokena
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor response - obsługuje błędy 401/403 i automatycznie odświeża token
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jeśli błąd nie ma response (błąd sieciowy), nie wylogowuj - po prostu zwróć błąd
    if (!error.response) {
      // Błąd sieciowy - nie wylogowuj użytkownika
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Dla 401 (wygasły token) - spróbuj odświeżyć token
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Jeśli już odświeżamy token, dodaj request do kolejki
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        isRefreshing = false;
        processQueue(error, null);
        // Brak tokena - po prostu zwróć błąd, nie czyść storage
        // AppNavigator zdecyduje czy wylogować użytkownika
        return Promise.reject(error);
      }

      try {
        // Spróbuj odświeżyć token
        const refreshResponse = await axios.post(`${getBaseURL()}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Backend zwraca dict z access_token i token_type
        const newToken = refreshResponse.data?.access_token || refreshResponse.data;
        
        if (!newToken) {
          throw new Error('No token in refresh response');
        }
        
        if (newToken) {
          await AsyncStorage.setItem('authToken', newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          isRefreshing = false;
          processQueue(null, newToken);
          return API(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError: any) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // NIE czyść storage tutaj - pozwól AppNavigator zdecydować
        // Jeśli refresh nie zadziałał, po prostu zwróć błąd
        // AppNavigator użyje zapisanych danych jako fallback
        console.log('Nie udało się odświeżyć tokena:', refreshError?.response?.status || 'no response');
        
        return Promise.reject(error);
      }
    }

    // Dla 403 (brak uprawnień) - NIE wylogowuj, tylko zwróć błąd
    // Użytkownik może nie mieć uprawnień do konkretnej akcji, ale sesja jest ważna
    
    return Promise.reject(error);
  }
);

export default API;
