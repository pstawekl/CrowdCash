import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function AppMenuScreen({ navigation, route }: any) {
    const { theme, toggleTheme } = useTheme();
    const rootNavigation = useNavigation();
    
    const handleLogout = () => {
        Alert.alert(
            'Wylogowanie',
            'Czy na pewno chcesz się wylogować?',
            [
                {
                    text: 'Anuluj',
                    style: 'cancel',
                },
                {
                    text: 'Wyloguj',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.multiRemove(['authToken', 'userRole', 'userPermissions']);
                            // Reset całego stacku nawigacji do ekranu Login
                            rootNavigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                })
                            );
                        } catch (error) {
                            console.error('Error during logout:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleShareApp = async () => {
        try {
            const shareMessage = Platform.select({
                ios: 'Sprawdź aplikację CrowdCash - platformę crowdfundingową!',
                android: 'Sprawdź aplikację CrowdCash - platformę crowdfundingową!',
                default: 'Sprawdź aplikację CrowdCash - platformę crowdfundingową!',
            });

            // TODO: Dodaj link do sklepu App Store / Google Play gdy aplikacja będzie dostępna
            const shareUrl = Platform.select({
                ios: 'https://apps.apple.com/app/crowdcash', // Zastąp rzeczywistym linkiem
                android: 'https://play.google.com/store/apps/details?id=com.pstawekl.crowdcashapp', // Zastąp rzeczywistym linkiem
                default: 'https://crowdcash.app', // Zastąp rzeczywistym linkiem
            });

            const result = await Share.share({
                message: `${shareMessage}\n\n${shareUrl}`,
                title: 'Udostępnij CrowdCash',
                url: shareUrl, // Działa tylko na iOS
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Udostępniono przez konkretną aplikację (iOS)
                    console.log('Udostępniono przez:', result.activityType);
                } else {
                    // Udostępniono (Android)
                    console.log('Aplikacja została udostępniona');
                }
            } else if (result.action === Share.dismissedAction) {
                // Użytkownik anulował udostępnianie
                console.log('Udostępnianie anulowane');
            }
        } catch (error: any) {
            Alert.alert('Błąd', 'Nie udało się udostępnić aplikacji. Spróbuj ponownie.');
            console.error('Błąd udostępniania aplikacji:', error);
        }
    };
    
    const menuOptions = [
        {
            icon: 'dark-mode',
            label: 'Motyw ciemny',
            isToggle: true,
            value: theme.mode === 'dark',
            onPress: toggleTheme,
        },
        {
            icon: 'settings',
            label: 'Ustawienia',
            onPress: () => {
                // Nawiguj do Settings w BottomTabNavigator przez MainTabs
                rootNavigation.navigate('MainTabs', { 
                    screen: 'Settings'
                });
            },
        },
        {
            icon: 'info',
            label: 'O aplikacji',
            onPress: () => {
                rootNavigation.navigate('About');
            },
        },
        {
            icon: 'help',
            label: 'Pomoc',
            onPress: () => {
                // TODO: Navigate to help screen
                console.log('Pomoc');
            },
        },
        {
            icon: 'privacy-tip',
            label: 'Polityka prywatności',
            onPress: () => {
                rootNavigation.navigate('PrivacyPolicy');
            },
        },
        {
            icon: 'description',
            label: 'Warunki użytkowania',
            onPress: () => {
                rootNavigation.navigate('TermsOfService');
            },
        },
        {
            icon: 'feedback',
            label: 'Wyślij opinię',
            onPress: () => {
                // TODO: Open feedback form
                console.log('Wyślij opinię');
            },
        },
        {
            icon: 'share',
            label: 'Udostępnij aplikację',
            onPress: handleShareApp,
        },
        {
            icon: 'rate-review',
            label: 'Oceń aplikację',
            onPress: () => {
                // TODO: Open app store rating
                console.log('Oceń aplikację');
            },
        },
    ];

    return (
        <LinearGradient
            colors={theme.colors.gradient.start as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.menuContainer}>
                    {menuOptions.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
                            onPress={option.isToggle ? undefined : option.onPress}
                            disabled={option.isToggle}
                        >
                            <View style={styles.menuItemContent}>
                                <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary }]}>
                                    <MaterialIcons name={option.icon as any} size={24} color={theme.colors.text} />
                                </View>
                                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{option.label}</Text>
                                {option.isToggle ? (
                                    <Switch
                                        value={option.value}
                                        onValueChange={option.onPress}
                                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                        thumbColor={option.value ? theme.colors.surface : '#f4f3f4'}
                                    />
                                ) : (
                                    <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                    
                    {/* Przycisk wylogowania */}
                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem, { backgroundColor: theme.colors.surface }]}
                        onPress={handleLogout}
                    >
                        <View style={styles.menuItemContent}>
                            <View style={[styles.iconContainer, styles.logoutIconContainer, { backgroundColor: '#fee2e2' }]}>
                                <MaterialIcons name="logout" size={24} color="#dc2626" />
                            </View>
                            <Text style={[styles.menuItemText, styles.logoutText, { color: '#dc2626' }]}>Wyloguj</Text>
                            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.colors.text }]}>CrowdCash</Text>
                    <Text style={[styles.footerVersion, { color: theme.colors.textSecondary }]}>Wersja 1.0.0</Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'transparent',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    menuContainer: {
        marginHorizontal: 16,
        marginTop: 8,
    },
    menuItem: {
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        marginTop: 32,
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    footerVersion: {
        fontSize: 14,
    },
    logoutItem: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
    },
    logoutIconContainer: {
        backgroundColor: '#fee2e2',
    },
    logoutText: {
        color: '#dc2626',
        fontWeight: '600',
    },
});

