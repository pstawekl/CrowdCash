import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Loader from '../components/Loader';
import { RootStackParamList } from '../navigation/AppNavigator';
import API from '../utils/api';

type Props = NativeStackScreenProps<RootStackParamList, 'EntrepreneurProfile'>;

export default function EntrepreneurProfileScreen({ route }: Props) {
    const { entrepreneurId } = route.params;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');
                // Pobierz profil przedsiębiorcy
                const res = await API.get(`/users/${entrepreneurId}/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Odebrany profil przedsiębiorcy:', res.data);
                setProfile(res.data || null);
            } catch (e: any) {
                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać profilu przedsiębiorcy');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [entrepreneurId]);

    if (loading) return <Loader />;
    if (!profile) return <Text style={{ textAlign: 'center', marginTop: 30 }}>Brak profilu przedsiębiorcy</Text>;

    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>{profile.name || 'Przedsiębiorca'}</Text> */}
            <Text style={styles.label}>Email: <Text style={styles.value}>{profile.email || '-'}</Text></Text>
            <Text style={styles.label}>Bio:</Text>
            <Text style={styles.value}>{profile.bio || 'Brak opisu'}</Text>
            <Text style={styles.label}>Lokalizacja: <Text style={styles.value}>{profile.location || 'Brak'}</Text></Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, marginTop: 10, fontWeight: 'bold' },
    value: { fontWeight: 'normal', color: '#333' },
});
