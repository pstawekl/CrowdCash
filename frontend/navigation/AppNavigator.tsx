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
import RegisterScreen from '../screens/RegisterScreen';
import VerifyScreen from '../screens/VerifyScreen';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Verify: { email: string } | undefined;
    Investments: undefined;
    InvestmentDetails: { investmentId?: string; campaignId?: string };
    Pomodoro: undefined;
    EntrepreneurDashboard: undefined;
    InvestorDashboard: undefined;
    InvestorFeed: undefined;
    EntrepreneurProfile: { entrepreneurId: string };
    InvestorHistory: undefined;
    InvestorTransactions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const navigationRef = useRef<any>(null);

    useEffect(() => {
        const checkSession = async () => {
            const token = await AsyncStorage.getItem('authToken');
            const userRole = await AsyncStorage.getItem('userRole');
            setRole(userRole);
            setIsLoading(false);
            // Jeśli token istnieje, przekieruj na odpowiedni dashboard
            if (token && userRole && navigationRef.current) {
                if (userRole === 'investor') {
                    navigationRef.current.reset({ index: 0, routes: [{ name: 'InvestorDashboard' }] });
                } else if (userRole === 'entrepreneur') {
                    navigationRef.current.reset({ index: 0, routes: [{ name: 'EntrepreneurDashboard' }] });
                }
            }
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
                            <Text>CrowdCash</Text>
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
                </Stack.Navigator>
            </NavigationContainer>
            <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)}>
                <Text style={styles.menuTitle}>Menu</Text>
                {role === 'investor' ? (
                    <>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigationRef.current?.navigate('InvestorDashboard'); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuText}>Panel inwestora</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigationRef.current?.navigate('InvestorFeed'); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuText}>Kampanie</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigationRef.current?.navigate('InvestorHistory'); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuText}>Historia inwestycji</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigationRef.current?.navigate('InvestorTransactions'); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuText}>Historia transakcji</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { AsyncStorage.clear(); setMenuVisible(false); navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuTextLogout}>Wyloguj</Text>
                            </View>
                        </TouchableOpacity>
                    </>
                ) : role === 'entrepreneur' ? (
                    <>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigationRef.current?.navigate('EntrepreneurDashboard'); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuText}>Panel przedsiębiorcy</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigationRef.current?.navigate('EntrepreneurProfile', { entrepreneurId: 'me' }); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuText}>Mój profil</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { AsyncStorage.clear(); setMenuVisible(false); navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
                            <View style={styles.menuRow}>
                                <LogoutIcon width="18" height="18" color="#222" />
                                <Text style={styles.menuTextLogout}>Wyloguj</Text>
                            </View>
                        </TouchableOpacity>
                    </>
                ) : null}
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
