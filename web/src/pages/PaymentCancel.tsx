import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { MdCancel, MdArrowBack } from 'react-icons/md';

export default function PaymentCancel() {
    const navigate = useNavigate();

    useEffect(() => {
        // Automatyczne przekierowanie po 5 sekundach do transakcji
        const timer = setTimeout(() => {
            navigate({ to: '/transactions' });
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <MdCancel className="mx-auto text-6xl text-yellow-500" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Płatność anulowana
                </h1>
                
                <p className="text-gray-600 mb-8">
                    Twoja płatność została anulowana. Możesz spróbować ponownie w dowolnym momencie.
                </p>

                <div className="space-y-4">
                    <Link
                        to="/transactions"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                    >
                        Zobacz historię transakcji
                        <MdArrowBack className="ml-2" />
                    </Link>

                    <Link
                        to="/feed"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Przeglądaj kampanie
                    </Link>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                    Zostaniesz automatycznie przekierowany za kilka sekund...
                </p>
            </div>
        </div>
    );
}

