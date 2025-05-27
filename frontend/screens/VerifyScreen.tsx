import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import API from '../utils/api';

// Dodaj typ do propsów nawigacji

type Props = NativeStackScreenProps<RootStackParamList, 'Verify'>;

export default function VerifyScreen({ navigation, route }: Props) {
    const [code, setCode] = useState('');
    const [email, setEmail] = useState(route.params?.email || '');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0); // sekundy
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleVerify = async () => {
        setLoading(true);
        try {
            await API.post('/auth/verify', {
                email,
                code,
            });
            Alert.alert('Weryfikacja udana', 'Możesz się teraz zalogować.');
            navigation.replace('Login');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Błąd weryfikacji', error?.response?.data?.detail || 'Coś poszło nie tak.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            await API.get(`/auth/resend-verification-code?email=${encodeURIComponent(email)}`);
            Alert.alert('Kod wysłany', 'Nowy kod weryfikacyjny został wysłany na Twój email.');
            setCooldown(90); // 1,5 minuty
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Błąd', error?.response?.data?.detail || 'Nie udało się wysłać kodu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>Weryfikacja konta</Text> */}
            <Text style={styles.label}>Podaj kod weryfikacyjny wysłany na email</Text>
            <TextInput
                placeholder="Kod weryfikacyjny"
                value={code}
                onChangeText={setCode}
                style={styles.input}
                keyboardType="numeric"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
            />
            {cooldown > 0 && (
                <Text style={styles.cooldown}>Możesz wysłać kod ponownie za {cooldown}s</Text>
            )}
            <Button title={loading ? 'Weryfikuję...' : 'Zweryfikuj'} onPress={handleVerify} disabled={loading} />
            <Button title="Wyślij ponownie kod" onPress={handleResend} disabled={loading || cooldown > 0 || !email} />
            <Button title="Wróć do logowania" onPress={() => navigation.replace('Login')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10, borderRadius: 6 },
    cooldown: { color: '#888', textAlign: 'center', marginBottom: 10 },
});
