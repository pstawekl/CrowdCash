import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { MdArrowBack, MdEmail, MdPerson, MdSecurity } from 'react-icons/md';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';
import type { AxiosError } from 'axios';

interface UserData {
    id: string;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    is_verified?: boolean;
}

export default function Settings() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

                const res = await API.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserData(res.data);
            } catch (e) {
                const axiosError = e as AxiosError<{ detail?: string }>;
                setError(axiosError?.response?.data?.detail || 'Nie udało się pobrać danych użytkownika');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) return <Spinner />;

    return (
        <RequirePermission permission="view_settings">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-blue-50/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Przycisk powrotu */}
                    <Link
                        to="/"
                        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <MdArrowBack className="text-xl" />
                        <span>Powrót</span>
                    </Link>

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

                    {userData && (
                        <div className="space-y-6">
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
                                    {userData.username && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Nazwa użytkownika
                                            </label>
                                            <p className="text-lg text-gray-900">{userData.username}</p>
                                        </div>
                                    )}
                                    {(userData.first_name || userData.last_name) && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Imię i nazwisko
                                            </label>
                                            <p className="text-lg text-gray-900">
                                                {userData.first_name || ''} {userData.last_name || ''}
                                            </p>
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
                                </div>
                            </div>

                            {/* Bezpieczeństwo */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <MdSecurity className="text-2xl text-green-600" />
                                    <h2 className="text-xl font-bold text-gray-900">Bezpieczeństwo</h2>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        Funkcje związane z bezpieczeństwem konta będą dostępne wkrótce.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </RequirePermission>
    );
}

