import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RegionSearchBox from '../components/RegionSearchBox';
import { useTheme } from '../contexts/ThemeContext';
import API from '../utils/api';

interface Profile {
    id: string;
    user_id: string;
    name?: string;
    bio?: string;
    location?: string;
    interests?: string[];
    profile_picture_url?: string;
}

interface Company {
    id: string;
    user_id: string;
    nip: string;
    regon?: string;
    krs?: string;
    company_name: string;
    street?: string;
    building_number?: string;
    apartment_number?: string;
    postal_code?: string;
    city?: string;
    country?: string;
    created_at: string;
    updated_at: string;
}

interface RegionCity {
    id: string;
    name: string;
    state_id?: string;
    country_id?: string;
}

interface UserSettings {
    id: string;
    email: string;
    role_id: number;
    role_name: string;
    city_id?: string;
    created_at: string;
    last_login?: string;
    is_verified: boolean;
    profile?: Profile;
    company?: Company;
    city?: RegionCity;
}

export default function SettingsScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [userData, setUserData] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    // Pola zmiany hasła
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Pola edycji firmy
    const [editCompanyName, setEditCompanyName] = useState('');
    const [editNip, setEditNip] = useState('');
    const [editRegon, setEditRegon] = useState('');
    const [editKrs, setEditKrs] = useState('');
    const [editStreet, setEditStreet] = useState('');
    const [editBuildingNumber, setEditBuildingNumber] = useState('');
    const [editApartmentNumber, setEditApartmentNumber] = useState('');
    const [editPostalCode, setEditPostalCode] = useState('');
    const [editCity, setEditCity] = useState<{ id: string; name: string } | null>(null);

    const fetchUserSettings = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
                navigation.navigate('Login');
                return;
            }

            const response = await API.get('/auth/settings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserData(response.data);
            
            // Wypełnij pola edycji danymi z bazy
            if (response.data.company) {
                setEditCompanyName(response.data.company.company_name || '');
                setEditNip(response.data.company.nip || '');
                setEditRegon(response.data.company.regon || '');
                setEditKrs(response.data.company.krs || '');
                setEditStreet(response.data.company.street || '');
                setEditBuildingNumber(response.data.company.building_number || '');
                setEditApartmentNumber(response.data.company.apartment_number || '');
                setEditPostalCode(response.data.company.postal_code || '');
            }
            
            if (response.data.city) {
                setEditCity({ id: response.data.city_id, name: response.data.city.name });
            }
        } catch (error: any) {
            console.error('Error fetching user settings:', error);
            Alert.alert(
                'Błąd',
                error?.response?.data?.detail || 'Nie udało się pobrać danych użytkownika'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleEditCompany = () => {
        setIsEditingCompany(true);
    };

    const handleCancelEdit = () => {
        setIsEditingCompany(false);
        
        // Przywróć oryginalne wartości
        if (userData?.company) {
            setEditCompanyName(userData.company.company_name || '');
            setEditNip(userData.company.nip || '');
            setEditRegon(userData.company.regon || '');
            setEditKrs(userData.company.krs || '');
            setEditStreet(userData.company.street || '');
            setEditBuildingNumber(userData.company.building_number || '');
            setEditApartmentNumber(userData.company.apartment_number || '');
            setEditPostalCode(userData.company.postal_code || '');
        }
        if (userData?.city) {
            setEditCity({ id: userData.city_id!, name: userData.city.name });
        }
    };

    const handleSaveCompany = async () => {
        setIsSaving(true);

        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
                setIsSaving(false);
                return;
            }

            // Aktualizuj dane firmy
            await API.put('/auth/settings/company', {
                company_name: editCompanyName,
                nip: editNip,
                regon: editRegon || null,
                krs: editKrs || null,
                street: editStreet || null,
                building_number: editBuildingNumber || null,
                apartment_number: editApartmentNumber || null,
                postal_code: editPostalCode || null,
                city: editCity?.name || null,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Aktualizuj city_id użytkownika
            if (editCity) {
                await API.put('/auth/settings/user', {
                    city_id: editCity.id,
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            Alert.alert('Sukces', 'Dane zostały zaktualizowane pomyślnie!');
            setIsEditingCompany(false);

            // Odśwież dane
            fetchUserSettings();
        } catch (error: any) {
            console.error('Error saving company data:', error);
            Alert.alert(
                'Błąd',
                error?.response?.data?.detail || 'Nie udało się zaktualizować danych'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setIsChangingPassword(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
                navigation.navigate('Login');
                return;
            }

            await API.put('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Alert.alert('Sukces', 'Hasło zostało pomyślnie zmienione!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            Alert.alert(
                'Błąd',
                error?.response?.data?.detail || 'Nie udało się zmienić hasła'
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Usuń konto',
            'Czy na pewno chcesz usunąć swoje konto?\n\n' +
            'Ta operacja jest nieodwracalna i spowoduje:\n' +
            '• Usunięcie wszystkich danych osobowych\n' +
            '• Usunięcie wszystkich kampanii (jeśli jesteś przedsiębiorcą)\n' +
            '• Usunięcie historii inwestycji (jeśli jesteś inwestorem)\n' +
            '• Utratę dostępu do konta',
            [
                {
                    text: 'Anuluj',
                    style: 'cancel',
                },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            if (!token) {
                                Alert.alert('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
                                navigation.navigate('Login');
                                return;
                            }

                            await API.delete('/auth/me', {
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            // Wyloguj użytkownika
                            await AsyncStorage.multiRemove(['authToken', 'userRole', 'userPermissions']);

                            Alert.alert('Sukces', 'Twoje konto zostało pomyślnie usunięte');

                            // Przekieruj do logowania
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                })
                            );
                        } catch (error: any) {
                            console.error('Error deleting account:', error);
                            Alert.alert(
                                'Błąd',
                                error?.response?.data?.detail || 'Nie udało się usunąć konta'
                            );
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    useEffect(() => {
        fetchUserSettings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUserSettings();
    };

    const getRoleDisplayName = (roleName: string) => {
        switch (roleName) {
            case 'entrepreneur':
                return 'Przedsiębiorca';
            case 'investor':
                return 'Inwestor';
            case 'admin':
                return 'Administrator';
            default:
                return 'Użytkownik';
        }
    };

    if (loading) {
        return (
            <LinearGradient
                colors={theme.colors.gradient.start as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                        Ładowanie danych...
                    </Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={theme.colors.gradient.start as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {userData && (
                    <>
                        {/* Typ użytkownika */}
                        <View style={[styles.card, styles.roleCard, { backgroundColor: theme.colors.primary }]}>
                            <View style={styles.roleContent}>
                                <MaterialIcons name="person" size={40} color="#fff" />
                                <View style={styles.roleTextContainer}>
                                    <Text style={styles.roleTitle}>
                                        {getRoleDisplayName(userData.role_name)}
                                    </Text>
                                    <Text style={styles.roleSubtitle}>Typ konta</Text>
                                </View>
                            </View>
                        </View>

                        {/* Informacje o koncie */}
                        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.cardHeader}>
                                <MaterialIcons name="account-circle" size={24} color={theme.colors.primary} />
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                    Informacje o koncie
                                </Text>
                            </View>
                            <View style={styles.cardContent}>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                        Email
                                    </Text>
                                    <View style={styles.infoValueContainer}>
                                        <MaterialIcons name="email" size={18} color={theme.colors.primary} />
                                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                            {userData.email}
                                        </Text>
                                    </View>
                                </View>

                                {userData.profile?.name && (
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                            Imię i nazwisko
                                        </Text>
                                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                            {userData.profile.name}
                                        </Text>
                                    </View>
                                )}

                                {userData.profile?.bio && (
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                            Bio
                                        </Text>
                                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                            {userData.profile.bio}
                                        </Text>
                                    </View>
                                )}

                                {userData.city && (
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                            Lokalizacja
                                        </Text>
                                        <View style={styles.infoValueContainer}>
                                            <MaterialIcons name="location-on" size={18} color={theme.colors.primary} />
                                            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                                {userData.city.name}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                        Status weryfikacji
                                    </Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: userData.is_verified ? '#d1fae5' : '#fef3c7' }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: userData.is_verified ? '#065f46' : '#92400e' }
                                        ]}>
                                            {userData.is_verified ? 'Zweryfikowane' : 'Niezweryfikowane'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                        Data utworzenia konta
                                    </Text>
                                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                        {new Date(userData.created_at).toLocaleDateString('pl-PL', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Dane firmy - tylko dla przedsiębiorców */}
                        {userData.role_name === 'entrepreneur' && userData.company && (
                            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                                <View style={[styles.cardHeader, styles.cardHeaderWithButton]}>
                                    <View style={styles.cardHeaderLeft}>
                                        <MaterialIcons name="business" size={24} color="#3b82f6" />
                                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                            Dane firmy
                                        </Text>
                                    </View>
                                    {!isEditingCompany && (
                                        <TouchableOpacity
                                            onPress={handleEditCompany}
                                            style={styles.editButton}
                                        >
                                            <MaterialIcons name="edit" size={20} color="#fff" />
                                            <Text style={styles.editButtonText}>Edytuj</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {!isEditingCompany ? (
                                    <View style={styles.cardContent}>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                            Nazwa firmy
                                        </Text>
                                        <Text style={[styles.infoValue, styles.companyName, { color: theme.colors.text }]}>
                                            {userData.company.company_name}
                                        </Text>
                                    </View>

                                    <View style={styles.companyDetailsGrid}>
                                        <View style={styles.companyDetailItem}>
                                            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                                NIP
                                            </Text>
                                            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                                {userData.company.nip}
                                            </Text>
                                        </View>

                                        {userData.company.regon && (
                                            <View style={styles.companyDetailItem}>
                                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                                    REGON
                                                </Text>
                                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                                    {userData.company.regon}
                                                </Text>
                                            </View>
                                        )}

                                        {userData.company.krs && (
                                            <View style={styles.companyDetailItem}>
                                                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                                    KRS
                                                </Text>
                                                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                                    {userData.company.krs}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {(userData.company.street || userData.company.city) && (
                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                                Adres
                                            </Text>
                                            <View style={styles.addressContainer}>
                                                <View style={styles.addressIconContainer}>
                                                    <MaterialIcons name="location-on" size={18} color="#3b82f6" />
                                                </View>
                                                <View style={styles.addressTextContainer}>
                                                    {userData.company.street && (
                                                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                                            {userData.company.street} {userData.company.building_number}
                                                            {userData.company.apartment_number && `/${userData.company.apartment_number}`}
                                                        </Text>
                                                    )}
                                                    {userData.company.postal_code && userData.company.city && (
                                                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                                            {userData.company.postal_code} {userData.company.city}
                                                        </Text>
                                                    )}
                                                    {userData.company.country && (
                                                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                                                            {userData.company.country}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                                ) : (
                                    /* Formularz edycji */
                                    <View style={styles.cardContent}>
                                        <View style={styles.formGroup}>
                                            <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                Nazwa firmy *
                                                {userData.company?.company_name && (
                                                    <Text style={styles.disabledNote}> (nie można zmienić)</Text>
                                                )}
                                            </Text>
                                            <TextInput
                                                style={[styles.input, { 
                                                    backgroundColor: userData.company?.company_name ? '#e5e7eb' : theme.colors.background, 
                                                    color: userData.company?.company_name ? '#6b7280' : theme.colors.text,
                                                    borderColor: theme.colors.border 
                                                }]}
                                                value={editCompanyName}
                                                onChangeText={setEditCompanyName}
                                                placeholder="Nazwa firmy"
                                                placeholderTextColor={theme.colors.textSecondary}
                                                editable={!userData.company?.company_name}
                                            />
                                        </View>

                                        <View style={styles.formRow}>
                                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                    NIP *
                                                    <Text style={styles.disabledNote}> (nie można zmienić)</Text>
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, { 
                                                        backgroundColor: '#e5e7eb', 
                                                        color: '#6b7280',
                                                        borderColor: theme.colors.border 
                                                    }]}
                                                    value={editNip}
                                                    placeholder="NIP"
                                                    placeholderTextColor={theme.colors.textSecondary}
                                                    editable={false}
                                                />
                                            </View>

                                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                    REGON
                                                    {editRegon && (
                                                        <Text style={styles.disabledNote}> (nie można zmienić)</Text>
                                                    )}
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, { 
                                                        backgroundColor: editRegon ? '#e5e7eb' : theme.colors.background, 
                                                        color: editRegon ? '#6b7280' : theme.colors.text,
                                                        borderColor: theme.colors.border 
                                                    }]}
                                                    value={editRegon}
                                                    onChangeText={setEditRegon}
                                                    placeholder="REGON"
                                                    placeholderTextColor={theme.colors.textSecondary}
                                                    editable={!editRegon}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.formGroup}>
                                            <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                KRS
                                            </Text>
                                            <TextInput
                                                style={[styles.input, { 
                                                    backgroundColor: theme.colors.background, 
                                                    color: theme.colors.text,
                                                    borderColor: theme.colors.border 
                                                }]}
                                                value={editKrs}
                                                onChangeText={setEditKrs}
                                                placeholder="KRS"
                                                placeholderTextColor={theme.colors.textSecondary}
                                            />
                                        </View>

                                        <View style={styles.formGroup}>
                                            <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                Miasto *
                                            </Text>
                                            <RegionSearchBox
                                                onSelect={(region) => setEditCity(region ? { id: region.id, name: region.name } : null)}
                                                placeholder="Wybierz miasto"
                                                filterType="city"
                                            />
                                        </View>

                                        <View style={styles.formRow}>
                                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                    Ulica
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, { 
                                                        backgroundColor: theme.colors.background, 
                                                        color: theme.colors.text,
                                                        borderColor: theme.colors.border 
                                                    }]}
                                                    value={editStreet}
                                                    onChangeText={setEditStreet}
                                                    placeholder="Ulica"
                                                    placeholderTextColor={theme.colors.textSecondary}
                                                />
                                            </View>

                                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                    Nr budynku
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, { 
                                                        backgroundColor: theme.colors.background, 
                                                        color: theme.colors.text,
                                                        borderColor: theme.colors.border 
                                                    }]}
                                                    value={editBuildingNumber}
                                                    onChangeText={setEditBuildingNumber}
                                                    placeholder="Nr budynku"
                                                    placeholderTextColor={theme.colors.textSecondary}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.formRow}>
                                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                    Nr lokalu
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, { 
                                                        backgroundColor: theme.colors.background, 
                                                        color: theme.colors.text,
                                                        borderColor: theme.colors.border 
                                                    }]}
                                                    value={editApartmentNumber}
                                                    onChangeText={setEditApartmentNumber}
                                                    placeholder="Nr lokalu"
                                                    placeholderTextColor={theme.colors.textSecondary}
                                                />
                                            </View>

                                            <View style={[styles.formGroup, styles.formGroupHalf]}>
                                                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                                    Kod pocztowy
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, { 
                                                        backgroundColor: theme.colors.background, 
                                                        color: theme.colors.text,
                                                        borderColor: theme.colors.border 
                                                    }]}
                                                    value={editPostalCode}
                                                    onChangeText={setEditPostalCode}
                                                    placeholder="Kod pocztowy"
                                                    placeholderTextColor={theme.colors.textSecondary}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity
                                                onPress={handleSaveCompany}
                                                disabled={isSaving}
                                                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                                            >
                                                <MaterialIcons name="save" size={20} color="#fff" />
                                                <Text style={styles.saveButtonText}>
                                                    {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleCancelEdit}
                                                disabled={isSaving}
                                                style={[styles.cancelButton, isSaving && styles.buttonDisabled]}
                                            >
                                                <Text style={styles.cancelButtonText}>Anuluj</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Bezpieczeństwo */}
                        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.cardHeader}>
                                <MaterialIcons name="security" size={24} color={theme.colors.primary} />
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                    Bezpieczeństwo
                                </Text>
                            </View>
                            <View style={styles.cardContent}>
                                {/* Zmiana hasła */}
                                <View style={styles.securitySection}>
                                    <View style={styles.securityHeader}>
                                        <MaterialIcons name="lock" size={20} color="#3b82f6" />
                                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                            Zmiana hasła
                                        </Text>
                                    </View>
                                    <View style={styles.formGroup}>
                                        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                            Aktualne hasło *
                                        </Text>
                                        <TextInput
                                            style={[styles.input, { 
                                                backgroundColor: theme.colors.background, 
                                                color: theme.colors.text,
                                                borderColor: theme.colors.border 
                                            }]}
                                            value={currentPassword}
                                            onChangeText={setCurrentPassword}
                                            placeholder="Aktualne hasło"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            secureTextEntry
                                        />
                                    </View>
                                    <View style={styles.formGroup}>
                                        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                            Nowe hasło * (min. 8 znaków)
                                        </Text>
                                        <TextInput
                                            style={[styles.input, { 
                                                backgroundColor: theme.colors.background, 
                                                color: theme.colors.text,
                                                borderColor: theme.colors.border 
                                            }]}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            placeholder="Nowe hasło"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            secureTextEntry
                                        />
                                    </View>
                                    <View style={styles.formGroup}>
                                        <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                                            Powtórz nowe hasło *
                                        </Text>
                                        <TextInput
                                            style={[styles.input, { 
                                                backgroundColor: theme.colors.background, 
                                                color: theme.colors.text,
                                                borderColor: theme.colors.border 
                                            }]}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="Powtórz nowe hasło"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            secureTextEntry
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleChangePassword}
                                        disabled={isChangingPassword}
                                        style={[styles.changePasswordButton, isChangingPassword && styles.buttonDisabled]}
                                    >
                                        <MaterialIcons name="save" size={20} color="#fff" />
                                        <Text style={styles.changePasswordButtonText}>
                                            {isChangingPassword ? 'Zmiana hasła...' : 'Zmień hasło'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 2FA */}
                                <View style={[styles.securitySection, styles.securitySectionBordered]}>
                                    <View style={styles.securityHeader}>
                                        <MaterialIcons name="shield" size={20} color="#9333ea" />
                                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                            Dwuskładnikowe uwierzytelnianie (2FA)
                                        </Text>
                                    </View>
                                    <View style={styles.infoBox}>
                                        <Text style={[styles.infoBoxText, { color: theme.colors.textSecondary }]}>
                                            Funkcja dwuskładnikowego uwierzytelniania (2FA) zostanie dodana w przyszłości.
                                        </Text>
                                        <Text style={[styles.infoBoxTextSmall, { color: theme.colors.textSecondary }]}>
                                            2FA to dodatkowa warstwa bezpieczeństwa, która będzie wymagać drugiej formy weryfikacji 
                                            przy logowaniu, co znacznie zwiększy bezpieczeństwo Twojego konta.
                                        </Text>
                                    </View>
                                </View>

                                {/* Usuwanie konta */}
                                <View style={[styles.securitySection, styles.securitySectionBordered]}>
                                    <View style={styles.securityHeader}>
                                        <MaterialIcons name="delete" size={20} color="#ef4444" />
                                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                            Usuwanie konta
                                        </Text>
                                    </View>
                                    <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                                        Usunięcie konta jest operacją nieodwracalną. Wszystkie Twoje dane, 
                                        kampanie i historia inwestycji zostaną trwale usunięte.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleDeleteAccount}
                                        disabled={isDeleting}
                                        style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
                                    >
                                        <Text style={styles.deleteButtonText}>
                                            {isDeleting ? 'Usuwanie...' : 'Usuń konto'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    roleCard: {
        padding: 20,
    },
    roleContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleTextContainer: {
        marginLeft: 16,
    },
    roleTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    roleSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    cardHeaderWithButton: {
        justifyContent: 'space-between',
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
    },
    cardContent: {
        padding: 16,
    },
    infoRow: {
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    infoValue: {
        fontSize: 16,
    },
    infoValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    companyName: {
        fontSize: 18,
        fontWeight: '600',
    },
    companyDetailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
        gap: 16,
    },
    companyDetailItem: {
        flex: 1,
        minWidth: '45%',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressIconContainer: {
        marginRight: 8,
        marginTop: 2,
    },
    addressTextContainer: {
        flex: 1,
    },
    formGroup: {
        marginBottom: 16,
    },
    formGroupHalf: {
        flex: 1,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22c55e',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#d1d5db',
        paddingVertical: 14,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    disabledNote: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '400',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    securitySection: {
        marginBottom: 24,
    },
    securitySectionBordered: {
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    changePasswordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    changePasswordButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 16,
    },
    infoBoxText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    infoBoxTextSmall: {
        fontSize: 12,
        lineHeight: 18,
    },
});


