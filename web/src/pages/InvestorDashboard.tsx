import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

                // Pobierz ostatnie 3 inwestycje
                const invRes = await API.get('/investments/history?limit=3', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Konwertuj UUID na stringi
                const recentData = Array.isArray(invRes.data) ? invRes.data.map(inv => ({
                    ...inv,
                    id: String(inv.id),
                    campaign_id: inv.campaign_id ? String(inv.campaign_id) : null,
                    campaign_title: inv.campaign_title || null,
                    campaign_status: inv.campaign_status || null
                })) : [];

                setRecentInvestments(recentData);
            } catch (e: any) {
                console.error('Błąd pobierania danych:', e);
                setError(e?.response?.data?.detail || 'Nie udało się pobrać danych');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <RequirePermission permission="view_investor_dashboard">
            <div className="min-w-50 md:min-w-[800px] p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Panel inwestora</h2>
                    <p className="text-gray-600">Przegląd Twoich inwestycji i aktywności</p>
                </div>

                {loading && <Spinner />}
                {error && <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}

                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Liczba inwestycji</h3>
                        <p className="text-4xl font-bold text-green-600">{stats.count || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">aktywnych projektów</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Zainwestowana kwota</h3>
                        <p className="text-4xl font-bold text-blue-600">{stats.total_amount || 0} PLN</p>
                        <p className="text-sm text-gray-500 mt-1">łącznie zainwestowane</p>
                    </div>
                </div>

                {/* Ostatnie inwestycje */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Ostatnie inwestycje</h3>
                        <Link to="/investments" className="text-green-600 hover:text-green-700 font-medium">
                            Zobacz wszystkie →
                        </Link>
                    </div>

                    {recentInvestments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">Nie masz jeszcze żadnych inwestycji</p>
                            <Link
                                to="/feed"
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Przeglądaj kampanie
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentInvestments.map(inv => (
                                <Link
                                    to={`/campaign/${inv.campaign_id}`}
                                    key={inv.id}
                                    className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">
                                                {inv.campaign_title || 'Brak kampanii'}
                                            </h4>
                                            <p className="text-green-600 font-medium">
                                                {inv.amount} PLN
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Status: <span className="font-medium">{inv.status}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">
                                                {inv.created_at ? new Date(inv.created_at).toLocaleDateString('pl-PL') : ''}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Przyciski szybkiego dostępu */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/feed"
                        className="bg-white rounded-lg shadow p-6 text-center hover:bg-green-50 transition-colors border border-gray-200"
                    >
                        <div className="text-green-600 font-semibold text-lg mb-2">Przeglądaj kampanie</div>
                        <div className="text-sm text-gray-500">Znajdź nowe projekty do inwestowania</div>
                    </Link>
                    <Link
                        to="/investments"
                        className="bg-white rounded-lg shadow p-6 text-center hover:bg-green-50 transition-colors border border-gray-200"
                    >
                        <div className="text-green-600 font-semibold text-lg mb-2">Historia inwestycji</div>
                        <div className="text-sm text-gray-500">Zobacz wszystkie swoje inwestycje</div>
                    </Link>
                    <Link
                        to="/transactions"
                        className="bg-white rounded-lg shadow p-6 text-center hover:bg-green-50 transition-colors border border-gray-200"
                    >
                        <div className="text-green-600 font-semibold text-lg mb-2">Transakcje</div>
                        <div className="text-sm text-gray-500">Historia wszystkich płatności</div>
                    </Link>
                </div>
            </div>
        </RequirePermission>
    );
}
