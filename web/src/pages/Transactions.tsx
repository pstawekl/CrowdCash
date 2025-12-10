import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';
import { AxiosError } from 'axios';

interface Transaction {
    id: string;
    investment_id: string | null;
    amount: number;
    fee: number;
    type: string;
    status: string;
    created_at: string;
}

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingPayment, setLoadingPayment] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('Brak autoryzacji. Zaloguj się ponownie.');
                    setLoading(false);
                    return;
                }

                // Uproszczone pobieranie transakcji - bez obsługi redirectów
                const res = await API.get('/transactions/', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Konwertuj UUID na stringi i waliduj dane
                if (!Array.isArray(res.data)) {
                    console.error('Odpowiedź API nie jest tablicą:', res.data);
                    setTransactions([]);
                    return;
                }

                const transactionsData = res.data.map(transaction => ({
                    ...transaction,
                    id: String(transaction.id || ''),
                    investment_id: transaction.investment_id ? String(transaction.investment_id) : null,
                    amount: Number(transaction.amount) || 0,
                    fee: Number(transaction.fee) || 0,
                    type: transaction.type || 'unknown',
                    status: transaction.status || 'pending',
                    created_at: transaction.created_at || new Date().toISOString(),
                }));

                setTransactions(transactionsData);
            } catch (e: any) {
                console.error('Błąd pobierania transakcji:', e);
                const errorMessage = e?.response?.data?.detail || e?.message || 'Nie udało się pobrać transakcji';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);


    const getTypeLabel = (type: string) => {
        switch (type.toLowerCase()) {
            case 'deposit': return 'Depozyt';
            case 'refund': return 'Zwrot';
            case 'payout': return 'Wypłata';
            default: return type;
        }
    };

    const handleResumePayment = async (transactionId: string) => {
        setLoadingPayment(transactionId);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Brak autoryzacji. Zaloguj się ponownie.');
                setLoadingPayment(null);
                return;
            }

            const res = await API.get(`/payments/${transactionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data?.payment_link) {
                // Przekieruj użytkownika do Stripe checkout
                window.location.href = res.data.payment_link;
            } else {
                setError('Nie udało się pobrać linku do płatności.');
            }
        } catch (e) {
            const axiosError = e as AxiosError<{ detail?: string }>;
            console.error('Błąd pobierania linku do płatności:', axiosError);
            const errorMessage = axiosError?.response?.data?.detail || axiosError?.message || 'Nie udało się pobrać linku do płatności';
            setError(errorMessage);
        } finally {
            setLoadingPayment(null);
        }
    };

    return (
        <RequirePermission permission="view_transactions">
            <div className="min-w-50 md:min-w-[800px] p-6 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Historia transakcji</h2>

                {loading && <Spinner />}
                {error && <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}

                <div className="space-y-4">
                    {transactions.length === 0 && !loading && (
                        <div className="text-gray-500 text-center py-8">Brak transakcji</div>
                    )}

                    {transactions.map(transaction => (
                        <div
                            key={transaction.id}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {getTypeLabel(transaction.type)}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${transaction.status === 'successful' ? 'bg-green-100 text-green-800' :
                                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {transaction.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Inwestycja: <span className="font-medium">{transaction.investment_id}</span></p>
                                            <p className="text-gray-600">Kwota: <span className="font-semibold text-green-600">{transaction.amount} PLN</span></p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Prowizja: <span className="font-medium">{transaction.fee} PLN</span></p>
                                            <p className="text-gray-500 text-xs">
                                                {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('pl-PL') : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {transaction.status === 'pending' && (
                                    <div className="ml-4">
                                        <button
                                            onClick={() => handleResumePayment(transaction.id)}
                                            disabled={loadingPayment === transaction.id}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                                        >
                                            {loadingPayment === transaction.id ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Ładowanie...
                                                </span>
                                            ) : (
                                                'Dokończ płatność'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Podsumowanie */}
                {transactions.length > 0 && (
                    <div className="mt-8 bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-4">Podsumowanie</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {transactions.filter(t => t.status === 'successful' && t.type === 'deposit').length}
                                </p>
                                <p className="text-sm text-gray-600">Pomyślnych depozytów</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {transactions.filter(t => t.status === 'successful').reduce((sum, t) => sum + t.amount, 0)} PLN
                                </p>
                                <p className="text-sm text-gray-600">Łączna kwota</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-600">
                                    {transactions.filter(t => t.status === 'pending').length}
                                </p>
                                <p className="text-sm text-gray-600">Oczekujących</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Przyciski szybkiego dostępu */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <Link
                        to="/investor-dashboard"
                        className="bg-white rounded-lg shadow p-4 text-center hover:bg-green-50 transition-colors"
                    >
                        <div className="text-green-600 font-semibold">Moje inwestycje</div>
                        <div className="text-sm text-gray-500">Zobacz swoje inwestycje</div>
                    </Link>
                    <Link
                        to="/feed"
                        className="bg-white rounded-lg shadow p-4 text-center hover:bg-green-50 transition-colors"
                    >
                        <div className="text-green-600 font-semibold">Kampanie</div>
                        <div className="text-sm text-gray-500">Przeglądaj projekty</div>
                    </Link>
                    <Link
                        to="/investor-dashboard"
                        className="bg-white rounded-lg shadow p-4 text-center hover:bg-green-50 transition-colors"
                    >
                        <div className="text-green-600 font-semibold">Panel</div>
                        <div className="text-sm text-gray-500">Powrót do dashboard</div>
                    </Link>
                </div>
            </div>
        </RequirePermission>
    );
}
