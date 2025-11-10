import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RequirePermission from '../components/RequirePermission';
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
        <RequirePermission permission="view_investor_dashboard" navigation={navigation}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
                    <View style={styles.topBar}>
                        <View style={styles.topBarRight}>
                            {role === 'entrepreneur' ? (
                                <TouchableOpacity onPress={() => navigation.navigate('EntrepreneurDashboard', { addCampaign: true })} style={styles.iconButton}>
                                    <Ionicons name="add-circle-outline" size={Math.min(28, screenWidth * 0.07)} color="#388e3c" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={() => navigation.navigate('InvestorFeed')} style={styles.iconButton}>
                                    <Ionicons name="search" size={Math.min(24, screenWidth * 0.06)} color="#388e3c" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <View style={styles.content}>
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
                                    <Text style={{ fontSize: Math.min(14, screenWidth * 0.035) }}>Kwota: {item.amount} PLN</Text>
                                    <Text style={{ fontSize: Math.min(14, screenWidth * 0.035) }}>Status: {item.status}</Text>
                                    <Text style={{ fontSize: Math.min(12, screenWidth * 0.03) }}>Data: {new Date(item.created_at).toLocaleString()}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 10, fontSize: Math.min(14, screenWidth * 0.035) }}>Brak inwestycji</Text>}
                            scrollEnabled={false}
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
                </ScrollView>
            </SafeAreaView>
        </RequirePermission>
    );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Math.min(20, screenWidth * 0.05), // Responsywny padding
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Math.min(16, screenWidth * 0.04),
        paddingVertical: Math.min(12, screenHeight * 0.015),
        backgroundColor: '#e6f7ee',
        borderBottomWidth: 1,
        borderBottomColor: '#d0e6db',
    },
    logo: {
        fontSize: Math.min(22, screenWidth * 0.06),
        fontWeight: 'bold',
        color: '#388e3c',
        letterSpacing: 1,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: Math.min(12, screenWidth * 0.03),
    },
    iconButton: {
        padding: Math.min(8, screenWidth * 0.02),
        borderRadius: Math.min(20, screenWidth * 0.05),
        backgroundColor: '#fff',
        elevation: 2,
    },
    statsBox: {
        backgroundColor: '#e6f7ee',
        borderRadius: Math.min(10, screenWidth * 0.025),
        padding: Math.min(16, screenWidth * 0.04),
        marginBottom: Math.min(20, screenWidth * 0.05),
    },
    statLabel: {
        fontSize: Math.min(16, screenWidth * 0.04),
        marginBottom: 4,
    },
    statValue: {
        fontWeight: 'bold',
        color: '#388e3c',
        fontSize: Math.min(18, screenWidth * 0.045),
    },
    sectionTitle: {
        fontSize: Math.min(18, screenWidth * 0.045),
        fontWeight: 'bold',
        marginBottom: Math.min(10, screenWidth * 0.025),
    },
    item: {
        backgroundColor: '#f4f4f4',
        borderRadius: Math.min(10, screenWidth * 0.025),
        padding: Math.min(16, screenWidth * 0.04),
        marginBottom: Math.min(14, screenWidth * 0.035),
    },
    campaign: {
        fontSize: Math.min(16, screenWidth * 0.04),
        fontWeight: 'bold',
        marginBottom: 4,
    },
    buttonsRow: {
        flexDirection: screenWidth < 400 ? 'column' : 'row', // Responsywna zmiana układu
        justifyContent: 'space-between',
        marginTop: Math.min(20, screenWidth * 0.05),
        gap: screenWidth < 400 ? Math.min(10, screenWidth * 0.025) : 0,
    },
    button: {
        backgroundColor: '#4caf50',
        borderRadius: Math.min(8, screenWidth * 0.02),
        padding: Math.min(12, screenWidth * 0.03),
        flex: screenWidth < 400 ? 0 : 1,
        marginHorizontal: screenWidth < 400 ? 0 : Math.min(4, screenWidth * 0.01),
        marginBottom: screenWidth < 400 ? Math.min(8, screenWidth * 0.02) : 0,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: Math.min(14, screenWidth * 0.035),
    },
});
