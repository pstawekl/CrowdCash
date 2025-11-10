import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
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

interface User {
    id: string;
    email: string;
}

export default function EntrepreneurProfile() {
    const { entrepreneurId } = useParams({ from: '/profile/$entrepreneurId' });
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');

                // Pobierz profil przedsiębiorcy
                const profileRes = await API.get(`/users/${String(entrepreneurId)}/profile`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                setProfile(profileRes.data);

                // Pobierz podstawowe informacje o użytkowniku
                const userRes = await API.get(`/users/${String(entrepreneurId)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                setUser(userRes.data);
            } catch (e: any) {
                console.error('Błąd pobierania profilu:', e);
                setError(e?.response?.data?.detail || 'Nie udało się pobrać profilu przedsiębiorcy');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [entrepreneurId]);

    if (loading) return <Spinner />;
    if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
    if (!profile || !user) return <div className="p-6 text-gray-500 text-center">Brak profilu przedsiębiorcy</div>;

    return (
        <RequirePermission permission="view_profile">
            <div className="min-w-50 md:min-w-[800px] p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        className="btn btn-sm mb-4"
                        onClick={() => navigate({ to: '/feed' })}
                    >
                        ← Powrót do feedu
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Profil przedsiębiorcy</h2>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start gap-6">
                        {/* Zdjęcie profilowe */}
                        <div className="flex-shrink-0">
                            {profile.profile_picture_url ? (
                                <img
                                    src={profile.profile_picture_url}
                                    alt="Zdjęcie profilowe"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-2xl text-gray-500">
                                        {profile.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Informacje */}
                        <div className="flex-1">
                            <div className="mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {profile.name || 'Przedsiębiorca'}
                                </h3>
                                <p className="text-gray-600">{user.email}</p>
                                {profile.location && (
                                    <p className="text-sm text-gray-500">📍 {profile.location}</p>
                                )}
                            </div>

                            {profile.bio && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">O mnie</h4>
                                    <p className="text-gray-700">{profile.bio}</p>
                                </div>
                            )}

                            {profile.interests && profile.interests.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Zainteresowania</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map((interest, index) => (
                                            <span
                                                key={index}
                                                className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Przyciski akcji */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => navigate({ to: '/feed' })}
                            className="btn btn-outline"
                        >
                            Przeglądaj kampanie
                        </button>
                        <button
                            onClick={() => navigate({ to: '/investor-dashboard' })}
                            className="btn btn-primary"
                        >
                            Powrót do dashboard
                        </button>
                    </div>
                </div>

                {/* Informacje o kampaniach (placeholder) */}
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Kampanie przedsiębiorcy</h4>
                    <p className="text-gray-500 text-sm">
                        Informacje o kampaniach tego przedsiębiorcy będą dostępne wkrótce.
                    </p>
                    {/* TODO: Dodać listę kampanii przedsiębiorcy */}
                </div>
            </div>
        </RequirePermission>
    );
}
