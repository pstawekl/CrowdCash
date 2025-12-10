// Hook do pobierania stanu autoryzacji i roli użytkownika w aplikacji mobilnej
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  isLoading: boolean;
}

// Funkcja do ręcznego aktualizowania stanu autoryzacji
let authUpdateCallback: (() => void) | null = null;

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    isLoading: true,
  });

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          role: null,
          isLoading: false,
        });
        return;
      }

      // Sprawdź czy token jest nadal ważny przez wywołanie API
      try {
        const API = (await import('./api')).default;
        await API.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Token jest ważny
        const role = await AsyncStorage.getItem('userRole');
        setAuthState({
          isAuthenticated: true,
          role,
          isLoading: false,
        });
      } catch (apiError: any) {
        // Sprawdź czy to rzeczywiście błąd autoryzacji (401) czy błąd sieciowy
        const status = apiError?.response?.status;
        
        // Tylko przy 401 (Unauthorized) wyczyść sesję
        // Przy błędach sieciowych (brak response) - zachowaj sesję
        if (status === 401) {
          console.log('Token nieważny (401) - czyszczenie sesji');
          await AsyncStorage.multiRemove(['authToken', 'userRole', 'userPermissions']);
          setAuthState({
            isAuthenticated: false,
            role: null,
            isLoading: false,
          });
        } else {
          // Błąd sieciowy lub inny - zachowaj sesję i użyj zapisanych danych
          console.log('Błąd sieciowy, zachowuję sesję:', status || 'no response');
          const role = await AsyncStorage.getItem('userRole');
          setAuthState({
            isAuthenticated: !!role,
            role,
            isLoading: false,
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Przy błędach - zachowaj sesję jeśli jest token
      const token = await AsyncStorage.getItem('authToken');
      const role = await AsyncStorage.getItem('userRole');
      setAuthState({
        isAuthenticated: !!token && !!role,
        role,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    // Sprawdź na starcie
    checkAuth();

    // Sprawdzaj rzadziej - co 5 minut (zamiast co 30 sekund)
    // Token będzie automatycznie odświeżany przez interceptor API
    const interval = setInterval(checkAuth, 300000); // 5 minut

    return () => {
      clearInterval(interval);
    };
  }, []);

  return authState;
}

// Funkcja do natychmiastowego aktualizowania stanu autoryzacji (do użycia po logowaniu)
export function updateAuthState() {
  if (authUpdateCallback) {
    authUpdateCallback();
  }
}

// Hook do nasłuchiwania zmian autoryzacji
export function useAuthListener() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    authUpdateCallback = () => forceUpdate({});
    return () => {
      authUpdateCallback = null;
    };
  }, []);
}

export async function logout(navigation?: any) {
  try {
    await AsyncStorage.multiRemove(['authToken', 'userRole', 'userPermissions']);
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
}
