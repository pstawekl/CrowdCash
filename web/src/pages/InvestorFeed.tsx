import { useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { MdSearch, MdLocationOn, MdClear } from 'react-icons/md';
import FeedCampaign from '../components/FeedCampaign';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';

interface Campaign {
    id: string;
    title: string;
    description: string;
    goal_amount: number;
    current_amount: number;
    status: string;
    entrepreneur_id?: string;
    region?: string;
    images?: Array<{ image_url: string; alt_text?: string; order_index?: number }>;
}

export default function InvestorFeed() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [region, setRegion] = useState('');
    const [availableRegions, setAvailableRegions] = useState<string[]>([]);
    const [following, setFollowing] = useState<string[]>([]);
    const navigate = useNavigate();

    // Pobierz dostępne regiony
    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const res = await API.get('/campaigns/regions');
                if (Array.isArray(res.data)) {
                    setAvailableRegions(res.data);
                }
            } catch (e) {
                console.error('Błąd pobierania regionów:', e);
            }
        };
        fetchRegions();
    }, []);

    useEffect(() => {
        const fetchFeed = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                
                // Pobierz listę obserwowanych przedsiębiorców PRZED pobraniem kampanii
                // żeby status obserwacji był dostępny od razu
                if (token) {
                    try {
                        const followingRes = await API.get('/users/following', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        type FollowingItem = { entrepreneur_id: string };
                        const followingIds = Array.isArray(followingRes.data) 
                            ? (followingRes.data as FollowingItem[]).map((f) => String(f.entrepreneur_id)) 
                            : [];
                        setFollowing(followingIds);
                    } catch (e) {
                        console.error('Błąd pobierania statusu obserwacji:', e);
                        // Nie przerywaj ładowania feedu jeśli nie udało się pobrać obserwacji
                    }
                }

                const params: Record<string, string> = {};
                if (search.trim()) {
                    params.q = search.trim();
                }
                if (region.trim()) {
                    params.region = region.trim();
                }

                const res = await API.get('/campaigns/feed', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    params,
                });
                // Konwertuj UUID na stringi
                const campaignsData = Array.isArray(res.data) ? res.data.map(campaign => ({
                    ...campaign,
                    id: String(campaign.id),
                    entrepreneur_id: campaign.entrepreneur_id ? String(campaign.entrepreneur_id) : undefined
                })) : [];

                setCampaigns(campaignsData);
            } catch (e) {
                const err = e as AxiosError<{ detail?: string }>;
                setError(err.response?.data?.detail || 'Błąd pobierania feedu');
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, [search, region]);

    const handleFollowToggle = async (entrepreneurId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            
            const entrepreneurIdStr = String(entrepreneurId);
            const isCurrentlyFollowing = following.includes(entrepreneurIdStr);
            
            if (isCurrentlyFollowing) {
                await API.delete(`/users/unfollow/${entrepreneurIdStr}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing(following.filter(id => id !== entrepreneurIdStr));
            } else {
                await API.post(`/users/follow/${entrepreneurIdStr}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing([...following, entrepreneurIdStr]);
            }
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            setError(err.response?.data?.detail || 'Błąd zmiany obserwowania');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setRegion('');
    };

    const hasActiveFilters = search.trim() || region.trim();

    return (
        <RequirePermission permission="view_feed">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-blue-50/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                            Feed kampanii
                        </h1>
                        <p className="text-gray-600">Odkryj projekty, które mogą Cię zainteresować</p>
                    </div>

                    {/* Filtry */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Wyszukiwanie */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Szukaj kampanii
                                </label>
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                    <input
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                        placeholder="Szukaj po tytule, opisie lub kategorii..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Region */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Region
                                </label>
                                <div className="relative">
                                    <MdLocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                    <select
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none bg-white"
                                        value={region}
                                        onChange={e => setRegion(e.target.value)}
                                    >
                                        <option value="">Wszystkie regiony</option>
                                        {availableRegions.map((reg) => (
                                            <option key={reg} value={reg}>
                                                {reg}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Przycisk wyczyść filtry */}
                        {hasActiveFilters && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <MdClear className="text-lg" />
                                    Wyczyść filtry
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <Spinner />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Grid kampanii */}
                    {!loading && (
                        <>
                            {campaigns.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                        <MdSearch className="text-gray-400 text-3xl" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Brak kampanii</h3>
                                    <p className="text-gray-600 mb-6">
                                        {hasActiveFilters 
                                            ? 'Nie znaleziono kampanii spełniających kryteria wyszukiwania.'
                                            : 'Nie ma jeszcze żadnych kampanii do wyświetlenia.'}
                                    </p>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                        >
                                            Wyczyść filtry
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {campaigns.map(camp => {
                                        const percent = Math.round((camp.current_amount / camp.goal_amount) * 100);
                                        let progressClass = 'w-0';
                                        if (percent >= 100) progressClass = 'w-full';
                                        else if (percent >= 83) progressClass = 'w-5/6';
                                        else if (percent >= 75) progressClass = 'w-3/4';
                                        else if (percent >= 66) progressClass = 'w-2/3';
                                        else if (percent >= 50) progressClass = 'w-1/2';
                                        else if (percent >= 33) progressClass = 'w-1/3';
                                        else if (percent >= 25) progressClass = 'w-1/4';
                                        else if (percent >= 16) progressClass = 'w-1/6';
                                        else progressClass = 'w-0';
                                        return (
                                            <FeedCampaign
                                                key={camp.id}
                                                campaign={camp}
                                                percent={percent}
                                                progressClass={progressClass}
                                                isFollowing={camp.entrepreneur_id ? following.includes(String(camp.entrepreneur_id)) : false}
                                                onFollowToggle={handleFollowToggle}
                                                onDetails={id => navigate({ to: `/campaign/${id}` })}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </RequirePermission>
    );
}
