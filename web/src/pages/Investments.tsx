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
    campaign_id?: string | null;
    campaign_title?: string | null;
    campaign_status?: string | null;
}

interface InvestmentStats {
    count?: number;
    total_amount?: number;
}

export default function Investments() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [stats, setStats] = useState<InvestmentStats>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');

                // Pobierz statystyki
                const statsRes = await API.get('/investments/stats', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(statsRes.data);

                // Pobierz historię inwestycji
                const res = await API.get('/investments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Konwertuj UUID na stringi
                const investmentsData = Array.isArray(res.data) ? res.data.map(inv => ({
                    ...inv,
                    id: String(inv.id),
                    campaign_id: inv.campaign_id ? String(inv.campaign_id) : null,
                    campaign_title: inv.campaign_title || null,
                    campaign_status: inv.campaign_status || null
                })) : [];

                setInvestments(investmentsData);
                console.log('Odebrana lista inwestycji:', investmentsData);
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
        <RequirePermission permission="view_investments">
            <div className="min-w-50 md:min-w-[800px] p-6 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Moje inwestycje</h2>

                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Liczba inwestycji</h3>
                        <p className="text-3xl font-bold text-green-600">{stats.count || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Zainwestowana kwota</h3>
                        <p className="text-3xl font-bold text-green-600">{stats.total_amount || 0} PLN</p>
                    </div>
                </div>

                {loading && <Spinner />}
                {error && <div className="text-red-600 mb-4">{error}</div>}

                <div className="space-y-4">
                    {investments.length === 0 && !loading && (
                        <div className="text-gray-500 text-center py-8">Brak inwestycji</div>
                    )}
                    {investments.map(inv => (
                        <Link
                            to={`/campaign/${inv.campaign_id}`}
                            key={inv.id}
                            className="block bg-white rounded-lg shadow p-4 hover:bg-blue-50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900">{inv.campaign_title || 'Brak kampanii'}</h3>
                                    <p className="text-gray-600">Kwota: <span className="font-semibold text-green-600">{inv.amount} PLN</span></p>
                                    <p className="text-sm text-gray-500">Status: <span className="font-medium">{inv.status}</span></p>
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

                {/* Przyciski szybkiego dostępu */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <Link
                        to="/feed"
                        className="bg-white rounded-lg shadow p-4 text-center hover:bg-green-50 transition-colors"
                    >
                        <div className="text-green-600 font-semibold">Przeglądaj kampanie</div>
                        <div className="text-sm text-gray-500">Znajdź nowe projekty</div>
                    </Link>
                    <Link
                        to="/transactions"
                        className="bg-white rounded-lg shadow p-4 text-center hover:bg-green-50 transition-colors"
                    >
                        <div className="text-green-600 font-semibold">Historia transakcji</div>
                        <div className="text-sm text-gray-500">Zobacz wszystkie płatności</div>
                    </Link>
                    <Link
                        to="/investor-dashboard"
                        className="bg-white rounded-lg shadow p-4 text-center hover:bg-green-50 transition-colors"
                    >
                        <div className="text-green-600 font-semibold">Dashboard</div>
                        <div className="text-sm text-gray-500">Powrót do panelu</div>
                    </Link>
                </div>
            </div>
        </RequirePermission>
    );
}
