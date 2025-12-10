import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import API from '../utils/api';
import { useAuth, useAuthListener } from '../utils/auth';
import { getUserPermissions, setPermissionsUpdateCallback } from '../utils/permissions';

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

    const checkPermission = useCallback(async () => {
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
            let perms = await getUserPermissions();
            console.log('RequirePermission: Checking permission', permission, 'against', perms);
            
            // Jeśli permissions są puste, spróbuj pobrać z API (race condition fix)
            // Może być opóźnienie między zapisaniem uprawnień a ich odczytem
            if (perms.length === 0) {
                console.log('RequirePermission: Permissions empty, trying to fetch from API...');
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    try {
                        // Spróbuj pobrać uprawnienia bezpośrednio z API
                        const permRes = await API.get('/auth/permissions', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const permissionNames = (permRes.data as Array<{ id: number; name: string }>).map((p) => p.name);
                        console.log('RequirePermission: Fetched permissions from API:', permissionNames);
                        if (permissionNames.length > 0) {
                            // Zapisz do AsyncStorage
                            await AsyncStorage.setItem('userPermissions', JSON.stringify(permissionNames));
                            perms = permissionNames;
                            // Powiadom o aktualizacji uprawnień
                            const { notifyPermissionsUpdated } = require('../utils/permissions');
                            if (notifyPermissionsUpdated) {
                                notifyPermissionsUpdated();
                            }
                        }
                    } catch (apiError: any) {
                        console.error('RequirePermission: Error fetching permissions from API:', apiError);
                        // Jeśli API nie działa, spróbuj jeszcze kilka razy z AsyncStorage
                        for (let i = 0; i < 5; i++) {
                            await new Promise(resolve => setTimeout(resolve, 300));
                            perms = await getUserPermissions();
                            console.log(`RequirePermission: Retry ${i + 1}/5 from storage, permissions:`, perms);
                            if (perms.length > 0) {
                                console.log('RequirePermission: Permissions found after retry!');
                                break;
                            }
                        }
                    }
                } else {
                    // Brak tokena - spróbuj jeszcze kilka razy z AsyncStorage
                    for (let i = 0; i < 5; i++) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                        perms = await getUserPermissions();
                        console.log(`RequirePermission: Retry ${i + 1}/5 from storage, permissions:`, perms);
                        if (perms.length > 0) {
                            console.log('RequirePermission: Permissions found after retry!');
                            break;
                        }
                    }
                }
            }
            
            setPermissions(perms);

            // Sprawdź czy użytkownik ma wymagane uprawnienia
            const permissionGranted = perms.includes(permission);
            console.log('RequirePermission: Permission granted?', permissionGranted, 'for', permission);
            setHasPerm(permissionGranted);

            if (!permissionGranted) {
                if (perms.length === 0) {
                    console.log('RequirePermission: Permissions still empty after retries, checking if token exists...');
                    // Sprawdź czy token istnieje - jeśli tak, to może być problem z uprawnieniami
                    const token = await AsyncStorage.getItem('authToken');
                    if (!token) {
                        console.log('RequirePermission: No token found, redirecting to login');
                        if (navigation) {
                            navigation.navigate('Login');
                        }
                    } else {
                        console.log('RequirePermission: Token exists but no permissions - possible backend issue or user has no permissions assigned');
                        // Nie przekierowuj od razu - może być problem z backendem
                        // Pozwól użytkownikowi zobaczyć komunikat o braku uprawnień
                    }
                } else {
                    console.log('RequirePermission: Permission denied - user has permissions but not the required one:', permission);
                    console.log('RequirePermission: User permissions:', perms);
                    // Nie przekierowuj do logowania - użytkownik jest zalogowany, ale nie ma uprawnień
                    // Pozwól zobaczyć komunikat o braku uprawnień
                }
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
            setHasPerm(false);
        } finally {
            setPermLoading(false);
        }
    }, [isAuthenticated, permission, navigation, authLoading]);

    // Nasłuchuj zmian uprawnień
    useEffect(() => {
        const handlePermissionsUpdate = () => {
            console.log('RequirePermission: Permissions updated, re-checking...');
            checkPermission();
        };
        
        setPermissionsUpdateCallback(handlePermissionsUpdate);
        
        return () => {
            setPermissionsUpdateCallback(null);
        };
    }, [checkPermission]);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    // Sprawdź permissions ponownie gdy się zmienią
    useEffect(() => {
        if (permissions.length > 0 && !permLoading) {
            const permissionGranted = permissions.includes(permission);
            console.log('RequirePermission: Re-checking permission', permission, 'against updated permissions', permissions);
            setHasPerm(permissionGranted);

            if (!permissionGranted) {
                console.log('RequirePermission: Permission denied after update - user has permissions but not the required one');
                // Nie przekierowuj - użytkownik jest zalogowany, ale nie ma uprawnień
                // Pozwól zobaczyć komunikat o braku uprawnień
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
