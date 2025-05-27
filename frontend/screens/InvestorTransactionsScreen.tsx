import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Loader from '../components/Loader';
import API from '../utils/api';

export default function InvestorTransactionsScreen() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                console.log('[DEBUG] InvestorTransactionsScreen: token from AsyncStorage:', token);
                if (!token) throw new Error('Brak tokena');
                // Wymuś brak końcowego slasha i wyłącz automatyczne przekierowania
                const res = await API.get('/transactions/', {
                    headers: { Authorization: `Bearer ${token}` },
                    maxRedirects: 0, // axios nie podąża za 307, więc nie zgubi nagłówków
                    validateStatus: status => status < 400 // nie rzucaj na 307
                });
                if (res.status === 307) {
                    console.log('[DEBUG] InvestorTransactionsScreen: 307 redirect, ponawiam na /transactions/ z nagłówkiem');
                    // ręcznie ponów żądanie na /transactions/ z nagłówkiem
                    const redirected = await API.get('/transactions/', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setTransactions(Array.isArray(redirected.data) ? redirected.data : []);
                    console.log('[DEBUG] InvestorTransactionsScreen: response data (redirected):', redirected.data);
                } else {
                    setTransactions(Array.isArray(res.data) ? res.data : []);
                    console.log('[DEBUG] InvestorTransactionsScreen: response data:', res.data);
                }
            } catch (e: any) {
                console.log('[DEBUG] InvestorTransactionsScreen: error:', e?.response?.data || e);
                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać transakcji');
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    if (loading) return <Loader />;

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={item => (item && item.id ? String(item.id) : Math.random().toString())}
                renderItem={({ item }) => {
                    if (!item || typeof item !== 'object') return null;
                    const investment_id = item.investment_id || '-';
                    const amount = item.amount ?? '-';
                    const status = item.status || '-';
                    const type = item.type || '-';
                    let date = '-';
                    try { date = item.created_at ? new Date(item.created_at).toLocaleString() : '-'; } catch (e) { date = '-'; }
                    return (
                        <View style={styles.item}>
                            <Text style={styles.campaign}>Inwestycja: {investment_id}</Text>
                            <Text>Kwota: {amount} PLN</Text>
                            <Text>Status: {status}</Text>
                            <Text>Typ: {type}</Text>
                            <Text>Data: {date}</Text>
                        </View>
                    );
                }}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>Brak transakcji</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    item: { backgroundColor: '#f4f4f4', borderRadius: 10, padding: 16, marginBottom: 14 },
    campaign: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
});
