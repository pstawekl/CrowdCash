import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../utils/auth';
import { hasPermissionAsync } from '../utils/permissions';

interface Props {
    permission: string;
    children: ReactNode;
}

export default function RequirePermission({ permission, children }: Props) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [hasPerm, setHasPerm] = useState<boolean | null>(null);

    useEffect(() => {
        // Najpierw sprawdź czy użytkownik jest zalogowany
        if (!isAuthenticated) {
            navigate({ to: '/login' });
            return;
        }

        // Potem asynchronicznie sprawdź czy ma wymagane uprawnienia
        hasPermissionAsync(permission).then(permResult => {
            // Jeśli permissions nie są dostępne (pusta tablica), zakładamy że użytkownik ma dostęp
            // To pozwala na fallback gdy permissions nie są jeszcze załadowane
            setHasPerm(permResult || true);
        });
    }, [isAuthenticated, permission, navigate]);

    // Jeśli nie jest zalogowany, pokaż loading
    if (!isAuthenticated) {
        return <div className="text-center mt-8">Ładowanie...</div>;
    }

    // Jeśli permissions się ładują, pokaż loading
    if (hasPerm === null) {
        return <div className="text-center mt-8">Sprawdzanie uprawnień...</div>;
    }

    // Jeśli nie ma uprawnień, pokaż komunikat
    if (!hasPerm) {
        return <div className="text-red-600 text-center mt-8">Brak uprawnień do wyświetlenia tej strony.</div>;
    }

    return <>{children}</>;
}
