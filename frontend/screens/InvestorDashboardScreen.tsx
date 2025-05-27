import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import API from '../utils/api';

export default function InvestorDashboardScreen({ navigation, route }: any) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [recentInvestments, setRecentInvestments] = useState<any[]>([]);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');
                // Statystyki inwestora (liczba inwestycji, suma, itp.)
                const statsRes = await API.get('/investments/stats', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(statsRes.data);
                // Ostatnie inwestycje
                const invRes = await API.get('/investments/history?limit=3', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRecentInvestments(invRes.data);
            } catch (e) {
                // fallback
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        AsyncStorage.getItem('userRole').then(setRole);
    }, []);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4caf50" />;

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.topBar}>
                <View style={styles.topBarRight}>
                    {role === 'entrepreneur' ? (
                        <TouchableOpacity onPress={() => navigation.navigate('EntrepreneurDashboard', { addCampaign: true })} style={styles.iconButton}>
                            <Ionicons name="add-circle-outline" size={28} color="#388e3c" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => navigation.navigate('InvestorFeed')} style={styles.iconButton}>
                            <Ionicons name="search" size={24} color="#388e3c" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View style={styles.container}>
                <View style={styles.statsBox}>
                    <Text style={styles.statLabel}>Liczba inwestycji: <Text style={styles.statValue}>{stats.count ?? '-'}</Text></Text>
                    <Text style={styles.statLabel}>Zainwestowana kwota: <Text style={styles.statValue}>{stats.total_amount ?? '-'} PLN</Text></Text>
                </View>
                <Text style={styles.sectionTitle}>Ostatnie inwestycje</Text>
                <FlatList
                    data={recentInvestments}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('InvestmentDetails', { investmentId: item.id })}>
                            <Text style={styles.campaign}>{item.campaign_title || 'Brak kampanii'}</Text>
                            <Text>Kwota: {item.amount} PLN</Text>
                            <Text>Status: {item.status}</Text>
                            <Text>Data: {new Date(item.created_at).toLocaleString()}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 10 }}>Brak inwestycji</Text>}
                />
                <View style={styles.buttonsRow}>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('InvestorHistory')}>
                        <Text style={styles.buttonText}>Historia inwestycji</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('InvestorTransactions')}>
                        <Text style={styles.buttonText}>Transakcje</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('InvestorFeed')}>
                        <Text style={styles.buttonText}>Feed</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#e6f7ee',
        borderBottomWidth: 1,
        borderBottomColor: '#d0e6db',
        marginTop: 0,
    },
    logo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#388e3c',
        letterSpacing: 1,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    iconButton: {
        marginLeft: 12,
        padding: 6,
        borderRadius: 20,
        backgroundColor: '#fff',
        elevation: 2,
    },
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    statsBox: { backgroundColor: '#e6f7ee', borderRadius: 10, padding: 16, marginBottom: 20 },
    statLabel: { fontSize: 16, marginBottom: 4 },
    statValue: { fontWeight: 'bold', color: '#388e3c' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    item: { backgroundColor: '#f4f4f4', borderRadius: 10, padding: 16, marginBottom: 14 },
    campaign: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    button: { backgroundColor: '#4caf50', borderRadius: 8, padding: 12, flex: 1, marginHorizontal: 4 },
    buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
