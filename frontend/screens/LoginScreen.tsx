import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import API from '../utils/api';
import { updateAuthState } from '../utils/auth';
import { UserRoleEnum } from '../utils/roles';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
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
                if (token && token.startsWith('{')) {
                    try {
                        const tokenObj = JSON.parse(token);
                        const parsedToken: string = tokenObj?.access_token || token;
                    } catch (e) {
                        // Jeśli nie uda się sparsować, zostaw jak jest
                    }
                }
                await AsyncStorage.setItem('authToken', token); // Zapisz tylko access_token jako string
                // Pobierz profil użytkownika, aby sprawdzić rolę i weryfikację
                const profileRes = await API.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const { role_id, email, is_verified } = profileRes.data;
                await AsyncStorage.setItem('userRole', role_id.toString());
                // Pobierz uprawnienia
                type PermissionOut = { id: number; name: string };
                const permRes = await API.get('/auth/permissions', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                await AsyncStorage.setItem('userPermissions', JSON.stringify((permRes.data as PermissionOut[]).map((p) => p.name)));
                console.log('Zalogowano jako:', role_id, '/ Zweryfikowany:', is_verified);

                // Natychmiast zaktualizuj stan autoryzacji
                updateAuthState();
                if (!is_verified) {
                    Alert.alert('Weryfikacja wymagana', 'Twoje konto nie zostało jeszcze zweryfikowane. Sprawdź email.');
                    navigation.replace('Verify', { email });
                    return;
                }
                if (role_id === UserRoleEnum.entrepreneur) {
                    navigation.replace('EntrepreneurDashboard');
                } else if (role_id === UserRoleEnum.investor) {
                    navigation.replace('InvestorFeed');
                } else if (role_id === UserRoleEnum.admin) {
                    navigation.replace('EntrepreneurDashboard'); // lub inny ekran admina
                } else {
                    Alert.alert('Błąd', 'Nieznana rola użytkownika.');
                }
                return;
            }

            navigation.replace('Investments');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Błąd logowania', 'Nieprawidłowy email lub hasło.');
        }

    };

    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>Zaloguj się</Text> */}
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Hasło"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />
            <Button title="Zaloguj" onPress={handleLogin} />
            <Button title="Nie masz konta? Zarejestruj się" onPress={() => navigation.replace('Register')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10, borderRadius: 6 },
});
