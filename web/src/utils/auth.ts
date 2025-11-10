// Hook do pobierania stanu autoryzacji i roli użytkownika
import { useEffect, useState } from 'react';

export function useAuth() {
  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    return { isAuthenticated: !!token, role };
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      setAuthState({ isAuthenticated: !!token, role });
    };

    // Sprawdź na starcie
    checkAuth();

    // Nasłuchuj na zmiany w localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'userRole') {
        checkAuth();
      }
    };

    // Nasłuchuj na custom events (dla tego samego okna)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  return authState;
}

export function logout(navigate?: () => void) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPermissions');

    // Trigger custom event dla tego samego okna
    window.dispatchEvent(new CustomEvent('authChange'));

    if (navigate) {
        navigate();
    } else {
        window.location.href = '/login';
    }
}
