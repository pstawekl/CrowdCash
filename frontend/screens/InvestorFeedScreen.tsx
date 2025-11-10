import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import Loader from '../components/Loader';
import RequirePermission from '../components/RequirePermission';
import API from '../utils/api';

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
                Alert.alert('Przestano obserwować przedsiębiorcę');
            } else {
                await API.post(`/users/follow/${entrepreneurId}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing([...following, entrepreneurId]);
                Alert.alert('Obserwujesz tego przedsiębiorcę!');
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

    if (loading) return <Loader />;

    return (
        <RequirePermission permission="view_feed" navigation={navigation}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
                    {/* <Text style={styles.title}>Feed kampanii</Text> */}
                    <TextInput
                        placeholder="Szukaj kampanii..."
                        value={search}
                        onChangeText={setSearch}
                        style={styles.input}
                    />
                    <FlatList
                        data={filteredCampaigns}
                        keyExtractor={item => (item && item.id ? String(item.id) : Math.random().toString())}
                        renderItem={({ item }) => {
                            if (!item || typeof item !== 'object') return null;
                            // Fallbacky na brakujące pola
                            const title = item.title || 'Brak tytułu';
                            const status = item.status || '-';
                            const current_amount = item.current_amount ?? '-';
                            const goal_amount = item.goal_amount ?? '-';
                            let deadline = '-';
                            try {
                                deadline = item.deadline ? new Date(item.deadline).toLocaleDateString() : '-';
                            } catch (e) { deadline = '-'; }
                            const entrepreneur_id = item.entrepreneur_id || '-';
                            return (
                                <TouchableOpacity
                                    style={styles.item}
                                    onPress={() => item.id && navigation.navigate('InvestmentDetails', { campaignId: item.id })}
                                >
                                    <Text style={styles.campaign}>{title}</Text>
                                    <Text style={styles.itemText}>Status: {status}</Text>
                                    <Text style={styles.itemText}>Zebrano: {current_amount} / {goal_amount} PLN</Text>
                                    <Text style={styles.itemText}>Do: {deadline}</Text>
                                    <Text style={styles.itemText}>Przedsiębiorca: {entrepreneur_id}</Text>
                                    <TouchableOpacity
                                        style={styles.followButton}
                                        onPress={e => {
                                            e.stopPropagation();
                                            if (entrepreneur_id !== '-') handleFollowToggle(entrepreneur_id);
                                        }}
                                    >
                                        <Text style={styles.followButtonText}>
                                            {following.includes(entrepreneur_id) ? 'Od-obserwuj' : 'Obserwuj'}
                                        </Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={<Text style={styles.emptyText}>Brak kampanii w feedzie</Text>}
                        scrollEnabled={false}
                    />
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
        padding: Math.min(20, screenWidth * 0.05),
    },
    title: {
        fontSize: Math.min(24, screenWidth * 0.06),
        fontWeight: 'bold',
        marginBottom: Math.min(20, screenWidth * 0.05),
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: Math.min(15, screenWidth * 0.04),
        padding: Math.min(10, screenWidth * 0.025),
        borderRadius: Math.min(6, screenWidth * 0.015),
        fontSize: Math.min(16, screenWidth * 0.04),
    },
    item: {
        backgroundColor: '#f4f4f4',
        borderRadius: Math.min(10, screenWidth * 0.025),
        padding: Math.min(16, screenWidth * 0.04),
        marginBottom: Math.min(14, screenWidth * 0.035),
    },
    campaign: {
        fontSize: Math.min(18, screenWidth * 0.045),
        fontWeight: 'bold',
        marginBottom: 4,
    },
    itemText: {
        fontSize: Math.min(14, screenWidth * 0.035),
        marginBottom: 2,
    },
    followButton: {
        marginTop: Math.min(10, screenWidth * 0.025),
        backgroundColor: '#4caf50',
        padding: Math.min(8, screenWidth * 0.02),
        borderRadius: Math.min(6, screenWidth * 0.015),
        alignItems: 'center',
    },
    followButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: Math.min(14, screenWidth * 0.035),
    },
    emptyText: {
        textAlign: 'center',
        marginTop: Math.min(30, screenWidth * 0.075),
        fontSize: Math.min(16, screenWidth * 0.04),
        color: '#666',
    },
});
