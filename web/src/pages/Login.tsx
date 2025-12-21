import { Link, useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { MdArrowBack, MdEmail, MdLock, MdLogin } from 'react-icons/md';
import API from '../utils/api';
import { UserRoleEnum } from '../utils/roles';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionError, setSessionError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const authError = localStorage.getItem('authError');
        if (authError) {
            setSessionError(authError);
            localStorage.removeItem('authError');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);
            console.log('Sending login request with params:', params.toString());
            const res = await API.post('/auth/login', params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            console.log('Response:', res.data);
            const { access_token: token, role_id: roleFromLogin } = res.data;
            if (token) {
            let parsedToken = token;
                if (token.startsWith('{')) {
                    try {
                        const tokenObj = JSON.parse(token);
                        parsedToken = tokenObj?.access_token || token;
                    } catch {
                        // ignoruj błąd parsowania
                    }
                }
                localStorage.setItem('authToken', parsedToken);
                // Pobierz rolę i uprawnienia użytkownika
                try {
                    const meRes = await API.get('/auth/me', {
                        headers: { Authorization: `Bearer ${parsedToken}` },
                    });
                    // Użyj role_id z logowania lub z /me jako fallback
                    const userRole: number | null = roleFromLogin || (meRes.data && meRes.data.role_id);
                    const isVerified: boolean = meRes.data && meRes.data.is_verified;
                    console.log('Pobrana rola użytkownika:', meRes.data);

                    // Sprawdź czy konto jest zweryfikowane
                    if (!isVerified) {
                        console.log('Konto nie jest zweryfikowane, przekierowanie do weryfikacji');
                        localStorage.removeItem('authToken');
                        navigate({ 
                            to: '/verify',
                            search: { email: email, fromLogin: 'true' }
                        });
                        return;
                    }

                    if (userRole !== null && userRole !== undefined) {
                        localStorage.setItem('userRole', userRole.toString());
                        // Pobierz uprawnienia
                        try {
                            type PermissionOut = { id: number; name: string };
                            const permRes = await API.get('/auth/permissions', {
                                headers: { Authorization: `Bearer ${parsedToken}` },
                            });
                            localStorage.setItem('userPermissions', JSON.stringify((permRes.data as PermissionOut[]).map((p) => p.name)));
                        } catch (permError) {
                            console.warn('Nie udało się pobrać uprawnień:', permError);
                            // Zapisz pustą tablicę permissions jako fallback
                            localStorage.setItem('userPermissions', JSON.stringify([]));
                        }

                        // Przekierowanie na podstawie roli
                        console.log('Zalogowano jako:', userRole);
                        if (userRole === UserRoleEnum.investor) {
                            navigate({ to: '/investor-dashboard' });
                        } else if (userRole === UserRoleEnum.entrepreneur) {
                            navigate({ to: '/dashboard' });
                        } else if (userRole === UserRoleEnum.admin) {
                            navigate({ to: '/dashboard' });
                        } else {
                            navigate({ to: '/' });
                        }
                    } else {
                        // Jeśli nie ma roli, ustaw domyślną
                        console.warn('Użytkownik nie ma przypisanej roli');
                        localStorage.setItem('userRole', '2'); // investor jako domyślna
                        localStorage.setItem('userPermissions', JSON.stringify(['view_investor_dashboard', 'view_feed', 'view_investments', 'view_transactions', 'view_profile', 'logout']));
                        navigate({ to: '/investor-dashboard' });
                    }

                    // Trigger custom event dla tego samego okna
                    window.dispatchEvent(new CustomEvent('authChange'));
                } catch {
                    // Jeśli nie uda się pobrać roli, wyczyść userRole i userPermissions
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userPermissions');
                    // Trigger custom event
                    window.dispatchEvent(new CustomEvent('authChange'));
                }
            } else {
                console.error('Login error: Brak tokenu');
                setError('Błąd logowania: Brak tokenu');
            }
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            console.error('Login error:', err);
            
            // Sprawdź czy błąd dotyczy niezweryfikowanego konta (403)
            if (err.response?.status === 403) {
                const errorDetail = err.response?.data?.detail || '';
                // Sprawdź czy komunikat zawiera informację o niezweryfikowanym koncie
                if (errorDetail.toLowerCase().includes('not verified') || errorDetail.toLowerCase().includes('verify')) {
                    // Upewnij się, że token nie został zapisany
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userPermissions');
                    
                    // Przekieruj do strony weryfikacji
                    navigate({ 
                        to: '/verify',
                        search: { email: email, fromLogin: 'true' }
                    });
                    return;
                }
            }
            
            setError(err.response?.data?.detail || 'Błąd logowania');

            // Trigger custom event w przypadku błędu
            window.dispatchEvent(new CustomEvent('authChange'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ top: '10%', left: '10%' }} />
                <div className="absolute w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" style={{ top: '20%', right: '10%' }} />
                <div className="absolute w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" style={{ bottom: '10%', left: '20%' }} />
            </div>

            <div className="relative w-full max-w-md">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 mb-6 group"
                    title="Powrót do strony głównej"
                >
                    <MdArrowBack className="text-xl" />
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                                Witaj z powrotem
                            </span>
                        </h1>
                        <p className="text-gray-600">Zaloguj się do swojego konta</p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <MdEmail className="mr-2 text-gray-400" />
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                                placeholder="twoj@email.pl"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <MdLock className="mr-2 text-gray-400" />
                                Hasło
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Error Messages */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        {sessionError && (
                            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm">
                                {sessionError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    <MdLogin className="mr-2 text-xl" />
                                    Zaloguj się
                                </>
                            )}
                        </button>

                        {/* Register Link */}
                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-gray-600">
                                Nie masz konta?{' '}
                                <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                                    Zarejestruj się
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
