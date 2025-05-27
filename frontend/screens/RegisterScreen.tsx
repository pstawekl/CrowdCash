import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { RootStackParamList } from '../navigation/AppNavigator';
import API from '../utils/api';

// Dodaj typ do propsów nawigacji

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('investor');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [items] = useState([
        { label: 'Inwestor', value: 'investor' },
        { label: 'Przedsiębiorca', value: 'entrepreneur' },
    ]);

    const handleRegister = async () => {
        setLoading(true);
        try {
            const response = await API.post('/auth/register', {
                email,
                password,
                role,
            });
            Alert.alert('Rejestracja udana', 'Sprawdź email i potwierdź konto.');
            navigation.replace('Verify', { email });
        } catch (error: any) {
            console.error(error);
            Alert.alert('Błąd rejestracji', error?.response?.data?.detail || 'Coś poszło nie tak.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>Zarejestruj się</Text> */}
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
            <DropDownPicker
                open={open}
                value={role}
                items={items}
                setOpen={setOpen}
                setValue={setRole}
                setItems={() => { }}
                style={styles.input}
                containerStyle={{ marginBottom: 15 }}
                placeholder="Wybierz rolę"
                zIndex={1000}
            />
            <Button title={loading ? 'Rejestruję...' : 'Zarejestruj się'} onPress={handleRegister} disabled={loading} />
            <Button title="Masz konto? Zaloguj się" onPress={() => navigation.replace('Login')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10, borderRadius: 6 },
});
