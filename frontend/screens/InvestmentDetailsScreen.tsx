import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Loader from '../components/Loader';
import PaymentWebView from '../components/PaymentWebView';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import API, { getResourceURL } from '../utils/api';

type Props = NativeStackScreenProps<RootStackParamList, 'InvestmentDetails'>;

export default function InvestmentDetailsScreen({ route, navigation }: Props) {
    const { theme } = useTheme();
    const { investmentId, campaignId } = route.params;
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [investing, setInvesting] = useState(false);
    const [campaign, setCampaign] = useState<any>(null);
    const [investments, setInvestments] = useState<any[]>([]);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [showPaymentWebView, setShowPaymentWebView] = useState(false);
    const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageSliderRef = useRef<FlatList>(null);
    
    const screenWidth = Dimensions.get('window').width;

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

    useEffect(() => {
        AsyncStorage.getItem('userId').then(setUserId);
    }, []);

    // Funkcja do odświeżania danych po płatności
    const refreshData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;
            
            if (campaignId) {
                // Odśwież dane kampanii
                const campRes = await API.get(`/campaigns/${campaignId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCampaign(campRes.data || null);
                
                // Odśwież listę inwestycji
                const invRes = await API.get(`/investments/campaign/${campaignId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setInvestments(Array.isArray(invRes.data) ? invRes.data : []);
            }
            
            if (investmentId) {
                // Odśwież szczegóły inwestycji
                const res = await API.get(`/investments/${investmentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDetails(res.data || null);
            }
        } catch (error) {
            console.error('Błąd odświeżania danych:', error);
        }
    };

    const handlePaymentSuccess = () => {
        Alert.alert('Sukces', 'Płatność została pomyślnie zakończona!');
        refreshData();
        setPaymentUrl(null);
    };

    const handlePaymentCancel = () => {
        Alert.alert('Anulowano', 'Płatność została anulowana.');
        setPaymentUrl(null);
    };

    const handleCloseWebView = () => {
        setShowPaymentWebView(false);
        setPaymentUrl(null);
    };

    // Sprawdź, czy użytkownik już inwestował w tę kampanię
    const hasInvested = userId && investments.some(inv => inv.investor_id === userId);

    const handleInvest = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Błąd', 'Podaj poprawną kwotę');
            return;
        }
        setInvesting(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            
            // Utwórz inwestycję
            const res = await API.post('/investments/', {
                campaign_id: campaign.id,
                amount: parseFloat(amount),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            // Po utworzeniu inwestycji zainicjuj płatność Stripe
            const paymentRes = await API.post('/payments/', {
                investment_id: res.data.id,
                amount: parseFloat(amount),
                currency: 'PLN', // Domyślna waluta
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            console.log('Payment response:', paymentRes.data);
            
            // Zapisz transaction_id do weryfikacji statusu po sukcesie
            const transactionId = paymentRes.data?.id || null;
            setCurrentTransactionId(transactionId);
            
            setPaymentUrl(paymentRes.data.payment_url);
            setShowPaymentWebView(true);
            setAmount('');
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się zainwestować');
        } finally {
            setInvesting(false);
        }
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        if (!amount || amount === '-') return '-';
        if (typeof amount === 'string') {
            const parsed = parseFloat(amount);
            if (isNaN(parsed)) return amount;
            amount = parsed;
        }
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
            case 'draft': return { bg: '#fef9c3', text: '#eab308', border: '#fde047' };
            case 'successful': return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
            case 'closed': return { bg: '#fee2e2', text: '#ef4444', border: '#fecaca' };
            default: return { bg: '#e5e7eb', text: '#6b7280', border: '#d1d5db' };
        }
    };

    if (loading) return <Loader />;
    if (!campaign) return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Brak szczegółów kampanii</Text>
        </View>
    );

    const statusColors = getStatusColor(campaign.status);
    const percent = campaign.goal_amount > 0 
        ? Math.min(Math.round((campaign.current_amount / campaign.goal_amount) * 100), 100)
        : 0;

    const campaignImages = campaign.images && Array.isArray(campaign.images) && campaign.images.length > 0
        ? campaign.images.map((img: any) => getResourceURL(img.image_url))
        : [];

    return (
        <LinearGradient
            colors={theme.colors.gradient.start as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            {/* Fixed Header */}
            <View style={[styles.headerFixed, { 
                backgroundColor: theme.colors.header.background,
                borderBottomColor: theme.colors.header.border 
            }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    Szczegóły kampanii
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Slider */}
                {campaignImages.length > 0 && (
                    <View style={styles.imageSliderContainer}>
                        <FlatList
                            ref={imageSliderRef}
                            data={campaignImages}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, index) => `image-${index}`}
                            onMomentumScrollEnd={(event) => {
                                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                                setCurrentImageIndex(index);
                            }}
                            renderItem={({ item }) => (
                                <View style={[styles.imageSlide, { width: screenWidth }]}>
                                    <Image 
                                        source={{ uri: item }} 
                                        style={styles.heroImage}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}
                            getItemLayout={(data, index) => ({
                                length: screenWidth,
                                offset: screenWidth * index,
                                index,
                            })}
                            nestedScrollEnabled={true}
                            scrollEventThrottle={16}
                            decelerationRate="fast"
                            snapToInterval={screenWidth}
                            snapToAlignment="start"
                        />
                        {/* Image Counter */}
                        {campaignImages.length > 1 && (
                            <View style={styles.imageCounter} pointerEvents="none">
                                <Text style={styles.imageCounterText}>
                                    {currentImageIndex + 1} / {campaignImages.length}
                                </Text>
                            </View>
                        )}
                        {/* Navigation Arrows */}
                        {campaignImages.length > 1 && (
                            <>
                                {currentImageIndex > 0 && (
                                    <TouchableOpacity
                                        style={[styles.imageNavButton, styles.imageNavButtonLeft]}
                                        onPress={() => {
                                            const newIndex = currentImageIndex - 1;
                                            setCurrentImageIndex(newIndex);
                                            imageSliderRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <MaterialIcons name="chevron-left" size={28} color="#fff" />
                                    </TouchableOpacity>
                                )}
                                {currentImageIndex < campaignImages.length - 1 && (
                                    <TouchableOpacity
                                        style={[styles.imageNavButton, styles.imageNavButtonRight]}
                                        onPress={() => {
                                            const newIndex = currentImageIndex + 1;
                                            setCurrentImageIndex(newIndex);
                                            imageSliderRef.current?.scrollToIndex({ index: newIndex, animated: true });
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <MaterialIcons name="chevron-right" size={28} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* Title and Status */}
                <View style={[styles.titleCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.campaignTitle, { color: theme.colors.text }]}>{campaign.title || 'Brak tytułu'}</Text>
                    <View style={[styles.statusBadge, { 
                        backgroundColor: statusColors.bg, 
                        borderColor: statusColors.border 
                    }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {campaign.status === 'active' ? 'Aktywna' : 
                             campaign.status === 'draft' ? 'Szkic' :
                             campaign.status === 'successful' ? 'Sukces' :
                             campaign.status === 'closed' ? 'Zamknięta' : campaign.status}
                        </Text>
                    </View>
                </View>

                {/* Progress Card */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Postęp kampanii</Text>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                            <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: theme.colors.primary }]} />
                        </View>
                        <Text style={[styles.progressText, { color: theme.colors.text }]}>{percent}%</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <MaterialIcons name="attach-money" size={20} color={theme.colors.primary} />
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Zebrano</Text>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatCurrency(campaign.current_amount)}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialIcons name="flag" size={20} color={theme.colors.primary} />
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Cel</Text>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatCurrency(campaign.goal_amount)}</Text>
                        </View>
                    </View>
                </View>

                {/* Description Card */}
                {campaign.description && (
                    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Opis kampanii</Text>
                        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{campaign.description}</Text>
                    </View>
                )}

                {/* Campaign Info Card */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Informacje podstawowe</Text>
                    
                    {campaign.category_rel && (
                        <View style={styles.infoRow}>
                            <MaterialIcons name="category" size={20} color={theme.colors.textSecondary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Kategoria</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{campaign.category_rel.name || '-'}</Text>
                            </View>
                        </View>
                    )}
                    
                    {campaign.region && (
                        <View style={styles.infoRow}>
                            <MaterialIcons name="location-on" size={20} color={theme.colors.textSecondary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Miasto</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{campaign.region}</Text>
                            </View>
                        </View>
                    )}
                    
                    {campaign.deadline && (
                        <View style={styles.infoRow}>
                            <MaterialIcons name="schedule" size={20} color={theme.colors.textSecondary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Termin zakończenia</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                    {new Date(campaign.deadline).toLocaleDateString('pl-PL', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                            </View>
                        </View>
                    )}
                    
                    {campaign.entrepreneur_id && (
                        <TouchableOpacity 
                            style={styles.infoRow}
                            onPress={() => navigation.navigate('EntrepreneurProfile', { entrepreneurId: campaign.entrepreneur_id })}
                        >
                            <MaterialIcons name="person" size={20} color={theme.colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Przedsiębiorca</Text>
                                <Text style={[styles.infoValue, { color: theme.colors.primary }]}>{campaign.entrepreneur_id}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Investment Form Card */}
                {!investmentId && campaign.status === 'active' && (
                    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Zainwestuj w tę kampanię</Text>
                        <View style={styles.investForm}>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="attach-money" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Kwota (PLN)"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    style={[styles.input, { 
                                        backgroundColor: theme.colors.background,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.text
                                    }]}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.investButton, { 
                                    backgroundColor: theme.colors.primary,
                                    opacity: (investing || !amount || parseFloat(amount) <= 0) ? 0.6 : 1
                                }]}
                                onPress={handleInvest}
                                disabled={investing || !amount || parseFloat(amount) <= 0}
                            >
                                {investing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialIcons name="trending-up" size={20} color="#fff" />
                                        <Text style={styles.investButtonText}>
                                            {hasInvested ? 'Zainwestuj ponownie' : 'Zainwestuj'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

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

                {/* Investments List Card */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                        Inwestycje w tej kampanii ({investments.length})
                    </Text>
                    {investments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="inventory" size={48} color={theme.colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Brak inwestycji</Text>
                        </View>
                    ) : (
                        investments.map(inv => {
                            if (!inv || typeof inv !== 'object') return null;
                            const invAmount = inv.amount ?? '-';
                            const status = inv.status || '-';
                            let date = '-';
                            try { 
                                date = inv.created_at ? new Date(inv.created_at).toLocaleDateString('pl-PL', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : '-'; 
                            } catch (e) { date = '-'; }
                            
                            return (
                                <View key={inv.id} style={[styles.investmentItem, { 
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.border 
                                }]}>
                                    <View style={styles.investmentHeader}>
                                        <MaterialIcons name="account-balance-wallet" size={20} color={theme.colors.primary} />
                                        <Text style={[styles.investmentAmount, { color: theme.colors.text }]}>
                                            {formatCurrency(invAmount)}
                                        </Text>
                                    </View>
                                    <View style={styles.investmentDetails}>
                                        <View style={styles.investmentDetailRow}>
                                            <Text style={[styles.investmentLabel, { color: theme.colors.textSecondary }]}>Status:</Text>
                                            <Text style={[styles.investmentValue, { color: theme.colors.text }]}>{status}</Text>
                                        </View>
                                        <View style={styles.investmentDetailRow}>
                                            <MaterialIcons name="schedule" size={16} color={theme.colors.textSecondary} />
                                            <Text style={[styles.investmentDate, { color: theme.colors.textSecondary }]}>{date}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerFixed: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 8,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Dodaj padding na dole dla bottom tab navigatora
    },
    imageSliderContainer: {
        width: '100%',
        height: 250,
        marginBottom: 16,
        position: 'relative',
    },
    imageSlide: {
        height: 250,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    imageCounter: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    imageNavButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -20 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageNavButtonLeft: {
        left: 12,
    },
    imageNavButtonRight: {
        right: 12,
    },
    titleCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    campaignTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    investForm: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    investButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    investButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    paymentCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#16a34a',
        marginBottom: 8,
    },
    paymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 8,
        marginBottom: 8,
    },
    paymentButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    paymentUrl: {
        fontSize: 12,
        color: '#059669',
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 12,
    },
    investmentItem: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    investmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    investmentAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    investmentDetails: {
        marginTop: 8,
        gap: 4,
    },
    investmentDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    investmentLabel: {
        fontSize: 12,
        marginRight: 4,
    },
    investmentValue: {
        fontSize: 12,
        fontWeight: '500',
    },
    investmentDate: {
        fontSize: 12,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 16,
    },
});
