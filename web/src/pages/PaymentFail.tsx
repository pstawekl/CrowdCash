import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { MdError, MdArrowBack } from 'react-icons/md';

export default function PaymentFail() {
    const navigate = useNavigate();

    useEffect(() => {
        // Automatyczne przekierowanie po 7 sekundach do transakcji
        const timer = setTimeout(() => {
            navigate({ to: '/transactions' });
        }, 7000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <MdError className="mx-auto text-6xl text-red-500" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Płatność nie powiodła się
                </h1>
                
                <p className="text-gray-600 mb-8">
                    Niestety, podczas przetwarzania płatności wystąpił błąd. 
                    Sprawdź swoje dane karty lub skontaktuj się z bankiem, 
                    a następnie spróbuj ponownie.
                </p>

                <div className="space-y-4">
                    <Link
                        to="/feed"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        <MdArrowBack className="mr-2" />
                        Spróbuj ponownie
                    </Link>

                    <Link
                        to="/transactions"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Zobacz historię transakcji
                    </Link>

                    <Link
                        to="/investor-dashboard"
                        className="inline-flex items-center justify-center w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium underline"
                    >
                        Powrót do panelu
                    </Link>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                    Zostaniesz automatycznie przekierowany za kilka sekund...
                </p>
            </div>
        </div>
    );
}

