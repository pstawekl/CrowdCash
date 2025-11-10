import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { logout as baseLogout, useAuth } from '../utils/auth';
import { UserRoleEnum } from '../utils/roles';

export default function MainLayout() {
    const { isAuthenticated, role } = useAuth();
    const navigate = useNavigate();

    // Przekieruj na odpowiedni dashboard po zalogowaniu
    useEffect(() => {
        if (isAuthenticated && role) {
            const userRole = Number(role);
            if (userRole === UserRoleEnum.investor && window.location.pathname === '/') {
                navigate({ to: '/investor-dashboard' });
            } else if (userRole === UserRoleEnum.entrepreneur && window.location.pathname === '/') {
                navigate({ to: '/dashboard' });
            } else if (userRole === UserRoleEnum.admin && window.location.pathname === '/') {
                navigate({ to: '/dashboard' });
            }
        }
    }, [isAuthenticated, role, navigate]);

    const logout = () => {
        baseLogout(() => navigate({ to: '/login' }));
    };


    return (
        <div className="h-screen w-screen flex flex-col bg-gray-50">
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-green-700 hover:text-green-800 transition-colors">
                    CrowdCash
                </Link>
                <nav className="flex items-center space-x-6">
                    {isAuthenticated && Number(role) === UserRoleEnum.investor && (
                        <>
                            <Link to="/feed" className="text-gray-700 hover:text-green-600 transition-colors">Kampanie</Link>
                            <Link to="/investments" className="text-gray-700 hover:text-green-600 transition-colors">Inwestycje</Link>
                            <Link to="/transactions" className="text-gray-700 hover:text-green-600 transition-colors">Transakcje</Link>
                        </>
                    )}
                    {isAuthenticated && Number(role) === UserRoleEnum.entrepreneur && (
                        <>
                            <Link to="/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">Kampanie</Link>
                            <Link to="/notifications" className="text-gray-700 hover:text-green-600 transition-colors">Powiadomienia</Link>
                        </>
                    )}
                    {isAuthenticated && Number(role) === UserRoleEnum.admin && (
                        <>
                            <Link to="/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">Panel admina</Link>
                            <Link to="/feed" className="text-gray-700 hover:text-green-600 transition-colors">Feed</Link>
                            <Link to="/investments" className="text-gray-700 hover:text-green-600 transition-colors">Inwestycje</Link>
                        </>
                    )}
                    {!isAuthenticated && (
                        <>
                            <Link to="/login" className="text-gray-700 hover:text-green-600 transition-colors">Logowanie</Link>
                            <Link to="/register" className="text-gray-700 hover:text-green-600 transition-colors">Rejestracja</Link>
                        </>
                    )}
                    {isAuthenticated && (
                        <button
                            onClick={logout}
                            className="text-red-600 hover:text-red-700 transition-colors font-medium"
                        >
                            Wyloguj
                        </button>
                    )}
                </nav>
            </header>
            <main className="flex-grow flex flex-col w-screen overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
