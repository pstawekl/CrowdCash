import { Link, useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { MdArrowBack, MdEmail, MdLock, MdPerson, MdPersonAdd } from 'react-icons/md';
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ top: '10%', left: '10%' }} />
                <div className="absolute w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" style={{ top: '20%', right: '10%' }} />
                <div className="absolute w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" style={{ bottom: '10%', left: '20%' }} />
            </div>

            <div className="relative w-full max-w-2xl">
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
                                Dołącz do CrowdCash
                            </span>
                        </h1>
                        <p className="text-gray-600">Utwórz konto i rozpocznij swoją przygodę</p>
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

                        {/* Password Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div>
                                <label htmlFor="repeatPassword" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                    <MdLock className="mr-2 text-gray-400" />
                                    Powtórz hasło
                                </label>
                                <input
                                    id="repeatPassword"
                                    type="password"
                                    value={repeatPassword}
                                    onChange={(e) => setRepeatPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Role Select */}
                        <div>
                            <label htmlFor="role" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <MdPerson className="mr-2 text-gray-400" />
                                Typ konta
                            </label>
                            <div className="relative">
                                <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                                >
                                    <option value="investor">Inwestor</option>
                                    <option value="entrepreneur">Przedsiębiorca</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Entrepreneur Form */}
                        {role === 'entrepreneur' && (
                            <div className="border-t border-gray-200 pt-6 mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dane firmy</h3>
                                <EntrepreneurForm onChange={setEntrepreneurData} />
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
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
                                    <MdPersonAdd className="mr-2 text-xl" />
                                    Zarejestruj się
                                </>
                            )}
                        </button>

                        {/* Login Link */}
                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-gray-600">
                                Masz już konto?{' '}
                                <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                                    Zaloguj się
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
