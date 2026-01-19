import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Loader from '../components/Loader';
import { RootStackParamList } from '../navigation/AppNavigator';
import API, { getResourceURL } from '../utils/api';

type Props = NativeStackScreenProps<RootStackParamList, 'EntrepreneurProfile'>;

const { width: screenWidth } = Dimensions.get('window');

export default function EntrepreneurProfileScreen({ route }: Props) {
    const { entrepreneurId } = route.params;
    const navigation = useNavigation();
    const [profile, setProfile] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');
                
                setIsOwnProfile(entrepreneurId === 'me');
                
                // Jeśli to własny profil, użyj danych z /auth/me
                if (entrepreneurId === 'me') {
                    // Pobierz dane użytkownika
                    try {
                        const userRes = await API.get('/auth/me', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        setUserInfo(userRes.data);
                        
                        // Pobierz profil
                        try {
                            const profileRes = await API.get('/auth/profile', {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setProfile(profileRes.data);
                        } catch (profileError: any) {
                            if (profileError?.response?.status === 404) {
                                // Utwórz pusty profil
                                try {
                                    const createRes = await API.put('/auth/profile', {
                                        bio: '',
                                        location: '',
                                        name: userRes.data.email?.split('@')[0] || 'Użytkownik'
                                    }, {
                                        headers: { Authorization: `Bearer ${token}` },
                                    });
                                    setProfile(createRes.data);
                                } catch {
                                    setProfile({ 
                                        name: userRes.data.email?.split('@')[0] || 'Użytkownik',
                                        bio: '', 
                                        location: '',
                                        interests: [],
                                        profile_picture_url: null
                                    });
                                }
                            }
                        }
                        
                        // Pobierz kampanie użytkownika
                        try {
                            const campaignsRes = await API.get('/campaigns/my', {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
                        } catch {
                            setCampaigns([]);
                        }
                    } catch (e: any) {
                        console.error('Błąd pobierania danych własnego profilu:', e?.response?.status, e?.response?.data);
                        Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać danych profilu');
                    }
                } else {
                    // Pobierz profil innego użytkownika
                    console.log('EntrepreneurProfileScreen: Pobieranie profilu przedsiębiorcy, entrepreneurId:', entrepreneurId);
                    try {
                        const profileRes = await API.get(`/users/${entrepreneurId}/profile`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        console.log('EntrepreneurProfileScreen: Otrzymano profil:', profileRes.data);
                        setProfile(profileRes.data);
                        
                        // Pobierz dane użytkownika (email itp.) dla cudzego profilu
                        try {
                            const userRes = await API.get(`/users/${entrepreneurId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            console.log('EntrepreneurProfileScreen: Otrzymano dane użytkownika:', userRes.data);
                            setUserInfo(userRes.data);
                        } catch (userError: any) {
                            // Jeśli endpoint /users/{id} nie istnieje, spróbuj użyć danych z profilu
                            console.warn('EntrepreneurProfileScreen: Nie udało się pobrać danych użytkownika:', userError?.response?.status);
                            // Użyj danych z profilu jako fallback - sprawdź czy profil zawiera email
                            if (profileRes.data) {
                                console.log('EntrepreneurProfileScreen: Używam danych z profilu jako fallback:', profileRes.data);
                                setUserInfo({ 
                                    email: profileRes.data.email || profileRes.data.user?.email || '',
                                    id: profileRes.data.user_id || entrepreneurId
                                });
                            }
                        }
                        
                        // Pobierz kampanie tego przedsiębiorcy
                        try {
                            const campaignsRes = await API.get(`/users/${entrepreneurId}/campaigns`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
                        } catch {
                            // Jeśli endpoint nie istnieje, spróbuj przez /campaigns z filtrem
                            try {
                                const campaignsRes = await API.get(`/campaigns`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                    params: { entrepreneur_id: entrepreneurId },
                                });
                                setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
                            } catch {
                                setCampaigns([]);
                            }
                        }
                    } catch (e: any) {
                        console.error('Błąd pobierania danych profilu przedsiębiorcy:', e?.response?.status, e?.response?.data);
                        Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać danych profilu');
                    }
                }
            } catch (e: any) {
                console.error('Błąd:', e);
                Alert.alert('Błąd', 'Nie udało się pobrać profilu');
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfileData();
    }, [entrepreneurId]);

    const handleEditProfile = () => {
        // TODO: Przekieruj do ekranu edycji profilu
        Alert.alert('Info', 'Edycja profilu będzie dostępna wkrótce');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return { bg: '#dcfce7', text: '#16a34a', border: '#86efac' };
            case 'draft':
                return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
            case 'successful':
                return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
            case 'closed':
                return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
            default:
                return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
        }
    };

    if (loading) return <Loader />;

    // Dla własnego profilu używamy userInfo, dla cudzego używamy danych z profilu
    console.log('EntrepreneurProfileScreen: Wyświetlanie profilu, isOwnProfile:', isOwnProfile, 'entrepreneurId:', entrepreneurId, 'profile:', profile, 'userInfo:', userInfo);
    const displayName = isOwnProfile 
        ? (profile?.name || userInfo?.email?.split('@')[0] || 'Użytkownik')
        : (profile?.name || 'Użytkownik');
    const displayEmail = isOwnProfile 
        ? (userInfo?.email || '') 
        : (userInfo?.email || profile?.email || profile?.user?.email || '');
    const displayBio = profile?.bio || 'Brak opisu';
    const displayLocation = profile?.location || 'Brak lokalizacji';
    const interests = profile?.interests || [];
    const profilePicture = profile?.profile_picture_url;

    // Statystyki
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.current_amount || 0), 0);
    const totalGoal = campaigns.reduce((sum, c) => sum + (c.goal_amount || 0), 0);

    return (
        <LinearGradient
            colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header z zdjęciem profilowym */}
                <View style={styles.headerSection}>
                    <View style={styles.profileImageContainer}>
                        {profilePicture ? (
                            <Image 
                                source={{ uri: getResourceURL(profilePicture) }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={60} color="#9ca3af" />
                            </View>
                        )}
                        {isOwnProfile && (
                            <TouchableOpacity 
                                style={styles.editImageButton}
                                onPress={handleEditProfile}
                            >
                                <MaterialIcons name="camera-alt" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <Text style={styles.profileName}>{displayName}</Text>
                    {displayEmail && (
                        <Text style={styles.profileEmail}>{displayEmail}</Text>
                    )}
                    
                    {isOwnProfile && (
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={handleEditProfile}
                        >
                            <MaterialIcons name="edit" size={18} color="#16a34a" />
                            <Text style={styles.editButtonText}>Edytuj profil</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Statystyki */}
                <View style={styles.statsSection}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalCampaigns}</Text>
                        <Text style={styles.statLabel}>Kampanie</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{activeCampaigns}</Text>
                        <Text style={styles.statLabel}>Aktywne</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{formatCurrency(totalRaised)}</Text>
                        <Text style={styles.statLabel}>Zebrano</Text>
                    </View>
                </View>

                {/* Informacje o profilu */}
                <View style={styles.infoSection}>
                    {displayBio && displayBio !== 'Brak opisu' && (
                        <View style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <MaterialIcons name="info" size={20} color="#16a34a" />
                                <Text style={styles.infoTitle}>O mnie</Text>
                            </View>
                            <Text style={styles.infoText}>{displayBio}</Text>
                        </View>
                    )}
                    
                    {displayLocation && displayLocation !== 'Brak lokalizacji' && (
                        <View style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <MaterialIcons name="location-on" size={20} color="#ef4444" />
                                <Text style={styles.infoTitle}>Lokalizacja</Text>
                            </View>
                            <Text style={styles.infoText}>{displayLocation}</Text>
                        </View>
                    )}
                    
                    {interests && interests.length > 0 && (
                        <View style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <MaterialIcons name="favorite" size={20} color="#ec4899" />
                                <Text style={styles.infoTitle}>Zainteresowania</Text>
                            </View>
                            <View style={styles.interestsContainer}>
                                {interests.map((interest: string, index: number) => (
                                    <View key={index} style={styles.interestTag}>
                                        <Text style={styles.interestText}>{interest}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Lista kampanii */}
                {isOwnProfile && campaigns.length > 0 && (
                    <View style={styles.campaignsSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="campaign" size={24} color="#111827" />
                            <Text style={styles.sectionTitle}>Moje kampanie</Text>
                        </View>
                        
                        {campaigns.map((campaign) => {
                            const statusColors = getStatusColor(campaign.status);
                            const percent = campaign.goal_amount > 0 
                                ? Math.min(Math.round((campaign.current_amount / campaign.goal_amount) * 100), 100)
                                : 0;
                            
                            return (
                                <TouchableOpacity
                                    key={campaign.id}
                                    style={styles.campaignCard}
                                    onPress={() => {
                                        // Przekieruj do zakładki "Kampanie" w bottom navigation
                                        // Używamy navigate przez MainTabs, podobnie jak w InvestorDashboardScreen
                                        try {
                                            (navigation as any).navigate('MainTabs', { 
                                                screen: 'EntrepreneurDashboard' 
                                            });
                                        } catch (error: any) {
                                            console.error('Błąd nawigacji:', error);
                                            // Fallback - spróbuj bezpośrednio przez tab navigator
                                            try {
                                                const tabNavigator = navigation.getParent();
                                                if (tabNavigator) {
                                                    (tabNavigator as any).navigate('EntrepreneurDashboard');
                                                }
                                            } catch (parentError) {
                                                console.error('Błąd nawigacji przez parent:', parentError);
                                            }
                                        }
                                    }}
                                >
                                    <View style={styles.campaignHeader}>
                                        <Text style={styles.campaignTitle} numberOfLines={2}>
                                            {campaign.title}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                                            <Text style={[styles.statusText, { color: statusColors.text }]}>
                                                {campaign.status === 'active' ? 'Aktywna' : 
                                                 campaign.status === 'draft' ? 'Szkic' :
                                                 campaign.status === 'successful' ? 'Sukces' :
                                                 campaign.status === 'closed' ? 'Zamknięta' : campaign.status}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {campaign.description && (
                                        <Text style={styles.campaignDescription} numberOfLines={2}>
                                            {campaign.description}
                                        </Text>
                                    )}
                                    
                                    <View style={styles.campaignProgress}>
                                        <View style={styles.progressBarContainer}>
                                            <View style={[styles.progressBar, { width: `${percent}%` }]} />
                                        </View>
                                        <Text style={styles.progressText}>{percent}%</Text>
                                    </View>
                                    
                                    <View style={styles.campaignStats}>
                                        <View style={styles.campaignStat}>
                                            <MaterialIcons name="attach-money" size={16} color="#6b7280" />
                                            <Text style={styles.campaignStatText}>
                                                {formatCurrency(campaign.current_amount)} / {formatCurrency(campaign.goal_amount)}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                
                {isOwnProfile && campaigns.length === 0 && (
                    <View style={styles.emptyCampaigns}>
                        <MaterialIcons name="campaign" size={48} color="#9ca3af" />
                        <Text style={styles.emptyCampaignsText}>Nie masz jeszcze żadnych kampanii</Text>
                        <Text style={styles.emptyCampaignsSubtext}>Utwórz swoją pierwszą kampanię!</Text>
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f3f4f6',
        borderWidth: 4,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editImageButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 16,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#f0f9ff',
        borderWidth: 1,
        borderColor: '#16a34a',
    },
    editButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#16a34a',
    },
    statsSection: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        paddingVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e5e7eb',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    infoSection: {
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    infoText: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 22,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    interestTag: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    interestText: {
        fontSize: 14,
        color: '#d97706',
        fontWeight: '500',
    },
    campaignsSection: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    campaignCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    campaignHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 12,
    },
    campaignTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    campaignDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
        lineHeight: 20,
    },
    campaignProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#16a34a',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16a34a',
        minWidth: 40,
    },
    campaignStats: {
        flexDirection: 'row',
        gap: 16,
    },
    campaignStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    campaignStatText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    emptyCampaigns: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyCampaignsText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyCampaignsSubtext: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});
