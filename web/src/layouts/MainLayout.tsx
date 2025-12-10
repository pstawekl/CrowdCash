import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import {
    MdAdminPanelSettings,
    MdArrowDropDown,
    MdCampaign,
    MdDashboard,
    MdLogin,
    MdLogout,
    MdNotifications,
    MdPayment,
    MdSettings
} from 'react-icons/md';
import logoImage from '../assets/logo.png';
import API from '../utils/api';
import { logout as baseLogout, useAuth } from '../utils/auth';
import { UserRoleEnum } from '../utils/roles';

interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
}

export default function MainLayout() {
    const { isAuthenticated, role } = useAuth();
    const navigate = useNavigate();
    const hasCheckedVerification = useRef(false);
    const [isCheckingVerification, setIsCheckingVerification] = useState(false);
    const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
    const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsDropdownRef = useRef<HTMLDivElement>(null);

    // Sprawdź weryfikację konta dla zalogowanych użytkowników
    useEffect(() => {
        const checkVerification = async () => {
            // Nie sprawdzaj jeśli już sprawdziliśmy w tej sesji
            if (hasCheckedVerification.current) return;
            
            if (!isAuthenticated || isCheckingVerification) return;
            
            // Nie sprawdzaj na stronie weryfikacji lub logowania
            const currentPath = window.location.pathname;
            if (currentPath === '/verify' || currentPath === '/login' || currentPath === '/register') {
                return;
            }

            setIsCheckingVerification(true);
            hasCheckedVerification.current = true;
            
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setIsCheckingVerification(false);
                    hasCheckedVerification.current = false;
                    return;
                }

                const meRes = await API.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                const isVerified = meRes.data?.is_verified;
                const email = meRes.data?.email;

                if (!isVerified && email) {
                    // Wyczyść token przed przekierowaniem
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userPermissions');
                    hasCheckedVerification.current = false; // Reset żeby można było sprawdzić ponownie po weryfikacji
                    
                    // Przekieruj do strony weryfikacji
                    navigate({ 
                        to: '/verify',
                        search: { email }
                    });
                }
            } catch (error) {
                // Jeśli błąd 401/403, nie wylogowuj jeśli jesteśmy na verify/login
                const apiError = error as AxiosError;
                const status = apiError?.response?.status;
                if (status === 401 || status === 403) {
                    const currentPath = window.location.pathname;
                    if (currentPath !== '/verify' && currentPath !== '/login') {
                        console.error('Błąd sprawdzania weryfikacji:', apiError);
                        hasCheckedVerification.current = false;
                        baseLogout(() => navigate({ to: '/login' }));
                    }
                } else {
                    // Dla innych błędów, reset flagi żeby można było spróbować ponownie
                    hasCheckedVerification.current = false;
                }
            } finally {
                setIsCheckingVerification(false);
            }
        };

        checkVerification();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, navigate]); // Celowo pomijamy isCheckingVerification żeby uniknąć nieskończonej pętli

    // Reset flagi gdy użytkownik się wyloguje
    useEffect(() => {
        if (!isAuthenticated) {
            hasCheckedVerification.current = false;
        }
    }, [isAuthenticated]);

    // Przekieruj na odpowiedni dashboard po zalogowaniu
    useEffect(() => {
        if (isAuthenticated && role && !isCheckingVerification) {
            // Nie przekierowuj jeśli jesteśmy na stronie weryfikacji
            if (window.location.pathname === '/verify') {
                return;
            }
            
            const userRole = Number(role);
            if (userRole === UserRoleEnum.investor && window.location.pathname === '/') {
                navigate({ to: '/investor-dashboard' });
            } else if (userRole === UserRoleEnum.entrepreneur && window.location.pathname === '/') {
                navigate({ to: '/dashboard' });
            } else if (userRole === UserRoleEnum.admin && window.location.pathname === '/') {
                navigate({ to: '/dashboard' });
            }
        }
    }, [isAuthenticated, role, navigate, isCheckingVerification]);

    const logout = () => {
        baseLogout(() => navigate({ to: '/login' }));
    };

    // Pobierz powiadomienia
    useEffect(() => {
        if (isAuthenticated && isNotificationsDropdownOpen) {
            fetchNotifications();
        }
    }, [isAuthenticated, isNotificationsDropdownOpen]);

    const fetchNotifications = async () => {
        setNotificationsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const res = await API.get('/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Błąd pobierania powiadomień:', e);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await API.patch(`/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (e) {
            console.error('Błąd oznaczania powiadomienia jako przeczytanego:', e);
        }
    };

    // Zamknij dropdown po kliknięciu poza nim
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSettingsDropdownOpen(false);
            }
            if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsDropdownOpen(false);
            }
        };

        if (isSettingsDropdownOpen || isNotificationsDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSettingsDropdownOpen, isNotificationsDropdownOpen]);

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;


    return (
        <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-50 via-green-50/20 to-blue-50/20">
            <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link 
                            to="/" 
                            className="flex items-center group transition-all duration-200 hover:scale-105"
                        >
                            <img 
                                src={logoImage} 
                                alt="CrowdCash Logo" 
                                className="h-10 w-auto transition-transform duration-200 group-hover:rotate-3" 
                            />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 hidden sm:block">
                                CrowdCash
                            </span>
                        </Link>

                        {/* Navigation */}
                        <nav className="flex items-center gap-2 sm:gap-4">
                            {isAuthenticated && Number(role) === UserRoleEnum.investor && (
                                <>
                                    <Link 
                                        to="/investor-dashboard" 
                                        className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
                                    >
                                        <MdDashboard className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Panel inwestora</span>
                                    </Link>
                                    <Link 
                                        to="/feed" 
                                        className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
                                    >
                                        <MdCampaign className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Kampanie</span>
                                    </Link>
                                    <Link 
                                        to="/transactions" 
                                        className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
                                    >
                                        <MdPayment className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Transakcje</span>
                                    </Link>
                                    {/* Dropdown powiadomień */}
                                    <div className="relative" ref={notificationsDropdownRef}>
                                        <button
                                            onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
                                            className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium relative"
                                        >
                                            <MdNotifications className="text-xl group-hover:scale-110 transition-transform" />
                                            <span className="hidden sm:inline">Powiadomienia</span>
                                            {unreadNotificationsCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                                </span>
                                            )}
                                        </button>
                                        
                                        {isNotificationsDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                                                {/* Nagłówek dropdown */}
                                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900">Powiadomienia</h3>
                                                    {unreadNotificationsCount > 0 && (
                                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                            {unreadNotificationsCount}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Lista powiadomień */}
                                                <div className="overflow-y-auto max-h-[500px]">
                                                    {notificationsLoading ? (
                                                        <div className="p-8 text-center">
                                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                                            <p className="mt-2 text-sm text-gray-500">Ładowanie...</p>
                                                        </div>
                                                    ) : notifications.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <MdNotifications className="mx-auto text-4xl text-gray-300 mb-2" />
                                                            <p className="text-gray-500 text-sm">Brak powiadomień</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-100">
                                                            {notifications.map(notification => (
                                                                <div
                                                                    key={notification.id}
                                                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                                                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                                                                        !notification.read ? 'bg-green-50/50 border-l-4 border-green-500' : ''
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        {!notification.read && (
                                                                            <div className="mt-2 w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                                <h4 className={`font-semibold text-sm ${
                                                                                    notification.read ? 'text-gray-600' : 'text-gray-900'
                                                                                }`}>
                                                                                    {notification.title}
                                                                                </h4>
                                                                                {!notification.read && (
                                                                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                                                                                )}
                                                                            </div>
                                                                            <p className={`text-sm mb-2 ${
                                                                                notification.read ? 'text-gray-500' : 'text-gray-700'
                                                                            }`}>
                                                                                {notification.body}
                                                                            </p>
                                                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                                <span>{new Date(notification.created_at).toLocaleDateString('pl-PL', {
                                                                                    day: 'numeric',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Stopka z linkiem do wszystkich powiadomień */}
                                                {notifications.length > 0 && (
                                                    <div className="px-4 py-3 border-t border-gray-200">
                                                        <Link
                                                            to="/notifications"
                                                            onClick={() => setIsNotificationsDropdownOpen(false)}
                                                            className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                                                        >
                                                            Zobacz wszystkie powiadomienia
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            {isAuthenticated && Number(role) === UserRoleEnum.entrepreneur && (
                                <>
                                    <Link 
                                        to="/dashboard" 
                                        className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
                                    >
                                        <MdDashboard className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Panel przedsiębiorcy</span>
                                    </Link>
                                    {/* Dropdown powiadomień */}
                                    <div className="relative" ref={notificationsDropdownRef}>
                                        <button
                                            onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
                                            className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium relative"
                                        >
                                            <MdNotifications className="text-xl group-hover:scale-110 transition-transform" />
                                            <span className="hidden sm:inline">Powiadomienia</span>
                                            {unreadNotificationsCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                                </span>
                                            )}
                                        </button>
                                        
                                        {isNotificationsDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                                                {/* Nagłówek dropdown */}
                                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900">Powiadomienia</h3>
                                                    {unreadNotificationsCount > 0 && (
                                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                            {unreadNotificationsCount}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Lista powiadomień */}
                                                <div className="overflow-y-auto max-h-[500px]">
                                                    {notificationsLoading ? (
                                                        <div className="p-8 text-center">
                                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                                            <p className="mt-2 text-sm text-gray-500">Ładowanie...</p>
                                                        </div>
                                                    ) : notifications.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <MdNotifications className="mx-auto text-4xl text-gray-300 mb-2" />
                                                            <p className="text-gray-500 text-sm">Brak powiadomień</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-100">
                                                            {notifications.map(notification => (
                                                                <div
                                                                    key={notification.id}
                                                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                                                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                                                                        !notification.read ? 'bg-green-50/50 border-l-4 border-green-500' : ''
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        {!notification.read && (
                                                                            <div className="mt-2 w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                                <h4 className={`font-semibold text-sm ${
                                                                                    notification.read ? 'text-gray-600' : 'text-gray-900'
                                                                                }`}>
                                                                                    {notification.title}
                                                                                </h4>
                                                                                {!notification.read && (
                                                                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                                                                                )}
                                                                            </div>
                                                                            <p className={`text-sm mb-2 ${
                                                                                notification.read ? 'text-gray-500' : 'text-gray-700'
                                                                            }`}>
                                                                                {notification.body}
                                                                            </p>
                                                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                                <span>{new Date(notification.created_at).toLocaleDateString('pl-PL', {
                                                                                    day: 'numeric',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Stopka z linkiem do wszystkich powiadomień */}
                                                {notifications.length > 0 && (
                                                    <div className="px-4 py-3 border-t border-gray-200">
                                                        <Link
                                                            to="/notifications"
                                                            onClick={() => setIsNotificationsDropdownOpen(false)}
                                                            className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                                                        >
                                                            Zobacz wszystkie powiadomienia
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            {isAuthenticated && Number(role) === UserRoleEnum.admin && (
                                <>
                                    <Link 
                                        to="/dashboard" 
                                        className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 font-medium"
                                    >
                                        <MdAdminPanelSettings className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Panel admina</span>
                                    </Link>
                                    <Link 
                                        to="/feed" 
                                        className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
                                    >
                                        <MdCampaign className="text-xl group-hover:scale-110 transition-transform" />
                                        <span className="hidden sm:inline">Feed</span>
                                    </Link>
                                    {/* Dropdown powiadomień */}
                                    <div className="relative" ref={notificationsDropdownRef}>
                                        <button
                                            onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
                                            className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium relative"
                                        >
                                            <MdNotifications className="text-xl group-hover:scale-110 transition-transform" />
                                            <span className="hidden sm:inline">Powiadomienia</span>
                                            {unreadNotificationsCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                                </span>
                                            )}
                                        </button>
                                        
                                        {isNotificationsDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                                                {/* Nagłówek dropdown */}
                                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900">Powiadomienia</h3>
                                                    {unreadNotificationsCount > 0 && (
                                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                            {unreadNotificationsCount}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Lista powiadomień */}
                                                <div className="overflow-y-auto max-h-[500px]">
                                                    {notificationsLoading ? (
                                                        <div className="p-8 text-center">
                                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                                            <p className="mt-2 text-sm text-gray-500">Ładowanie...</p>
                                                        </div>
                                                    ) : notifications.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <MdNotifications className="mx-auto text-4xl text-gray-300 mb-2" />
                                                            <p className="text-gray-500 text-sm">Brak powiadomień</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-100">
                                                            {notifications.map(notification => (
                                                                <div
                                                                    key={notification.id}
                                                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                                                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                                                                        !notification.read ? 'bg-green-50/50 border-l-4 border-green-500' : ''
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        {!notification.read && (
                                                                            <div className="mt-2 w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                                <h4 className={`font-semibold text-sm ${
                                                                                    notification.read ? 'text-gray-600' : 'text-gray-900'
                                                                                }`}>
                                                                                    {notification.title}
                                                                                </h4>
                                                                                {!notification.read && (
                                                                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                                                                                )}
                                                                            </div>
                                                                            <p className={`text-sm mb-2 ${
                                                                                notification.read ? 'text-gray-500' : 'text-gray-700'
                                                                            }`}>
                                                                                {notification.body}
                                                                            </p>
                                                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                                <span>{new Date(notification.created_at).toLocaleDateString('pl-PL', {
                                                                                    day: 'numeric',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Stopka z linkiem do wszystkich powiadomień */}
                                                {notifications.length > 0 && (
                                                    <div className="px-4 py-3 border-t border-gray-200">
                                                        <Link
                                                            to="/notifications"
                                                            onClick={() => setIsNotificationsDropdownOpen(false)}
                                                            className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                                                        >
                                                            Zobacz wszystkie powiadomienia
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            {!isAuthenticated && (
                                <Link 
                                    to="/login" 
                                    className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <MdLogin className="text-xl" />
                                    <span className="hidden sm:inline">Zaloguj się</span>
                                </Link>
                            )}
                            {isAuthenticated && (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                                        className="group flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
                                    >
                                        <MdSettings className="text-xl group-hover:rotate-90 transition-transform" />
                                        <span className="hidden sm:inline">Ustawienia</span>
                                        <MdArrowDropDown className={`text-xl transition-transform ${isSettingsDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isSettingsDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                            <button
                                                onClick={() => {
                                                    setIsSettingsDropdownOpen(false);
                                                    // TODO: Przekieruj do strony ustawień aplikacji
                                                    navigate({ to: '/settings' });
                                                }}
                                                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                            >
                                                <MdSettings className="text-lg" />
                                                <span>Ustawienia aplikacji</span>
                                            </button>
                                            <div className="border-t border-gray-200 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    setIsSettingsDropdownOpen(false);
                                                    logout();
                                                }}
                                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                            >
                                                <MdLogout className="text-lg" />
                                                <span>Wyloguj</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            </header>
            <main className="flex-grow flex flex-col w-screen overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
