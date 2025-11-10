import { useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
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
}

export default function InvestorFeed() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [following, setFollowing] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFeed = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                const res = await API.get('/campaigns/feed', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    params: search.trim() ? { q: search.trim() } : {},
                });
                // Konwertuj UUID na stringi
                const campaignsData = Array.isArray(res.data) ? res.data.map(campaign => ({
                    ...campaign,
                    id: String(campaign.id),
                    entrepreneur_id: campaign.entrepreneur_id ? String(campaign.entrepreneur_id) : undefined
                })) : [];

                setCampaigns(campaignsData);
                // Pobierz listę obserwowanych przedsiębiorców
                const followingRes = await API.get('/users/following', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                type FollowingItem = { entrepreneur_id: string };
                setFollowing(Array.isArray(followingRes.data) ? (followingRes.data as FollowingItem[]).map((f) => f.entrepreneur_id) : []);
            } catch (e) {
                const err = e as AxiosError<{ detail?: string }>;
                setError(err.response?.data?.detail || 'Błąd pobierania feedu');
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, [search]);

    const handleFollowToggle = async (entrepreneurId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');
            if (following.includes(entrepreneurId)) {
                await API.delete(`/users/unfollow/${entrepreneurId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing(following.filter(id => id !== entrepreneurId));
            } else {
                await API.post(`/users/follow/${entrepreneurId}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFollowing([...following, entrepreneurId]);
            }
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            setError(err.response?.data?.detail || 'Błąd zmiany obserwowania');
        }
    };

    return (
        <RequirePermission permission="view_feed">
            <div className="p-6 mx-auto">
                <h2 className="text-2xl font-bold mb-4">Feed kampanii</h2>
                <input
                    className="input input-bordered w-full mb-4"
                    placeholder="Szukaj kampanii..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {loading && <Spinner />}
                {error && <div className="text-red-600 mb-4">{error}</div>}
                <div className="space-y-4">
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
                                isFollowing={camp.entrepreneur_id ? following.includes(camp.entrepreneur_id) : false}
                                onFollowToggle={handleFollowToggle}
                                onDetails={id => navigate({ to: `/campaign/${id}` })}
                            />
                        );
                    })}
                </div>
            </div>
        </RequirePermission>
    );
}
