import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';

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

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('Brak tokena');

                // Najpierw spróbuj endpoint /transactions/
                let res;
                try {
                    res = await API.get('/transactions/', {
                        headers: { Authorization: `Bearer ${token}` },
                        maxRedirects: 0,
                        validateStatus: (status) => status < 400
                    });

                    if (res.status === 307) {
                        // Jeśli 307 redirect, ponów żądanie
                        res = await API.get('/transactions/', {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    }
                } catch (redirectError) {
                    // Jeśli błąd związany z redirect, spróbuj alternatywnego endpointu
                    console.log('307 redirect, ponawiam na /transactions/');
                    res = await API.get('/transactions/', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                }

                // Konwertuj UUID na stringi
                const transactionsData = Array.isArray(res.data) ? res.data.map(transaction => ({
                    ...transaction,
                    id: String(transaction.id),
                    investment_id: transaction.investment_id ? String(transaction.investment_id) : null
                })) : [];

                setTransactions(transactionsData);
                console.log('Odebrane transakcje:', transactionsData);
            } catch (e: any) {
                console.error('Błąd pobierania transakcji:', e);
                setError(e?.response?.data?.detail || 'Nie udało się pobrać transakcji');
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
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <div className="text-green-600 font-semibold">Inwestycje</div>
                        <div className="text-sm text-gray-500">Zobacz swoje inwestycje</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <div className="text-green-600 font-semibold">Kampanie</div>
                        <div className="text-sm text-gray-500">Przeglądaj projekty</div>
                    </div>
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
