import { useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { MdBusiness, MdDelete, MdEdit, MdEmail, MdLocationOn, MdLock, MdPerson, MdSave, MdSecurity, MdShield } from 'react-icons/md';
import RegionSearchBox from '../components/RegionSearchBox';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';
import { UserRoleEnum } from '../utils/roles';

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

interface UserData {
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

export default function Settings() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Pola zmiany hasła
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
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

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('Brak autoryzacji. Zaloguj się ponownie.');
                    setLoading(false);
                    return;
                }

                const res = await API.get('/auth/settings', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserData(res.data);
                
                // Wypełnij pola edycji danymi z bazy
                if (res.data.company) {
                    setEditCompanyName(res.data.company.company_name || '');
                    setEditNip(res.data.company.nip || '');
                    setEditRegon(res.data.company.regon || '');
                    setEditKrs(res.data.company.krs || '');
                    setEditStreet(res.data.company.street || '');
                    setEditBuildingNumber(res.data.company.building_number || '');
                    setEditApartmentNumber(res.data.company.apartment_number || '');
                    setEditPostalCode(res.data.company.postal_code || '');
                }
                
                if (res.data.city) {
                    setEditCity({ id: res.data.city_id, name: res.data.city.name });
                }
            } catch (e) {
                const axiosError = e as AxiosError<{ detail?: string }>;
                setError(axiosError?.response?.data?.detail || 'Nie udało się pobrać danych użytkownika');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleEditCompany = () => {
        setIsEditingCompany(true);
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setIsEditingCompany(false);
        setError('');
        setSuccess('');
        
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
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Brak autoryzacji. Zaloguj się ponownie.');
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

            setSuccess('Dane zostały zaktualizowane pomyślnie!');
            setIsEditingCompany(false);

            // Odśwież dane
            const res = await API.get('/auth/settings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserData(res.data);
        } catch (e) {
            const axiosError = e as AxiosError<{ detail?: string }>;
            setError(axiosError?.response?.data?.detail || 'Nie udało się zaktualizować danych');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Czy na pewno chcesz usunąć swoje konto?\n\n' +
            'Ta operacja jest nieodwracalna i spowoduje:\n' +
            '- Usunięcie wszystkich danych osobowych\n' +
            '- Usunięcie wszystkich kampanii (jeśli jesteś przedsiębiorcą)\n' +
            '- Usunięcie historii inwestycji (jeśli jesteś inwestorem)\n' +
            '- Utratę dostępu do konta\n\n' +
            'Wpisz "USUŃ" aby potwierdzić:'
        );

        if (!confirmed) return;

        const finalConfirm = window.prompt('Wpisz "USUŃ" aby potwierdzić usunięcie konta:');
        
        if (finalConfirm !== 'USUŃ') {
            alert('Anulowano usuwanie konta');
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Brak autoryzacji. Zaloguj się ponownie.');
                setIsDeleting(false);
                return;
            }

            await API.delete('/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Wyloguj użytkownika
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            
            alert('Twoje konto zostało pomyślnie usunięte');
            
            // Przekieruj do strony głównej
            navigate({ to: '/login' });
        } catch (e) {
            const axiosError = e as AxiosError<{ detail?: string }>;
            setError(axiosError?.response?.data?.detail || 'Nie udało się usunąć konta');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsChangingPassword(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Brak autoryzacji. Zaloguj się ponownie.');
                setIsChangingPassword(false);
                return;
            }

            await API.put('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccess('Hasło zostało pomyślnie zmienione!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            const axiosError = e as AxiosError<{ detail?: string }>;
            setError(axiosError?.response?.data?.detail || 'Nie udało się zmienić hasła');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <RequirePermission permission="view_settings">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-blue-50/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Przycisk powrotu */}
                    {/* <Link
                        to="/"
                        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <MdArrowBack className="text-xl" />
                        <span>Powrót</span>
                    </Link> */}

                    {/* Nagłówek */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ustawienia aplikacji</h1>
                        <p className="text-gray-600">Zarządzaj ustawieniami swojego konta</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 text-red-600 rounded-lg p-4 mb-6">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border-2 border-green-200 text-green-600 rounded-lg p-4 mb-6">
                            {success}
                        </div>
                    )}

                    {userData && (
                        <div className="space-y-6">
                            {/* Typ użytkownika */}
                            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <MdPerson className="text-3xl" />
                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            {userData.role_name === 'entrepreneur' ? 'Przedsiębiorca' : 
                                             userData.role_name === 'investor' ? 'Inwestor' : 
                                             userData.role_name === 'admin' ? 'Administrator' : 'Użytkownik'}
                                        </h2>
                                        <p className="text-green-100">Typ konta</p>
                                    </div>
                                </div>
                            </div>

                            {/* Informacje o koncie */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <MdPerson className="text-2xl text-green-600" />
                                    <h2 className="text-xl font-bold text-gray-900">Informacje o koncie</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Email
                                        </label>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <MdEmail className="text-lg" />
                                            <span className="text-lg">{userData.email}</span>
                                        </div>
                                    </div>
                                    {userData.profile?.name && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Imię i nazwisko
                                            </label>
                                            <p className="text-lg text-gray-900">{userData.profile.name}</p>
                                        </div>
                                    )}
                                    {userData.profile?.bio && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Bio
                                            </label>
                                            <p className="text-gray-900">{userData.profile.bio}</p>
                                        </div>
                                    )}
                                    {userData.city && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Lokalizacja
                                            </label>
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <MdLocationOn className="text-lg text-green-600" />
                                                <span className="text-lg">{userData.city.name}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Status weryfikacji
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {userData.is_verified ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                                    Zweryfikowane
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                                    Niezweryfikowane
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Data utworzenia konta
                                        </label>
                                        <p className="text-gray-900">
                                            {new Date(userData.created_at).toLocaleDateString('pl-PL', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Dane firmy - tylko dla przedsiębiorców */}
                            {userData.role_id === UserRoleEnum.entrepreneur && (
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <MdBusiness className="text-2xl text-blue-600" />
                                            <h2 className="text-xl font-bold text-gray-900">Dane firmy</h2>
                                        </div>
                                        {!isEditingCompany && (
                                            <button
                                                onClick={handleEditCompany}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                            >
                                                <MdEdit />
                                                <span>Edytuj</span>
                                            </button>
                                        )}
                                    </div>

                                    {!isEditingCompany && userData.company && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Nazwa firmy
                                                </label>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {userData.company.company_name}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        NIP
                                                    </label>
                                                    <p className="text-gray-900">{userData.company.nip}</p>
                                                </div>
                                                {userData.company.regon && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            REGON
                                                        </label>
                                                        <p className="text-gray-900">{userData.company.regon}</p>
                                                    </div>
                                                )}
                                                {userData.company.krs && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            KRS
                                                        </label>
                                                        <p className="text-gray-900">{userData.company.krs}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {(userData.company.street || userData.company.city) && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Adres
                                                    </label>
                                                    <div className="flex items-start gap-2 text-gray-900">
                                                        <MdLocationOn className="text-lg text-blue-600 mt-1" />
                                                        <div>
                                                            {userData.company.street && (
                                                                <p>
                                                                    {userData.company.street} {userData.company.building_number}
                                                                    {userData.company.apartment_number && `/${userData.company.apartment_number}`}
                                                                </p>
                                                            )}
                                                            {userData.company.postal_code && userData.company.city && (
                                                                <p>{userData.company.postal_code} {userData.company.city}</p>
                                                            )}
                                                            {userData.company.country && (
                                                                <p>{userData.company.country}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {
                                        isEditingCompany && (
                                             /* Formularz edycji */
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Nazwa firmy *
                                                    {userData.company?.company_name && (
                                                        <span className="text-xs text-gray-500 ml-2">(nie można zmienić)</span>
                                                    )}
                                                </label>
                                                <input
                                                    title="Nazwa firmy"
                                                    placeholder="Nazwa firmy"
                                                    type="text"
                                                    value={editCompanyName}
                                                    onChange={(e) => setEditCompanyName(e.target.value)}
                                                    disabled={!!userData.company?.company_name}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-600"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        NIP *
                                                        <span className="text-xs text-gray-500 ml-2">(nie można zmienić)</span>
                                                    </label>
                                                    <input
                                                        title="NIP"
                                                        placeholder="NIP"
                                                        type="text"
                                                        value={editNip}
                                                        disabled
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        REGON
                                                        {editRegon && (
                                                            <span className="text-xs text-gray-500 ml-2">(nie można zmienić)</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        title="REGON"
                                                        placeholder="REGON"
                                                        type="text"
                                                        value={editRegon}
                                                        disabled={!!editRegon}
                                                        onChange={(e) => setEditRegon(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-600"
                                                    />
                                                </div>

                                                {/* <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        KRS
                                                    </label>
                                                    <input
                                                        title="KRS"
                                                        placeholder="KRS"
                                                        type="text"
                                                        value={editKrs}
                                                        onChange={(e) => setEditKrs(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    />
                                                </div> */}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Miasto *
                                                </label>
                                                <RegionSearchBox
                                                    onSelect={(region) => {
                                                        if (region && region.type === 'city') {
                                                            setEditCity({ id: region.id, name: region.name });
                                                        } else {
                                                            setEditCity(null);
                                                        }
                                                    }}
                                                    placeholder="Wybierz miasto"
                                                    filterType="city"
                                                    value={editCity ? { ...editCity, type: 'city' as const } : undefined}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        Ulica
                                                    </label>
                                                    <input
                                                        title="Ulica"
                                                        placeholder="Ulica"
                                                        type="text"
                                                        value={editStreet}
                                                        onChange={(e) => setEditStreet(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        Numer budynku
                                                    </label>
                                                    <input
                                                        title="Numer budynku"
                                                        placeholder="Numer budynku"
                                                        type="text"
                                                        value={editBuildingNumber}
                                                        onChange={(e) => setEditBuildingNumber(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        Numer lokalu
                                                    </label>
                                                    <input
                                                        title="Numer lokalu"
                                                        placeholder="Numer lokalu"
                                                        type="text"
                                                        value={editApartmentNumber}
                                                        onChange={(e) => setEditApartmentNumber(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        Kod pocztowy
                                                    </label>
                                                    <input
                                                        title="Kod pocztowy"
                                                        placeholder="Kod pocztowy"
                                                        type="text"
                                                        value={editPostalCode}
                                                        onChange={(e) => setEditPostalCode(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    onClick={handleSaveCompany}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <MdSave />
                                                    <span>{isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Anuluj
                                                </button>
                                            </div>
                                        </div>
                                        )
                                    }
                                </div>
                            )}

                            {/* Bezpieczeństwo */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <MdSecurity className="text-2xl text-green-600" />
                                    <h2 className="text-xl font-bold text-gray-900">Bezpieczeństwo</h2>
                                </div>
                                <div className="space-y-6">
                                    {/* Zmiana hasła */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <MdLock className="text-xl text-blue-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Zmiana hasła</h3>
                                        </div>
                                        <form onSubmit={handleChangePassword} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Aktualne hasło *
                                                </label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="Wprowadź aktualne hasło"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Nowe hasło * (min. 8 znaków)
                                                </label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Wprowadź nowe hasło"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    required
                                                    minLength={8}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Powtórz nowe hasło *
                                                </label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Powtórz nowe hasło"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isChangingPassword}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <MdSave />
                                                <span>{isChangingPassword ? 'Zmiana hasła...' : 'Zmień hasło'}</span>
                                            </button>
                                        </form>
                                    </div>

                                    {/* Dwuskładnikowe uwierzytelnianie (2FA) */}
                                    <div className="pt-6 border-t border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MdShield className="text-xl text-purple-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Dwuskładnikowe uwierzytelnianie (2FA)</h3>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <p className="text-gray-600 mb-2">
                                                Funkcja dwuskładnikowego uwierzytelniania (2FA) zostanie dodana w przyszłości.
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                2FA to dodatkowa warstwa bezpieczeństwa, która będzie wymagać drugiej formy weryfikacji 
                                                przy logowaniu, co znacznie zwiększy bezpieczeństwo Twojego konta.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Usuwanie konta */}
                                    <div className="pt-6 border-t border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MdDelete className="text-xl text-red-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Usuwanie konta</h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">
                                            Usunięcie konta jest operacją nieodwracalną. Wszystkie Twoje dane, 
                                            kampanie i historia inwestycji zostaną trwale usunięte.
                                        </p>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span>{isDeleting ? 'Usuwanie...' : 'Usuń konto'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </RequirePermission>
    );
}

