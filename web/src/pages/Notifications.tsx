import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';

interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const res = await API.get('/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (e: any) {
            console.error('Błąd pobierania powiadomień:', e);
            setError(e?.response?.data?.detail || 'Nie udało się pobrać powiadomień');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            await API.patch(`/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Zaktualizuj lokalny stan
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (e: any) {
            console.error('Błąd oznaczania powiadomienia jako przeczytanego:', e);
            setError(e?.response?.data?.detail || 'Nie udało się oznaczyć powiadomienia jako przeczytanego');
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <RequirePermission permission="view_notifications">
            <div className="min-w-50 md:min-w-[800px] p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">Powiadomienia</h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600">Zobacz swoje najnowsze powiadomienia</p>
                </div>

                {loading && <Spinner />}
                {error && <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}

                {notifications.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📭</div>
                        <p className="text-gray-500 mb-4">Brak nowych powiadomień</p>
                        <Link
                            to="/dashboard"
                            className="text-green-600 hover:text-green-700 font-medium"
                        >
                            ← Powrót do dashboardu
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border-l-4 transition-colors ${notification.read
                                        ? 'bg-gray-50 border-gray-300'
                                        : 'bg-blue-50 border-blue-500 cursor-pointer hover:bg-blue-100'
                                    }`}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className={`font-medium mb-2 ${notification.read ? 'text-gray-600' : 'text-gray-900'
                                            }`}>
                                            {notification.title}
                                        </h4>
                                        <p className={`text-sm mb-3 ${notification.read ? 'text-gray-500' : 'text-gray-700'
                                            }`}>
                                            {notification.body}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notification.created_at).toLocaleDateString('pl-PL')}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="ml-4">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t">
                    <Link
                        to="/dashboard"
                        className="text-green-600 hover:text-green-700 font-medium"
                    >
                        ← Powrót do dashboardu
                    </Link>
                </div>
            </div>
        </RequirePermission>
    );
}
