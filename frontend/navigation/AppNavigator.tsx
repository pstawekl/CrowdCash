import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HamburgerButton from '../components/HamburgerButton';
import LogoutIcon from '../components/Icons/LogoutIcon';
import Loader from '../components/Loader';
import SideMenu from '../components/SideMenu';
import EntrepreneurDashboardScreen from '../screens/EntrepreneurDashboardScreen';
import EntrepreneurProfileScreen from '../screens/EntrepreneurProfileScreen';
import InvestmentDetailsScreen from '../screens/InvestmentDetailsScreen';
import InvestmentsScreen from '../screens/InvestmentsScreen';
import InvestorDashboardScreen from '../screens/InvestorDashboardScreen';
import InvestorFeedScreen from '../screens/InvestorFeedScreen';
import InvestorHistoryScreen from '../screens/InvestorHistoryScreen';
import InvestorTransactionsScreen from '../screens/InvestorTransactionsScreen';
import LoginScreen from '../screens/LoginScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyScreen from '../screens/VerifyScreen';
import { getUserPermissions } from '../utils/permissions';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Verify: { email: string } | undefined;
    Investments: undefined;
    InvestmentDetails: { investmentId?: string; campaignId?: string };
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
    const navigationRef = useRef<any>(null);

    useEffect(() => {
        const checkSession = async () => {
            const token = await AsyncStorage.getItem('authToken');
            const userRole = await AsyncStorage.getItem('userRole');
            setRole(userRole);
            const perms = await getUserPermissions();
            setPermissions(perms);
            setIsLoading(false);
            // Usunięto automatyczne przekierowanie - LoginScreen sam obsługuje przekierowanie
        };
        checkSession();

        // Dodaj listener na focus, by odświeżać rolę po zmianie ekranu (np. po przelogowaniu)
        const unsubscribe = navigationRef.current?.addListener?.('state', async () => {
            const userRole = await AsyncStorage.getItem('userRole');
            setRole(userRole);
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Definicje WSZYSTKICH możliwych opcji menu (nie filtrujemy tu po roli, tylko po uprawnieniach)
    const allMenuOptions = [
        {
            label: 'Panel inwestora',
            screen: 'InvestorDashboard',
            permission: 'view_investor_dashboard',
        },
        {
            label: 'Kampanie',
            screen: 'InvestorFeed',
            permission: 'view_feed',
        },
        {
            label: 'Historia inwestycji',
            screen: 'InvestorHistory',
            permission: 'view_investments',
        },
        {
            label: 'Historia transakcji',
            screen: 'InvestorTransactions',
            permission: 'view_transactions',
        },
        {
            label: 'Panel przedsiębiorcy',
            screen: 'EntrepreneurDashboard',
            permission: 'view_dashboard',
        },
        {
            label: 'Powiadomienia',
            screen: 'Notifications',
            permission: 'view_notifications',
        },
        {
            label: 'Mój profil',
            screen: 'EntrepreneurProfile',
            permission: 'view_profile',
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
            <NavigationContainer ref={navigationRef}>
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
                            <Text style={{ color: "#fff", fontWeight: 'bold', fontSize: 16 }}>CrowdCash</Text>
                            // <HeaderDropdownMenu options={role === 'investor' ? investorMenu : role === 'entrepreneur' ? entrepreneurMenu : []} />
                        ),
                    }}
                >
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Rejestracja', headerShown: true }} />
                    <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Weryfikacja', headerShown: true }} />
                    <Stack.Screen name="Investments" component={InvestmentsScreen} options={{ title: 'Inwestycje', headerShown: true }} />
                    <Stack.Screen name="InvestmentDetails" component={InvestmentDetailsScreen} options={{ title: 'Szczegóły inwestycji', headerShown: true }} />
                    <Stack.Screen name="EntrepreneurDashboard" component={EntrepreneurDashboardScreen} options={{ title: 'Panel przedsiębiorcy', headerShown: true }} />
                    <Stack.Screen name="InvestorDashboard" component={InvestorDashboardScreen} options={{ title: 'Panel inwestora', headerShown: true }} />
                    <Stack.Screen name="InvestorFeed" component={InvestorFeedScreen} options={{ title: 'Kampanie', headerShown: true }} />
                    <Stack.Screen name="EntrepreneurProfile" component={EntrepreneurProfileScreen} options={{ title: 'Profil przedsiębiorcy', headerShown: true }} />
                    <Stack.Screen name="InvestorHistory" component={InvestorHistoryScreen} options={{ title: 'Historia inwestycji', headerShown: true }} />
                    <Stack.Screen name="InvestorTransactions" component={InvestorTransactionsScreen} options={{ title: 'Historia transakcji', headerShown: true }} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Powiadomienia', headerShown: true }} />
                </Stack.Navigator>
            </NavigationContainer>
            <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)}>
                <Text style={styles.menuTitle}>Menu</Text>
                {filteredMenu.map(opt => (
                    opt.isLogout ? (
                        <TouchableOpacity key={opt.screen} style={styles.menuItem} onPress={() => { AsyncStorage.clear(); setMenuVisible(false); navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuTextLogout}>Wyloguj</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity key={opt.screen} style={styles.menuItem} onPress={() => { setMenuVisible(false); navigationRef.current?.navigate(opt.screen, (opt as any).params); }}>
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
