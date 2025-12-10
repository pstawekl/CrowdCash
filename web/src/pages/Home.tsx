import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../utils/auth';

export default function Home() {
    const { isAuthenticated } = useAuth();
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
    const [openFaqs, setOpenFaqs] = useState<{ [key: number]: boolean }>({});
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible((prev) => ({
                            ...prev,
                            [entry.target.id]: true,
                        }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = document.querySelectorAll('[data-animate]');
        elements.forEach((el) => observerRef.current?.observe(el));

        return () => {
            elements.forEach((el) => observerRef.current?.unobserve(el));
        };
    }, []);

    const stats = [
        { value: '500+', label: 'Aktywnych kampanii', icon: '📊' },
        { value: '10M+', label: 'Zebranych środków', icon: '💰' },
        { value: '25K+', label: 'Zadowolonych inwestorów', icon: '👥' },
        { value: '98%', label: 'Wskaźnik sukcesu', icon: '✅' },
    ];

    const steps = [
        {
            number: '01',
            title: 'Utwórz kampanię',
            description: 'Zarejestruj się jako przedsiębiorca i stwórz szczegółową kampanię crowdfundingową.',
            icon: '🚀',
        },
        {
            number: '02',
            title: 'Zdobądź wsparcie',
            description: 'Promuj swoją kampanię i zbieraj środki od społeczności inwestorów.',
            icon: '💡',
        },
        {
            number: '03',
            title: 'Rozwijaj biznes',
            description: 'Wykorzystaj zebrane środki na rozwój projektu i osiągnij sukces.',
            icon: '📈',
        },
    ];

    const benefits = [
        {
            title: 'Dla Inwestorów',
            items: [
                'Dostęp do innowacyjnych projektów',
                'Dywersyfikacja portfela inwestycyjnego',
                'Transparentne warunki inwestycji',
                'Możliwość śledzenia postępów',
            ],
            color: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'Dla Przedsiębiorców',
            items: [
                'Szybkie pozyskanie kapitału',
                'Bezpośredni kontakt z inwestorami',
                'Marketing i promocja projektu',
                'Elastyczne warunki finansowania',
            ],
            color: 'from-green-500 to-emerald-500',
        },
    ];

    const features = [
        {
            icon: '🔒',
            title: 'Bezpieczne transakcje',
            description: 'Zaawansowane systemy bezpieczeństwa chroniące Twoje środki.',
        },
        {
            icon: '📱',
            title: 'Intuicyjny interfejs',
            description: 'Prosta i przyjazna platforma dostępna na wszystkich urządzeniach.',
        },
        {
            icon: '⚡',
            title: 'Szybkie płatności',
            description: 'Natychmiastowe przetwarzanie transakcji i szybkie wypłaty.',
        },
        {
            icon: '📊',
            title: 'Szczegółowe raporty',
            description: 'Kompleksowe analizy i raporty dotyczące Twoich inwestycji.',
        },
        {
            icon: '🌍',
            title: 'Globalny zasięg',
            description: 'Dostęp do projektów z całego świata w jednym miejscu.',
        },
        {
            icon: '💬',
            title: 'Wsparcie 24/7',
            description: 'Zespół wsparcia dostępny przez całą dobę, aby pomóc.',
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
                        style={{
                            top: `${20 + scrollY * 0.1}px`,
                            left: `${20 + scrollY * 0.05}px`,
                        }}
                    />
                    <div
                        className="absolute w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
                        style={{
                            top: `${60 + scrollY * 0.15}px`,
                            right: `${20 + scrollY * 0.1}px`,
                        }}
                    />
                    <div
                        className="absolute w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
                        style={{
                            bottom: `${20 + scrollY * 0.08}px`,
                            left: `${50 + scrollY * 0.12}px`,
                        }}
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div
                        className="space-y-8"
                        data-animate
                        id="hero"
                    >
                        <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 leading-tight animate-fade-in-up">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                                CrowdCash
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
                            Platforma crowdfundingowa łącząca przedsiębiorców z inwestorami.
                            <br />
                            Realizuj swoje marzenia i buduj przyszłość razem z nami.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-400">
                            {!isAuthenticated ? (
                                <Link
                                    to="/login"
                                    className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                >
                                    <span className="relative z-10">Zaloguj się</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </Link>
                            ) : (
                                <Link
                                    to="/feed"
                                    className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                                >
                                    <span className="relative z-10">Przeglądaj kampanie</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-[10%] left-0 right-0 flex justify-center animate-bounce z-20">
                    <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center bg-white/50 backdrop-blur-sm">
                        <div className="w-1 h-3 bg-gray-600 rounded-full mt-2 animate-scroll" />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={`text-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                                    isVisible[`stat-${index}`] ? 'animate-fade-in-up' : 'opacity-0'
                                }`}
                                data-animate
                                id={`stat-${index}`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="text-5xl mb-4">{stat.icon}</div>
                                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-16"
                        data-animate
                        id="how-it-works"
                    >
                        <h2 className="text-5xl font-bold text-gray-900 mb-4">
                            Jak to działa?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Prosty proces w trzech krokach, który pomoże Ci osiągnąć sukces
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                                    isVisible[`step-${index}`] ? 'animate-fade-in-up' : 'opacity-0'
                                }`}
                                data-animate
                                id={`step-${index}`}
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                <div className="absolute top-4 right-4 text-6xl opacity-10 font-bold text-green-600">
                                    {step.number}
                                </div>
                                <div className="text-5xl mb-4">{step.icon}</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-green-500 text-3xl">
                                        →
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-16"
                        data-animate
                        id="benefits"
                    >
                        <h2 className="text-5xl font-bold text-gray-900 mb-4">
                            Korzyści dla Ciebie
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Niezależnie od tego, czy jesteś inwestorem czy przedsiębiorcą, mamy coś dla Ciebie
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className={`p-8 rounded-2xl bg-gradient-to-br ${benefit.color} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                                    isVisible[`benefit-${index}`] ? 'animate-fade-in-up' : 'opacity-0'
                                }`}
                                data-animate
                                id={`benefit-${index}`}
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                <h3 className="text-3xl font-bold mb-6">{benefit.title}</h3>
                                <ul className="space-y-4">
                                    {benefit.items.map((item, itemIndex) => (
                                        <li
                                            key={itemIndex}
                                            className="flex items-center text-lg"
                                        >
                                            <span className="mr-3 text-2xl">✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-16"
                        data-animate
                        id="features"
                    >
                        <h2 className="text-5xl font-bold text-gray-900 mb-4">
                            Dlaczego CrowdCash?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Najlepsze narzędzia i funkcje dla Twojego sukcesu
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`p-6 rounded-xl bg-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-100 hover:border-green-500 ${
                                    isVisible[`feature-${index}`] ? 'animate-fade-in-up' : 'opacity-0'
                                }`}
                                data-animate
                                id={`feature-${index}`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Campaigns Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-16"
                        data-animate
                        id="campaigns"
                    >
                        <h2 className="text-5xl font-bold text-gray-900 mb-4">
                            Popularne kampanie
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Zobacz najpopularniejsze projekty, które zdobyły wsparcie społeczności
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Innowacyjna aplikacja mobilna',
                                description: 'Rewolucyjna aplikacja łącząca ludzi z pasją do podróży',
                                raised: 125000,
                                goal: 200000,
                                backers: 450,
                                category: 'Technologia',
                                daysLeft: 15,
                            },
                            {
                                title: 'Ekologiczny startup',
                                description: 'Zrównoważone rozwiązania dla przyszłości naszej planety',
                                raised: 85000,
                                goal: 150000,
                                backers: 320,
                                category: 'Ekologia',
                                daysLeft: 22,
                            },
                            {
                                title: 'Lokalna kawiarnia',
                                description: 'Miejsce spotkań społeczności z najlepszą kawą w mieście',
                                raised: 45000,
                                goal: 60000,
                                backers: 180,
                                category: 'Biznes',
                                daysLeft: 8,
                            },
                        ].map((campaign, index) => {
                            const progress = (campaign.raised / campaign.goal) * 100;
                            return (
                                <div
                                    key={index}
                                    className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 border border-gray-100 hover:border-green-500 ${
                                        isVisible[`campaign-${index}`] ? 'animate-fade-in-up' : 'opacity-0'
                                    }`}
                                    data-animate
                                    id={`campaign-${index}`}
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                                                {campaign.category_rel?.name || campaign.category || 'Brak kategorii'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {campaign.daysLeft} dni
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                                            {campaign.title}
                                        </h3>
                                        <p className="text-gray-600 mb-4 line-clamp-2">
                                            {campaign.description}
                                        </p>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-600">
                                                    {campaign.raised.toLocaleString('pl-PL')} zł
                                                </span>
                                                <span className="text-gray-600">
                                                    {campaign.goal.toLocaleString('pl-PL')} zł
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                <span className="font-semibold">{campaign.backers}</span> wspierających
                                            </span>
                                            <span className="text-green-600 font-semibold">
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/0 transition-all duration-300 pointer-events-none" />
                                </div>
                            );
                        })}
                    </div>
                    {!isAuthenticated && (
                        <div className="text-center mt-12">
                            <Link
                                to="/register"
                                className="inline-block px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                Zobacz wszystkie kampanie
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10" />
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div
                        className="space-y-8"
                        data-animate
                        id="cta"
                    >
                        <h2 className="text-5xl md:text-6xl font-bold">
                            Gotowy na start?
                        </h2>
                        <p className="text-xl md:text-2xl opacity-90">
                            Dołącz do tysięcy zadowolonych użytkowników już dziś
                        </p>
                        {!isAuthenticated ? (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/register"
                                    className="px-8 py-4 bg-white text-green-600 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    Utwórz konto za darmo
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-green-600 transform hover:scale-105 transition-all duration-300"
                                >
                                    Zaloguj się
                                </Link>
                            </div>
                        ) : (
                            <Link
                                to="/feed"
                                className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                Przejdź do kampanii
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-16"
                        data-animate
                        id="faq"
                    >
                        <h2 className="text-5xl font-bold text-gray-900 mb-4">
                            Najczęściej zadawane pytania
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Odpowiedzi na najpopularniejsze pytania dotyczące naszej platformy
                        </p>
                    </div>
                    <div className="space-y-4">
                        {[
                            {
                                question: 'Jak mogę rozpocząć zbiórkę środków?',
                                answer: 'Aby rozpocząć zbiórkę, zarejestruj się jako przedsiębiorca, wypełnij formularz kampanii z opisem projektu, celami finansowymi i planem działania. Po weryfikacji Twoja kampania zostanie opublikowana na platformie.',
                            },
                            {
                                question: 'Jakie są koszty korzystania z platformy?',
                                answer: 'Platforma pobiera niewielką prowizję od zebranych środków tylko w przypadku udanej kampanii. Nie ma żadnych ukrytych opłat ani opłat za rejestrację.',
                            },
                            {
                                question: 'Czy moje środki są bezpieczne?',
                                answer: 'Tak, wszystkie transakcje są chronione zaawansowanymi systemami bezpieczeństwa. Środki są przechowywane bezpiecznie i wypłacane tylko po spełnieniu warunków kampanii.',
                            },
                            {
                                question: 'Jak długo trwa kampania?',
                                answer: 'Czas trwania kampanii zależy od Ciebie. Możesz ustawić okres od 7 do 90 dni. Większość udanych kampanii osiąga swój cel w ciągu 30-45 dni.',
                            },
                            {
                                question: 'Co się dzieje, jeśli kampania nie osiągnie celu?',
                                answer: 'Jeśli kampania nie osiągnie założonego celu w wyznaczonym czasie, wszystkie środki są zwracane inwestorom. Nie ponosisz żadnych kosztów.',
                            },
                            {
                                question: 'Jak mogę skontaktować się z zespołem wsparcia?',
                                answer: 'Nasz zespół wsparcia jest dostępny 24/7. Możesz skontaktować się z nami przez formularz kontaktowy na stronie lub wysłać e-mail na adres support@crowdcash.pl.',
                            },
                        ].map((faq, index) => {
                            const isOpen = openFaqs[index] || false;
                            return (
                                <div
                                    key={index}
                                    className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden ${
                                        isVisible[`faq-${index}`] ? 'animate-fade-in-up' : 'opacity-100'
                                    }`}
                                    data-animate
                                    id={`faq-${index}`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <button
                                        onClick={() => setOpenFaqs((prev) => ({ ...prev, [index]: !prev[index] }))}
                                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="text-lg font-semibold text-gray-900 pr-4">
                                            {faq.question}
                                        </span>
                                        <span
                                            className={`text-2xl text-green-600 transform transition-transform duration-300 flex-shrink-0 ${
                                                isOpen ? 'rotate-180' : ''
                                            }`}
                                        >
                                            ▼
                                        </span>
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${
                                            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="px-6 pb-4 text-gray-600">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-white text-xl font-bold mb-4">CrowdCash</h3>
                            <p className="text-sm">
                                Platforma crowdfundingowa łącząca przedsiębiorców z inwestorami.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Platforma</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link
                                        to="/feed"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Kampanie
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/register"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Rejestracja
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/login"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Logowanie
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Wsparcie</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Pomoc
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        FAQ
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Kontakt
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Prawne</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Regulamin
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Polityka prywatności
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-green-400 transition-colors"
                                    >
                                        Cookies
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
                        <p>© 2024 CrowdCash. Wszelkie prawa zastrzeżone.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
