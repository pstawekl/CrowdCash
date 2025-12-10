import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Button, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import DatePicker from '../components/DatePicker/DatePicker';
import Loader from '../components/Loader';
import RegionSearchBox, { Region } from '../components/RegionSearchBox';
import RequirePermission from '../components/RequirePermission';
import API, { getResourceURL } from '../utils/api';

// ProgressCircle został usunięty - używamy teraz prostego paska postępu

export default function EntrepreneurDashboardScreen({ route, navigation }: any) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [categories, setCategories] = useState<Array<{ id: string; name: string; description?: string }>>([]);

    // --- STATYSTYKI I SZCZEGÓŁY KAMPANII ---
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [campaignStats, setCampaignStats] = useState<any | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // --- PODGLĄD INWESTORÓW W KAMPANII ---
    const [investors, setInvestors] = useState<any[]>([]);
    const [showInvestors, setShowInvestors] = useState(false);

    // --- REGION SEARCH ---
    const [selectedCity, setSelectedCity] = useState<Region | null>(null);
    const [userProfile, setUserProfile] = useState<{ location?: string } | null>(null);

    // --- IMAGES ---
    interface CampaignImage {
        file?: any; // URI pliku lokalnego
        preview?: string; // URI do podglądu
        image_url?: string; // URL po uploadzie
        alt_text?: string;
        order_index?: number;
    }
    const [images, setImages] = useState<CampaignImage[]>([]);

    // --- REWARD TIERS ---
    interface CampaignRewardTier {
        title: string;
        description: string;
        min_percentage: number;
        max_percentage: number;
        estimated_delivery_date?: Date;
    }
    const [rewardTiers, setRewardTiers] = useState<CampaignRewardTier[]>([]);

    // --- EDYCJA KAMPANII ---
    const [isEditingCampaign, setIsEditingCampaign] = useState(false);


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
                // Backend zwraca obiekty z id, name, description
                setCategories(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error('Błąd pobierania kategorii:', e);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    const { control, handleSubmit, reset, setValue, getValues } = useForm({
        defaultValues: {
            title: '',
            description: '',
            category_id: '',
            goal_amount: '',
            region: '',
            deadline: new Date(),
        },
    });

    const onSubmit = async (data: any) => {
        try {
            if (images.length === 0) {
                Alert.alert('Błąd', 'Musisz dodać przynajmniej jedno zdjęcie');
                return;
            }
            if (rewardTiers.length < 3) {
                Alert.alert('Błąd', 'Musisz dodać przynajmniej trzy widełki nagród');
                return;
            }

            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description || '');
            formData.append('category_id', data.category_id);
            formData.append('goal_amount', parseFloat(data.goal_amount).toString());
            formData.append('region', data.region || '');
            formData.append('deadline', data.deadline.toISOString());

            // Dodaj zdjęcia
            images.forEach((image, index) => {
                if (image.file) {
                    formData.append('images', {
                        uri: image.file,
                        type: 'image/jpeg',
                        name: `image_${index}.jpg`,
                    } as any);
                }
                if (image.alt_text) {
                    formData.append(`image_alt_${index}`, image.alt_text);
                }
            });

            // Dodaj widełki nagród
            rewardTiers.forEach((tier, index) => {
                formData.append(`reward_tiers[${index}][title]`, tier.title);
                formData.append(`reward_tiers[${index}][description]`, tier.description);
                formData.append(`reward_tiers[${index}][min_percentage]`, tier.min_percentage.toString());
                formData.append(`reward_tiers[${index}][max_percentage]`, tier.max_percentage.toString());
            });

            await API.post('/campaigns/', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            Alert.alert(
                'Kampania utworzona',
                'Kampania została utworzona jako szkic (draft). Aby była widoczna dla inwestorów i możliwa do inwestowania, musisz ją opublikować w szczegółach kampanii.'
            );
            setShowAddForm(false);
            reset();
            setImages([]);
            setRewardTiers([]);
            setSelectedCity(null);
            const res = await API.get('/campaigns/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaigns(res.data);
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się dodać kampanii');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
            case 'draft':
                return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
            case 'successful':
                return { bg: '#dcfce7', text: '#15803d', border: '#16a34a' };
            case 'closed':
                return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
            default:
                return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
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
        setIsEditingCampaign(false);
        reset(); // Resetuj formularz
        setImages([]);
        setRewardTiers([]);
        setSelectedCity(null);
    };

    // --- ZARZĄDZANIE ZDJĘCIAMI ---
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Brak uprawnień', 'Potrzebujesz uprawnień do galerii, aby dodać zdjęcia.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            const newImages = result.assets.map((asset) => ({
                file: asset.uri,
                preview: asset.uri,
                alt_text: '',
                order_index: images.length,
            }));
            setImages([...images, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
    };

    const updateImageAltText = (index: number, text: string) => {
        const newImages = [...images];
        newImages[index].alt_text = text;
        setImages(newImages);
    };

    // --- ZARZĄDZANIE WIDEŁKAMI NAGRÓD ---
    const addRewardTier = () => {
        setRewardTiers([
            ...rewardTiers,
            {
                title: '',
                description: '',
                min_percentage: 0,
                max_percentage: 100,
            },
        ]);
    };

    const removeRewardTier = (index: number) => {
        const newTiers = rewardTiers.filter((_, i) => i !== index);
        setRewardTiers(newTiers);
    };

    const updateRewardTier = (index: number, field: keyof CampaignRewardTier, value: string) => {
        const newTiers = [...rewardTiers];
        (newTiers[index] as any)[field] = value;
        setRewardTiers(newTiers);
    };

    const updateRewardTierRange = (index: number, min: number, max: number) => {
        const newTiers = [...rewardTiers];
        newTiers[index].min_percentage = min;
        newTiers[index].max_percentage = max;
        setRewardTiers(newTiers);
    };

    // --- EDYCJA KAMPANII - WYPEŁNIENIE FORMULARZA ---
    const handleEditCampaign = async () => {
        if (!selectedCampaign) return;
        
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            // Pobierz pełne dane kampanii
            const campaignRes = await API.get(`/campaigns/${selectedCampaign.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const campaign = campaignRes.data;

            // Wypełnij formularz danymi kampanii
            setValue('title', campaign.title || '');
            setValue('description', campaign.description || '');
            setValue('category_id', campaign.category_rel?.id || campaign.category || '');
            setValue('goal_amount', campaign.goal_amount?.toString() || '');
            setValue('region', campaign.region || '');
            // DatePicker wymaga obiektu Date, nie stringa
            setValue('deadline', campaign.deadline 
                ? new Date(campaign.deadline) 
                : new Date());

            // Wypełnij zdjęcia
            if (campaign.images && campaign.images.length > 0) {
                setImages(campaign.images.map((img: any) => ({
                    image_url: img.image_url,
                    alt_text: img.alt_text || '',
                    order_index: img.order_index || 0,
                })));
            } else {
                setImages([]);
            }

            // Wypełnij widełki
            if (campaign.reward_tiers && campaign.reward_tiers.length > 0) {
                setRewardTiers(campaign.reward_tiers.map((tier: any) => ({
                    title: tier.title || '',
                    description: tier.description || '',
                    min_percentage: tier.min_percentage || 0,
                    max_percentage: tier.max_percentage || 100,
                })));
            } else {
                setRewardTiers([]);
            }

            // Wypełnij miasto jeśli dostępne
            if (campaign.region) {
                try {
                    const regionRes = await API.get('/regions/search', {
                        params: { q: campaign.region, type: 'city' },
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (regionRes.data && regionRes.data.length > 0) {
                        const matchingCity = regionRes.data.find((city: Region) => 
                            city.name.toLowerCase() === campaign.region?.toLowerCase()
                        ) || regionRes.data[0];
                        setSelectedCity(matchingCity);
                    }
                } catch (e) {
                    // Ignoruj błąd wyszukiwania miasta
                }
            }

            setIsEditingCampaign(true);
        } catch (e: any) {
            Alert.alert('Błąd', 'Nie udało się załadować danych kampanii do edycji');
            console.error('Error loading campaign for edit:', e);
        }
    };

    // --- AKTUALIZACJA KAMPANII ---
    const handleUpdateCampaign = async () => {
        if (!selectedCampaign) return;
        
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            // Pobierz wartości z formularza używając getValues
            const formValues = getValues();
            
            // Walidacja
            if (!formValues.title || !formValues.category_id || 
                !formValues.goal_amount || !formValues.deadline) {
                Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
                return;
            }

            // Przygotuj dane do wysłania
            const formData = new FormData();
            formData.append('title', formValues.title);
            formData.append('description', formValues.description || '');
            formData.append('category_id', formValues.category_id);
            formData.append('goal_amount', formValues.goal_amount);
            formData.append('region', formValues.region || '');
            
            // Deadline - DatePicker zwraca obiekt Date
            const deadlineValue = formValues.deadline;
            const deadline = deadlineValue instanceof Date
                ? deadlineValue.toISOString()
                : deadlineValue
                ? new Date(deadlineValue).toISOString()
                : new Date().toISOString();
            formData.append('deadline', deadline);

            // Dodaj zdjęcia
            images.forEach((image, index) => {
                if (image.file) {
                    formData.append('images', {
                        uri: image.file,
                        type: 'image/jpeg',
                        name: `image_${index}.jpg`,
                    } as any);
                }
                if (image.alt_text) {
                    formData.append(`image_alt_${index}`, image.alt_text);
                }
            });

            // Dodaj widełki nagród
            rewardTiers.forEach((tier, index) => {
                formData.append(`reward_tiers[${index}][title]`, tier.title);
                formData.append(`reward_tiers[${index}][description]`, tier.description);
                formData.append(`reward_tiers[${index}][min_percentage]`, tier.min_percentage.toString());
                formData.append(`reward_tiers[${index}][max_percentage]`, tier.max_percentage.toString());
            });

            await API.put(`/campaigns/${selectedCampaign.id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Sukces', 'Kampania została zaktualizowana!');
            setIsEditingCampaign(false);
            
            // Odśwież dane
            const res = await API.get('/campaigns/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaigns(res.data);
            await handleShowDetails(selectedCampaign);
        } catch (e: any) {
            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się zaktualizować kampanii');
        }
    };

    // --- USUWANIE KAMPANII ---
    const handleDeleteCampaign = async (campaignId: string) => {
        Alert.alert(
            'Potwierdzenie usunięcia',
            'Czy na pewno chcesz usunąć tę kampanię? Tej operacji nie można cofnąć.',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await API.delete(`/campaigns/${campaignId}`);
                            Alert.alert('Sukces', 'Kampania została usunięta!');
                            handleCloseDetails();
                            // Odśwież listę kampanii
                            const token = await AsyncStorage.getItem('authToken');
                            if (token) {
                                const res = await API.get('/campaigns/my', {
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                setCampaigns(res.data);
                            }
                        } catch (e: any) {
                            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się usunąć kampanii');
                        }
                    },
                },
            ]
        );
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
                <LinearGradient
                    colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    {/* Fixed Header */}
                    <View style={styles.formHeaderFixed}>
                        <Text style={styles.formTitleFixed}>Nowa kampania</Text>
                        <TouchableOpacity onPress={() => {
                            setShowAddForm(false);
                            reset(); // Resetuj formularz
                            setImages([]);
                            setRewardTiers([]);
                            setSelectedCity(null);
                        }} style={styles.closeFormButton}>
                            <MaterialIcons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.formScrollView}
                        contentContainerStyle={styles.formContent}
                        showsVerticalScrollIndicator={false}
                    >

                        {/* Formularz */}
                        <View style={styles.formCard}>
                            {/* Tytuł i Kategoria */}
                            <View style={styles.formRow}>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Tytuł kampanii <Text style={styles.required}>*</Text></Text>
                                    <Controller
                                        control={control}
                                        name="title"
                                        rules={{ required: 'Tytuł jest wymagany' }}
                                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                                            <>
                                                <TextInput
                                                    placeholder="Wprowadź tytuł kampanii"
                                                    value={value}
                                                    onChangeText={onChange}
                                                    style={[styles.formInput, error && styles.formInputError]}
                                                />
                                                {error && <Text style={styles.error}>{error.message}</Text>}
                                            </>
                                        )}
                                    />
                                </View>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Kategoria <Text style={styles.required}>*</Text></Text>
                                    <Controller
                                        control={control}
                                        name="category_id"
                                        rules={{ required: 'Kategoria jest wymagana' }}
                                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                                            <>
                                                <View style={[styles.pickerWrapper, error && styles.formInputError]}>
                                                    <Picker
                                                        selectedValue={value}
                                                        onValueChange={onChange}
                                                        style={styles.picker}
                                                    >
                                                        <Picker.Item label="Wybierz kategorię" value="" />
                                                        {categories.map(cat => (
                                                            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                                                        ))}
                                                    </Picker>
                                                </View>
                                                {error && <Text style={styles.error}>{error.message}</Text>}
                                                {value && categories.find(c => c.id === value)?.description && (
                                                    <Text style={styles.formHint}>
                                                        {categories.find(c => c.id === value)?.description}
                                                    </Text>
                                                )}
                                            </>
                                        )}
                                    />
                                </View>
                            </View>

                            {/* Opis */}
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Opis kampanii</Text>
                                <Controller
                                    control={control}
                                    name="description"
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            placeholder="Opisz szczegółowo swoją kampanię..."
                                            value={value}
                                            onChangeText={onChange}
                                            style={[styles.formInput, styles.formTextArea]}
                                            multiline
                                            numberOfLines={4}
                                        />
                                    )}
                                />
                            </View>

                            {/* Cel, Miasto, Deadline */}
                            <View style={styles.formRow}>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Cel (PLN) <Text style={styles.required}>*</Text></Text>
                                    <Controller
                                        control={control}
                                        name="goal_amount"
                                        rules={{ required: 'Cel finansowy jest wymagany', min: { value: 1, message: 'Kwota musi być większa od 0' } }}
                                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                                            <>
                                                <TextInput
                                                    placeholder="0"
                                                    value={value}
                                                    onChangeText={onChange}
                                                    style={[styles.formInput, error && styles.formInputError]}
                                                    keyboardType="numeric"
                                                />
                                                {error && <Text style={styles.error}>{error.message}</Text>}
                                            </>
                                        )}
                                    />
                                </View>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>
                                        <MaterialIcons name="location-on" size={16} color="#16a34a" /> Miasto <Text style={styles.required}>*</Text>
                                    </Text>
                                    <RegionSearchBox
                                        filterType="city"
                                        placeholder="Wyszukaj miasto..."
                                        onSelect={(region) => {
                                            if (region) {
                                                setSelectedCity(region);
                                                control._formValues.region = region.id;
                                            } else {
                                                setSelectedCity(null);
                                                control._formValues.region = '';
                                            }
                                        }}
                                        value={selectedCity}
                                    />
                                    {selectedCity && (
                                        <View style={styles.selectedCityContainer}>
                                            <MaterialIcons name="check-circle" size={16} color="#16a34a" />
                                            <Text style={styles.selectedCityText}>Wybrano: {selectedCity.name}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Termin zakończenia <Text style={styles.required}>*</Text></Text>
                                    <DatePicker control={control} name="deadline" />
                                </View>
                            </View>
                        </View>
                        
                        {/* Sekcja zdjęć */}
                        <View style={styles.formCard}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Zdjęcia kampanii <Text style={styles.required}>*</Text></Text>
                                    <Text style={styles.sectionSubtitle}>Wymagane przynajmniej jedno zdjęcie</Text>
                                </View>
                                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                                    <MaterialIcons name="image" size={20} color="#16a34a" />
                                    {/* <Text style={styles.addImageButtonText}>Dodaj zdjęcie</Text> */}
                                </TouchableOpacity>
                            </View>
                            {images.length === 0 && (
                                <View style={styles.warningBox}>
                                    <MaterialIcons name="warning" size={20} color="#f59e0b" />
                                    <Text style={styles.warningText}>
                                        Musisz dodać przynajmniej jedno zdjęcie do kampanii.
                                    </Text>
                                </View>
                            )}
                            {images.length > 0 && (
                                <View style={styles.imagesList}>
                                    {images.map((image, index) => (
                                        <View key={index} style={styles.imageCard}>
                                            {(image.preview || image.image_url) && (
                                                <Image 
                                                    source={{ uri: image.preview || (image.image_url ? getResourceURL(image.image_url) : '') }} 
                                                    style={styles.imagePreviewForm} 
                                                />
                                            )}
                                            <View style={styles.imageCardContent}>
                                                <TextInput
                                                    placeholder="Tekst alternatywny (opcjonalne)"
                                                    value={image.alt_text || ''}
                                                    onChangeText={(text) => updateImageAltText(index, text)}
                                                    style={styles.imageAltInputForm}
                                                />
                                                <TouchableOpacity
                                                    style={styles.removeImageButtonForm}
                                                    onPress={() => removeImage(index)}
                                                >
                                                    <MaterialIcons name="delete" size={20} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Sekcja widełek nagród */}
                        <View style={styles.formCard}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Widełki nagród dla inwestorów <Text style={styles.required}>*</Text></Text>
                                    <Text style={styles.sectionSubtitle}>Wymagane przynajmniej trzy widełki</Text>
                                </View>
                                <TouchableOpacity style={styles.addTierButton} onPress={addRewardTier}>
                                    <MaterialIcons name="add" size={20} color="#8b5cf6" />
                                    {/* <Text style={styles.addTierButtonText}>Dodaj widełkę</Text> */}
                                </TouchableOpacity>
                            </View>
                            {rewardTiers.length < 3 && (
                                <View style={styles.warningBox}>
                                    <MaterialIcons name="warning" size={20} color="#f59e0b" />
                                    <Text style={styles.warningText}>
                                        Musisz dodać przynajmniej trzy widełki nagród. 
                                        {rewardTiers.length > 0 && ` Dodano: ${rewardTiers.length}/3`}
                                    </Text>
                                </View>
                            )}
                            {rewardTiers.map((tier, index) => (
                                <View key={index} style={styles.rewardTierCardForm}>
                                    <View style={styles.rewardTierHeaderForm}>
                                        <Text style={styles.rewardTierNumber}>Widełka {index + 1}</Text>
                                        <TouchableOpacity onPress={() => removeRewardTier(index)} style={styles.removeTierButton}>
                                            <MaterialIcons name="delete" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.rewardTierFields}>
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Nazwa widełki <Text style={styles.required}>*</Text></Text>
                                            <TextInput
                                                placeholder="np. Wsparcie podstawowe"
                                                value={tier.title}
                                                onChangeText={(text) => updateRewardTier(index, 'title', text)}
                                                style={styles.formInput}
                                            />
                                        </View>
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Opis nagrody <Text style={styles.required}>*</Text></Text>
                                            <TextInput
                                                placeholder="Opisz szczegółowo co inwestor otrzyma..."
                                                value={tier.description}
                                                onChangeText={(text) => updateRewardTier(index, 'description', text)}
                                                style={[styles.formInput, styles.formTextArea]}
                                                multiline
                                                numberOfLines={3}
                                            />
                                        </View>
                                        <View style={styles.sliderContainer}>
                                            <Text style={styles.formLabel}>Zakres procentowy celu kampanii</Text>
                                            <View style={styles.sliderRow}>
                                                <Text style={styles.sliderLabel}>Od: <Text style={styles.sliderValue}>{tier.min_percentage}%</Text></Text>
                                                <Text style={styles.sliderLabel}>Do: <Text style={styles.sliderValue}>{tier.max_percentage || 100}%</Text></Text>
                                                <Text style={styles.sliderLabel}>Zakres: <Text style={styles.sliderValue}>{((tier.max_percentage || 100) - tier.min_percentage).toFixed(1)}%</Text></Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                <Text style={{ width: 50, fontSize: 12 }}>{tier.min_percentage}%</Text>
                                                <Slider
                                                    style={{ flex: 1, height: 40 }}
                                                    minimumValue={0}
                                                    maximumValue={100}
                                                    value={tier.min_percentage}
                                                    onValueChange={(value: number) => {
                                                        const newMin = Math.floor(value);
                                                        const newMax = Math.max(newMin + 1, tier.max_percentage);
                                                        updateRewardTierRange(index, newMin, newMax);
                                                    }}
                                                    step={1}
                                                    minimumTrackTintColor="#8b5cf6"
                                                    maximumTrackTintColor="#e5e7eb"
                                                    thumbTintColor="#8b5cf6"
                                                />
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                <Text style={{ width: 50, fontSize: 12 }}>{tier.max_percentage}%</Text>
                                                <Slider
                                                    style={{ flex: 1, height: 40 }}
                                                    minimumValue={tier.min_percentage + 1}
                                                    maximumValue={100}
                                                    value={tier.max_percentage}
                                                    onValueChange={(value: number) => {
                                                        const newMax = Math.floor(value);
                                                        updateRewardTierRange(index, tier.min_percentage, newMax);
                                                    }}
                                                    step={1}
                                                    minimumTrackTintColor="#8b5cf6"
                                                    maximumTrackTintColor="#e5e7eb"
                                                    thumbTintColor="#8b5cf6"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                    </ScrollView>

                    {/* Fixed Bottom Panel */}
                    <View style={styles.formActionsFixed}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit(onSubmit)}
                            disabled={false}
                        >
                            <Text style={styles.submitButtonText}>Utwórz kampanię</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
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


    if (selectedCampaign && isEditingCampaign) {
        // Tryb edycji - pokaż formularz
        return (
            <RequirePermission permission="view_dashboard" navigation={navigation}>
                <LinearGradient
                    colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    {/* Fixed Header */}
                    <View style={styles.formHeaderFixed}>
                        <Text style={styles.formTitleFixed}>Edytuj kampanię</Text>
                        <TouchableOpacity onPress={() => {
                            setIsEditingCampaign(false);
                            reset(); // Resetuj formularz
                            setImages([]);
                            setRewardTiers([]);
                            setSelectedCity(null);
                            if (selectedCampaign) {
                                handleShowDetails(selectedCampaign);
                            }
                        }} style={styles.closeFormButton}>
                            <MaterialIcons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.formScrollView}
                        contentContainerStyle={styles.formContent}
                        showsVerticalScrollIndicator={false}
                    >

                        {/* Formularz */}
                        <View style={styles.formCard}>
                            {/* Tytuł i Kategoria */}
                            <View style={styles.formRow}>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Tytuł kampanii <Text style={styles.required}>*</Text></Text>
                                    <Controller
                                        control={control}
                                        name="title"
                                        rules={{ required: 'Tytuł jest wymagany' }}
                                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                                            <>
                                                <TextInput
                                                    placeholder="Wprowadź tytuł kampanii"
                                                    value={value}
                                                    onChangeText={onChange}
                                                    style={[styles.formInput, error && styles.formInputError]}
                                                />
                                                {error && <Text style={styles.error}>{error.message}</Text>}
                                            </>
                                        )}
                                    />
                                </View>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Kategoria <Text style={styles.required}>*</Text></Text>
                                    <Controller
                                        control={control}
                                        name="category_id"
                                        rules={{ required: 'Kategoria jest wymagana' }}
                                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                                            <>
                                                <View style={[styles.pickerWrapper, error && styles.formInputError]}>
                                                    <Picker
                                                        selectedValue={value}
                                                        onValueChange={onChange}
                                                        style={styles.picker}
                                                    >
                                                        <Picker.Item label="Wybierz kategorię" value="" />
                                                        {categories.map(cat => (
                                                            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                                                        ))}
                                                    </Picker>
                                                </View>
                                                {error && <Text style={styles.error}>{error.message}</Text>}
                                                {value && categories.find(c => c.id === value)?.description && (
                                                    <Text style={styles.formHint}>
                                                        {categories.find(c => c.id === value)?.description}
                                                    </Text>
                                                )}
                                            </>
                                        )}
                                    />
                                </View>
                            </View>

                            {/* Opis */}
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Opis kampanii</Text>
                                <Controller
                                    control={control}
                                    name="description"
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            placeholder="Opisz szczegółowo swoją kampanię..."
                                            value={value}
                                            onChangeText={onChange}
                                            style={[styles.formInput, styles.formTextArea]}
                                            multiline
                                            numberOfLines={4}
                                        />
                                    )}
                                />
                            </View>

                            {/* Cel */}
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Cel (PLN) <Text style={styles.required}>*</Text></Text>
                                <Controller
                                    control={control}
                                    name="goal_amount"
                                    rules={{ required: 'Cel finansowy jest wymagany', min: { value: 1, message: 'Kwota musi być większa od 0' } }}
                                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                                        <>
                                            <TextInput
                                                placeholder="0"
                                                value={value}
                                                onChangeText={onChange}
                                                style={[styles.formInput, error && styles.formInputError]}
                                                keyboardType="numeric"
                                            />
                                            {error && <Text style={styles.error}>{error.message}</Text>}
                                        </>
                                    )}
                                />
                            </View>

                            {/* Miasto */}
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>
                                    <MaterialIcons name="location-on" size={16} color="#16a34a" /> Miasto <Text style={styles.required}>*</Text>
                                </Text>
                                <RegionSearchBox
                                    filterType="city"
                                    placeholder="Wyszukaj miasto..."
                                    onSelect={(region) => {
                                        if (region) {
                                            setSelectedCity(region);
                                            control._formValues.region = region.id;
                                        } else {
                                            setSelectedCity(null);
                                            control._formValues.region = '';
                                        }
                                    }}
                                    value={selectedCity}
                                />
                                {selectedCity && (
                                    <View style={styles.selectedCityContainer}>
                                        <MaterialIcons name="check-circle" size={16} color="#16a34a" />
                                        <Text style={styles.selectedCityText}>Wybrano: {selectedCity.name}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Deadline */}
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Termin zakończenia <Text style={styles.required}>*</Text></Text>
                                <DatePicker control={control} name="deadline" />
                            </View>
                        </View>

                        {/* Sekcja zdjęć */}
                        <View style={styles.formCard}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Zdjęcia kampanii <Text style={styles.required}>*</Text></Text>
                                    <Text style={styles.sectionSubtitle}>Wymagane przynajmniej jedno zdjęcie</Text>
                                </View>
                                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                                    <MaterialIcons name="image" size={20} color="#16a34a" />
                                    {/* <Text style={styles.addImageButtonText}>Dodaj zdjęcie</Text> */}
                                </TouchableOpacity>
                            </View>
                            {images.length === 0 && (
                                <View style={styles.warningBox}>
                                    <MaterialIcons name="warning" size={20} color="#f59e0b" />
                                    <Text style={styles.warningText}>
                                        Musisz dodać przynajmniej jedno zdjęcie do kampanii.
                                    </Text>
                                </View>
                            )}
                            {images.length > 0 && (
                                <View style={styles.imagesList}>
                                    {images.map((image, index) => (
                                        <View key={index} style={styles.imageCard}>
                                            {(image.preview || image.image_url) && (
                                                <Image 
                                                    source={{ uri: image.preview || (image.image_url ? getResourceURL(image.image_url) : '') }} 
                                                    style={styles.imagePreviewForm} 
                                                />
                                            )}
                                            <View style={styles.imageCardContent}>
                                                <TextInput
                                                    placeholder="Tekst alternatywny (opcjonalne)"
                                                    value={image.alt_text || ''}
                                                    onChangeText={(text) => updateImageAltText(index, text)}
                                                    style={styles.imageAltInputForm}
                                                />
                                                <TouchableOpacity
                                                    style={styles.removeImageButtonForm}
                                                    onPress={() => removeImage(index)}
                                                >
                                                    <MaterialIcons name="delete" size={20} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Sekcja widełek nagród */}
                        <View style={styles.formCard}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Widełki nagród dla inwestorów <Text style={styles.required}>*</Text></Text>
                                    <Text style={styles.sectionSubtitle}>Wymagane przynajmniej trzy widełki</Text>
                                </View>
                                <TouchableOpacity style={styles.addTierButton} onPress={addRewardTier}>
                                    <MaterialIcons name="add" size={20} color="#8b5cf6" />
                                    {/* <Text style={styles.addTierButtonText}>Dodaj widełkę</Text> */}
                                </TouchableOpacity>
                            </View>
                            {rewardTiers.length < 3 && (
                                <View style={styles.warningBox}>
                                    <MaterialIcons name="warning" size={20} color="#f59e0b" />
                                    <Text style={styles.warningText}>
                                        Musisz dodać przynajmniej trzy widełki nagród. 
                                        {rewardTiers.length > 0 && ` Dodano: ${rewardTiers.length}/3`}
                                    </Text>
                                </View>
                            )}
                            {rewardTiers.map((tier, index) => (
                                <View key={index} style={styles.rewardTierCardForm}>
                                    <View style={styles.rewardTierHeaderForm}>
                                        <Text style={styles.rewardTierNumber}>Widełka {index + 1}</Text>
                                        <TouchableOpacity onPress={() => removeRewardTier(index)} style={styles.removeTierButton}>
                                            <MaterialIcons name="delete" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.rewardTierFields}>
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Nazwa widełki <Text style={styles.required}>*</Text></Text>
                                            <TextInput
                                                placeholder="np. Wsparcie podstawowe"
                                                value={tier.title}
                                                onChangeText={(text) => updateRewardTier(index, 'title', text)}
                                                style={styles.formInput}
                                            />
                                        </View>
                                        <View style={styles.formField}>
                                            <Text style={styles.formLabel}>Opis nagrody <Text style={styles.required}>*</Text></Text>
                                            <TextInput
                                                placeholder="Opisz szczegółowo co inwestor otrzyma..."
                                                value={tier.description}
                                                onChangeText={(text) => updateRewardTier(index, 'description', text)}
                                                style={[styles.formInput, styles.formTextArea]}
                                                multiline
                                                numberOfLines={3}
                                            />
                                        </View>
                                        <View style={styles.sliderContainer}>
                                            <Text style={styles.formLabel}>Zakres procentowy celu kampanii</Text>
                                            <View style={styles.sliderRow}>
                                                <Text style={styles.sliderLabel}>Od: <Text style={styles.sliderValue}>{tier.min_percentage}%</Text></Text>
                                                <Text style={styles.sliderLabel}>Do: <Text style={styles.sliderValue}>{tier.max_percentage || 100}%</Text></Text>
                                                <Text style={styles.sliderLabel}>Zakres: <Text style={styles.sliderValue}>{((tier.max_percentage || 100) - tier.min_percentage).toFixed(1)}%</Text></Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                <Text style={{ width: 50, fontSize: 12 }}>{tier.min_percentage}%</Text>
                                                <Slider
                                                    style={{ flex: 1, height: 40 }}
                                                    minimumValue={0}
                                                    maximumValue={100}
                                                    value={tier.min_percentage}
                                                    onValueChange={(value: number) => {
                                                        const newMin = Math.floor(value);
                                                        const newMax = Math.max(newMin + 1, tier.max_percentage);
                                                        updateRewardTierRange(index, newMin, newMax);
                                                    }}
                                                    step={1}
                                                    minimumTrackTintColor="#8b5cf6"
                                                    maximumTrackTintColor="#e5e7eb"
                                                    thumbTintColor="#8b5cf6"
                                                />
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                <Text style={{ width: 50, fontSize: 12 }}>{tier.max_percentage}%</Text>
                                                <Slider
                                                    style={{ flex: 1, height: 40 }}
                                                    minimumValue={tier.min_percentage + 1}
                                                    maximumValue={100}
                                                    value={tier.max_percentage}
                                                    onValueChange={(value: number) => {
                                                        const newMax = Math.floor(value);
                                                        updateRewardTierRange(index, tier.min_percentage, newMax);
                                                    }}
                                                    step={1}
                                                    minimumTrackTintColor="#8b5cf6"
                                                    maximumTrackTintColor="#e5e7eb"
                                                    thumbTintColor="#8b5cf6"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                    </ScrollView>

                    {/* Fixed Bottom Panel */}
                    <View style={styles.formActionsFixed}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleUpdateCampaign}
                            disabled={false}
                        >
                            <Text style={styles.submitButtonText}>Zapisz zmiany</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </RequirePermission>
        );
    }

    if (selectedCampaign) {
        const statusColors = getStatusColor(selectedCampaign.status);
        const percent = selectedCampaign.goal_amount > 0 
            ? Math.min(Math.round((selectedCampaign.current_amount / selectedCampaign.goal_amount) * 100), 100)
            : 0;
        const daysRemaining = selectedCampaign.deadline 
            ? Math.ceil((new Date(selectedCampaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return (
            <RequirePermission permission="view_dashboard" navigation={navigation}>
                <LinearGradient
                    colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    {/* Fixed Header */}
                    <View style={styles.detailsHeaderFixed}>
                        <TouchableOpacity onPress={handleCloseDetails} style={styles.backButtonDetails}>
                            <MaterialIcons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.detailsTitleFixed} numberOfLines={1} ellipsizeMode="tail">
                            {selectedCampaign.title}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                            <Text style={[styles.statusText, { color: statusColors.text }]}>
                                {selectedCampaign.status === 'active' ? 'Aktywna' : 
                                 selectedCampaign.status === 'draft' ? 'Szkic' :
                                 selectedCampaign.status === 'successful' ? 'Sukces' :
                                 selectedCampaign.status === 'closed' ? 'Zamknięta' : selectedCampaign.status}
                            </Text>
                        </View>
                    </View>

                    <ScrollView 
                        style={styles.detailsScrollView}
                        contentContainerStyle={styles.detailsContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Opis kampanii */}
                        {selectedCampaign.description && (
                            <View style={styles.detailsCard}>
                                <Text style={styles.cardTitle}>Opis kampanii</Text>
                                <Text style={styles.detailsDescription}>{selectedCampaign.description}</Text>
                            </View>
                        )}

                        {/* Postęp kampanii */}
                        <View style={styles.detailsCard}>
                            <Text style={styles.cardTitle}>Postęp kampanii</Text>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${percent}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{percent}%</Text>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <MaterialIcons name="flag" size={20} color="#6b7280" />
                                    <Text style={styles.statLabel}>Cel</Text>
                                    <Text style={styles.statValue}>{formatCurrency(selectedCampaign.goal_amount || 0)}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <MaterialIcons name="trending-up" size={20} color="#16a34a" />
                                    <Text style={styles.statLabel}>Zebrano</Text>
                                    <Text style={[styles.statValue, { color: '#16a34a' }]}>{formatCurrency(selectedCampaign.current_amount || 0)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Informacje podstawowe */}
                        <View style={styles.detailsCard}>
                            <Text style={styles.cardTitle}>Informacje podstawowe</Text>
                            
                            {selectedCampaign.category_rel && (
                                <View style={styles.infoRow}>
                                    <MaterialIcons name="category" size={20} color="#6b7280" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Kategoria</Text>
                                        <Text style={styles.infoValue}>{selectedCampaign.category_rel.name}</Text>
                                        {selectedCampaign.category_rel.description && (
                                            <Text style={styles.infoDescription}>{selectedCampaign.category_rel.description}</Text>
                                        )}
                                    </View>
                                </View>
                            )}

                            {selectedCampaign.region && (
                                <View style={styles.infoRow}>
                                    <MaterialIcons name="location-on" size={20} color="#6b7280" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Miasto</Text>
                                        <Text style={styles.infoValue}>{selectedCampaign.region}</Text>
                                    </View>
                                </View>
                            )}

                            {selectedCampaign.deadline && (
                                <View style={styles.infoRow}>
                                    <MaterialIcons name="schedule" size={20} color="#6b7280" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Termin zakończenia</Text>
                                        <Text style={styles.infoValue}>
                                            {new Date(selectedCampaign.deadline).toLocaleDateString('pl-PL', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Text>
                                        {daysRemaining !== null && daysRemaining > 0 && (
                                            <Text style={styles.infoDescription}>
                                                Pozostało: {daysRemaining} {daysRemaining === 1 ? 'dzień' : 'dni'}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Zdjęcia kampanii */}
                        {selectedCampaign.images && selectedCampaign.images.length > 0 && (
                            <View style={styles.detailsCard}>
                                <Text style={styles.cardTitle}>Zdjęcia kampanii</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                                    {selectedCampaign.images
                                        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                                        .map((image: any) => (
                                            <View key={image.id} style={styles.imageContainer}>
                                                <Image
                                                    source={{ uri: getResourceURL(image.image_url) }}
                                                    style={styles.campaignImage}
                                                />
                                                {image.alt_text && (
                                                    <Text style={styles.imageAltText} numberOfLines={2}>{image.alt_text}</Text>
                                                )}
                                            </View>
                                        ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Widełki nagród */}
                        {selectedCampaign.reward_tiers && selectedCampaign.reward_tiers.length > 0 && (
                            <View style={styles.detailsCard}>
                                <Text style={styles.cardTitle}>Widełki nagród dla inwestorów</Text>
                                {selectedCampaign.reward_tiers
                                    .sort((a: any, b: any) => a.min_percentage - b.min_percentage)
                                    .map((tier: any, index: number) => (
                                        <View key={tier.id || index} style={styles.rewardTierCard}>
                                            <View style={styles.rewardTierHeader}>
                                                <Text style={styles.rewardTierTitle}>{tier.title}</Text>
                                                <View style={styles.rewardTierBadge}>
                                                    <Text style={styles.rewardTierPercentage}>
                                                        {tier.min_percentage}% - {tier.max_percentage || 100}%
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.rewardTierDescription}>{tier.description}</Text>
                                            {tier.estimated_delivery_date && (
                                                <View style={styles.rewardTierFooter}>
                                                    <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
                                                    <Text style={styles.rewardTierDate}>
                                                        Szacowana data dostawy: {new Date(tier.estimated_delivery_date).toLocaleDateString('pl-PL')}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                            </View>
                        )}
                        {/* Statystyki */}
                        {statsLoading ? (
                            <View style={styles.detailsCard}>
                                <ActivityIndicator size="large" color="#16a34a" />
                                <Text style={styles.loadingText}>Ładowanie statystyk...</Text>
                            </View>
                        ) : campaignStats ? (
                            <View style={styles.detailsCard}>
                                <Text style={styles.cardTitle}>Statystyki kampanii</Text>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <MaterialIcons name="people" size={24} color="#16a34a" />
                                        <Text style={styles.statCardValue}>{campaignStats.investors_count ?? '-'}</Text>
                                        <Text style={styles.statCardLabel}>Inwestorów</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <MaterialIcons name="account-balance-wallet" size={24} color="#16a34a" />
                                        <Text style={styles.statCardValue}>{campaignStats.investments_count ?? '-'}</Text>
                                        <Text style={styles.statCardLabel}>Inwestycji</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <MaterialIcons name="attach-money" size={24} color="#f59e0b" />
                                        <Text style={styles.statCardValue}>
                                            {campaignStats.max_investment ? formatCurrency(campaignStats.max_investment) : '-'}
                                        </Text>
                                        <Text style={styles.statCardLabel}>Największa inwestycja</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <MaterialIcons name="payment" size={24} color="#8b5cf6" />
                                        <Text style={styles.statCardValue}>{campaignStats.payout_status ?? '-'}</Text>
                                        <Text style={styles.statCardLabel}>Status payoutu</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.exportButtons}>
                                    <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
                                        <MaterialIcons name="file-download" size={20} color="#16a34a" />
                                        <Text style={styles.exportButtonText}>Eksportuj CSV</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
                                        <MaterialIcons name="picture-as-pdf" size={20} color="#ef4444" />
                                        <Text style={styles.exportButtonText}>Eksportuj PDF</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null}

                    </ScrollView>

                    {/* Fixed Bottom Panel */}
                    <View style={styles.detailsActionsFixed}>
                        {selectedCampaign.status === 'draft' && (
                            <TouchableOpacity
                                style={styles.publishButton}
                                onPress={async () => {
                                    try {
                                        await API.patch(`/campaigns/${selectedCampaign.id}/status`, { status: 'active' });
                                        Alert.alert('Sukces', 'Kampania została opublikowana!');
                                        const token = await AsyncStorage.getItem('authToken');
                                        if (token) {
                                            const res = await API.get('/campaigns/my', {
                                                headers: { Authorization: `Bearer ${token}` },
                                            });
                                            setCampaigns(res.data);
                                            await handleShowDetails(selectedCampaign);
                                        }
                                    } catch (e: any) {
                                        if (e?.response?.status === 401) {
                                            Alert.alert('Błąd', 'Sesja wygasła. Zaloguj się ponownie.');
                                        } else {
                                            Alert.alert('Błąd', e?.response?.data?.detail || 'Nie udało się opublikować kampanii');
                                        }
                                    }
                                }}
                            >
                                <Text style={styles.publishButtonText}>Opublikuj</Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity style={styles.actionButton} onPress={handleEditCampaign}>
                            {/* <MaterialIcons name="edit" size={20} color="#3b82f6" /> */}
                            <Text style={styles.actionButtonText}>Edytuj</Text>
                        </TouchableOpacity>
                        
                        {selectedCampaign.status !== 'closed' && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.closeButtonDetails]}
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
                            >
                                {/* <MaterialIcons name="close" size={20} color="#ef4444" /> */}
                                <Text style={[styles.actionButtonText, styles.closeButtonTextDetails]}>Zamknij</Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleShowInvestors(selectedCampaign.id)}>
                            {/* <MaterialIcons name="people" size={20} color="#16a34a" /> */}
                            <Text style={styles.actionButtonText}>Inwestorzy</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </RequirePermission>
        );
    }

    return (
        <RequirePermission permission="view_dashboard" navigation={navigation}>
            <LinearGradient
                colors={['#f9fafb', '#ecfdf5', '#eff6ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                {/* Floating Action Button dla nowej kampanii */}
                <TouchableOpacity 
                    onPress={() => setShowAddForm(true)} 
                    style={styles.fab}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#16a34a', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.fabGradient}
                    >
                        <MaterialIcons name="add" size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.content}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#16a34a" />
                            <Text style={styles.loadingText}>Ładowanie kampanii...</Text>
                        </View>
                    ) : campaigns.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="campaign" size={64} color="#9ca3af" />
                            <Text style={styles.emptyTitle}>Brak kampanii</Text>
                            <Text style={styles.emptyText}>Utwórz swoją pierwszą kampanię, aby rozpocząć zbiórkę</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={campaigns}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => {
                                const statusColors = getStatusColor(item.status);
                                const percent = item.goal_amount > 0 
                                    ? Math.min(Math.round((item.current_amount / item.goal_amount) * 100), 100)
                                    : 0;
                                
                                return (
                                    <View style={styles.campaignCard}>
                                        <View style={styles.campaignHeader}>
                                            <Text style={styles.campaignTitle}>{item.title}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                                                <Text style={[styles.statusText, { color: statusColors.text }]}>
                                                    {item.status === 'active' ? 'Aktywna' : 
                                                     item.status === 'draft' ? 'Szkic' :
                                                     item.status === 'successful' ? 'Sukces' :
                                                     item.status === 'closed' ? 'Zamknięta' : item.status}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        {item.description && (
                                            <Text style={styles.campaignDescription} numberOfLines={2}>
                                                {item.description}
                                            </Text>
                                        )}
                                        
                                        <View style={styles.campaignStats}>
                                            <View style={styles.statItem}>
                                                <MaterialIcons name="flag" size={16} color="#6b7280" />
                                                <Text style={styles.statLabel}>Cel:</Text>
                                                <Text style={styles.statValue}>{formatCurrency(item.goal_amount)}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <MaterialIcons name="trending-up" size={16} color="#16a34a" />
                                                <Text style={styles.statLabel}>Zebrano:</Text>
                                                <Text style={styles.statValue}>{formatCurrency(item.current_amount)}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressBar}>
                                                <View style={[styles.progressFill, { width: `${percent}%` }]} />
                                            </View>
                                            <Text style={styles.progressText}>{percent}%</Text>
                                        </View>
                                        
                                        {item.region && (
                                            <View style={styles.regionContainer}>
                                                <MaterialIcons name="location-on" size={16} color="#6b7280" />
                                                <Text style={styles.regionText}>{item.region}</Text>
                                            </View>
                                        )}
                                        
                                        <View style={styles.actions}>
                                            <TouchableOpacity 
                                                onPress={() => handleShowDetails(item)} 
                                                style={styles.detailsButton}
                                            >
                                                <Text style={styles.detailsButtonText}>Szczegóły</Text>
                                            </TouchableOpacity>
                                            {item.status !== 'closed' && (
                                                <TouchableOpacity
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
                                                    style={styles.closeButtonList}
                                                >
                                                    <Text style={styles.closeButtonTextList}>Zamknij</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            }}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </LinearGradient>
        </RequirePermission>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    item: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    campaign: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 15, padding: 12, borderRadius: 8, backgroundColor: '#fff', fontSize: 16 },
    error: { color: '#ef4444', marginBottom: 8, marginLeft: 4, fontSize: 14 },
    pickerWrapper: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 15, overflow: 'hidden', backgroundColor: '#fff' },
    picker: { 
        height: 50, 
        width: '100%',
        borderColor: Colors.gray,
        borderWidth: 1,
     },
    sectionTitleOld: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 10, 
        color: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
        paddingBottom: 10,
    },
    campaignCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    campaignHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    campaignTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    campaignDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        lineHeight: 20,
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
    statItem: {
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
    regionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    regionText: {
        fontSize: 14,
        color: '#6b7280',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    detailsButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#dcfce7',
        borderWidth: 1,
        borderColor: '#16a34a',
    },
    detailsButtonText: {
        color: '#16a34a',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    closeButtonList: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    closeButtonTextList: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 10 : 10, // Tuż nad bottom tab navigator (iOS: 64+28+8=100px, Android: 64+8+8=80px)
        right: 20,
        zIndex: 1000,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#f0fdf4',
    },
    addButtonGradient: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 100,
    },
    imagePreviewContainer: {
        marginRight: 10,
        position: 'relative',
    },
    imagePreview: {
        width: 150,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'red',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    imageAltInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 4,
        fontSize: 12,
    },
    rewardTierContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
    },
    // Style dla szczegółów kampanii
    detailsScrollView: {
        flex: 1,
        marginTop: 60, // Wysokość fixed header
        marginBottom: 90, // Wysokość fixed bottom panel
    },
    detailsContent: {
        padding: 16,
        paddingBottom: 20,
    },
    detailsHeaderFixed: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    detailsTitleFixed: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginHorizontal: 12,
        textAlign: 'center',
    },
    backButtonDetails: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailsTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    detailsDescription: {
        fontSize: 16,
        color: '#6b7280',
        lineHeight: 24,
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        gap: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
    infoDescription: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
    imagesScrollView: {
        marginTop: 12,
    },
    imageContainer: {
        marginRight: 12,
        width: 200,
    },
    campaignImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    imageAltText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
    },
    rewardTierCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    rewardTierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rewardTierTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    rewardTierBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#16a34a',
    },
    rewardTierPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16a34a',
    },
    rewardTierDescription: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 8,
    },
    rewardTierFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    rewardTierDate: {
        fontSize: 12,
        color: '#6b7280',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8,
    },
    statCardValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    statCardLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    exportButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    exportButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8,
    },
    exportButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    detailsActionsFixed: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderTopWidth: 0.5,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
    },
    actionButtons: {
        marginBottom: 20,
    },
    publishButton: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#16a34a',
        minHeight: 48,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: '#f8f9fa',
        minHeight: 48,
        flex: 1,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#212529',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    closeButtonDetails: {
        backgroundColor: '#fff5f5',
        borderColor: '#fee2e2',
    },
    closeButtonTextDetails: {
        color: '#dc2626',
        fontWeight: '600',
    },
    backButtonActionDetails: {
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },
    backButtonTextDetails: {
        color: '#6b7280',
    },
    // Style dla formularzy
    formScrollView: {
        flex: 1,
        marginTop: 70, // Padding dla fixed header
        marginBottom: 90, // Padding dla fixed bottom panel
    },
    formContent: {
        padding: 16,
        paddingBottom: 20,
    },
    formHeaderFixed: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    formTitleFixed: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
    },
    closeFormButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    formRow: {
        flexDirection: 'column',
        marginBottom: 16,
    },
    formField: {
        width: '100%',
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
        color: '#111827',
    },
    formInputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    formTextArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    formHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    selectedCityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#16a34a',
    },
    selectedCityText: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    addImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#16a34a',
    },
    addImageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#16a34a',
    },
    addTierButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f5f3ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8b5cf6',
    },
    addTierButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8b5cf6',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#fef3c7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f59e0b',
        marginBottom: 16,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#92400e',
        fontWeight: '500',
    },
    imagesList: {
        gap: 12,
    },
    imageCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    imagePreviewForm: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#f3f4f6',
    },
    imageCardContent: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    imageAltInputForm: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#fff',
    },
    removeImageButtonForm: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#fee2e2',
    },
    rewardTierCardForm: {
        backgroundColor: '#f5f3ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9d5ff',
    },
    rewardTierHeaderForm: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    rewardTierNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    removeTierButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#fee2e2',
    },
    rewardTierFields: {
        gap: 12,
    },
    sliderContainer: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginTop: 8,
    },
    sliderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    sliderValue: {
        fontWeight: '700',
        color: '#8b5cf6',
    },
    formActionsFixed: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'column',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderTopWidth: 0.5,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
    },
    formActions: {
        gap: 12,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    submitButton: {
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        backgroundColor: '#16a34a',
        minHeight: 52,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientButtonForm: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#16a34a',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    cancelButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        width: '100%',
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6c757d',
    },
});
