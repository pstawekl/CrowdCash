import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Loader from '../components/Loader';
import PaymentWebView from '../components/PaymentWebView';
import API from '../utils/api';

export default function InvestorHistoryScreen() {
    const [investments, setInvestments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [showPaymentWebView, setShowPaymentWebView] = useState(false);
    const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
    const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);

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

    const handleResumePayment = async (transactionId: string) => {
        setLoadingPayment(transactionId);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
                setLoadingPayment(null);
                return;
            }

            console.log('Pobieranie linku płatności dla transaction_id:', transactionId);
            
            const res = await API.get(`/payments/${transactionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Payment link response status:', res.status);
            console.log('Payment link response data:', res.data);
            console.log('Payment link response data type:', typeof res.data);
            console.log('Payment link response keys:', Object.keys(res.data || {}));
            
            // Backend zwraca payment_link, nie payment_url
            // Sprawdź różne możliwe formaty odpowiedzi
            let paymentLink = null;
            
            if (res.data) {
                // Sprawdź bezpośrednio w res.data
                paymentLink = res.data.payment_link || res.data.payment_url;
                
                // Jeśli nie znaleziono, sprawdź czy może być zagnieżdżone
                if (!paymentLink && res.data.data) {
                    paymentLink = res.data.data.payment_link || res.data.data.payment_url;
                }
                
                // Jeśli nadal nie znaleziono, sprawdź czy może być w innym formacie
                if (!paymentLink && typeof res.data === 'string') {
                    try {
                        const parsed = JSON.parse(res.data);
                        paymentLink = parsed.payment_link || parsed.payment_url;
                    } catch (e) {
                        // Nie jest JSON
                    }
                }
            }
            
            console.log('Extracted payment_link:', paymentLink);
            
            if (paymentLink && typeof paymentLink === 'string' && paymentLink.length > 0) {
                console.log('Znaleziono payment_link, otwieram WebView');
                // Zapisz transaction_id do weryfikacji statusu po sukcesie
                setCurrentTransactionId(transactionId);
                setPaymentUrl(paymentLink);
                setShowPaymentWebView(true);
            } else {
                console.error('Brak payment_link w odpowiedzi!');
                console.error('Pełna odpowiedź:', JSON.stringify(res.data, null, 2));
                console.error('Response headers:', res.headers);
                Alert.alert('Błąd', `Nie udało się pobrać linku do płatności. Status: ${res.status}, Odpowiedź: ${JSON.stringify(res.data)}`);
            }
        } catch (e: any) {
            console.error('Błąd pobierania linku do płatności:', e);
            const errorMessage = e?.response?.data?.detail || e?.message || 'Nie udało się pobrać linku do płatności';
            Alert.alert('Błąd', errorMessage);
        } finally {
            setLoadingPayment(null);
        }
    };

    const handlePaymentSuccess = () => {
        Alert.alert('Sukces', 'Płatność została pomyślnie zakończona!');
        // Odśwież listę inwestycji
        const fetchInvestments = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) return;
                const res = await API.get('/investments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setInvestments(Array.isArray(res.data) ? res.data : []);
            } catch (e: any) {
                console.error('Błąd odświeżania inwestycji:', e);
            }
        };
        fetchInvestments();
    };

    const handlePaymentCancel = () => {
        Alert.alert('Anulowano', 'Płatność została anulowana.');
    };

    const handleCloseWebView = () => {
        setShowPaymentWebView(false);
        setPaymentUrl(null);
    };

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
                    const transactionId = item.transaction_id || null;
                    // Pokaż przycisk tylko jeśli inwestycja jest pending I ma transaction_id
                    // (transaction_id jest przypisywany gdy płatność jest tworzona)
                    const isPending = status?.toLowerCase() === 'pending' && transactionId;
                    
                    // Debug log
                    if (status?.toLowerCase() === 'pending') {
                        console.log('Pending investment:', {
                            id: item.id,
                            transaction_id: transactionId,
                            hasTransactionId: !!transactionId
                        });
                    }
                    let date = '-';
                    try { date = item.created_at ? new Date(item.created_at).toLocaleString('pl-PL') : '-'; } catch (e) { date = '-'; }
                    
                    const getStatusColor = (status: string) => {
                        switch (status?.toLowerCase()) {
                            case 'completed':
                                return '#16a34a'; // green
                            case 'pending':
                                return '#eab308'; // yellow
                            case 'refunded':
                                return '#dc2626'; // red
                            default:
                                return '#6b7280'; // gray
                        }
                    };

                    const getStatusLabel = (status: string) => {
                        switch (status?.toLowerCase()) {
                            case 'completed':
                                return 'Zakończona';
                            case 'pending':
                                return 'Oczekująca';
                            case 'refunded':
                                return 'Zwrócona';
                            default:
                                return status || '-';
                        }
                    };
                    
                    return (
                        <View style={styles.item}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.campaign}>{campaign_title}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                                        {getStatusLabel(status)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={styles.label}>Kwota: <Text style={[styles.value, styles.amountValue]}>{amount} PLN</Text></Text>
                                <Text style={styles.label}>Data: <Text style={styles.value}>{date}</Text></Text>
                            </View>

                            {isPending && transactionId && (
                                <TouchableOpacity
                                    style={styles.resumeButton}
                                    onPress={() => {
                                        console.log('Kliknięto "Dokończ płatność" dla transaction_id:', transactionId, 'type:', typeof transactionId);
                                        handleResumePayment(String(transactionId));
                                    }}
                                    disabled={loadingPayment === transactionId}
                                >
                                    {loadingPayment === transactionId ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="payment" size={18} color="#fff" />
                                            <Text style={styles.resumeButtonText}>Dokończ płatność</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>Brak inwestycji</Text>}
            />

            {/* Payment WebView */}
            {paymentUrl && (
                <PaymentWebView
                    visible={showPaymentWebView}
                    paymentUrl={paymentUrl}
                    transactionId={currentTransactionId}
                    onClose={handleCloseWebView}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f9fafb', 
        padding: 16 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        textAlign: 'center' 
    },
    item: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    campaign: { 
        fontSize: 16, 
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    itemContent: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        color: '#6b7280',
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    amountValue: {
        color: '#16a34a',
        fontWeight: '600',
    },
    resumeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    resumeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 16,
        color: '#6b7280',
    },
});
