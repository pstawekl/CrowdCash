import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import AppMenuScreen from '../screens/AppMenuScreen';
import EntrepreneurDashboardScreen from '../screens/EntrepreneurDashboardScreen';
import EntrepreneurProfileScreen from '../screens/EntrepreneurProfileScreen';
import InvestorDashboardScreen from '../screens/InvestorDashboardScreen';
import InvestorFeedScreen from '../screens/InvestorFeedScreen';
import InvestorHistoryScreen from '../screens/InvestorHistoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { UserRoleEnum } from '../utils/roles';

const Tab = createBottomTabNavigator();

interface BottomTabNavigatorProps {
    userRole: string | null;
    navigation?: any;
    route?: any;
    onMenuPress?: () => void;
}

export default function BottomTabNavigator({ userRole, onMenuPress, route }: BottomTabNavigatorProps) {
    const tabNavigation = useNavigation();
    const { theme } = useTheme();
    const [effectiveRole, setEffectiveRole] = useState<string | null>(userRole);
    const [isLoadingRole, setIsLoadingRole] = useState(!userRole);
    
    // Natychmiast zaktualizuj effectiveRole gdy userRole prop się zmienia
    useEffect(() => {
        if (userRole && userRole !== effectiveRole) {
            setEffectiveRole(userRole);
            setIsLoadingRole(false);
        } else if (!userRole && effectiveRole) {
            // userRole prop jest null, ale mamy effectiveRole - sprawdź AsyncStorage
            setIsLoadingRole(true);
        } else if (!userRole && !effectiveRole) {
            // Oba są null - kontynuuj ładowanie
            setIsLoadingRole(true);
        } else if (userRole === effectiveRole) {
            // Role są zgodne - nie ładuj
            setIsLoadingRole(false);
        }
    }, [userRole, effectiveRole]);
    
    // Jeśli userRole jest null, spróbuj odczytać z AsyncStorage
    useEffect(() => {
        const loadRoleFromStorage = async () => {
            try {
                const storedRole = await AsyncStorage.getItem('userRole');
                
                // Użyj userRole jeśli jest dostępna, w przeciwnym razie użyj storedRole
                const roleToUse = userRole || storedRole;
                
                if (roleToUse && roleToUse !== effectiveRole) {
                    setEffectiveRole(roleToUse);
                    setIsLoadingRole(false);
                } else if (!roleToUse && effectiveRole) {
                    // Rola została usunięta
                    setEffectiveRole(null);
                    setIsLoadingRole(false);
                } else if (roleToUse) {
                    setIsLoadingRole(false);
                } else if (!roleToUse) {
                    // Nadal nie mamy roli - kontynuuj ładowanie
                    setIsLoadingRole(true);
                }
            } catch (error) {
                console.error('Błąd odczytu roli z AsyncStorage:', error);
                setIsLoadingRole(false);
            }
        };
        
        // Załaduj od razu
        loadRoleFromStorage();
        
        // Nasłuchuj zmian w AsyncStorage częściej przez pierwsze 30 sekund, potem rzadziej
        const interval = setInterval(loadRoleFromStorage, 500);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            // Po 30 sekundach sprawdzaj co 2 sekundy (dla przelogowania)
            const longInterval = setInterval(loadRoleFromStorage, 2000);
            return () => clearInterval(longInterval);
        }, 30000);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]); // Tylko userRole w dependencies, effectiveRole sprawdzamy wewnątrz
    
    // Obsługa nawigacji z parametrów route (gdy nawigujemy z SideMenu lub innych ekranów)
    React.useEffect(() => {
        if (route?.params?.screen) {
            console.log('BottomTabNavigator: Nawigacja do ekranu z parametrów route:', route.params.screen, route.params.params);
            (tabNavigation as any).navigate(route.params.screen, route.params.params);
        }
    }, [route?.params, tabNavigation]);
    
    const roleNum = effectiveRole ? parseInt(effectiveRole, 10) : 0;
    
    // WAŻNE: Nie renderuj niczego, dopóki nie mamy pewności co do roli
    // To zapobiega renderowaniu layoutu przedsiębiorcy gdy użytkownik jest inwestorem
    if (!effectiveRole || isLoadingRole) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Ładowanie...</Text>
            </View>
        );
    }
    
    // Jeśli rola nie pasuje do żadnej znanej roli, pokaż komunikat błędu
    if (roleNum !== UserRoleEnum.investor && roleNum !== UserRoleEnum.entrepreneur && roleNum !== UserRoleEnum.admin) {
        console.error('BottomTabNavigator - nieznana rola użytkownika! roleNum:', roleNum);
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#d32f2f', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                    Błąd: Nie można określić roli użytkownika.
                </Text>
                <Text style={{ color: '#666', textAlign: 'center' }}>
                    Spróbuj wylogować się i zalogować ponownie.
                </Text>
            </View>
        );
    }

    // Dla inwestora (sprawdzamy najpierw, bo może być problem z kolejnością)
    if (roleNum === UserRoleEnum.investor) {
        return (
            <Tab.Navigator
                key="investor-tabs" // Key wymusza re-render gdy rola się zmienia
                initialRouteName="InvestorFeed"
                screenOptions={{
                    headerShown: true,
                    header: ({ route }) => (
                        <AppHeader 
                            title={route.name === 'InvestorFeed' ? 'Kampanie' : 
                                   route.name === 'InvestorDashboard' ? 'Panel' : 
                                   route.name === 'InvestorHistory' ? 'Historia' : 
                                   route.name === 'Notifications' ? 'Powiadomienia' : 
                                   route.name === 'AppMenu' ? 'Menu aplikacji' : route.name}
                            showBackButton={route.name === 'Settings'}
                        />
                    ),
                    tabBarActiveTintColor: theme.colors.tabBar.active,
                    tabBarInactiveTintColor: theme.colors.tabBar.inactive,
                    tabBarStyle: {
                        backgroundColor: theme.colors.tabBar.background,
                        borderTopWidth: 0.5,
                        borderTopColor: theme.colors.tabBar.border,
                        height: 64, //Platform.OS === 'ios' ? 88 : 88,
                        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                        paddingTop: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                        marginTop: 4,
                    },
                    tabBarIconStyle: {
                        marginTop: 4,
                    },
                }}
            >
                <Tab.Screen
                    name="InvestorFeed"
                    component={InvestorFeedScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="explore" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="InvestorDashboard"
                    component={InvestorDashboardScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="dashboard" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="InvestorHistory"
                    component={InvestorHistoryScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="history" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="notifications" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="AppMenu"
                    component={AppMenuScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="menu" size={size} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
        );
    }

    // Dla przedsiębiorcy/admina
    if (roleNum === UserRoleEnum.entrepreneur || roleNum === UserRoleEnum.admin) {
        return (
            <Tab.Navigator
                key="entrepreneur-tabs" // Key wymusza re-render gdy rola się zmienia
                screenOptions={{
                    headerShown: true,
                    header: ({ route }) => {
                        // Sprawdź czy to profil innego użytkownika (nie własny)
                        const isOtherUserProfile = route.name === 'EntrepreneurProfile' && 
                                                   route.params?.entrepreneurId && 
                                                   route.params?.entrepreneurId !== 'me';
                        return (
                            <AppHeader 
                                title={route.name === 'EntrepreneurDashboard' ? 'Kampanie' : 
                                       route.name === 'Notifications' ? 'Powiadomienia' : 
                                       route.name === 'EntrepreneurProfile' ? 'Profil przedsiębiorcy' : 
                                       route.name === 'AppMenu' ? 'Menu aplikacji' : route.name}
                                showBackButton={isOtherUserProfile}
                            />
                        );
                    },
                    tabBarActiveTintColor: theme.colors.tabBar.active,
                    tabBarInactiveTintColor: theme.colors.tabBar.inactive,
                    tabBarStyle: {
                        backgroundColor: theme.colors.tabBar.background,
                        borderTopWidth: 0.5,
                        borderTopColor: theme.colors.tabBar.border,
                        height: 64, //Platform.OS === 'ios' ? 64 : 64,
                        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                        paddingTop: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                        marginTop: 4,
                    },
                    tabBarIconStyle: {
                        marginTop: 4,
                    },
                }}
            >
                <Tab.Screen
                    name="EntrepreneurDashboard"
                    component={EntrepreneurDashboardScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="campaign" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="notifications" size={size} color={color} />
                        ),
                        tabBarBadge: undefined, // Można dodać badge dla nieprzeczytanych
                    }}
                />
                <Tab.Screen
                    name="EntrepreneurProfile"
                    component={EntrepreneurProfileScreen as any}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="person" size={size} color={color} />
                        ),
                    }}
                    initialParams={{ entrepreneurId: 'me' }}
                />
                <Tab.Screen
                    name="AppMenu"
                    component={AppMenuScreen}
                    options={{
                        tabBarLabel: '',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="menu" size={size} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
        );
    }

    return null;
}

