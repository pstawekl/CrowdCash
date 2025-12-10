import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { MdAccountBalance, MdArrowForward, MdCampaign, MdHistory, MdTrendingUp } from 'react-icons/md';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';

interface Investment {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    campaign_id?: string;
    campaign_title?: string;
}

interface InvestmentStats {
    count?: number;
    total_amount?: number;
}

export default function InvestorDashboard() {
    const [stats, setStats] = useState<InvestmentStats>({});
    const [recentInvestments, setRecentInvestments] = useState<Investment[]>([]);
    const [allInvestments, setAllInvestments] = useState<Investment[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');

                // Pobierz statystyki inwestora
                const statsRes = await API.get('/investments/stats', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(statsRes.data);

                // Pobierz wszystkie inwestycje
                const invRes = await API.get('/investments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Konwertuj UUID na stringi i filtruj tylko completed inwestycje
                // Pending inwestycje nie liczą się jako aktywne projekty
                const allData = Array.isArray(invRes.data) ? invRes.data
                    .filter(inv => inv.status === 'completed') // Tylko completed (approved płatności)
                    .map(inv => ({
                        ...inv,
                        id: String(inv.id),
                        campaign_id: inv.campaign_id ? String(inv.campaign_id) : null,
                        campaign_title: inv.campaign_title || null,
                        campaign_status: inv.campaign_status || null
                    })) : [];

                setAllInvestments(allData);
                setRecentInvestments(allData.slice(0, 3)); // Ostatnie 3 dla podglądu
            } catch (e: any) {
                console.error('Błąd pobierania danych:', e);
                setError(e?.response?.data?.detail || 'Nie udało się pobrać danych');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <RequirePermission permission="view_investor_dashboard">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto mb-8">
                    {/* Header */}
                    <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 mb-2">
                            Panel Inwestora
                        </h1>
                        <p className="text-gray-600 text-lg">Przegląd Twoich inwestycji i aktywności</p>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <Spinner />
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm animate-fade-in">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Statystyki - Nowoczesne karty z animacjami */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {/* Karta: Liczba inwestycji */}
                        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-gray-100 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <MdTrendingUp className="text-white text-2xl" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Inwestycje</p>
                                    </div>
                                </div>
                                <h3 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                                    {stats.count || 0}
                                </h3>
                                <p className="text-gray-600 font-medium">aktywnych projektów</p>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 flex items-center">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                        Aktywne inwestycje
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Karta: Zainwestowana kwota */}
                        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-gray-100 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <MdAccountBalance className="text-white text-2xl" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Portfolio</p>
                                    </div>
                                </div>
                                <h3 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 mb-2">
                                    {formatCurrency(stats.total_amount || 0)}
                                </h3>
                                <p className="text-gray-600 font-medium">łącznie zainwestowane</p>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 flex items-center">
                                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                                        Całkowita wartość
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ostatnie inwestycje */}
                    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <MdHistory className="text-green-600" />
                                    Ostatnie inwestycje
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Twoje najnowsze aktywności</p>
                            </div>
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="group flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-all hover:gap-3"
                            >
                                {showAll ? 'Pokaż mniej' : 'Zobacz wszystkie'}
                                <MdArrowForward className={`group-hover:translate-x-1 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {recentInvestments.length === 0 ? (
                            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-green-50/50 rounded-xl border-2 border-dashed border-gray-200">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <MdCampaign className="text-green-600 text-2xl" />
                                </div>
                                <p className="text-gray-600 font-medium mb-2">Nie masz jeszcze żadnych inwestycji</p>
                                <p className="text-gray-500 text-sm mb-6">Rozpocznij swoją przygodę z inwestowaniem</p>
                                <Link
                                    to="/feed"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                >
                                    <MdCampaign />
                                    Przeglądaj kampanie
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(showAll ? allInvestments : recentInvestments).map((inv, index) => (
                                    <Link
                                        to={`/campaign/${inv.campaign_id}`}
                                        key={inv.id}
                                        className="group block bg-gradient-to-r from-gray-50 to-green-50/30 rounded-xl p-5 hover:from-green-50 hover:to-emerald-50 border border-gray-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                                                    {inv.campaign_title || 'Brak kampanii'}
                                                </h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                                                            {formatCurrency(inv.amount)}
                                                        </span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        inv.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm text-gray-500 font-medium">
                                                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString('pl-PL', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    }) : ''}
                                                </p>
                                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MdArrowForward className="text-green-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Przyciski szybkiego dostępu
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} mb-5`}>
                        <Link
                            to="/feed"
                            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 text-center border border-gray-100 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition-all duration-300"></div>
                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <MdCampaign className="text-white text-2xl" />
                                </div>
                                <div className="text-green-600 font-bold text-lg mb-2 group-hover:text-emerald-600 transition-colors">Przeglądaj kampanie</div>
                                <div className="text-sm text-gray-600">Znajdź nowe projekty do inwestowania</div>
                            </div>
                        </Link>
                        
                        <Link
                            to="/transactions"
                            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 text-center border border-gray-100 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-300"></div>
                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <MdHistory className="text-white text-2xl" />
                                </div>
                                <div className="text-blue-600 font-bold text-lg mb-2 group-hover:text-cyan-600 transition-colors">Historia transakcji</div>
                                <div className="text-sm text-gray-600">Zobacz wszystkie swoje transakcje</div>
                            </div>
                        </Link>
                        
                        <Link
                            to="/transactions"
                            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 text-center border border-gray-100 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300"></div>
                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <MdPayment className="text-white text-2xl" />
                                </div>
                                <div className="text-purple-600 font-bold text-lg mb-2 group-hover:text-pink-600 transition-colors">Transakcje</div>
                                <div className="text-sm text-gray-600">Historia wszystkich płatności</div>
                            </div>
                        </Link>
                    </div> */}
                </div>
            </div>
        </RequirePermission>
    );
}
