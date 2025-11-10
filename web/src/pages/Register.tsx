import { useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import type { EntrepreneurFormData } from '../components/EntrepreneurForm';
import EntrepreneurForm from '../components/EntrepreneurForm';
import API from '../utils/api';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [role, setRole] = useState('investor');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [entrepreneurData, setEntrepreneurData] = useState<EntrepreneurFormData>({ companyName: '', nip: '', city: null, street: '', apartmentNumber: '', buildingNumber: '', postalCode: '', country: null });
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== repeatPassword) {
            setError('Hasła nie są zgodne');
            return;
        }
        if (role === 'entrepreneur') {
            if (!entrepreneurData.companyName || !entrepreneurData.nip || !entrepreneurData.city) {
                setError('Uzupełnij wszystkie dane firmy i wybierz miasto');
                return;
            }
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('email', email);
            params.append('password', password);
            params.append('role', role);
            if (role === 'entrepreneur') {
                params.append('company_name', entrepreneurData.companyName);
                params.append('nip', entrepreneurData.nip);
                params.append('city_id', entrepreneurData.city?.id || '');
                params.append('street', entrepreneurData.street || '');
                params.append('building_number', entrepreneurData.buildingNumber || '');
                params.append('apartment_number', entrepreneurData.apartmentNumber || '');
                params.append('postal_code', entrepreneurData.postalCode || '');
            }
            console.log('Sending registration request with params:', params.toString());
            await API.post('/auth/register', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            //localStorage.setItem('userRole', role);
            navigate({ to: '/verify', search: { email } });
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Błąd rejestracji');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Rejestracja</h2>
            <form className="w-full max-w-xs space-y-4" onSubmit={handleSubmit}>
                <input className="input input-bordered w-full" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input className="input input-bordered w-full" placeholder="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                <input className="input input-bordered w-full" placeholder="Powtórz hasło" type="password" value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)} required />
                <label htmlFor="role" className="sr-only">Rola</label>
                <div className="relative">
                    <select
                        id="role"
                        className="input input-bordered w-full appearance-none pr-8 bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                        name="role"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    >
                        <option value="investor">Inwestor</option>
                        <option value="entrepreneur">Przedsiębiorca</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">▼</span>
                </div>
                {role === 'entrepreneur' && (
                    <EntrepreneurForm onChange={setEntrepreneurData} />
                )}
                <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Rejestracja...' : 'Zarejestruj się'}</button>
                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            </form>
        </div>
    );
}
