import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Loader from '../components/Loader';
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
        <View style={styles.container}>
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
                            <Text>Status: {status}</Text>
                            <Text>Zebrano: {current_amount} / {goal_amount} PLN</Text>
                            <Text>Do: {deadline}</Text>
                            <Text>Przedsiębiorca: {entrepreneur_id}</Text>
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
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>Brak kampanii w feedzie</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10, borderRadius: 6 },
    item: { backgroundColor: '#f4f4f4', borderRadius: 10, padding: 16, marginBottom: 14 },
    campaign: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    followButton: { marginTop: 10, backgroundColor: '#4caf50', padding: 8, borderRadius: 6, alignItems: 'center' },
    followButtonText: { color: '#fff', fontWeight: 'bold' },
});
