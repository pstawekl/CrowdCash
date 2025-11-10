import { Link, useNavigate, useParams } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
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
    entrepreneur_id?: string;
    deadline?: string;
}

interface Investment {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    investor_id: string;
}

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
    const navigate = useNavigate();

    const fetchCampaign = async () => {
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

                // Konwertuj UUID na stringi
                const investmentsData = Array.isArray(invRes.data) ? invRes.data.map(inv => ({
                    ...inv,
                    id: String(inv.id),
                    campaign_id: inv.campaign_id ? String(inv.campaign_id) : null,
                    investor_id: String(inv.investor_id)
                })) : [];

                setInvestments(investmentsData);
            } catch (e) {
                console.log('Brak dostępu do listy inwestycji lub brak inwestycji');
                setInvestments([]);
            }
        } catch (e: unknown) {
            setError(`Błąd pobierania kampanii: ${(e as AxiosError).response?.data || ''}`);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchCampaign().finally(() => setLoading(false));
    }, [id]);

    // Pobierz ID aktualnego użytkownika
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                const res = await API.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUserId(res.data.id);
            } catch (e) {
                console.error('Błąd pobierania użytkownika:', e);
            }
        };
        fetchCurrentUser();
    }, []);

    // Sprawdź czy użytkownik już inwestował w tę kampanię
    const hasInvested = currentUserId && investments.some(inv => inv.investor_id === currentUserId);

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

            // Zainicjuj płatność TPay
            const tpayRes = await API.post('/transactions/initiate-tpay', {
                investment_id: res.data.id
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccess('Inwestycja złożona! Przejdź do płatności.');
            setAmount('');

            // Opcjonalnie: przekieruj do płatności
            if (tpayRes.data.payment_url) {
                window.open(tpayRes.data.payment_url, '_blank');
            }

            // Odśwież dane kampanii i inwestycji
            fetchCampaign();
        } catch (e: any) {
            console.error('Błąd inwestowania:', e);
            setError(e?.response?.data?.detail || 'Błąd inwestowania');
        } finally {
            setInvesting(false);
        }
    };

    if (loading) return <Spinner />;
    if (!campaign) return <div className="p-6 text-red-600">Brak szczegółów kampanii</div>;

    // Pasek postępu
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
        <RequirePermission permission="view_campaign">
            <div className="p-6 x§mx-auto">
                <button className="btn btn-sm mb-4" onClick={() => navigate({ to: '/feed' })}>&larr; Powrót do feedu</button>
                <h2 className="text-2xl font-bold mb-2">{campaign.title}</h2>
                <div className="mb-2 text-gray-600">{campaign.description}</div>
                <div className="flex flex-wrap gap-4 text-sm mb-2">
                    <span className="font-medium">Cel: <span className="font-normal">{campaign.goal_amount} PLN</span></span>
                    <span className="font-medium">Zebrano: <span className="font-normal">{campaign.current_amount} PLN</span></span>
                    <span className="font-medium">Status: <span className="font-normal">{campaign.status}</span></span>
                    {campaign.deadline && <span className="font-medium">Deadline: <span className="font-normal">{new Date(campaign.deadline).toLocaleDateString()}</span></span>}
                </div>
                {campaign.entrepreneur_id && (
                    <div className="mb-2 text-xs text-gray-500">
                        Przedsiębiorca:{' '}
                        <Link
                            to={`/profile/${campaign.entrepreneur_id}`}
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            {campaign.entrepreneur_id}
                        </Link>
                    </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 relative overflow-hidden">
                    <div className={`bg-green-500 h-2 rounded-full absolute top-0 left-0 transition-all duration-500 ${progressClass}`} />
                </div>
                <span className="text-xs text-gray-500 mt-1 block">{percent}% celu</span>
                <form className="mt-6 space-y-4" onSubmit={handleInvest}>
                    <label className="block font-medium">Kwota inwestycji (PLN):</label>
                    <input
                        className="input input-bordered w-full"
                        type="number"
                        min={1}
                        step={1}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        placeholder="Wpisz kwotę"
                    />
                    <button className="btn btn-success w-full" type="submit" disabled={investing || !amount}>
                        {hasInvested
                            ? (investing ? 'Inwestuję ponownie...' : 'Zainwestuj ponownie')
                            : (investing ? 'Inwestuję...' : 'Zainwestuj')
                        }
                    </button>
                    {success && (
                        <div className="text-green-600 text-center p-4 bg-green-50 rounded-lg">
                            {success}
                        </div>
                    )}
                    {error && <div className="text-red-600 text-center">{error}</div>}
                </form>

                {/* Lista inwestycji w kampanii */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Inwestycje w tej kampanii</h3>
                    {investments.length === 0 ? (
                        <p className="text-gray-500">Brak inwestycji</p>
                    ) : (
                        <div className="space-y-3">
                            {investments.map(inv => (
                                <div key={inv.id} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-600">Inwestor: {inv.investor_id}</p>
                                            <p className="font-semibold text-green-600">{inv.amount} PLN</p>
                                            <p className="text-sm text-gray-500">
                                                Status: <span className={`font-medium ${inv.status === 'completed' ? 'text-green-600' :
                                                    inv.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>{inv.status}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">
                                                {new Date(inv.created_at).toLocaleDateString('pl-PL')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </RequirePermission>
    );
}
