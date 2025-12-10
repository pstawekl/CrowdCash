import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HamburgerButton from '../components/HamburgerButton';
import LogoutIcon from '../components/Icons/LogoutIcon';
import Loader from '../components/Loader';
import SideMenu from '../components/SideMenu';
import EntrepreneurProfileScreen from '../screens/EntrepreneurProfileScreen';
import InvestmentDetailsScreen from '../screens/InvestmentDetailsScreen';
import InvestmentsScreen from '../screens/InvestmentsScreen';
import InvestorTransactionsScreen from '../screens/InvestorTransactionsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyScreen from '../screens/VerifyScreen';
import API from '../utils/api';
import { getUserPermissions } from '../utils/permissions';
import BottomTabNavigator from './BottomTabNavigator';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Verify: { email: string } | undefined;
    Investments: undefined;
    InvestmentDetails: { investmentId?: string; campaignId?: string };
    MainTabs: { screen?: string; params?: any } | undefined;
    EntrepreneurDashboard: undefined;
    InvestorDashboard: undefined;
    InvestorFeed: undefined;
    EntrepreneurProfile: { entrepreneurId: string };
    InvestorHistory: undefined;
    InvestorTransactions: undefined;
    Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const [role, setRole] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const [appMenuVisible, setAppMenuVisible] = useState(false);
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const navigationRef = useRef<any>(null);
    const previousRoleRef = useRef<string | null>(null);
    const previousVerifiedSessionRef = useRef<typeof verifiedSession>(null);

    // Stan do przechowywania informacji o zweryfikowanej sesji
    const [verifiedSession, setVerifiedSession] = useState<{
        userRole: string | null;
        needsVerification: boolean;
        email?: string;
    } | null>(null);

    // Listener na zmiany AsyncStorage (dla odświeżania roli po zalogowaniu)
    useEffect(() => {
        // Zaktualizuj ref przy zmianie roli
        previousRoleRef.current = role;
    }, [role]);

    useEffect(() => {
        const refreshRoleFromStorage = async () => {
            try {
                const storedRole = await AsyncStorage.getItem('userRole');
                const token = await AsyncStorage.getItem('authToken');
                const currentRole = previousRoleRef.current;
                
                // Jeśli rola się zmieniła, zaktualizuj stan
                if (storedRole && token && storedRole !== currentRole) {
                    console.log('AppNavigator - odświeżanie roli z AsyncStorage:', storedRole, 'stara rola:', currentRole);
                    setRole(storedRole);
                    setVerifiedSession(prev => {
                        // Aktualizuj tylko jeśli rola się rzeczywiście zmieniła
                        if (prev?.userRole !== storedRole) {
                            return prev ? { ...prev, userRole: storedRole } : { userRole: storedRole, needsVerification: false };
                        }
                        return prev;
                    });
                }
                // Jeśli rola została usunięta (wylogowanie), zaktualizuj stan
                else if (!storedRole && !token && currentRole) {
                    console.log('AppNavigator - rola została usunięta (wylogowanie)');
                    setRole(null);
                    setVerifiedSession(null);
                }
            } catch (error) {
                console.error('Błąd odświeżania roli:', error);
            }
        };

        // Sprawdź rolę częściej przez pierwsze 30 sekund po załadowaniu (dla szybkiego odświeżenia po zalogowaniu)
        const interval = setInterval(refreshRoleFromStorage, 500);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            // Po 30 sekundach sprawdzaj co 2 sekundy (dla przelogowania)
            const longInterval = setInterval(refreshRoleFromStorage, 2000);
            return () => clearInterval(longInterval);
        }, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Usunięto role z zależności, używamy ref zamiast tego

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Najpierw sprawdź zapisane dane - jeśli są, użyj ich natychmiast (dla hot reload)
                const storedRole = await AsyncStorage.getItem('userRole');
                const storedPerms = await getUserPermissions();
                const token = await AsyncStorage.getItem('authToken');
                
                // Jeśli mamy zapisane dane i token, użyj ich natychmiast (hot reload)
                if (token && storedRole && storedPerms.length > 0) {
                    console.log('Hot reload: używam zapisanych danych sesji', { storedRole, storedPerms: storedPerms.length });
                    setRole(storedRole);
                    setPermissions(storedPerms);
                    setIsLoading(false);
                    // Ustaw verifiedSession SYNCHRONICZNIE - to jest kluczowe!
                    setVerifiedSession({ userRole: storedRole, needsVerification: false });
                    console.log('Hot reload: verifiedSession ustawione, userRole:', storedRole);
                    
                    // W tle sprawdź czy token jest nadal ważny (nie blokuj UI)
                    // Użyj setTimeout aby dać czas na przekierowanie przed weryfikacją
                    setTimeout(async () => {
                        try {
                            const profileRes = await API.get('/auth/me', {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            const { role_id, is_verified } = profileRes.data;
                            const userRole = role_id?.toString() || null;
                            
                            // Zaktualizuj dane jeśli się zmieniły (ale nie resetuj verifiedSession!)
                            if (userRole && userRole !== storedRole) {
                                await AsyncStorage.setItem('userRole', userRole);
                                setRole(userRole);
                                // Aktualizuj verifiedSession jeśli rola się zmieniła
                                setVerifiedSession({ userRole, needsVerification: false });
                            }
                            
                            // Pobierz uprawnienia w tle
                            try {
                                const permRes = await API.get('/auth/permissions', {
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                const permissionNames = (permRes.data as Array<{ id: number; name: string }>).map((p) => p.name);
                                await AsyncStorage.setItem('userPermissions', JSON.stringify(permissionNames));
                                setPermissions(permissionNames);
                            } catch (permError) {
                                // Ignoruj błędy uprawnień - użyj zapisanych
                            }
                        } catch (apiError: any) {
                            // Ignoruj błędy API przy hot reload - używamy zapisanych danych
                            console.log('Błąd weryfikacji tokena przy hot reload (ignorowany):', apiError?.response?.status || 'no response');
                            // NIE resetuj verifiedSession przy błędzie!
                        }
                    }, 500); // Daj czas na przekierowanie
                    return;
                }
                
                // Jeśli nie ma tokena, sprawdź czy to pierwsze uruchomienie czy hot reload
                if (!token) {
                    // Brak tokena - pokaż ekran logowania tylko jeśli nie ma zapisanych danych
                    if (!storedRole) {
                        setIsLoading(false);
                        setVerifiedSession(null);
                    } else {
                        // Hot reload bez tokena ale z zapisanymi danymi - zachowaj sesję
                        console.log('Hot reload: brak tokena ale są zapisane dane, zachowuję sesję');
                        setRole(storedRole);
                        setPermissions(storedPerms);
                        setIsLoading(false);
                        setVerifiedSession({ userRole: storedRole, needsVerification: false });
                    }
                    return;
                }

                // Sprawdź czy token jest nadal ważny przez wywołanie API
                try {
                    const profileRes = await API.get('/auth/me', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    const { role_id, is_verified, email } = profileRes.data;
                    const userRole = role_id?.toString() || null;
                    
                    console.log('AppNavigator - pobrano rolę z API:', userRole, 'role_id:', role_id);
                    
                    // Jeśli konto nie jest zweryfikowane, zapisz informację i przekieruj później
                    if (!is_verified) {
                        setIsLoading(false);
                        setVerifiedSession({ userRole: null, needsVerification: true, email });
                        return;
                    }
                    
                    // Pobierz uprawnienia
                    try {
                        const permRes = await API.get('/auth/permissions', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const permissionNames = (permRes.data as Array<{ id: number; name: string }>).map((p) => p.name);
                        await AsyncStorage.setItem('userPermissions', JSON.stringify(permissionNames));
                        setPermissions(permissionNames);
                    } catch (permError) {
                        console.warn('Nie udało się pobrać uprawnień, używam zapisanych:', permError);
                        if (storedPerms.length > 0) {
                            setPermissions(storedPerms);
                        }
                    }
                    
                    // Zapisz rolę
                    if (userRole) {
                        await AsyncStorage.setItem('userRole', userRole);
                        console.log('AppNavigator - zapisano rolę do AsyncStorage:', userRole);
                    }
                    
                    setRole(userRole);
                    setIsLoading(false);
                    setVerifiedSession({ userRole, needsVerification: false });
                    console.log('AppNavigator - ustawiono role:', userRole, 'verifiedSession.userRole:', userRole);
                } catch (apiError: any) {
                    // Sprawdź czy to rzeczywiście błąd autoryzacji (401) czy błąd sieciowy
                    const status = apiError?.response?.status;
                    
                    // Jeśli mamy zapisane dane, użyj ich zamiast wylogowywać
                    if (storedRole && storedPerms.length > 0) {
                        console.log('Błąd API, używam zapisanych danych sesji. Status:', status || 'no response');
                        setRole(storedRole);
                        setPermissions(storedPerms);
                        setIsLoading(false);
                        setVerifiedSession({ userRole: storedRole, needsVerification: false });
                        return;
                    }
                    
                    // Tylko jeśli NIE MA zapisanych danych i jest 401, wyczyść sesję
                    if (status === 401 && !storedRole) {
                        console.log('Token nieważny (401) i brak zapisanych danych - czyszczenie sesji');
                        await AsyncStorage.multiRemove(['authToken', 'userRole', 'userPermissions']);
                        setIsLoading(false);
                        setVerifiedSession(null);
                    } else {
                        // Błąd sieciowy lub inny - zachowaj sesję jeśli są zapisane dane
                        console.log('Błąd sieciowy lub inny, zachowuję sesję:', status || 'no response');
                        if (storedRole) {
                            setRole(storedRole);
                            setPermissions(storedPerms);
                            setIsLoading(false);
                            setVerifiedSession({ userRole: storedRole, needsVerification: false });
                        } else {
                            // Jeśli nie ma zapisanej roli, pokaż ekran logowania
                            setIsLoading(false);
                            setVerifiedSession(null);
                        }
                    }
                }
            } catch (error) {
                console.error('Błąd sprawdzania sesji:', error);
                // Przy błędzie ogólnym, spróbuj użyć zapisanych danych
                try {
                    const storedRole = await AsyncStorage.getItem('userRole');
                    const storedPerms = await getUserPermissions();
                    if (storedRole && storedPerms.length > 0) {
                        console.log('Błąd ogólny, używam zapisanych danych sesji');
                        setRole(storedRole);
                        setPermissions(storedPerms);
                        setIsLoading(false);
                        setVerifiedSession({ userRole: storedRole, needsVerification: false });
                    } else {
                        setIsLoading(false);
                        setVerifiedSession(null);
                    }
                } catch {
                    setIsLoading(false);
                    setVerifiedSession(null);
                }
            }
        };
        
        // Sprawdź sesję od razu (nie czekaj na nawigację)
        checkSession();

        // Dodaj listener na focus, by odświeżać rolę po zmianie ekranu (np. po przelogowaniu)
        const unsubscribe = navigationRef.current?.addListener?.('state', async () => {
            const userRole = await AsyncStorage.getItem('userRole');
            const token = await AsyncStorage.getItem('authToken');
            
            // Jeśli rola się zmieniła, zaktualizuj stan
            if (userRole && token && userRole !== role) {
                console.log('AppNavigator - listener state: odświeżanie roli:', userRole, 'stara rola:', role);
                setRole(userRole);
                setVerifiedSession(prev => prev ? { ...prev, userRole } : { userRole, needsVerification: false });
            }
            // Jeśli rola została usunięta (wylogowanie), zaktualizuj stan
            else if (!userRole && !token && role) {
                console.log('AppNavigator - listener state: rola usunięta (wylogowanie)');
                setRole(null);
                setVerifiedSession(null);
            }
            
            const perms = await getUserPermissions();
            setPermissions(perms);
        });
        
        // Dodaj listener na focus ekranu MainTabs, aby odświeżyć rolę po nawigacji z LoginScreen
        const focusUnsubscribe = navigationRef.current?.addListener?.('focus', async () => {
            const userRole = await AsyncStorage.getItem('userRole');
            const token = await AsyncStorage.getItem('authToken');
            
            if (userRole && token && userRole !== role) {
                console.log('AppNavigator - listener focus: odświeżanie roli:', userRole, 'stara rola:', role);
                setRole(userRole);
                setVerifiedSession(prev => prev ? { ...prev, userRole } : { userRole, needsVerification: false });
            }
        });
        
        return () => {
            if (unsubscribe) unsubscribe();
            if (focusUnsubscribe) focusUnsubscribe();
        };
    }, []);

    // Przekieruj użytkownika gdy nawigacja jest gotowa i mamy zweryfikowaną sesję
    useEffect(() => {
        if (!isNavigationReady || !navigationRef.current) {
            return;
        }

        // Jeśli jeszcze ładujemy, nie przekierowuj
        if (isLoading) {
            return;
        }

        // Sprawdź czy verifiedSession rzeczywiście się zmienił (porównaj wartości, nie referencje)
        const prevSession = previousVerifiedSessionRef.current;
        const sessionChanged = 
            (prevSession?.userRole !== verifiedSession?.userRole) ||
            (prevSession?.needsVerification !== verifiedSession?.needsVerification) ||
            (prevSession === null && verifiedSession !== null) ||
            (prevSession !== null && verifiedSession === null);

        // Jeśli sesja się nie zmieniła i już jesteśmy na właściwym ekranie, nie przekierowuj
        if (!sessionChanged && prevSession?.userRole) {
            const currentRoute = navigationRef.current?.getCurrentRoute?.();
            const isOnCorrectScreen = 
                currentRoute?.name === 'MainTabs' || 
                currentRoute?.name === 'EntrepreneurDashboard' || 
                currentRoute?.name === 'InvestorFeed' ||
                currentRoute?.name === 'Notifications' ||
                currentRoute?.name === 'EntrepreneurProfile' ||
                currentRoute?.name === 'InvestorDashboard' ||
                currentRoute?.name === 'InvestorHistory' ||
                currentRoute?.name === 'InvestmentDetails' ||
                currentRoute?.name === 'Investments' ||
                currentRoute?.name === 'InvestorTransactions' ||
                currentRoute?.name === 'Login' ||
                currentRoute?.name === 'Verify';
            
            if (isOnCorrectScreen) {
                return; // Nie przekierowuj jeśli już jesteśmy na właściwym ekranie
            }
        }

        // Zaktualizuj ref
        previousVerifiedSessionRef.current = verifiedSession;

        console.log('Navigation effect:', { 
            verifiedSession, 
            isLoading, 
            isNavigationReady,
            currentRoute: navigationRef.current?.getCurrentRoute?.()?.name,
            sessionChanged
        });

        if (verifiedSession?.needsVerification) {
            // Przekieruj do weryfikacji
            console.log('Przekierowanie do weryfikacji');
            if (verifiedSession.email) {
                AsyncStorage.setItem('pendingVerificationEmail', verifiedSession.email);
            }
            navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Verify', params: { email: verifiedSession.email } }],
            });
            setVerifiedSession(null);
        } else if (verifiedSession?.userRole) {
            // Przekieruj na bottom tabs
            console.log('Przekierowanie do MainTabs, userRole:', verifiedSession.userRole);
            const currentRoute = navigationRef.current?.getCurrentRoute?.();
            // Nie resetuj nawigacji jeśli już jesteśmy na MainTabs lub w jego zagnieżdżonych ekranach (hot reload)
            // Dodatkowo nie resetuj jeśli jesteśmy na ekranach modals/secondary (np. InvestmentDetails)
            if (currentRoute?.name !== 'MainTabs' && 
                currentRoute?.name !== 'EntrepreneurDashboard' && 
                currentRoute?.name !== 'InvestorFeed' &&
                currentRoute?.name !== 'Notifications' &&
                currentRoute?.name !== 'EntrepreneurProfile' &&
                currentRoute?.name !== 'InvestorDashboard' &&
                currentRoute?.name !== 'InvestorHistory' &&
                currentRoute?.name !== 'InvestmentDetails' &&
                currentRoute?.name !== 'Investments' &&
                currentRoute?.name !== 'InvestorTransactions') {
                navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }
            // NIE resetuj verifiedSession - pozwól mu pozostać, aby zapobiec ponownemu przekierowaniu
            // setVerifiedSession(null); // USUNIĘTE - powodowało przekierowanie do logowania
        } else if (verifiedSession === null) {
            // Brak sesji - upewnij się że jesteśmy na ekranie logowania
            // Ale tylko jeśli NIE jesteśmy już w zagnieżdżonych ekranach MainTabs lub ekranach modals/secondary
            const currentRoute = navigationRef.current?.getCurrentRoute?.();
            const isInMainTabs = currentRoute?.name === 'MainTabs' || 
                                 currentRoute?.name === 'EntrepreneurDashboard' || 
                                 currentRoute?.name === 'InvestorFeed' ||
                                 currentRoute?.name === 'Notifications' ||
                                 currentRoute?.name === 'EntrepreneurProfile' ||
                                 currentRoute?.name === 'InvestorDashboard' ||
                                 currentRoute?.name === 'InvestorHistory' ||
                                 currentRoute?.name === 'InvestmentDetails' ||
                                 currentRoute?.name === 'Investments' ||
                                 currentRoute?.name === 'InvestorTransactions';
            
            if (!isInMainTabs && currentRoute?.name !== 'Login') {
                console.log('Brak sesji, przekierowanie do logowania. Current route:', currentRoute?.name);
                navigationRef.current?.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } else if (isInMainTabs) {
                // Jesteśmy w MainTabs ale verifiedSession jest null - sprawdź zapisane dane
                console.log('Jesteśmy w MainTabs ale verifiedSession jest null, sprawdzam zapisane dane');
                AsyncStorage.getItem('userRole').then(storedRole => {
                    getUserPermissions().then(storedPerms => {
                        if (storedRole && storedPerms.length > 0) {
                            console.log('Przywracam sesję z zapisanych danych');
                            setRole(storedRole);
                            setPermissions(storedPerms);
                            setVerifiedSession({ userRole: storedRole, needsVerification: false });
                        }
                    });
                });
            }
        }
    }, [isNavigationReady, verifiedSession, isLoading]);

    // Definicje WSZYSTKICH możliwych opcji menu (nie filtrujemy tu po roli, tylko po uprawnieniach)
    const allMenuOptions = [
        {
            label: 'Panel inwestora',
            screen: 'InvestorDashboard',
            permission: 'view_investor_dashboard',
        },
        {
            label: 'Kampanie',
            screen: 'MainTabs',
            permission: 'view_feed',
            nestedScreen: 'InvestorFeed',
        },
        {
            label: 'Historia inwestycji',
            screen: 'MainTabs',
            permission: 'view_investments',
            nestedScreen: 'InvestorHistory',
        },
        {
            label: 'Historia transakcji',
            screen: 'InvestorTransactions',
            permission: 'view_transactions',
        },
        {
            label: 'Panel przedsiębiorcy',
            screen: 'MainTabs',
            permission: 'view_dashboard',
            nestedScreen: 'EntrepreneurDashboard',
        },
        {
            label: 'Powiadomienia',
            screen: 'MainTabs',
            permission: 'view_notifications',
            nestedScreen: 'Notifications',
        },
        {
            label: 'Mój profil',
            screen: 'MainTabs',
            permission: 'view_profile',
            nestedScreen: 'EntrepreneurProfile',
            params: { entrepreneurId: 'me' as const },
        },
        {
            label: 'Wyloguj',
            screen: 'Login',
            permission: 'logout',
            params: {},
            isLogout: true, // Flaga do oznaczenia opcji wylogowania
        }
    ];

    // Filtrowanie opcji menu po uprawnieniach użytkownika (pobranych z backendu), ale logout zawsze na końcu
    const filteredMenu = [
        ...((permissions.length > 0)
            ? allMenuOptions.filter(opt => !opt.isLogout && permissions.includes(opt.permission))
            : allMenuOptions.filter(opt => !opt.isLogout)),
        allMenuOptions.find(opt => opt.isLogout)!
    ];

    // Jeśli nie ma roli, wyświetl ekran logowania

    if (isLoading) return <Loader />;

    return (
        <>
            <NavigationContainer 
                ref={navigationRef}
                onReady={() => setIsNavigationReady(true)}
            >
                <Stack.Navigator
                    initialRouteName="Login"
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: '#4CAF50',
                        },
                        headerTintColor: '#fff',
                        headerLeft: () => (
                            <HamburgerButton onPress={() => setMenuVisible(true)} />
                        ),
                        headerRight: () => (
                            <Text style={{ color: "#fff", fontWeight: 'bold', fontSize: 16 }}>Crowdoo</Text>
                            // <HeaderDropdownMenu options={role === 'investor' ? investorMenu : role === 'entrepreneur' ? entrepreneurMenu : []} />
                        ),
                    }}
                >
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Rejestracja', headerShown: true }} />
                    <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Weryfikacja', headerShown: true }} />
                    
                    {/* Bottom Tab Navigator jako główny ekran */}
                    <Stack.Screen 
                        name="MainTabs" 
                        options={{ headerShown: false }}
                    >
                        {(props) => {
                            // Użyj roli z verifiedSession jeśli role jest null (dla hot reload)
                            const effectiveRole = role || verifiedSession?.userRole || null;
                            console.log('AppNavigator - przekazywanie roli do BottomTabNavigator:', effectiveRole, 'role:', role, 'verifiedSession?.userRole:', verifiedSession?.userRole);
                            // Użyj key opartego na roli, aby wymusić re-render gdy rola się zmienia
                            return <BottomTabNavigator key={`tabs-${effectiveRole}`} userRole={effectiveRole} onMenuPress={() => setMenuVisible(true)} route={props.route} />;
                        }}
                    </Stack.Screen>
                    
                    {/* Ekrany modals/secondary */}
                    <Stack.Screen name="Investments" component={InvestmentsScreen} options={{ title: 'Inwestycje', headerShown: true }} />
                    <Stack.Screen 
                        name="InvestmentDetails" 
                        component={InvestmentDetailsScreen} 
                        options={{ 
                            title: 'Szczegóły inwestycji', 
                            headerShown: false // Ukryj domyślny header, używamy custom headerFixed
                        }} 
                    />
                    <Stack.Screen name="EntrepreneurProfile" component={EntrepreneurProfileScreen} options={{ title: 'Profil przedsiębiorcy', headerShown: true }} />
                    <Stack.Screen name="InvestorTransactions" component={InvestorTransactionsScreen} options={{ title: 'Historia transakcji', headerShown: true }} />
                </Stack.Navigator>
            </NavigationContainer>
            <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)}>
                <Text style={styles.menuTitle}>Menu</Text>
                {filteredMenu.map(opt => (
                    opt.isLogout ? (
                        <TouchableOpacity key={opt.screen} style={styles.menuItem} onPress={async () => { 
                            await AsyncStorage.multiRemove(['authToken', 'userRole', 'userPermissions']);
                            setRole(null);
                            setPermissions([]);
                            setVerifiedSession(null);
                            setMenuVisible(false);
                            navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] });
                        }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuTextLogout}>Wyloguj</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity key={opt.screen} style={styles.menuItem} onPress={() => { 
                            setMenuVisible(false); 
                            if ((opt as any).nestedScreen) {
                                // Nawigacja do zagnieżdżonego ekranu w bottom tabs
                                navigationRef.current?.navigate('MainTabs', { 
                                    screen: (opt as any).nestedScreen,
                                    params: (opt as any).params 
                                });
                            } else {
                                // Nawigacja do zwykłego ekranu w stack
                                navigationRef.current?.navigate(opt.screen, (opt as any).params);
                            }
                        }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuText}>{opt.label}</Text>
                            </View>
                        </TouchableOpacity>
                    )
                ))}
            </SideMenu>
        </>
    );
}

// W EntrepreneurDashboardScreen należy obsłużyć props.route?.params?.addCampaign

// Style do menu bocznego
const styles = StyleSheet.create({
    menuItem: {
        marginBottom: 2,
        borderRadius: 5,
        paddingVertical: 6,
        paddingHorizontal: 0,
        minHeight: 28,
        justifyContent: 'center',
        width: '95%',
        alignSelf: 'center',
    },
    menuRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        width: '100%',
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    menuText: {
        fontSize: 20,
        marginLeft: 8,
        color: '#222',
        fontWeight: '500' as const,
        flexShrink: 1,
        flexWrap: 'wrap' as const,
        textAlign: 'right',
    },
    menuTextLogout: {
        fontSize: 20,
        marginLeft: 8,
        color: '#d32f2f',
        fontWeight: '500' as const,
        flexShrink: 1,
        flexWrap: 'wrap' as const,
    },
    menuTitle: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        marginBottom: 8,
        color: '#222',
        alignSelf: 'center',
    },
});
