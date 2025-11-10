import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import DatePicker from '../components/DatePicker/DatePicker';
import Loader from '../components/Loader';
import RequirePermission from '../components/RequirePermission';
import API from '../utils/api';

export interface ProgressCircleProps {
    style?: ViewStyle | ViewStyle[];
    progress?: number;
    progressColor?: string;
    backgroundColor?: string;
    strokeWidth?: number;
}

export class ProgressCircle extends React.Component<ProgressCircleProps> { }

export default function EntrepreneurDashboardScreen({ route, navigation }: any) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    // --- STATYSTYKI I SZCZEGÓŁY KAMPANII ---
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [campaignStats, setCampaignStats] = useState<any | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // --- PODGLĄD INWESTORÓW W KAMPANII ---
    const [investors, setInvestors] = useState<any[]>([]);
    const [showInvestors, setShowInvestors] = useState(false);


    // --- EDYCJA PROFILU PRZEDSIĘBIORCY ---
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const { control: profileControl, handleSubmit: handleProfileSubmit, reset: resetProfile } = useForm({
        defaultValues: {
            name: '',
            bio: '',
            location: '',
            profile_picture_url: '',
        },
    });

    useEffect(() => {
        if (route?.params?.addCampaign) {
            setShowAddForm(true);
        }
    }, [route?.params?.addCampaign]);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');
                const res = await API.get('/campaigns/my', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCampaigns(res.data);
            } catch (e: any) {
                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się pobrać kampanii');
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    useEffect(() => {
        // Pobierz kategorie z backendu
        const fetchCategories = async () => {
            try {
                const res = await API.get('/campaigns/categories');
                setCategories(res.data);
            } catch (e) {
                setCategories([
                    'Technologia',
                    'Zdrowie',
                    'Edukacja',
                    'Sztuka',
                    'Społeczność',
                    'Inne',
                ]);
            }
        };
        fetchCategories();
    }, []);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            title: '',
            description: '',
            category: '',
            goal_amount: '',
            region: '',
            deadline: new Date(),
        },
    });

    const onSubmit = async (data: any) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            const payload = { ...data, goal_amount: parseFloat(data.goal_amount) };
            await API.post('/campaigns/', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert(
                'Kampania utworzona',
                'Kampania została utworzona jako szkic (draft). Aby była widoczna dla inwestorów i możliwa do inwestowania, musisz ją opublikować w szczegółach kampanii.'
            );
            setShowAddForm(false);
            reset();
            const res = await API.get('/campaigns/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaigns(res.data);
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się dodać kampanii');
        }
    };

    const handleShowDetails = async (campaign: any) => {
        setSelectedCampaign(campaign);
        setStatsLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            // Przykładowy endpoint, dostosuj do swojego backendu
            const res = await API.get(`/campaigns/${campaign.id}/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaignStats(res.data);
        } catch (e) {
            setCampaignStats(null);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleCloseDetails = () => {
        setSelectedCampaign(null);
        setCampaignStats(null);
    };

    // --- EDYCJA I ZAMYKANIE KAMPANII ---
    const handleCloseCampaign = async (campaignId: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            await API.post(`/campaigns/${campaignId}/close`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Sukces', 'Kampania została zamknięta!');
            setSelectedCampaign(null);
            // Odśwież listę
            const res = await API.get('/campaigns/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaigns(res.data);
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się zamknąć kampanii');
        }
    };

    const handleShowInvestors = async (campaignId: string) => {
        setShowInvestors(true);
        setStatsLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            const res = await API.get(`/campaigns/${campaignId}/investors`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInvestors(res.data);
        } catch (e) {
            setInvestors([]);
        } finally {
            setStatsLoading(false);
        }
    };
    const handleCloseInvestors = () => {
        setShowInvestors(false);
        setInvestors([]);
    };

    const handleShowNotifications = () => {
        navigation.navigate('Notifications');
    };

    const handleShowEditProfile = async () => {
        setShowEditProfile(true);
        setProfileLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            const res = await API.get('/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProfile(res.data);
            resetProfile({
                name: res.data.name || '',
                bio: res.data.bio || '',
                location: res.data.location || '',
                profile_picture_url: res.data.profile_picture_url || '',
            });
        } catch (e) {
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    };
    const handleCloseEditProfile = () => {
        setShowEditProfile(false);
        setProfile(null);
    };
    const onSubmitProfile = async (data: any) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            await API.put('/auth/profile', data, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Sukces', 'Profil zaktualizowany!');
            setShowEditProfile(false);
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się zaktualizować profilu');
        }
    };

    // --- EKSPORT DO CSV ---
    const handleExportCSV = async () => {
        if (!selectedCampaign || !campaignStats) return;
        try {
            const csv = [
                ['Tytuł', 'Status', 'Cel', 'Zebrano', 'Liczba inwestorów', 'Największa inwestycja', 'Status payoutu'],
                [
                    selectedCampaign.title,
                    selectedCampaign.status,
                    selectedCampaign.goal_amount,
                    selectedCampaign.current_amount,
                    campaignStats.investors_count ?? '-',
                    campaignStats.max_investment ?? '-',
                    campaignStats.payout_status ?? '-',
                ],
            ]
                .map(row => row.join(','))
                .join('\n');
            const fileUri = FileSystem.cacheDirectory + `kampania_${selectedCampaign.id}.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
        } catch (e) {
            Alert.alert('Błąd', 'Nie udało się wyeksportować CSV');
        }
    };

    // --- EKSPORT DO PDF ---
    const handleExportPDF = async () => {
        if (!selectedCampaign || !campaignStats) return;
        try {
            // Prosty PDF jako tekst (możesz podmienić na generowanie HTML lub użyć zewnętrznej biblioteki)
            const pdfText = `Szczegóły kampanii\n\nTytuł: ${selectedCampaign.title}\nStatus: ${selectedCampaign.status}\nOpis: ${selectedCampaign.description}\nKategoria: ${selectedCampaign.category}\nCel: ${selectedCampaign.goal_amount} PLN\nZebrano: ${selectedCampaign.current_amount} PLN\nRegion: ${selectedCampaign.region}\nDeadline: ${new Date(selectedCampaign.deadline).toLocaleDateString()}\n\nStatystyki:\nLiczba inwestorów: ${campaignStats.investors_count ?? '-'}\nLiczba inwestycji: ${campaignStats.investments_count ?? '-'}\nNajwiększa inwestycja: ${campaignStats.max_investment ?? '-'} PLN\nStatus payoutu: ${campaignStats.payout_status ?? '-'}\n`;
            const fileUri = FileSystem.cacheDirectory + `kampania_${selectedCampaign.id}.pdf`;
            await FileSystem.writeAsStringAsync(fileUri, pdfText, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
        } catch (e) {
            Alert.alert('Błąd', 'Nie udało się wyeksportować PDF');
        }
    };

    if (loading) return <Loader />;

    if (showAddForm && categories.length === 0) {
        // Poczekaj na pobranie kategorii
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4caf50" />;
    }

    if (showAddForm) {
        return (
            <RequirePermission permission="view_dashboard" navigation={navigation}>
                <View style={styles.container}>
                    <Controller
                        control={control}
                        name="title"
                        rules={{ required: 'Tytuł jest wymagany' }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <>
                                <TextInput
                                    placeholder="Tytuł kampanii"
                                    value={value}
                                    onChangeText={onChange}
                                    style={styles.input}
                                />
                                {error && <Text style={styles.error}>{error.message}</Text>}
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="description"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Opis kampanii"
                                value={value}
                                onChangeText={onChange}
                                style={styles.input}
                                multiline
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="category"
                        render={({ field: { onChange, value } }) => (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ marginBottom: 4 }}>Kategoria:</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={value}
                                        onValueChange={onChange}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Wybierz kategorię..." value="" />
                                        {categories.map(cat => (
                                            <Picker.Item key={cat} label={cat} value={cat} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        )}
                    />
                    <Controller
                        control={control}
                        name="goal_amount"
                        rules={{ required: 'Cel finansowy jest wymagany', min: { value: 1, message: 'Kwota musi być większa od 0' } }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <>
                                <TextInput
                                    placeholder="Cel finansowy (PLN)"
                                    value={value}
                                    onChangeText={onChange}
                                    style={styles.input}
                                    keyboardType="numeric"
                                />
                                {error && <Text style={styles.error}>{error.message}</Text>}
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="region"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Region"
                                value={value}
                                onChangeText={onChange}
                                style={styles.input}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="deadline"
                        rules={{ required: 'Deadline jest wymagany' }}
                        render={({ field: { onChange, value } }) => (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ marginBottom: 4 }}>Deadline:</Text>
                                <DatePicker control={control} name="deadline" onChangeDate={onChange} />
                            </View>
                        )}
                    />
                    <Button title="Dodaj kampanię" onPress={handleSubmit(onSubmit)} color="#4caf50" />
                    <Text style={{ color: '#388e3c', marginTop: 20, textAlign: 'center' }} onPress={() => setShowAddForm(false)}>
                        Anuluj
                    </Text>
                </View>
            </RequirePermission>
        );
    }

    if (showInvestors) {
        return (
            <View style={styles.container}>
                {statsLoading ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#4caf50" />
                ) : investors.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 30 }}>Brak inwestorów</Text>
                ) : (
                    <FlatList
                        data={investors}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.item}>
                                <Text style={styles.campaign}>{item.name || item.email}</Text>
                                <Text>Kwota: {item.amount} PLN</Text>
                                <Text>Status: {item.status}</Text>
                                <Text>Data: {new Date(item.created_at).toLocaleString()}</Text>
                            </View>
                        )}
                    />
                )}
                <Button title="Powrót" onPress={handleCloseInvestors} color="#4caf50" />
            </View>
        );
    }


    if (selectedCampaign) {
        return (
            <View style={styles.container}>
                <Text style={styles.campaign}>{selectedCampaign.title}</Text>
                <Text>Status: {selectedCampaign.status}</Text>
                <Text>Opis: {selectedCampaign.description}</Text>
                <Text>Kategoria: {selectedCampaign.category}</Text>
                <Text>Cel: {selectedCampaign.goal_amount} PLN</Text>
                <Text>Zebrano: {selectedCampaign.current_amount} PLN</Text>
                <Text>Region: {selectedCampaign.region}</Text>
                <Text>Deadline: {new Date(selectedCampaign.deadline).toLocaleDateString()}</Text>
                {/* Przycisk publikacji kampanii */}
                {selectedCampaign.status === 'draft' && (
                    <Button
                        title="Opublikuj kampanię"
                        color="#388e3c"
                        onPress={async () => {
                            try {
                                const token = await AsyncStorage.getItem('authToken');
                                if (!token) throw new Error('Brak tokena');
                                await API.patch(`/campaigns/${selectedCampaign.id}/status`, { status: 'active' }, {
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                Alert.alert('Sukces', 'Kampania została opublikowana!');
                                // Odśwież szczegóły i listę kampanii
                                const res = await API.get('/campaigns/my', {
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                setCampaigns(res.data);
                                // Odśwież szczegóły wybranej kampanii
                                const updated = res.data.find((c: any) => c.id === selectedCampaign.id);
                                setSelectedCampaign(updated);
                            } catch (e: any) {
                                Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się opublikować kampanii');
                            }
                        }}
                    />
                )}
                {statsLoading ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#4caf50" />
                ) : campaignStats ? (
                    <View style={{ marginTop: 20 }}>
                        <Text style={styles.sectionTitle}>Statystyki:</Text>
                        <Text>Liczba inwestorów: {campaignStats.investors_count ?? '-'}</Text>
                        <Text>Liczba inwestycji: {campaignStats.investments_count ?? '-'}</Text>
                        <Text>Największa inwestycja: {campaignStats.max_investment ?? '-'} PLN</Text>
                        <Text>Status payoutu: {campaignStats.payout_status ?? '-'}</Text>
                        {/* Wykres postępu */}
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <Text style={{ marginBottom: 8 }}>Postęp kampanii</Text>
                            <ProgressCircle
                                style={{ height: 100 }}
                                progress={
                                    selectedCampaign.current_amount && selectedCampaign.goal_amount
                                        ? Math.min(selectedCampaign.current_amount / selectedCampaign.goal_amount, 1)
                                        : 0
                                }
                                progressColor={'#4caf50'}
                                backgroundColor={'#e0e0e0'}
                            />
                            <Text style={{ marginTop: 8 }}>
                                {selectedCampaign.current_amount} / {selectedCampaign.goal_amount} PLN
                            </Text>
                        </View>
                        <Button title="Eksportuj do CSV" onPress={handleExportCSV} color="#388e3c" />
                        <View style={{ height: 10 }} />
                        <Button title="Eksportuj do PDF" onPress={handleExportPDF} color="#388e3c" />
                    </View>
                ) : null}
                <Button title="Zamknij" onPress={handleCloseDetails} color="#4caf50" />
                {selectedCampaign.status !== 'closed' && (
                    <Button
                        title="Zamknij kampanię"
                        onPress={() => {
                            Alert.alert(
                                'Potwierdzenie',
                                'Czy na pewno chcesz zamknąć tę kampanię? Tej operacji nie można cofnąć.',
                                [
                                    { text: 'Anuluj', style: 'cancel' },
                                    { text: 'Zamknij', style: 'destructive', onPress: () => handleCloseCampaign(selectedCampaign.id) }
                                ]
                            );
                        }}
                        color="#d32f2f"
                    />
                )}
                <Button title="Zobacz inwestorów" onPress={() => handleShowInvestors(selectedCampaign.id)} color="#388e3c" />
            </View>
        );
    }

    return (
        <RequirePermission permission="view_dashboard" navigation={navigation}>
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <View style={styles.topBarRight}>
                        <TouchableOpacity onPress={handleShowNotifications} style={styles.iconButton}>
                            <Text style={styles.notificationButton}>🔔 Powiadomienia</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.iconButton}>
                            <Text style={styles.addButton}>➕ Nowa kampania</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.content}>
                    <FlatList
                        data={campaigns}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.campaignItem}>
                                <Text style={styles.campaignTitle}>{item.title}</Text>
                                <Text>Status: {item.status}</Text>
                                <Text>Cel: {item.goal_amount} PLN</Text>
                                <Text>Zebrano: {item.current_amount} PLN</Text>
                                <Text>Region: {item.region}</Text>
                                <Text>Deadline: {new Date(item.deadline).toLocaleDateString()}</Text>
                                <View style={styles.actions}>
                                    <Button title="Szczegóły" onPress={() => handleShowDetails(item)} color="#2196f3" />
                                    {item.status !== 'closed' && (
                                        <Button
                                            title="Zamknij kampanię"
                                            onPress={() => {
                                                Alert.alert(
                                                    'Potwierdzenie',
                                                    'Czy na pewno chcesz zamknąć tę kampanię? Tej operacji nie można cofnąć.',
                                                    [
                                                        { text: 'Anuluj', style: 'cancel' },
                                                        { text: 'Zamknij', style: 'destructive', onPress: () => handleCloseCampaign(item.id) }
                                                    ]
                                                );
                                            }}
                                            color="#d32f2f"
                                        />
                                    )}
                                </View>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                </View>
            </View>
        </RequirePermission>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    item: { backgroundColor: '#f4f4f4', borderRadius: 10, padding: 16, marginBottom: 14 },
    campaign: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 10, borderRadius: 6 },
    error: { color: 'red', marginBottom: 8, marginLeft: 4 },
    pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 15, overflow: 'hidden' },
    picker: { height: 44, width: '100%' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    campaignItem: { backgroundColor: '#f4f4f4', borderRadius: 10, padding: 16, marginBottom: 14 },
    campaignTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#e6f7ee',
        borderBottomWidth: 1,
        borderBottomColor: '#d0e6db',
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: 10,
    },
    iconButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#fff',
        elevation: 2,
    },
    notificationButton: {
        color: '#388e3c',
        fontSize: 14,
        fontWeight: '500',
    },
    addButton: {
        color: '#388e3c',
        fontSize: 14,
        fontWeight: '500',
    },
});
