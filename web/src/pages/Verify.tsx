import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { MdArrowBack, MdCheckCircle, MdVerifiedUser } from 'react-icons/md';
import API from '../utils/api';

export default function Verify() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendError, setResendError] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const search = useSearch({ from: '/verify' });
    const email = typeof search.email === 'string' ? search.email : '';

    // Odliczanie cooldownu
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => {
                setCooldown(cooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

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

    const handleResendCode = async () => {
        if (cooldown > 0 || !email) return;

        setResendLoading(true);
        setResendError('');
        setResendSuccess(false);

        try {
            await API.get('/auth/resend-verification-code', {
                params: { email }
            });
            setResendSuccess(true);
            setCooldown(30); // Ustaw cooldown na 30 sekund
            setTimeout(() => setResendSuccess(false), 3000); // Ukryj komunikat sukcesu po 3 sekundach
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            setResendError(err.response?.data?.detail || 'Nie udało się wysłać kodu ponownie');
        } finally {
            setResendLoading(false);
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
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <MdVerifiedUser className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                                Weryfikacja konta
                            </span>
                        </h1>
                        <p className="text-gray-600">
                            Wprowadź kod weryfikacyjny wysłany na adres
                        </p>
                        {email && (
                            <p className="text-green-600 font-semibold mt-2">{email}</p>
                        )}
                    </div>

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Code Input */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Kod weryfikacyjny
                            </label>
                            <input
                                id="code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white text-center text-2xl font-mono tracking-widest"
                                placeholder="000000"
                                maxLength={6}
                            />
                            <p className="text-sm text-gray-500 mt-2 text-center">
                                Wprowadź 6-cyfrowy kod z wiadomości e-mail
                            </p>
                        </div>

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
                                    <MdCheckCircle className="mr-2 text-xl" />
                                    Zweryfikuj konto
                                </>
                            )}
                        </button>

                        {/* Help Text */}
                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                                Nie otrzymałeś kodu?
                            </p>
                            
                            {/* Success Message */}
                            {resendSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm mb-2">
                                    Kod weryfikacyjny został wysłany ponownie!
                                </div>
                            )}

                            {/* Error Message */}
                            {resendError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-2">
                                    {resendError}
                                </div>
                            )}

                            {/* Resend Button */}
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendLoading || cooldown > 0 || !email}
                                className="text-green-600 hover:text-green-700 font-semibold transition-colors disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:text-gray-400"
                            >
                                {resendLoading ? (
                                    <span className="inline-flex items-center">
                                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Wysyłanie...
                                    </span>
                                ) : cooldown > 0 ? (
                                    `Wyślij ponownie (${cooldown}s)`
                                ) : (
                                    'Wyślij ponownie'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
