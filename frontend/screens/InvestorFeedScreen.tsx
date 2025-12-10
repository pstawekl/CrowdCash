import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Loader from '../components/Loader';
import RequirePermission from '../components/RequirePermission';
import API, { getResourceURL } from '../utils/api';

export default function InvestorFeedScreen({ navigation }: any) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [following, setFollowing] = useState<string[]>([]);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');
                // Dodaj wysyłanie parametru q do backendu
                const res = await API.get('/campaigns/feed', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: search.trim() ? { q: search.trim() } : {},
                });
                setCampaigns(Array.isArray(res.data) ? res.data : []);
                const followingRes = await API.get('/users/following', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing(Array.isArray(followingRes.data) ? followingRes.data.map((f: any) => f.entrepreneur_id) : []);
            } catch (e: any) {
                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać feedu');
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, [search]);

    const handleFollowToggle = async (entrepreneurId: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            if (following.includes(entrepreneurId)) {
                await API.delete(`/users/unfollow/${entrepreneurId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing(following.filter(id => id !== entrepreneurId));
            } else {
                await API.post(`/users/follow/${entrepreneurId}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing([...following, entrepreneurId]);
            }
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się zmienić obserwowania');
        }
    };

    useEffect(() => {
        console.log("Jestem w feedzie kampanii");
    }, [])

    // Kampanie są już przefiltrowane po stronie backendu
    const filteredCampaigns = campaigns;

    const formatCurrency = (amount: number | string | null | undefined) => {
        if (amount === null || amount === undefined) return '-';
        if (typeof amount === 'string') return amount;
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) return <Loader />;

    return (
        <RequirePermission permission="view_feed" navigation={navigation}>
            <LinearGradient
                colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Szukaj kampanii..."
                            placeholderTextColor="#9ca3af"
                            value={search}
                            onChangeText={setSearch}
                            style={styles.input}
                        />
                    </View>
                    <FlatList
                        data={filteredCampaigns}
                        keyExtractor={item => (item && item.id ? String(item.id) : Math.random().toString())}
                        renderItem={({ item }) => {
                            if (!item || typeof item !== 'object') return null;
                            const title = item.title || 'Brak tytułu';
                            const status = item.status || '-';
                            const current_amount = item.current_amount ?? 0;
                            const goal_amount = item.goal_amount ?? 0;
                            const percent = goal_amount > 0 ? Math.min(Math.round((current_amount / goal_amount) * 100), 100) : 0;
                            let deadline = '-';
                            try {
                                deadline = item.deadline ? new Date(item.deadline).toLocaleDateString('pl-PL') : '-';
                            } catch (e) { deadline = '-'; }
                            const entrepreneur_id = item.entrepreneur_id || '-';
                            const isFollowing = entrepreneur_id !== '-' && following.includes(entrepreneur_id);
                            const images = item.images && Array.isArray(item.images) ? item.images : [];
                            const imageUrls = images.length > 0 
                                ? images.map((img: any) => getResourceURL(img.image_url)).filter((url: string) => url)
                                : [];
                            const description = item.description || '';
                            
                            // Component for image slider
                            const CampaignImageSlider = () => {
                                const [currentImageIndex, setCurrentImageIndex] = useState(0);
                                const imageSliderRef = useRef<FlatList>(null);
                                const cardWidth = Dimensions.get('window').width - 32;
                                
                                if (imageUrls.length === 0) return null;
                                
                                return (
                                    <View style={styles.campaignImageContainer}>
                                        <FlatList
                                            ref={imageSliderRef}
                                            data={imageUrls}
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            keyExtractor={(url, index) => `campaign-image-${item.id}-${index}`}
                                            onMomentumScrollEnd={(event) => {
                                                const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
                                                setCurrentImageIndex(index);
                                            }}
                                            renderItem={({ item: imageUrl }) => (
                                                <View style={[styles.campaignImageSlide, { width: cardWidth }]}>
                                                    <Image
                                                        source={{ uri: imageUrl }}
                                                        style={styles.campaignImage}
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                            )}
                                            getItemLayout={(data, index) => ({
                                                length: cardWidth,
                                                offset: cardWidth * index,
                                                index,
                                            })}
                                            scrollEnabled={imageUrls.length > 1}
                                            nestedScrollEnabled={true}
                                            scrollEventThrottle={16}
                                            decelerationRate="fast"
                                            snapToInterval={cardWidth}
                                            snapToAlignment="start"
                                        />
                                        {/* Image Counter */}
                                        {imageUrls.length > 1 && (
                                            <View style={styles.campaignImageCounter} pointerEvents="none">
                                                <Text style={styles.campaignImageCounterText}>
                                                    {currentImageIndex + 1} / {imageUrls.length}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            };
                            
                            return (
                                <View style={styles.campaignCard}>
                                    <CampaignImageSlider />
                                    
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => item.id && navigation.navigate('InvestmentDetails', { campaignId: item.id })}
                                    >
                                    
                                    <View style={styles.campaignContent}>
                                        <View style={styles.campaignHeader}>
                                            <Text style={styles.campaignTitle} numberOfLines={2}>{title}</Text>
                                        </View>
                                        
                                        {description ? (
                                            <Text style={styles.campaignDescription} numberOfLines={3}>
                                                {description}
                                            </Text>
                                        ) : null}
                                        
                                        <View style={styles.campaignStats}>
                                            <View style={styles.statRow}>
                                                <MaterialIcons name="flag" size={16} color="#6b7280" />
                                                <Text style={styles.statLabel}>Cel:</Text>
                                                <Text style={styles.statValue}>{formatCurrency(goal_amount)}</Text>
                                            </View>
                                            <View style={styles.statRow}>
                                                <MaterialIcons name="trending-up" size={16} color="#16a34a" />
                                                <Text style={styles.statLabel}>Zebrano:</Text>
                                                <Text style={styles.statValue}>{formatCurrency(current_amount)}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressBar}>
                                                <View style={[styles.progressFill, { width: `${percent}%` }]} />
                                            </View>
                                            <Text style={styles.progressText}>{percent}%</Text>
                                        </View>
                                        
                                        {deadline !== '-' && (
                                            <View style={styles.deadlineContainer}>
                                                <MaterialIcons name="schedule" size={16} color="#6b7280" />
                                                <Text style={styles.deadlineText}>Do: {deadline}</Text>
                                            </View>
                                        )}
                                        
                                        {entrepreneur_id !== '-' && (
                                            <TouchableOpacity
                                                style={[styles.followButton, isFollowing && styles.followButtonActive]}
                                                onPress={e => {
                                                    e.stopPropagation();
                                                    handleFollowToggle(entrepreneur_id);
                                                }}
                                            >
                                                <MaterialIcons 
                                                    name={isFollowing ? "person-remove" : "person-add"} 
                                                    size={16} 
                                                    color={isFollowing ? "#fff" : "#16a34a"} 
                                                />
                                                <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                                                    {isFollowing ? 'Odobserwuj' : 'Obserwuj'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="campaign" size={64} color="#9ca3af" />
                                <Text style={styles.emptyText}>Brak kampanii w feedzie</Text>
                            </View>
                        }
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
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
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    campaignCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        overflow: 'hidden',
    },
    campaignImageContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
        overflow: 'hidden',
    },
    campaignImageSlide: {
        height: 200,
    },
    campaignImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f3f4f6',
    },
    campaignImageCounter: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    campaignImageCounterText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    campaignContent: {
        padding: 20,
    },
    campaignHeader: {
        marginBottom: 8,
    },
    campaignTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 26,
    },
    campaignDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    campaignStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f3f4f6',
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginRight: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#16a34a',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#16a34a',
        minWidth: 40,
        textAlign: 'right',
    },
    deadlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    deadlineText: {
        fontSize: 14,
        color: '#6b7280',
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#16a34a',
        gap: 6,
    },
    followButtonActive: {
        backgroundColor: '#16a34a',
        borderColor: '#059669',
    },
    followButtonText: {
        color: '#16a34a',
        fontSize: 14,
        fontWeight: '600',
    },
    followButtonTextActive: {
        color: '#fff',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
});
