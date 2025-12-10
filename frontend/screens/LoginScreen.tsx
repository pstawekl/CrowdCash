import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import API from '../utils/api';
import { updateAuthState } from '../utils/auth';
import { UserRoleEnum } from '../utils/roles';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Proszę wypełnić wszystkie pola');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            // For OAuth2PasswordRequestForm, we need to send as form data
            const formData = new URLSearchParams();
            formData.append('username', email); // OAuth2PasswordRequestForm uses 'username' field
            formData.append('password', password);

            const response = await API.post('/auth/login', formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            // Extract the token
            console.log('Response:', response.data);
            const { access_token: token } = response.data;
            if (token) {
                let parsedToken = token;
                if (token && token.startsWith('{')) {
                    try {
                        const tokenObj = JSON.parse(token);
                        parsedToken = tokenObj?.access_token || token;
                    } catch (e) {
                        // Jeśli nie uda się sparsować, zostaw jak jest
                    }
                }
                await AsyncStorage.setItem('authToken', parsedToken);
                
                // Pobierz profil użytkownika, aby sprawdzić rolę i weryfikację
                const profileRes = await API.get('/auth/me', {
                    headers: { Authorization: `Bearer ${parsedToken}` },
                });
                const { role_id, email: userEmail, is_verified } = profileRes.data;
                await AsyncStorage.setItem('userRole', role_id.toString());
                
                // Pobierz uprawnienia
                type PermissionOut = { id: number; name: string };
                const permRes = await API.get('/auth/permissions', {
                    headers: { Authorization: `Bearer ${parsedToken}` },
                });
                const permissionNames = (permRes.data as PermissionOut[]).map((p) => p.name);
                await AsyncStorage.setItem('userPermissions', JSON.stringify(permissionNames));
                console.log('Zalogowano jako:', role_id, '/ Zweryfikowany:', is_verified);
                console.log('Uprawnienia użytkownika:', permissionNames);
                
                // Powiadom o zaktualizowaniu uprawnień
                const permissionsModule = require('../utils/permissions');
                if (permissionsModule.notifyPermissionsUpdated) {
                    permissionsModule.notifyPermissionsUpdated();
                }

                // Natychmiast zaktualizuj stan autoryzacji
                updateAuthState();
                
                // Poczekaj chwilę, aby upewnić się, że uprawnienia są zapisane przed nawigacją
                // i że callback został zarejestrowany w RequirePermission
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Zweryfikuj, że uprawnienia są zapisane
                const storedPerms = await AsyncStorage.getItem('userPermissions');
                const parsedPerms = storedPerms ? JSON.parse(storedPerms) : [];
                console.log('Zweryfikowane uprawnienia w storage:', parsedPerms);
                console.log('Czy view_dashboard jest w uprawnieniach?', parsedPerms.includes('view_dashboard'));
                
                // Powiadom ponownie o zaktualizowaniu uprawnień (na wypadek gdyby callback nie był jeszcze zarejestrowany)
                if (permissionsModule.notifyPermissionsUpdated) {
                    permissionsModule.notifyPermissionsUpdated();
                }
                
                if (!is_verified) {
                    Alert.alert('Weryfikacja wymagana', 'Twoje konto nie zostało jeszcze zweryfikowane. Sprawdź email.');
                    navigation.replace('Verify', { email: userEmail });
                    return;
                }
                
                if (role_id === UserRoleEnum.entrepreneur) {
                    (navigation as any).replace('MainTabs', { screen: 'EntrepreneurDashboard' });
                } else if (role_id === UserRoleEnum.investor) {
                    (navigation as any).replace('MainTabs', { screen: 'InvestorFeed' });
                } else if (role_id === UserRoleEnum.admin) {
                    (navigation as any).replace('MainTabs', { screen: 'EntrepreneurDashboard' }); // lub inny ekran admina
                } else {
                    Alert.alert('Błąd', 'Nieznana rola użytkownika.');
                }
                return;
            }

            navigation.replace('Investments');
        } catch (error: any) {
            console.error(error);
            const errorMessage = error?.response?.data?.detail || 'Nieprawidłowy email lub hasło.';
            setError(errorMessage);
            
            // Sprawdź czy błąd dotyczy niezweryfikowanego konta (403)
            if (error?.response?.status === 403) {
                const errorDetail = error?.response?.data?.detail || '';
                if (errorDetail.toLowerCase().includes('not verified') || errorDetail.toLowerCase().includes('verify')) {
                    navigation.replace('Verify', { email });
                    return;
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#f0fdf4', '#ffffff', '#dcfce7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
            pointerEvents="box-none"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View 
                    style={[styles.container]} 
                    pointerEvents="box-none">
                        {/* Card */}
                        <View pointerEvents="auto">
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>
                                    Witaj z powrotem
                                </Text>
                                <Text style={styles.subtitle}>Zaloguj się do swojego konta</Text>
                            </View>

                            {/* Form */}
                            <View style={styles.form}>
                                {/* Email Input */}
                                <View style={styles.inputContainer} pointerEvents="box-none">
                                    <View style={styles.labelContainer} pointerEvents="none">
                                        <MaterialIcons name="email" size={18} color={theme.colors.textSecondary} style={styles.labelIcon} />
                                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
                                    </View>
                                    <TextInput
                                        placeholder="twoj@email.pl"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            setError('');
                                        }}
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => setEmailFocused(false)}
                                        style={[
                                            styles.input,
                                            emailFocused && styles.inputFocused,
                                            {
                                                borderColor: emailFocused ? theme.colors.primary : theme.colors.border,
                                                color: theme.colors.text,
                                            },
                                        ]}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoComplete="email"
                                        editable={!loading}
                                    />
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputContainer} pointerEvents="box-none">
                                    <View style={styles.labelContainer} pointerEvents="none">
                                        <MaterialIcons name="lock" size={18} color={theme.colors.textSecondary} style={styles.labelIcon} />
                                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Hasło</Text>
                                    </View>
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            setError('');
                                        }}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        style={[
                                            styles.input,
                                            passwordFocused && styles.inputFocused,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderColor: passwordFocused ? theme.colors.primary : theme.colors.border,
                                                color: theme.colors.text,
                                            },
                                        ]}
                                        secureTextEntry
                                        autoComplete="password"
                                        editable={!loading}
                                    />
                                </View>

                                {/* Error Message */}
                                {error ? (
                                    <View style={styles.errorContainer}>
                                        <MaterialIcons name="error-outline" size={18} color="#dc2626" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : null}

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={loading}
                                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                                >
                                    <LinearGradient
                                        colors={loading ? ['#9ca3af', '#6b7280'] : ['#16a34a', '#059669']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.buttonGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <>
                                                <MaterialIcons name="login" size={20} color="#ffffff" style={styles.buttonIcon} />
                                                <Text style={styles.submitButtonText}>Zaloguj się</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* App logo */}
                                <Image source={require('../assets/logo.png')} style={styles.logo} />
                                
                                {/* Register Link */}
                                <View style={styles.registerContainer}>
                                    <Text style={styles.registerText}>
                                        Nie masz konta?{' '}
                                        <Text
                                            style={styles.registerLink}
                                            onPress={() => navigation.replace('Register')}
                                        >
                                            Zarejestruj się
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        minHeight: '100%',
    },
    container: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: 24
    },
    card: {
        borderRadius: 24,
        padding: 32,
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 10 },
        // shadowOpacity: 0.15,
        // shadowRadius: 20,
        elevation: 8,
        // borderWidth: 1,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        marginBottom: 4,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelIcon: {
        marginRight: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 12,
        fontSize: 16,
        zIndex: 1,
    },
    inputFocused: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#dc2626',
        fontSize: 14,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    buttonIcon: {
        marginRight: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    registerContainer: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: '#6b7280',
    },
    registerLink: {
        color: '#16a34a',
        fontWeight: '600',
    },
    logo: {
        width: 80,
        height: 80,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
        resizeMode: 'contain',
    },
});
