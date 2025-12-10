import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Loader from '../components/Loader';
import RequirePermission from '../components/RequirePermission';
import { useTheme } from '../contexts/ThemeContext';
import API from '../utils/api';

export default function InvestorDashboardScreen({ navigation, route }: any) {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [recentInvestments, setRecentInvestments] = useState<any[]>([]);
    const [allInvestments, setAllInvestments] = useState<any[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(20))[0];

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
                
                // Wszystkie inwestycje (tylko completed)
                const invRes = await API.get('/investments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                const completedInvestments = Array.isArray(invRes.data) 
                    ? invRes.data.filter((inv: any) => inv.status === 'completed')
                    : [];
                
                setAllInvestments(completedInvestments);
                setRecentInvestments(completedInvestments.slice(0, 3));
            } catch (e) {
                console.error('Błąd pobierania danych:', e);
            } finally {
                setLoading(false);
                // Animacja wejścia
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        };
        fetchData();
        AsyncStorage.getItem('userRole').then(setRole);
    }, []);

    const formatCurrency = (amount: number | string) => {
        if (typeof amount === 'string' || amount === null || amount === undefined) return String(amount || '-');
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) return <Loader />;

    return (
        <RequirePermission permission="view_investor_dashboard" navigation={navigation}>
            <LinearGradient
                colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <Animated.View 
                        style={[
                            styles.animatedContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                    >
                        <ScrollView 
                            style={styles.scrollView} 
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Header
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Panel Inwestora</Text>
                                <Text style={styles.headerSubtitle}>Przegląd Twoich inwestycji i aktywności</Text>
                            </View> */}

                            {/* Statystyki - Nowoczesne karty */}
                            <View style={styles.statsContainer}>
                                {/* Karta: Liczba inwestycji */}
                                <TouchableOpacity 
                                    activeOpacity={0.9}
                                    style={styles.statCard}
                                >
                                    <LinearGradient
                                        colors={['#ecfdf5', '#d1fae5', '#a7f3d0']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.statCardGradient}
                                    >
                                        <View style={styles.statCardContent}>
                                            <View style={styles.statCardHeader}>
                                                <LinearGradient
                                                    colors={['#10b981', '#059669']}
                                                    style={styles.statIconContainer}
                                                >
                                                    <MaterialIcons name="trending-up" size={28} color="#fff" />
                                                </LinearGradient>
                                                <Text style={styles.statCardLabel}>INWESTYCJE</Text>
                                            </View>
                                            <Text style={styles.statCardValue}>
                                                {stats.count || 0}
                                            </Text>
                                            <Text style={styles.statCardDescription}>aktywnych projektów</Text>
                                            <View style={styles.statCardFooter}>
                                                <View style={styles.statIndicator} />
                                                <Text style={styles.statCardFooterText}>Aktywne inwestycje</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Karta: Zainwestowana kwota */}
                                <TouchableOpacity 
                                    activeOpacity={0.9}
                                    style={styles.statCard}
                                >
                                    <LinearGradient
                                        colors={['#eff6ff', '#dbeafe', '#bfdbfe']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.statCardGradient}
                                    >
                                        <View style={styles.statCardContent}>
                                            <View style={styles.statCardHeader}>
                                                <LinearGradient
                                                    colors={['#3b82f6', '#2563eb']}
                                                    style={styles.statIconContainer}
                                                >
                                                    <MaterialIcons name="account-balance" size={28} color="#fff" />
                                                </LinearGradient>
                                                <Text style={[styles.statCardLabel, styles.statCardLabelBlue]}>PORTFOLIO</Text>
                                            </View>
                                            <Text style={[styles.statCardValue, styles.statCardValueBlue]}>
                                                {formatCurrency(stats.total_amount || 0)}
                                            </Text>
                                            <Text style={styles.statCardDescription}>łącznie zainwestowane</Text>
                                            <View style={styles.statCardFooter}>
                                                <View style={[styles.statIndicator, styles.statIndicatorBlue]} />
                                                <Text style={styles.statCardFooterText}>Całkowita wartość</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* Ostatnie inwestycje */}
                            <View style={styles.investmentsSection}>
                                <View style={styles.sectionHeader}>
                                    <View>
                                        <View style={styles.sectionTitleRow}>
                                            <MaterialIcons name="history" size={24} color="#10b981" />
                                            <Text style={styles.sectionTitle}>Ostatnie inwestycje</Text>
                                        </View>
                                        <Text style={styles.sectionSubtitle}>Twoje najnowsze aktywności</Text>
                                    </View>
                                    {allInvestments.length > 3 && (
                                        <TouchableOpacity 
                                            onPress={() => setShowAll(!showAll)}
                                            style={styles.seeAllButton}
                                        >
                                            <Text style={styles.seeAllButtonText}>
                                                {showAll ? 'Pokaż mniej' : 'Zobacz wszystkie'}
                                            </Text>
                                            <MaterialIcons 
                                                name={showAll ? "expand-less" : "expand-more"} 
                                                size={20} 
                                                color="#10b981" 
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {recentInvestments.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyIconContainer}>
                                            <MaterialIcons name="campaign" size={48} color="#10b981" />
                                        </View>
                                        <Text style={styles.emptyTitle}>Nie masz jeszcze żadnych inwestycji</Text>
                                        <Text style={styles.emptySubtitle}>Rozpocznij swoją przygodę z inwestowaniem</Text>
                                        <TouchableOpacity 
                                            style={styles.emptyButton}
                                            onPress={() => navigation.navigate('InvestorFeed')}
                                        >
                                            <LinearGradient
                                                colors={['#10b981', '#059669']}
                                                style={styles.emptyButtonGradient}
                                            >
                                                <MaterialIcons name="explore" size={20} color="#fff" />
                                                <Text style={styles.emptyButtonText}>Przeglądaj kampanie</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.investmentsList}>
                                        {(showAll ? allInvestments : recentInvestments).map((inv, index) => (
                                            <TouchableOpacity
                                                key={inv.id}
                                                activeOpacity={0.8}
                                                style={styles.investmentCard}
                                                onPress={() => navigation.navigate('InvestmentDetails', { campaignId: inv.campaign_id })}
                                            >
                                                <LinearGradient
                                                    colors={['#f9fafb', '#ecfdf5']}
                                                    style={styles.investmentCardGradient}
                                                >
                                                    <View style={styles.investmentCardContent}>
                                                        <View style={styles.investmentCardHeader}>
                                                            <Text style={styles.investmentTitle} numberOfLines={2}>
                                                                {inv.campaign_title || 'Brak kampanii'}
                                                            </Text>
                                                            <View style={styles.investmentStatusBadge}>
                                                                <Text style={styles.investmentStatusText}>
                                                                    {inv.status === 'completed' ? 'Zakończona' : 
                                                                     inv.status === 'pending' ? 'Oczekująca' : 
                                                                     inv.status}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.investmentDetails}>
                                                            <Text style={styles.investmentAmount}>
                                                                {formatCurrency(inv.amount)}
                                                            </Text>
                                                            <Text style={styles.investmentDate}>
                                                                {inv.created_at ? new Date(inv.created_at).toLocaleDateString('pl-PL', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                }) : ''}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.investmentArrow}>
                                                            <MaterialIcons name="arrow-forward" size={20} color="#10b981" />
                                                        </View>
                                                    </View>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
        </RequirePermission>
    );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    animatedContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6b7280',
    },
    statsContainer: {
        flexDirection: 'column',
        paddingHorizontal: 16,
        marginBottom: 24,
        gap: 12,
        marginTop: 24,
    },
    statCard: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 12,
    },
    statCardGradient: {
        borderRadius: 20,
        padding: 20,
    },
    statCardContent: {
        position: 'relative',
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    statCardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statCardLabelBlue: {
        color: '#6b7280',
    },
    statCardValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: 4,
    },
    statCardValueBlue: {
        color: '#3b82f6',
    },
    statCardDescription: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 12,
    },
    statCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    statIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 8,
    },
    statIndicatorBlue: {
        backgroundColor: '#3b82f6',
    },
    statCardFooterText: {
        fontSize: 11,
        color: '#6b7280',
    },
    investmentsSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    investmentsList: {
        gap: 12,
    },
    investmentCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    investmentCardGradient: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    investmentCardContent: {
        position: 'relative',
    },
    investmentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    investmentTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    investmentStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#d1fae5',
    },
    investmentStatusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#065f46',
    },
    investmentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    investmentAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
    },
    investmentDate: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    investmentArrow: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 24,
        textAlign: 'center',
    },
    emptyButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
