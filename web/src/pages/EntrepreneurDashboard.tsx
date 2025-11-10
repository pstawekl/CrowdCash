import { useEffect, useState } from 'react';
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
    created_at: string;
}

interface CampaignStats {
    investor_count?: number;
    total_invested?: number;
    investment_count?: number;
}

interface Investor {
    id: string;
    email: string;
    amount: number;
    status: string;
    created_at: string;
}

interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
}

export default function EntrepreneurDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
    const [allCampaignStats, setAllCampaignStats] = useState<{ [campaignId: string]: CampaignStats }>({});
    const [statsLoading, setStatsLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // --- PODGLĄD INWESTORÓW W KAMPANII ---
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [showInvestors, setShowInvestors] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        goal_amount: '',
        region: '',
        deadline: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchCampaigns();
        fetchNotifications();
        fetchCategories();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const res = await API.get('/campaigns/my', {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Konwertuj UUID na stringi
            const campaignsData = Array.isArray(res.data) ? res.data.map(campaign => ({
                ...campaign,
                id: String(campaign.id)
            })) : [];

            setCampaigns(campaignsData);

            // Pobierz statystyki dla wszystkich kampanii
            const statsPromises = campaignsData.map(async (campaign) => {
                try {
                    const statsRes = await API.get(`/campaigns/${String(campaign.id)}/stats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    return { campaignId: String(campaign.id), stats: statsRes.data };
                } catch (e) {
                    return { campaignId: String(campaign.id), stats: null };
                }
            });

            const statsResults = await Promise.all(statsPromises);
            const statsMap: { [campaignId: string]: CampaignStats } = {};
            statsResults.forEach(result => {
                if (result.stats) {
                    statsMap[result.campaignId] = result.stats;
                }
            });
            setAllCampaignStats(statsMap);
        } catch (e: any) {
            console.error('Błąd pobierania kampanii:', e);
            setError(e?.response?.data?.detail || 'Nie udało się pobrać kampanii');
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const res = await API.get('/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (e: any) {
            console.error('Błąd pobierania powiadomień:', e);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await API.get('/campaigns/categories');
            setCategories(Array.isArray(res.data) ? res.data : [
                'Technologia',
                'Zdrowie',
                'Edukacja',
                'Sztuka',
                'Społeczność',
                'Inne',
            ]);
        } catch (e: any) {
            console.error('Błąd pobierania kategorii:', e);
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

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const deadline = new Date(formData.deadline).toISOString();

            await API.post('/campaigns/', {
                ...formData,
                goal_amount: parseFloat(formData.goal_amount),
                deadline: deadline
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert('Kampania została utworzona jako szkic. Aby była widoczna dla inwestorów, musisz ją opublikować.');
            setShowAddForm(false);
            setFormData({
                title: '',
                description: '',
                category: '',
                goal_amount: '',
                region: '',
                deadline: ''
            });
            await fetchCampaigns();
        } catch (e: any) {
            console.error('Błąd tworzenia kampanii:', e);
            alert(e?.response?.data?.detail || 'Nie udało się dodać kampanii');
        } finally {
            setFormLoading(false);
        }
    };

    const handleShowDetails = async (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setStatsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const res = await API.get(`/campaigns/${String(campaign.id)}/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaignStats(res.data);
        } catch (e: any) {
            console.error('Błąd pobierania statystyk:', e);
            setCampaignStats(null);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleCloseCampaign = async (campaignId: string) => {
        if (!confirm('Czy na pewno chcesz zamknąć tę kampanię?')) return;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            await API.post(`/campaigns/${campaignId}/close`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert('Kampania została zamknięta!');
            setSelectedCampaign(null);
            await fetchCampaigns();
        } catch (e: any) {
            console.error('Błąd zamykania kampanii:', e);
            alert(e?.response?.data?.detail || 'Nie udało się zamknąć kampanii');
        }
    };

    const handlePublishCampaign = async (campaignId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            await API.patch(`/campaigns/${campaignId}/status`, 'active', {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert('Kampania została opublikowana!');
            await fetchCampaigns();
        } catch (e: any) {
            console.error('Błąd publikowania kampanii:', e);
            alert(e?.response?.data?.detail || 'Nie udało się opublikować kampanii');
        }
    };

    const handleShowInvestors = async (campaignId: string) => {
        setShowInvestors(true);
        setStatsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const res = await API.get(`/campaigns/${campaignId}/investors`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Konwertuj UUID na stringi
            const investorsData = Array.isArray(res.data) ? res.data.map(investor => ({
                ...investor,
                id: String(investor.id),
                email: investor.email
            })) : [];

            setInvestors(investorsData);
        } catch (e: any) {
            console.error('Błąd pobierania inwestorów:', e);
            setInvestors([]);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleCloseInvestors = () => {
        setShowInvestors(false);
        setInvestors([]);
    };


    return (
        <RequirePermission permission="view_dashboard">
            <div className="min-w-50 md:min-w-[800px] p-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Panel przedsiębiorcy</h2>
                        <p className="text-gray-600">Zarządzaj swoimi kampaniami crowdfundingowymi</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/notifications"
                            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors relative"
                        >
                            Powiadomienia
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            + Nowa kampania
                        </button>
                    </div>
                </div>

                {loading && <Spinner />}
                {error && <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}


                {/* Formularz tworzenia kampanii */}
                {showAddForm && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Nowa kampania</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateCampaign} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Tytuł kampanii"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input input-bordered w-full"
                                    required
                                />
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="">Wybierz kategorię</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <textarea
                                placeholder="Opis kampanii"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="textarea textarea-bordered w-full"
                                rows={4}
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="number"
                                    placeholder="Cel (PLN)"
                                    value={formData.goal_amount}
                                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                    className="input input-bordered w-full"
                                    min="1"
                                    step="0.01"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Region"
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="input input-bordered w-full"
                                    required
                                />
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="input input-bordered w-full"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="btn btn-primary"
                                >
                                    {formLoading ? 'Tworzenie...' : 'Utwórz kampanię'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="btn btn-ghost"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista kampanii */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{campaign.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{campaign.description}</p>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-600">Cel: <span className="font-semibold">{campaign.goal_amount} PLN</span></p>
                                        <p className="text-gray-600">Zebrano: <span className="font-semibold text-green-600">{campaign.current_amount} PLN</span></p>
                                        <p className="text-gray-600">Status: <span className={`font-medium ${campaign.status === 'active' ? 'text-green-600' :
                                            campaign.status === 'draft' ? 'text-yellow-600' :
                                                campaign.status === 'successful' ? 'text-blue-600' : 'text-red-600'
                                            }`}>{campaign.status}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((campaign.current_amount / campaign.goal_amount) * 100)}% celu
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleShowDetails(campaign)}
                                    className="btn btn-primary btn-sm flex-1"
                                >
                                    Szczegóły
                                </button>
                                {campaign.status === 'active' && (allCampaignStats[String(campaign.id)]?.investor_count || 0) > 0 && (
                                    <button
                                        onClick={() => handleShowInvestors(String(campaign.id))}
                                        className="btn btn-info btn-sm"
                                    >
                                        Inwestorzy ({allCampaignStats[String(campaign.id)]?.investor_count || 0})
                                    </button>
                                )}
                                {campaign.status === 'draft' && (
                                    <button
                                        onClick={() => handlePublishCampaign(String(campaign.id))}
                                        className="btn btn-success btn-sm"
                                    >
                                        Opublikuj
                                    </button>
                                )}
                                {campaign.status === 'active' && (
                                    <button
                                        onClick={() => handleCloseCampaign(String(campaign.id))}
                                        className="btn btn-error btn-sm"
                                    >
                                        Zamknij
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {campaigns.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-500 mb-4">Nie masz jeszcze żadnych kampanii</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Utwórz pierwszą kampanię
                            </button>
                        </div>
                    )}
                </div>

                {/* Szczegóły kampanii */}
                {selectedCampaign && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">Szczegóły kampanii</h3>
                                    <button
                                        onClick={() => setSelectedCampaign(null)}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {statsLoading ? (
                                    <Spinner />
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-lg">{selectedCampaign.title}</h4>
                                            <p className="text-gray-600">{selectedCampaign.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Cel</p>
                                                <p className="font-semibold">{selectedCampaign.goal_amount} PLN</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Zebrano</p>
                                                <p className="font-semibold text-green-600">{selectedCampaign.current_amount} PLN</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Inwestorów</p>
                                                <p className="font-semibold">{campaignStats?.investor_count || 0}</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-600">Status</p>
                                                <p className="font-semibold">{selectedCampaign.status}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <button
                                                onClick={() => handleShowInvestors(selectedCampaign.id)}
                                                className="btn btn-info"
                                            >
                                                Zobacz inwestorów
                                            </button>
                                            {selectedCampaign.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePublishCampaign(selectedCampaign.id)}
                                                    className="btn btn-success"
                                                >
                                                    Opublikuj kampanię
                                                </button>
                                            )}
                                            {selectedCampaign.status === 'active' && (
                                                <button
                                                    onClick={() => handleCloseCampaign(String(selectedCampaign.id))}
                                                    className="btn btn-error"
                                                >
                                                    Zamknij kampanię
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedCampaign(null)}
                                                className="btn btn-ghost"
                                            >
                                                Zamknij
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista inwestorów */}
                {showInvestors && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">Inwestorzy w kampanii</h3>
                                    <button
                                        onClick={handleCloseInvestors}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {statsLoading ? (
                                    <Spinner />
                                ) : investors.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Brak inwestorów w tej kampanii</p>
                                ) : (
                                    <div className="space-y-3">
                                        {investors.map(investor => (
                                            <div key={investor.id} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{investor.email}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Inwestycja: <span className="font-semibold text-green-600">{investor.amount} PLN</span>
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Status: <span className={`font-medium ${investor.status === 'completed' ? 'text-green-600' :
                                                                investor.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                                                }`}>{investor.status}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(investor.created_at).toLocaleDateString('pl-PL')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4 mt-6 border-t">
                                    <button
                                        onClick={handleCloseInvestors}
                                        className="btn btn-ghost"
                                    >
                                        Zamknij
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RequirePermission>
    );
}
