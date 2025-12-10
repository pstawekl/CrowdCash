import { Link, useNavigate, useParams } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { MdArrowBack, MdCalendarToday, MdCheckCircle, MdChevronLeft, MdChevronRight, MdLocationOn, MdPerson, MdTrendingUp } from 'react-icons/md';
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
    deadline?: string;
    region?: string;
    images?: Array<{ image_url: string; alt_text?: string; order_index?: number }>;
}

interface Investment {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    investor_id: string;
}

const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    return `http://127.0.0.1:8000${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
};

export default function InvestmentDetails() {
    const { id } = useParams({ from: '/campaign/$id' });
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [investing, setInvesting] = useState(false);
    const [success, setSuccess] = useState('');
    const [percent, setPercent] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const navigate = useNavigate();

    const fetchCampaign = useCallback(async () => {
        setError('');
        try {
            const token = localStorage.getItem('authToken');

            // Pobierz szczegóły kampanii
            const res = await API.get(`/campaigns/${String(id)}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            setCampaign(res.data);
            setPercent(Math.round((res.data.current_amount / res.data.goal_amount) * 100));

            // Pobierz inwestycje w tę kampanię
            try {
                const invRes = await API.get(`/investments/campaign/${String(id)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                // Konwertuj UUID na stringi i filtruj tylko completed inwestycje do wyświetlenia
                // Pending inwestycje nie liczą się do postępu kampanii
                const investmentsData = Array.isArray(invRes.data) ? invRes.data
                    .filter(inv => inv.status === 'completed') // Tylko completed (approved płatności)
                    .map(inv => ({
                        ...inv,
                        id: String(inv.id),
                        campaign_id: inv.campaign_id ? String(inv.campaign_id) : null,
                        investor_id: String(inv.investor_id)
                    })) : [];

                setInvestments(investmentsData);
            } catch {
                console.log('Brak dostępu do listy inwestycji lub brak inwestycji');
                setInvestments([]);
            }
        } catch (e: unknown) {
            setError(`Błąd pobierania kampanii: ${(e as AxiosError).response?.data || ''}`);
        }
    }, [id]);

    useEffect(() => {
        setLoading(true);
        fetchCampaign().finally(() => setLoading(false));
    }, [fetchCampaign]);

    // Pobierz ID aktualnego użytkownika i status obserwacji
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                const res = await API.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUserId(res.data.id);

                // Sprawdź status obserwacji
                if (campaign?.entrepreneur_id) {
                    try {
                        const followingRes = await API.get('/users/following', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        type FollowingItem = { entrepreneur_id: string };
                        const following = Array.isArray(followingRes.data) 
                            ? (followingRes.data as FollowingItem[]).map((f) => String(f.entrepreneur_id)) 
                            : [];
                        setIsFollowing(following.includes(String(campaign.entrepreneur_id)));
                    } catch {
                        console.error('Błąd pobierania statusu obserwacji');
                    }
                }
            } catch {
                console.error('Błąd pobierania użytkownika');
            }
        };
        fetchCurrentUser();
    }, [campaign?.entrepreneur_id]);

    // Sprawdź czy użytkownik już inwestował w tę kampanię (tylko completed inwestycje)
    const hasInvested = currentUserId && investments.some(inv => 
        inv.investor_id === currentUserId && inv.status === 'completed'
    );

    const handleFollowToggle = async () => {
        if (!campaign?.entrepreneur_id || !currentUserId) return;
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            
            if (isFollowing) {
                await API.delete(`/users/unfollow/${campaign.entrepreneur_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsFollowing(false);
            } else {
                await API.post(`/users/follow/${campaign.entrepreneur_id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsFollowing(true);
            }
        } catch (e: unknown) {
            console.error('Błąd zmiany obserwowania:', e);
            const error = e as AxiosError<{ detail?: string }>;
            setError(error?.response?.data?.detail || 'Błąd zmiany obserwowania');
        }
    };

    const images = campaign?.images && Array.isArray(campaign.images) ? campaign.images : [];
    const mainImage = images.length > 0 ? images[selectedImageIndex] : null;
    const mainImageUrl = mainImage?.image_url ? getImageUrl(mainImage.image_url) : null;

    const handlePreviousImage = () => {
        if (images.length > 0) {
            setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        }
    };

    const handleNextImage = () => {
        if (images.length > 0) {
            setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }
    };

    const handleInvest = async (e: React.FormEvent) => {
        e.preventDefault();
        setInvesting(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            // Utwórz inwestycję
            const res = await API.post('/investments/', {
                campaign_id: id,
                amount: parseFloat(amount)
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Zainicjuj płatność Stripe
            const paymentRes = await API.post('/payments/', {
                investment_id: res.data.id,
                amount: parseFloat(amount),
                currency: 'PLN', // Domyślna waluta
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccess('Inwestycja złożona! Przejdź do płatności Stripe.');
            setAmount('');

            // Przekieruj do płatności Stripe
            if (paymentRes.data.payment_url) {
                window.location.href = paymentRes.data.payment_url; // Przekieruj w tym samym oknie
            }

            // Odśwież dane kampanii i inwestycji
            fetchCampaign();
        } catch (e: unknown) {
            console.error('Błąd inwestowania:', e);
            const error = e as AxiosError<{ detail?: string }>;
            setError(error?.response?.data?.detail || 'Błąd inwestowania');
        } finally {
            setInvesting(false);
        }
    };

    if (loading) return <Spinner />;
    if (!campaign) return <div className="p-6 text-red-600">Brak szczegółów kampanii</div>;

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string; label: string }> = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktywna' },
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Szkic' },
            successful: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sukces' },
            failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Nieudana' },
        };
        const statusStyle = statusMap[status] || statusMap.draft;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
            </span>
        );
    };

    return (
        <RequirePermission permission="view_campaign">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-blue-50/20 mb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Przycisk powrotu */}
                    <button 
                        onClick={() => navigate({ to: '/feed' })}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <MdArrowBack className="text-xl" />
                        <span>Powrót do feedu</span>
                    </button>

                    {/* Główny layout - dwie kolumny */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Lewa kolumna - Galeria zdjęć (60%) */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                {mainImageUrl ? (
                                    <div className="relative aspect-[16/10] bg-gray-100 group">
                                        <img
                                            src={mainImageUrl}
                                            alt={mainImage?.alt_text || campaign.title}
                                            className="w-full h-full object-cover"
                                        />
                                        
                                        {/* Strzałki nawigacyjne */}
                                        {images.length > 1 && (
                                            <>
                                                {/* Strzałka wstecz */}
                                                <button
                                                    onClick={handlePreviousImage}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                                                    aria-label="Poprzednie zdjęcie"
                                                >
                                                    <MdChevronLeft className="text-3xl" />
                                                </button>
                                                
                                                {/* Strzałka naprzód */}
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                                                    aria-label="Następne zdjęcie"
                                                >
                                                    <MdChevronRight className="text-3xl" />
                                                </button>
                                                
                                                {/* Wskaźnik zdjęć */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm font-medium">
                                                    {selectedImageIndex + 1} / {images.length}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="aspect-[16/10] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <span className="text-gray-400 text-lg">Brak zdjęcia</span>
                                    </div>
                                )}
                                
                                {/* Miniaturki */}
                                {images.length > 1 && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <div className="flex gap-2 overflow-x-auto">
                                            {images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedImageIndex(idx)}
                                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                        selectedImageIndex === idx 
                                                            ? 'border-green-500 ring-2 ring-green-200' 
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <img
                                                        src={getImageUrl(img.image_url)}
                                                        alt={img.alt_text || `${campaign.title} - zdjęcie ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Prawa kolumna - Szczegóły kampanii (40%) */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                                {/* Tytuł */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
                                
                                {/* Status */}
                                <div className="mb-4">
                                    {getStatusBadge(campaign.status)}
                                </div>

                                {/* Postęp zbiórki */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-600">Postęp zbiórki</span>
                                        <span className="text-2xl font-bold text-green-600">{percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(percent, 100)}%` } as React.CSSProperties}
                                    />
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-sm">
                                        <span className="text-gray-600">
                                            Zebrano: <span className="font-bold text-green-600">{campaign.current_amount.toLocaleString('pl-PL')} PLN</span>
                                        </span>
                                        <span className="text-gray-600">
                                            Cel: <span className="font-bold">{campaign.goal_amount.toLocaleString('pl-PL')} PLN</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Deadline */}
                                {campaign.deadline && (
                                    <div className="mb-4 flex items-center gap-2 text-gray-600">
                                        <MdCalendarToday className="text-xl" />
                                        <span className="text-sm">
                                            Deadline: <span className="font-semibold">{new Date(campaign.deadline).toLocaleDateString('pl-PL')}</span>
                                        </span>
                                    </div>
                                )}

                                {/* Region */}
                                {campaign.region && (
                                    <div className="mb-4 flex items-center gap-2 text-gray-600">
                                        <MdLocationOn className="text-xl" />
                                        <span className="text-sm">{campaign.region}</span>
                                    </div>
                                )}

                                {/* Przedsiębiorca */}
                                {campaign.entrepreneur_id && (
                                    <div className="mb-6 flex items-center gap-2 text-gray-600">
                                        <MdPerson className="text-xl" />
                                        <Link
                                            to={`/profile/${campaign.entrepreneur_id}`}
                                            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                                        >
                                            Zobacz profil przedsiębiorcy
                                        </Link>
                                    </div>
                                )}

                                {/* Przycisk obserwacji */}
                                {campaign.entrepreneur_id && currentUserId && (
                                    <button
                                        onClick={handleFollowToggle}
                                        className={`w-full mb-4 px-4 py-2 rounded-lg font-semibold transition-all ${
                                            isFollowing
                                                ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100'
                                        }`}
                                    >
                                        {isFollowing ? 'Odobserwuj' : 'Obserwuj'}
                                    </button>
                                )}

                                {/* Formularz inwestycji */}
                                <form onSubmit={handleInvest} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Kwota inwestycji (PLN)
                                        </label>
                                        <input
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            required
                                            placeholder="Wpisz kwotę"
                                        />
                                    </div>
                                    <button 
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        type="submit" 
                                        disabled={investing || !amount}
                                    >
                                        {hasInvested
                                            ? (investing ? 'Inwestuję ponownie...' : 'Zainwestuj ponownie')
                                            : (investing ? 'Inwestuję...' : 'Zainwestuj teraz')
                                        }
                                    </button>
                                    {success && (
                                        <div className="text-green-600 text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                            <MdCheckCircle className="inline-block mr-2" />
                                            {success}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                                            {error}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Opis kampanii - pełna szerokość */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis kampanii</h2>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {campaign.description || 'Brak opisu kampanii.'}
                        </div>
                    </div>

                    {/* Lista inwestycji - pełna szerokość */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <MdTrendingUp className="text-2xl text-green-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Inwestycje w tej kampanii</h2>
                            <span className="ml-auto px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                                {investments.length}
                            </span>
                        </div>
                        {investments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg">Brak inwestycji</p>
                                <p className="text-sm mt-2">Bądź pierwszym inwestorem!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {investments.map(inv => (
                                    <div key={inv.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Inwestor: {inv.investor_id}</p>
                                                <p className="text-xl font-bold text-green-600">{inv.amount.toLocaleString('pl-PL')} PLN</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Status: <span className={`font-medium ${
                                                        inv.status === 'completed' ? 'text-green-600' :
                                                        inv.status === 'pending' ? 'text-yellow-600' : 
                                                        'text-red-600'
                                                    }`}>{inv.status}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">
                                                    {new Date(inv.created_at).toLocaleDateString('pl-PL', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RequirePermission>
    );
}
