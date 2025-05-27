import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Loader from '../components/Loader';
import { RootStackParamList } from '../navigation/AppNavigator';
import API from '../utils/api';

type Props = NativeStackScreenProps<RootStackParamList, 'InvestmentDetails'>;

export default function InvestmentDetailsScreen({ route, navigation }: Props) {
    const { investmentId, campaignId } = route.params;
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [investing, setInvesting] = useState(false);
    const [campaign, setCampaign] = useState<any>(null);
    const [investments, setInvestments] = useState<any[]>([]);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');
                if (investmentId) {
                    // Pobierz szczegóły inwestycji
                    const res = await API.get(`/investments/${investmentId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setDetails(res.data || null);
                    // Pobierz szczegóły kampanii
                    let campRes = { data: null };
                    try {
                        campRes = await API.get(`/campaigns/${res.data?.campaign_id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    } catch (e) { campRes = { data: null }; }
                    setCampaign(campRes.data || null);
                    // Pobierz inwestycje w tę kampanię
                    let invRes = { data: [] };
                    try {
                        invRes = await API.get(`/investments/campaign/${res.data?.campaign_id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    } catch (e) { invRes = { data: [] }; }
                    setInvestments(Array.isArray(invRes.data) ? invRes.data : []);
                } else if (campaignId) {
                    // Wejście po campaignId (np. z feedu)
                    let campRes = { data: null };
                    try {
                        campRes = await API.get(`/campaigns/${campaignId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    } catch (e) { campRes = { data: null }; }
                    setCampaign(campRes.data || null);
                    setDetails(null); // Brak szczegółów inwestycji
                    // Pobierz inwestycje w tę kampanię
                    let invRes = { data: [] };
                    try {
                        invRes = await API.get(`/investments/campaign/${campaignId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    } catch (e) { invRes = { data: [] }; }
                    setInvestments(Array.isArray(invRes.data) ? invRes.data : []);
                }
            } catch (e: any) {
                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać szczegółów');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [investmentId, campaignId]);

    // Pobierz userId z tokena lub AsyncStorage (przyjmujemy, że userId jest w AsyncStorage)
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => {
        AsyncStorage.getItem('userId').then(setUserId);
    }, []);

    // Sprawdź, czy użytkownik już inwestował w tę kampanię
    const hasInvested = userId && investments.some(inv => inv.investor_id === userId);

    const handleInvest = async () => {
        setInvesting(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            const res = await API.post('/investments/', {
                campaign_id: campaign.id,
                amount: parseFloat(amount),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Po utworzeniu inwestycji zainicjuj płatność TPay
            const tpayRes = await API.post('/transactions/initiate-tpay', {
                investment_id: res.data.id
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPaymentUrl(tpayRes.data.payment_url);
            Alert.alert('Sukces', 'Sfinalizuj inwestycje! Przejdź do płatności.');
            setAmount('');
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się zainwestować');
        } finally {
            setInvesting(false);
        }
    };

    if (loading) return <Loader />;
    if (!campaign) return <Text style={{ textAlign: 'center', marginTop: 30 }}>Brak szczegółów kampanii</Text>;

    return (
        <>
            <View style={styles.topBar}>
                <Ionicons name="arrow-back" size={28} color="#222" onPress={() => navigation.goBack()} style={{ marginRight: 8 }} />
            </View>
            <ScrollView style={styles.container}>
                {/* <Text style={styles.title}>{campaign.title || 'Brak tytułu'}</Text> */}
                <Text style={styles.label}>Opis:</Text>
                <Text style={styles.value}>{campaign.description || '-'}</Text>
                <Text style={styles.label}>Cel: <Text style={styles.value}>{campaign.goal_amount ?? '-'} PLN</Text></Text>
                <Text style={styles.label}>Zebrano: <Text style={styles.value}>{campaign.current_amount ?? '-'} PLN</Text></Text>
                <Text style={styles.label}>Status: <Text style={styles.value}>{campaign.status || '-'}</Text></Text>
                <Text style={styles.label}>Deadline: <Text style={styles.value}>{campaign.deadline ? new Date(campaign.deadline).toLocaleString() : '-'}</Text></Text>
                <Text style={styles.label}>Przedsiębiorca:
                    <Text style={[styles.value, { color: '#1976d2' }]} onPress={() => campaign.entrepreneur_id && navigation.navigate('EntrepreneurProfile', { entrepreneurId: campaign.entrepreneur_id })}>
                        {campaign.entrepreneur_id || '-'}
                    </Text>
                </Text>
                {/* Formularz inwestycji tylko jeśli nie ma investmentId i kampania aktywna */}
                <View style={styles.investBox}>
                    <Text style={styles.label}>Zainwestuj w tę kampanię:</Text>
                    <TextInput
                        placeholder="Kwota (PLN)"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Button
                        title={hasInvested ? (investing ? 'Inwestuję ponownie...' : 'Zainwestuj ponownie') : (investing ? 'Inwestuję...' : 'Zainwestuj')}
                        onPress={handleInvest}
                        disabled={investing || !amount}
                    />
                </View>
                {/* Lista inwestycji w kampanii */}
                <Text style={styles.label}>Inwestycje w tej kampanii:</Text>
                {investments.length === 0 ? (
                    <Text style={{ color: '#888', marginBottom: 20 }}>Brak inwestycji</Text>
                ) : (
                    investments.map(inv => {
                        if (!inv || typeof inv !== 'object') return null;
                        const amount = inv.amount ?? '-';
                        const status = inv.status || '-';
                        let date = '-';
                        try { date = inv.created_at ? new Date(inv.created_at).toLocaleString() : '-'; } catch (e) { date = '-'; }
                        return (
                            <View key={inv.id} style={styles.investmentItem}>
                                <Text>Kwota: {amount} PLN</Text>
                                <Text>Status: {status}</Text>
                                <Text>Data: {date}</Text>
                            </View>
                        );
                    })
                )}
                {paymentUrl && (
                    <View style={{ marginVertical: 20 }}>
                        <Text style={{ color: '#4caf50', fontWeight: 'bold', marginBottom: 8 }}>Link do płatności:</Text>
                        <Text selectable style={{ color: 'blue' }}>{paymentUrl}</Text>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, marginTop: 10, fontWeight: 'bold' },
    value: { fontWeight: 'normal', color: '#333' },
    investBox: { marginVertical: 20, padding: 16, backgroundColor: '#f4f4f4', borderRadius: 10 },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 6 },
    investmentItem: { backgroundColor: '#e6e6e6', borderRadius: 8, padding: 10, marginBottom: 10 },
    topBar: {
        top: 0,
        left: 0,
        right: 0,
        marginTop: 0,
        zIndex: 10,
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});
