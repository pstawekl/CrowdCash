import { useNavigate, useSearch } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import API from '../utils/api';

export default function Verify() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const search = useSearch({ from: '/verify' });
    const email = typeof search.email === 'string' ? search.email : '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await API.post('/auth/verify', { email, code });
            navigate({ to: '/login' });
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            setError(err.response?.data?.detail || 'Błąd weryfikacji');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Weryfikacja konta</h2>
            <form className="w-full max-w-xs space-y-4" onSubmit={handleSubmit}>
                <input className="input input-bordered w-full" placeholder="Kod weryfikacyjny" type="text" value={code} onChange={e => setCode(e.target.value)} required />
                <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Weryfikacja...' : 'Zweryfikuj'}</button>
                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            </form>
        </div>
    );
}
