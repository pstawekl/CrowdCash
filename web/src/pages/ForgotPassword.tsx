import { Link, useNavigate } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { MdArrowBack, MdEmail, MdSend } from 'react-icons/md';
import API from '../utils/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await API.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            console.error('Forgot password error:', err);
            setError(err.response?.data?.detail || 'Wystąpił błąd podczas wysyłania żądania resetu hasła');
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
                    to="/login"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 mb-6 group"
                    title="Powrót do logowania"
                >
                    <MdArrowBack className="text-xl" />
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                                Resetowanie hasła
                            </span>
                        </h1>
                        <p className="text-gray-600">
                            {success
                                ? 'Sprawdź swoją skrzynkę pocztową'
                                : 'Podaj adres email powiązany z kontem'}
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                <p className="font-semibold mb-2">✓ Email został wysłany!</p>
                                <p>
                                    Jeśli konto z adresem <strong>{email}</strong> istnieje, otrzymasz email z linkiem do resetowania hasła.
                                </p>
                            </div>
                            <div className="text-center space-y-4">
                                <Link
                                    to="/login"
                                    className="inline-block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-center"
                                >
                                    Powrót do logowania
                                </Link>
                                <button
                                    onClick={() => {
                                        setSuccess(false);
                                        setEmail('');
                                    }}
                                    className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                                >
                                    Wyślij ponownie
                                </button>
                            </div>
                        </div>
                    ) : (
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
                                        <MdSend className="mr-2 text-xl" />
                                        Wyślij link resetujący
                                    </>
                                )}
                            </button>

                            {/* Login Link */}
                            <div className="text-center pt-4 border-t border-gray-200">
                                <p className="text-gray-600">
                                    Pamiętasz hasło?{' '}
                                    <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                                        Zaloguj się
                                    </Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
