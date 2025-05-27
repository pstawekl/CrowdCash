import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Loader from '../components/Loader';
import API from '../utils/api';

export default function InvestorHistoryScreen() {
    const [investments, setInvestments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvestments = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                console.log('[DEBUG] InvestorHistoryScreen: token from AsyncStorage:', token);
                if (!token) throw new Error('Brak tokena');
                const res = await API.get('/investments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('[DEBUG] InvestorHistoryScreen: response data:', res.data);
                setInvestments(Array.isArray(res.data) ? res.data : []);
            } catch (e: any) {
                console.log('[DEBUG] InvestorHistoryScreen: error:', e?.response?.data || e);
                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać historii inwestycji');
            } finally {
                setLoading(false);
            }
        };
        fetchInvestments();
    }, []);

    if (loading) return <Loader />;

    return (
        <View style={styles.container}>
            <FlatList
                data={investments}
                keyExtractor={item => (item && item.id ? String(item.id) : Math.random().toString())}
                renderItem={({ item }) => {
                    if (!item || typeof item !== 'object') return null;
                    const campaign_title = item.campaign_title || 'Brak kampanii';
                    const amount = item.amount ?? '-';
                    const status = item.status || '-';
                    let date = '-';
                    try { date = item.created_at ? new Date(item.created_at).toLocaleString() : '-'; } catch (e) { date = '-'; }
                    return (
                        <View style={styles.item}>
                            <Text style={styles.campaign}>{campaign_title}</Text>
                            <Text>Kwota: {amount} PLN</Text>
                            <Text>Status: {status}</Text>
                            <Text>Data: {date}</Text>
                        </View>
                    );
                }}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>Brak inwestycji</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    item: { backgroundColor: '#f4f4f4', borderRadius: 10, padding: 16, marginBottom: 14 },
    campaign: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
});
