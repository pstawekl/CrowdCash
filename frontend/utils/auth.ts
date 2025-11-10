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
      const role = await AsyncStorage.getItem('userRole');
      setAuthState({
        isAuthenticated: !!token,
        role,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthState({
        isAuthenticated: false,
        role: null,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    // Sprawdź na starcie
    checkAuth();

    // Dodaj listener na focus, żeby odświeżać stan po powrocie do ekranu
    const focusListener = () => {
      checkAuth();
    };

    // W React Native możemy użyć focus listener z navigation
    // Ale na razie zrobimy prostsze rozwiązanie z setInterval
    const interval = setInterval(checkAuth, 2000); // Zwiększono do 2 sekund

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
