import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth, useAuthListener } from '../utils/auth';
import { getUserPermissions } from '../utils/permissions';

interface RequirePermissionProps {
    permission: string;
    children: React.ReactNode;
    navigation?: any;
}

export default function RequirePermission({ permission, children, navigation }: RequirePermissionProps) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [hasPerm, setHasPerm] = useState<boolean | null>(null);
    const [permLoading, setPermLoading] = useState(true);
    const [permissions, setPermissions] = useState<string[]>([]);

    // Nasłuchuj zmian autoryzacji
    useAuthListener();

    useEffect(() => {
        const checkPermission = async () => {
            setPermLoading(true);
            try {
                // Jeśli auth się ładuje, poczekaj
                if (authLoading) {
                    return;
                }

                // Najpierw sprawdź czy użytkownik jest zalogowany
                if (!isAuthenticated) {
                    console.log('RequirePermission: User not authenticated, redirecting to login');
                    if (navigation) {
                        navigation.navigate('Login');
                    }
                    setHasPerm(false);
                    return;
                }

                // Pobierz permissions i zaktualizuj stan
                const perms = await getUserPermissions();
                console.log('RequirePermission: Checking permission', permission, 'against', perms);
                setPermissions(perms);

                // Sprawdź czy użytkownik ma wymagane uprawnienia
                const permissionGranted = perms.includes(permission);
                setHasPerm(permissionGranted);

                if (!permissionGranted) {
                    // Jeśli permissions są puste, poczekaj i sprawdź ponownie (race condition fix)
                    if (perms.length === 0) {
                        console.log('RequirePermission: Permissions empty, waiting and retrying...');
                        setTimeout(async () => {
                            const retryPerms = await getUserPermissions();
                            setPermissions(retryPerms);
                            const retryPermissionGranted = retryPerms.includes(permission);
                            setHasPerm(retryPermissionGranted);

                            if (!retryPermissionGranted) {
                                console.log('RequirePermission: Permission denied after retry, redirecting to login');
                                if (navigation) {
                                    navigation.navigate('Login');
                                }
                            }
                        }, 1000);
                    } else {
                        console.log('RequirePermission: Permission denied, redirecting to login');
                        if (navigation) {
                            navigation.navigate('Login');
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                setHasPerm(false);
            } finally {
                setPermLoading(false);
            }
        };

        checkPermission();
    }, [isAuthenticated, permission, navigation, authLoading]);

    // Sprawdź permissions ponownie gdy się zmienią
    useEffect(() => {
        if (permissions.length > 0 && !permLoading) {
            const permissionGranted = permissions.includes(permission);
            console.log('RequirePermission: Re-checking permission', permission, 'against updated permissions', permissions);
            setHasPerm(permissionGranted);

            if (!permissionGranted) {
                console.log('RequirePermission: Permission denied after update, redirecting to login');
                if (navigation) {
                    navigation.navigate('Login');
                }
            }
        }
    }, [permissions, permission, navigation, permLoading]);

    // Jeśli auth się ładuje, pokaż loading
    if (authLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={{ marginTop: 10, color: '#666' }}>Ładowanie...</Text>
            </View>
        );
    }

    // Jeśli nie jest zalogowany, nie renderuj nic (nawigacja już się odbyła)
    if (!isAuthenticated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={{ marginTop: 10, color: '#666' }}>Sprawdzanie autoryzacji...</Text>
            </View>
        );
    }

    // Jeśli permissions się ładują, pokaż loading
    if (permLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={{ marginTop: 10, color: '#666' }}>Sprawdzanie uprawnień...</Text>
            </View>
        );
    }

    // Jeśli nie ma uprawnień, pokaż komunikat
    if (!hasPerm) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#d32f2f', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                    Brak uprawnień do wyświetlenia tej strony.
                </Text>
                <Text style={{ color: '#666', textAlign: 'center' }}>
                    Skontaktuj się z administratorem, jeśli uważasz, że to błąd.
                </Text>
            </View>
        );
    }

    return <>{children}</>;
}
