import { useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
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
            const { access_token: token } = res.data;
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
                    const userRole: number | null = meRes.data && meRes.data.role_id;
                    console.log('Pobrana rola użytkownika:', meRes.data);

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
            setError(err.response?.data?.detail || 'Błąd logowania');

            // Trigger custom event w przypadku błędu
            window.dispatchEvent(new CustomEvent('authChange'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Logowanie</h2>
            <form className="w-full max-w-xs space-y-4" onSubmit={handleSubmit}>
                <input className="input input-bordered w-full" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input className="input input-bordered w-full" placeholder="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Logowanie...' : 'Zaloguj się'}</button>
                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            </form>
            {sessionError && <div className="text-orange-600 text-sm text-center mt-4">{sessionError}</div>}
        </div>
    );
}
