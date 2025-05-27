import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Loader from '../components/Loader';
import { RootStackParamList } from '../navigation/AppNavigator';
import API from '../utils/api';

export type InvestmentHistory = {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    campaign_id?: string;
    campaign_title?: string;
    campaign_status?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Investments'>;

export default function InvestmentsScreen({ navigation }: Props) {
    const [investments, setInvestments] = useState<InvestmentHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvestments = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');
                const res = await API.get('/investments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Odebrana lista inwestycji:', res.data);
                setInvestments(Array.isArray(res.data) ? res.data : []);
            } catch (e: any) {
                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać inwestycji');
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
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => item.id && navigation.navigate('InvestmentDetails', { investmentId: item.id })}
                        >
                            <Text style={styles.campaign}>{campaign_title}</Text>
                            <Text style={styles.amount}>{amount} PLN</Text>
                            <Text style={styles.status}>Status: {status}</Text>
                            <Text style={styles.date}>{date}</Text>
                        </TouchableOpacity>
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
    amount: { fontSize: 16, color: '#4caf50', marginBottom: 2 },
    status: { fontSize: 14, color: '#888' },
    date: { fontSize: 12, color: '#aaa', marginTop: 2 },
});
