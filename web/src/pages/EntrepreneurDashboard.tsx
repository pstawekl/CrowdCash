import { Link } from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { MdAdd, MdCampaign, MdCancel, MdCheckCircle, MdClose, MdDelete, MdEdit, MdImage, MdLocationOn, MdNotifications, MdPeople, MdPublish, MdSave, MdTrendingUp, MdVisibility } from 'react-icons/md';
import RegionSearchBox from '../components/RegionSearchBox';
import RequirePermission from '../components/RequirePermission';
import Spinner from '../components/Spinner';
import API from '../utils/api';

// Komponent slidera zakresu
interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
    disabled?: boolean;
    label?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, value, onChange, step = 0.1, disabled = false, label }) => {
    const [localValue, setLocalValue] = useState<[number, number]>(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = parseFloat(e.target.value);
        if (newMin >= min && newMin < localValue[1]) {
            const newValue: [number, number] = [newMin, localValue[1]];
            setLocalValue(newValue);
            onChange(newValue);
        }
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = parseFloat(e.target.value);
        if (newMax <= max && newMax > localValue[0]) {
            const newValue: [number, number] = [localValue[0], newMax];
            setLocalValue(newValue);
            onChange(newValue);
        }
    };

    const minPercent = ((localValue[0] - min) / (max - min)) * 100;
    const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
            )}
            <div className="relative h-8">
                {/* Tło slidera */}
                <div className="absolute w-full h-2 bg-gray-200 rounded-full top-3"></div>
                
                {/* Zakres aktywny */}
                <div
                    className="absolute h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full top-3"
                    style={{
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`
                    }}
                ></div>
                
                {/* Min slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={localValue[0]}
                    onChange={handleMinChange}
                    step={step}
                    disabled={disabled}
                    className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-10 top-3"
                    style={{
                        background: 'transparent',
                        WebkitAppearance: 'none'
                    }}
                    aria-label={`Minimalna wartość: ${localValue[0]}`}
                    title={`Minimalna wartość: ${localValue[0]}`}
                />
                
                {/* Max slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={localValue[1]}
                    onChange={handleMaxChange}
                    step={step}
                    disabled={disabled}
                    className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-10 top-3"
                    style={{
                        background: 'transparent',
                        WebkitAppearance: 'none'
                    }}
                    aria-label={`Maksymalna wartość: ${localValue[1]}`}
                    title={`Maksymalna wartość: ${localValue[1]}`}
                />
                
                {/* Wskaźniki wartości */}
                <div className="absolute w-full top-0 flex justify-between text-xs text-gray-600">
                    <span className="font-medium">{localValue[0]}%</span>
                    <span className="font-medium">{localValue[1]}%</span>
                </div>
            </div>
        </div>
    );
};

interface Campaign {
    id: string;
    title: string;
    description: string;
    goal_amount: number;
    current_amount: number;
    status: string;
    created_at: string;
    category?: string;
    category_rel?: Category;
    region?: string;
    deadline?: string;
    images?: Array<{
        id: string;
        image_url: string;
        order_index?: number;
        alt_text?: string;
    }>;
    reward_tiers?: Array<{
        id: string;
        title: string;
        description: string;
        min_percentage: number;
        max_percentage?: number;
        min_amount?: number;
        max_amount?: number;
        estimated_delivery_date?: string;
    }>;
}

interface CampaignStats {
    investor_count?: number;
    total_invested?: number;
    investment_count?: number;
}

interface Investor {
    id: string;
    email: string;
    amount: number;
    status: string;
    created_at: string;
}

interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
}

interface CampaignImage {
    image_url: string;
    order_index?: number;
    alt_text?: string;
    file?: File; // Plik do uploadu
    preview?: string; // URL podglądu (data URL)
}

interface CampaignRewardTier {
    title: string;
    description: string;
    min_percentage: number;
    max_percentage?: number;
    min_amount?: number;
    max_amount?: number;
    estimated_delivery_date?: string;
}

interface Region {
    id: string;
    name: string;
    type: 'country' | 'state' | 'city';
}

interface Category {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    created_at?: string;
}

interface ApiErrorResponse {
    detail?: string;
    message?: string;
}

type ApiError = AxiosError<ApiErrorResponse>;

export default function EntrepreneurDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isEditingCampaign, setIsEditingCampaign] = useState(false);
    const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
    const [allCampaignStats, setAllCampaignStats] = useState<{ [campaignId: string]: CampaignStats }>({});
    const [statsLoading, setStatsLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // --- PODGLĄD INWESTORÓW W KAMPANII ---
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [showInvestors, setShowInvestors] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '', // ID kategorii z bazy danych
        goal_amount: '',
        region: '', // Będzie przechowywać ID miasta
        deadline: ''
    });
    const [selectedCity, setSelectedCity] = useState<Region | null>(null);
    const [userProfile, setUserProfile] = useState<{ location?: string } | null>(null);
    const [images, setImages] = useState<CampaignImage[]>([]);
    const [rewardTiers, setRewardTiers] = useState<CampaignRewardTier[]>([]);
    const [formLoading, setFormLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchCampaigns();
        fetchNotifications();
        fetchCategories();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const res = await API.get('/users/me/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            setUserProfile(res.data);
            
            // Jeśli użytkownik ma ustawione miasto w profilu, spróbuj je znaleźć i ustawić
            if (res.data?.location) {
                // Wyszukaj miasto po nazwie
                try {
                    const cityRes = await API.get('/regions/search', {
                        params: { q: res.data.location, type: 'city' }
                    });
                    
                    if (cityRes.data && cityRes.data.length > 0) {
                        // Znajdź dokładne dopasowanie lub weź pierwsze
                        const matchingCity = cityRes.data.find((city: Region) => 
                            city.name.toLowerCase() === res.data.location.toLowerCase()
                        ) || cityRes.data[0];
                        
                        if (matchingCity) {
                            setSelectedCity(matchingCity);
                            setFormData(prev => ({ ...prev, region: matchingCity.id }));
                        }
                    }
                } catch (error) {
                    console.warn('Nie udało się znaleźć miasta z profilu:', error);
                }
            }
        } catch (error) {
            console.warn('Nie udało się pobrać profilu użytkownika:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'draft':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'successful':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'closed':
                return 'bg-gray-100 text-gray-700 border-gray-300';
            default:
                return 'bg-red-100 text-red-700 border-red-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <MdCheckCircle className="text-green-600" />;
            case 'draft':
                return <MdPublish className="text-yellow-600" />;
            case 'successful':
                return <MdTrendingUp className="text-blue-600" />;
            default:
                return <MdCancel className="text-red-600" />;
        }
    };

    const fetchCampaigns = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const res = await API.get('/campaigns/my', {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Konwertuj UUID na stringi
            const campaignsData = Array.isArray(res.data) ? res.data.map(campaign => ({
                ...campaign,
                id: String(campaign.id)
            })) : [];

            setCampaigns(campaignsData);

            // Pobierz statystyki dla wszystkich kampanii
            const statsPromises = campaignsData.map(async (campaign) => {
                try {
                    const statsRes = await API.get(`/campaigns/${String(campaign.id)}/stats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    return { campaignId: String(campaign.id), stats: statsRes.data };
                } catch {
                    // Ignoruj błędy dla pojedynczych statystyk
                    return { campaignId: String(campaign.id), stats: null };
                }
            });

            const statsResults = await Promise.all(statsPromises);
            const statsMap: { [campaignId: string]: CampaignStats } = {};
            statsResults.forEach(result => {
                if (result.stats) {
                    statsMap[result.campaignId] = result.stats;
                }
            });
            setAllCampaignStats(statsMap);
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd pobierania kampanii:', apiError);
            setError(apiError.response?.data?.detail || 'Nie udało się pobrać kampanii');
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const res = await API.get('/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd pobierania powiadomień:', apiError);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await API.get('/campaigns/categories');
            if (Array.isArray(res.data)) {
                // Konwertuj UUID na stringi jeśli potrzeba
                const categoriesData = res.data.map((cat: Category) => ({
                    ...cat,
                    id: String(cat.id)
                }));
                setCategories(categoriesData);
            } else {
                setCategories([]);
            }
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd pobierania kategorii:', apiError);
            setCategories([]);
        }
    };

    const validateCampaignForm = (): string | null => {
        // Walidacja podstawowych pól
        if (!formData.title.trim()) {
            return 'Tytuł kampanii jest wymagany';
        }
        if (!formData.category_id) {
            return 'Kategoria jest wymagana';
        }
        const goalAmount = parseFloat(formData.goal_amount);
        if (!goalAmount || goalAmount <= 0) {
            return 'Cel kampanii musi być większy od 0';
        }
        if (!selectedCity || !formData.region) {
            return 'Miasto jest wymagane';
        }
        if (!formData.deadline) {
            return 'Termin zakończenia jest wymagany';
        }
        
        // Sprawdź czy termin zakończenia nie jest w przeszłości
        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
            return 'Termin zakończenia nie może być w przeszłości';
        }

        // Walidacja zdjęć
        if (images.length === 0) {
            return 'Musisz dodać przynajmniej jedno zdjęcie do kampanii';
        }
        
        // Sprawdź czy wszystkie zdjęcia mają plik lub URL
        const invalidImages = images.filter(img => !img.file && !img.image_url?.trim());
        if (invalidImages.length > 0) {
            return 'Wszystkie zdjęcia muszą być przesłane lub mieć podany URL';
        }

        // Walidacja widełek
        if (rewardTiers.length < 3) {
            return 'Musisz dodać przynajmniej trzy widełki nagród dla inwestorów';
        }

        // Sprawdź czy wszystkie widełki są wypełnione
        for (let i = 0; i < rewardTiers.length; i++) {
            const tier = rewardTiers[i];
            if (!tier.title.trim()) {
                return `Widełka ${i + 1}: Nazwa widełki jest wymagana`;
            }
            if (!tier.description.trim()) {
                return `Widełka ${i + 1}: Opis nagrody jest wymagany`;
            }
            if (tier.min_percentage < 0) {
                return `Widełka ${i + 1}: Minimalny procent nie może być ujemny`;
            }
            if (tier.max_percentage === undefined || tier.max_percentage <= tier.min_percentage) {
                return `Widełka ${i + 1}: Maksymalny procent musi być większy od minimalnego`;
            }
        }

        // Sprawdź czy przedziały się nie nachodzą
        const sortedTiers = [...rewardTiers].sort((a, b) => a.min_percentage - b.min_percentage);
        for (let i = 0; i < sortedTiers.length - 1; i++) {
            const current = sortedTiers[i];
            const next = sortedTiers[i + 1];
            if (current.max_percentage && current.max_percentage > next.min_percentage) {
                return 'Widełki nie mogą się nachodzić. Każda widełka musi mieć unikalny zakres procentowy.';
            }
        }

        return null; // Brak błędów
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Walidacja formularza
        const validationError = validateCampaignForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        setFormLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            // Upload zdjęć które mają pliki
            const uploadedImageUrls: string[] = [];
            for (const image of images) {
                if (image.file) {
                    // Upload pliku
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', image.file);
                    
                    const uploadRes = await API.post('/upload/campaign-image', formDataUpload, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    uploadedImageUrls.push(uploadRes.data.url);
                } else if (image.image_url) {
                    // Użyj istniejącego URL
                    uploadedImageUrls.push(image.image_url);
                }
            }

            const deadline = new Date(formData.deadline).toISOString();

            // Przygotuj dane kampanii z zdjęciami i widełkami
            interface CampaignCreatePayload {
                title: string;
                description: string;
                category_id: string;
                goal_amount: number;
                region: string;
                deadline: string;
                images?: Array<{ image_url: string; order_index: number; alt_text: string }>;
                reward_tiers?: Array<{
                    title: string;
                    description: string;
                    min_percentage: number;
                    max_percentage: number | null;
                    min_amount: number | null;
                    max_amount: number | null;
                    estimated_delivery_date: string | null;
                }>;
            }

            const campaignData: CampaignCreatePayload = {
                title: formData.title,
                description: formData.description,
                category_id: formData.category_id,
                goal_amount: parseFloat(formData.goal_amount),
                region: formData.region,
                deadline: deadline
            };

            // Dodaj zdjęcia jeśli są
            if (uploadedImageUrls.length > 0) {
                campaignData.images = uploadedImageUrls.map((url: string, idx: number) => ({
                    image_url: url,
                    order_index: idx,
                    alt_text: images[idx]?.alt_text || ''
                }));
            }

            // Dodaj widełki jeśli są
            if (rewardTiers.length > 0) {
                campaignData.reward_tiers = rewardTiers.map(tier => ({
                    title: tier.title,
                    description: tier.description,
                    min_percentage: tier.min_percentage,
                    max_percentage: tier.max_percentage || null,
                    min_amount: tier.min_amount || null,
                    max_amount: tier.max_amount || null,
                    estimated_delivery_date: tier.estimated_delivery_date ? new Date(tier.estimated_delivery_date).toISOString() : null
                }));
            }

            await API.post('/campaigns/', campaignData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert('Kampania została utworzona jako szkic. Aby była widoczna dla inwestorów, musisz ją opublikować.');
            setShowAddForm(false);
            setFormData({
                title: '',
                description: '',
                category_id: '',
                goal_amount: '',
                region: '',
                deadline: ''
            });
            setSelectedCity(null);
            setImages([]);
            setRewardTiers([]);
            await fetchCampaigns();
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd tworzenia kampanii:', apiError);
            alert(apiError.response?.data?.detail || 'Nie udało się dodać kampanii');
        } finally {
            setFormLoading(false);
        }
    };

    const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        
        // Sprawdź typ pliku
        if (!file.type.startsWith('image/')) {
            alert('Proszę wybrać plik graficzny');
            return;
        }

        // Sprawdź rozmiar (max 10 MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Plik jest za duży. Maksymalny rozmiar to 10 MB');
            return;
        }

        // Utwórz podgląd
        const reader = new FileReader();
        reader.onloadend = () => {
            const preview = reader.result as string;
            
            if (index !== undefined) {
                // Aktualizuj istniejące zdjęcie
                const newImages = [...images];
                newImages[index] = {
                    ...newImages[index],
                    file: file,
                    preview: preview,
                    image_url: '' // Wyczyść URL jeśli był ustawiony
                };
                setImages(newImages);
            } else {
                // Dodaj nowe zdjęcie
                setImages([...images, {
                    image_url: '',
                    alt_text: '',
                    file: file,
                    preview: preview
                }]);
            }
        };
        reader.readAsDataURL(file);
        
        // Resetuj input
        e.target.value = '';
    };

    const addImage = () => {
        // Utwórz ukryty input file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
            handleImageFileSelect(event);
        };
        input.click();
    };

    const updateImage = (index: number, field: keyof CampaignImage, value: string | number) => {
        const updated = [...images];
        updated[index] = { ...updated[index], [field]: value };
        setImages(updated);
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const replaceImage = (index: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
            handleImageFileSelect(event, index);
        };
        input.click();
    };

    const addRewardTier = () => {
        // Znajdź maksymalny procent w istniejących widełkach
        const maxExisting = rewardTiers.length > 0
            ? Math.max(...rewardTiers.map(t => t.max_percentage || t.min_percentage))
            : 0;
        
        // Nowa widełka zaczyna się od maksymalnego istniejącego + 1%
        const newMin = maxExisting + 1;
        const newMax = Math.min(newMin + 5, 100); // Domyślnie 5% zakres
        
        setRewardTiers([...rewardTiers, {
            title: '',
            description: '',
            min_percentage: newMin,
            max_percentage: newMax,
            min_amount: undefined,
            max_amount: undefined,
            estimated_delivery_date: undefined
        }]);
    };

    const updateRewardTier = (index: number, field: keyof CampaignRewardTier, value: string | number | null | undefined) => {
        const newTiers = [...rewardTiers];
        const updatedTier: CampaignRewardTier = { ...newTiers[index] };
        (updatedTier as unknown as Record<string, string | number | null | undefined>)[field] = value;
        newTiers[index] = updatedTier;
        
        // Jeśli zmieniamy zakres procentowy, sprawdź czy nie nachodzi na inne
        if (field === 'min_percentage' || field === 'max_percentage') {
            // Automatycznie dostosuj sąsiednie widełki jeśli potrzeba
            const currentTier = newTiers[index];
            const sortedIndices = newTiers
                .map((_, i) => ({ tier: newTiers[i], index: i }))
                .sort((a, b) => a.tier.min_percentage - b.tier.min_percentage)
                .map(item => item.index);
            
            const currentSortedIndex = sortedIndices.indexOf(index);
            
            // Sprawdź poprzednią widełkę
            if (currentSortedIndex > 0) {
                const prevIndex = sortedIndices[currentSortedIndex - 1];
                const prevTier = newTiers[prevIndex];
                if (prevTier.max_percentage && currentTier.min_percentage < prevTier.max_percentage) {
                    // Przesuń min do max poprzedniej
                    currentTier.min_percentage = prevTier.max_percentage;
                }
            }
            
            // Sprawdź następną widełkę
            if (currentSortedIndex < sortedIndices.length - 1) {
                const nextIndex = sortedIndices[currentSortedIndex + 1];
                const nextTier = newTiers[nextIndex];
                if (currentTier.max_percentage && currentTier.max_percentage > nextTier.min_percentage) {
                    // Przesuń max do min następnej
                    currentTier.max_percentage = nextTier.min_percentage;
                }
            }
        }
        
        setRewardTiers(newTiers);
    };

    const updateRewardTierRange = (index: number, range: [number, number]) => {
        updateRewardTier(index, 'min_percentage', range[0]);
        updateRewardTier(index, 'max_percentage', range[1]);
    };

    const removeRewardTier = (index: number) => {
        setRewardTiers(rewardTiers.filter((_, i) => i !== index));
    };

    const handleShowDetails = async (campaign: Campaign) => {
        setIsEditingCampaign(false);
        setStatsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            // Pobierz pełne dane kampanii (z images, reward_tiers, category_rel)
            const campaignRes = await API.get(`/campaigns/${String(campaign.id)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedCampaign(campaignRes.data);

            // Pobierz statystyki
            const statsRes = await API.get(`/campaigns/${String(campaign.id)}/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaignStats(statsRes.data);
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd pobierania szczegółów kampanii:', apiError);
            setCampaignStats(null);
            // W razie błędu użyj podstawowych danych kampanii
            setSelectedCampaign(campaign);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleEditCampaign = () => {
        if (!selectedCampaign) return;

        // Wypełnij formularz danymi kampanii
        setFormData({
            title: selectedCampaign.title,
            description: selectedCampaign.description || '',
            category_id: selectedCampaign.category_rel?.id || selectedCampaign.category || '',
            goal_amount: selectedCampaign.goal_amount.toString(),
            region: selectedCampaign.region || '',
            deadline: selectedCampaign.deadline ? new Date(selectedCampaign.deadline).toISOString().split('T')[0] : ''
        });

        // Wypełnij zdjęcia
        if (selectedCampaign.images) {
            setImages(selectedCampaign.images.map(img => ({
                image_url: img.image_url,
                order_index: img.order_index,
                alt_text: img.alt_text
            })));
        }

        // Wypełnij widełki
        if (selectedCampaign.reward_tiers) {
            setRewardTiers(selectedCampaign.reward_tiers.map(tier => ({
                title: tier.title,
                description: tier.description,
                min_percentage: tier.min_percentage,
                max_percentage: tier.max_percentage,
                min_amount: tier.min_amount,
                max_amount: tier.max_amount,
                estimated_delivery_date: tier.estimated_delivery_date || undefined
            })));
        }

        // Wypełnij miasto jeśli dostępne
        if (selectedCampaign.region) {
            // Spróbuj znaleźć miasto po nazwie
            API.get('/regions/search', {
                params: { q: selectedCampaign.region, type: 'city' }
            }).then(res => {
                if (res.data && res.data.length > 0) {
                    const matchingCity = res.data.find((city: Region) => 
                        city.name.toLowerCase() === selectedCampaign.region?.toLowerCase()
                    ) || res.data[0];
                    setSelectedCity(matchingCity);
                }
            }).catch(() => {
                // Ignoruj błąd
            });
        }

        setIsEditingCampaign(true);
    };

    const handleUpdateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedCampaign) return;

        // Walidacja formularza
        const validationError = validateCampaignForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        setFormLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            // Upload zdjęć które mają pliki
            const uploadedImageUrls: string[] = [];
            for (const image of images) {
                if (image.file) {
                    // Upload pliku
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', image.file);
                    
                    const uploadRes = await API.post('/upload/campaign-image', formDataUpload, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    uploadedImageUrls.push(uploadRes.data.url);
                } else if (image.image_url) {
                    // Użyj istniejącego URL
                    uploadedImageUrls.push(image.image_url);
                }
            }

            const deadline = new Date(formData.deadline).toISOString();

            // Przygotuj dane kampanii
            interface CampaignUpdatePayload {
                title: string;
                description: string;
                category_id: string;
                goal_amount: number;
                region: string;
                deadline: string;
                images?: Array<{ image_url: string; order_index: number; alt_text: string }>;
                reward_tiers?: Array<{
                    title: string;
                    description: string;
                    min_percentage: number;
                    max_percentage: number | null;
                    min_amount: number | null;
                    max_amount: number | null;
                    estimated_delivery_date: string | null;
                }>;
            }

            const campaignData: CampaignUpdatePayload = {
                title: formData.title,
                description: formData.description,
                category_id: formData.category_id,
                goal_amount: parseFloat(formData.goal_amount),
                region: formData.region,
                deadline: deadline
            };

            // Dodaj zdjęcia jeśli są
            if (uploadedImageUrls.length > 0) {
                campaignData.images = uploadedImageUrls.map((url: string, idx: number) => ({
                    image_url: url,
                    order_index: idx,
                    alt_text: images[idx]?.alt_text || ''
                }));
            }

            // Dodaj widełki jeśli są
            if (rewardTiers.length > 0) {
                campaignData.reward_tiers = rewardTiers.map(tier => ({
                    title: tier.title,
                    description: tier.description,
                    min_percentage: tier.min_percentage,
                    max_percentage: tier.max_percentage || null,
                    min_amount: tier.min_amount || null,
                    max_amount: tier.max_amount || null,
                    estimated_delivery_date: tier.estimated_delivery_date ? new Date(tier.estimated_delivery_date).toISOString() : null
                }));
            }

            await API.put(`/campaigns/${selectedCampaign.id}`, campaignData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert('Kampania została zaktualizowana!');
            setIsEditingCampaign(false);
            await handleShowDetails(selectedCampaign);
            await fetchCampaigns();
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd aktualizacji kampanii:', apiError);
            alert(apiError.response?.data?.detail || 'Nie udało się zaktualizować kampanii');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteCampaign = async () => {
        if (!selectedCampaign) return;

        if (selectedCampaign.status !== 'draft') {
            alert('Można usunąć tylko kampanie ze statusem "szkic"');
            return;
        }

        if (!confirm(`Czy na pewno chcesz usunąć kampanię "${selectedCampaign.title}"? Ta operacja jest nieodwracalna.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            await API.delete(`/campaigns/${selectedCampaign.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert('Kampania została usunięta!');
            setSelectedCampaign(null);
            await fetchCampaigns();
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd usuwania kampanii:', apiError);
            alert(apiError.response?.data?.detail || 'Nie udało się usunąć kampanii');
        }
    };

    const handleCloseCampaign = async (campaignId: string) => {
        if (!confirm('Czy na pewno chcesz zamknąć tę kampanię?')) return;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            await API.post(`/campaigns/${campaignId}/close`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            alert('Kampania została zamknięta!');
            setSelectedCampaign(null);
            await fetchCampaigns();
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd zamykania kampanii:', apiError);
            alert(apiError.response?.data?.detail || 'Nie udało się zamknąć kampanii');
        }
    };

    const handlePublishCampaign = async (campaignId: string) => {
        try {
            // Backend oczekuje JSON body z embed=True, więc musimy wysłać obiekt
            await API.patch(`/campaigns/${campaignId}/status`, { status: 'active' });

            alert('Kampania została opublikowana!');
            await fetchCampaigns();
            // Odśwież szczegóły kampanii jeśli jest otwarta
            if (selectedCampaign && selectedCampaign.id === campaignId) {
                await handleShowDetails(selectedCampaign);
            }
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd publikowania kampanii:', apiError);
            
            // Jeśli błąd 401, token wygasł - interceptor już obsłużył logout
            if (apiError.response?.status === 401) {
                alert('Sesja wygasła. Zaloguj się ponownie.');
                return;
            }
            
            alert(apiError.response?.data?.detail || 'Nie udało się opublikować kampanii');
        }
    };

    const handleShowInvestors = async (campaignId: string) => {
        setShowInvestors(true);
        setStatsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const res = await API.get(`/campaigns/${campaignId}/investors`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Konwertuj UUID na stringi i filtruj tylko completed inwestycje
            // Pending inwestycje nie liczą się jako aktywni inwestorzy
            const investorsData = Array.isArray(res.data) ? res.data
                .filter(investor => investor.status === 'completed') // Tylko completed (approved płatności)
                .map(investor => ({
                    ...investor,
                    id: String(investor.id),
                    email: investor.email
                })) : [];

            setInvestors(investorsData);
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Błąd pobierania inwestorów:', apiError);
            setInvestors([]);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleCloseInvestors = () => {
        setShowInvestors(false);
        setInvestors([]);
    };


    return (
        <RequirePermission permission="view_dashboard">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                        <div className="mb-4 sm:mb-0">
                            <h1 className="text-4xl sm:text-5xl h-auto font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 pb-2">
                                Panel Przedsiębiorcy
                            </h1>
                            <p className="text-gray-600 text-lg">Zarządzaj swoimi kampaniami crowdfundingowymi</p>
                    </div>
                        <div className="flex gap-3">
                        <Link
                            to="/notifications"
                                className="group relative bg-white/80 backdrop-blur-sm hover:bg-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200"
                        >
                                <div className="flex items-center gap-2">
                                    <MdNotifications className="text-gray-700 text-xl group-hover:text-green-600 transition-colors" />
                                    <span className="font-semibold text-gray-700 group-hover:text-green-600 transition-colors">Powiadomienia</span>
                                </div>
                            {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setShowAddForm(true)}
                                className="group flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                                <MdAdd className="text-xl group-hover:rotate-90 transition-transform duration-300" />
                                Nowa kampania
                        </button>
                    </div>
                </div>

                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <Spinner />
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm animate-fade-in">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    )}


                {/* Formularz tworzenia kampanii */}
                {showAddForm && (
                        <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 p-6 mb-8 animate-fade-in ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                                    Nowa kampania
                                </h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                                    aria-label="Zamknij formularz"
                                    title="Zamknij formularz"
                            >
                                    <MdClose className="text-gray-500 group-hover:text-gray-700 text-2xl transition-colors" />
                            </button>
                        </div>
                            <form onSubmit={handleCreateCampaign} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tytuł kampanii</label>
                                        <input
                                            type="text"
                                                    placeholder="Wprowadź tytuł kampanii"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">Kategoria <span className="text-red-600">*</span></label>
                                <select
                                            id="category"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                    required
                                            aria-label="Wybierz kategorię kampanii"
                                >
                                    <option value="">Wybierz kategorię</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {formData.category_id && categories.find(c => c.id === formData.category_id)?.description && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {categories.find(c => c.id === formData.category_id)?.description}
                                    </p>
                                )}
                            </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Opis kampanii</label>
                            <textarea
                                        placeholder="Opisz szczegółowo swoją kampanię..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white resize-none"
                                rows={4}
                                required
                            />
                                </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cel (PLN)</label>
                                <input
                                    type="number"
                                            placeholder="0"
                                    value={formData.goal_amount}
                                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                            min="0.01"
                                    step="0.01"
                                    required
                                />
                                        {formData.goal_amount && parseFloat(formData.goal_amount) <= 0 && (
                                            <p className="text-xs text-red-600 mt-1">Cel musi być większy od 0</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <MdLocationOn className="text-green-600" />
                                            Miasto <span className="text-red-600">*</span>
                                        </label>
                                        <RegionSearchBox
                                            filterType="city"
                                            placeholder="Wyszukaj miasto..."
                                            onSelect={(region) => {
                                                if (region) {
                                                    setSelectedCity(region);
                                                    setFormData(prev => ({ ...prev, region: region.id }));
                                                } else {
                                                    setSelectedCity(null);
                                                    setFormData(prev => ({ ...prev, region: '' }));
                                                }
                                            }}
                                            value={selectedCity}
                                        />
                                        {userProfile?.location && !selectedCity && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                💡 Twoje miasto z profilu: <strong>{userProfile.location}</strong> - wyszukaj je powyżej aby automatycznie wypełnić
                                            </p>
                                        )}
                                        {selectedCity && (
                                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                                <MdCheckCircle />
                                                Wybrano: <strong>{selectedCity.name}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="deadline" className="block text-sm font-semibold text-gray-700 mb-2">Termin zakończenia</label>
                                <input
                                            id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                    required
                                            aria-label="Wybierz termin zakończenia kampanii"
                                />
                            </div>
                        </div>

                                {/* Sekcja zdjęć */}
                                <div className="border-t border-gray-200 pt-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">Zdjęcia kampanii <span className="text-red-600">*</span></label>
                                            <p className="text-xs text-gray-500 mt-1">Wymagane przynajmniej jedno zdjęcie</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addImage}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
                                        >
                                            <MdImage />
                                            Dodaj zdjęcie
                                        </button>
                                    </div>
                                    {images.length === 0 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Uwaga:</strong> Musisz dodać przynajmniej jedno zdjęcie do kampanii.
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        {images.map((image, index) => (
                                            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <div className="flex gap-3">
                                                    {/* Podgląd zdjęcia */}
                                                    {(image.preview || image.image_url) && (
                                                        <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-gray-300 bg-white">
                                                            <img
                                                                src={image.preview || image.image_url}
                                                                alt={image.alt_text || `Podgląd ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {/* Przycisk wyboru pliku */}
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                {image.file ? 'Zdjęcie wybrane' : 'Wybierz zdjęcie'}
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => replaceImage(index)}
                                                                    className="px-4 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
                                                                >
                                                                    {image.file ? 'Zmień zdjęcie' : 'Wybierz plik'}
                                                                </button>
                                                                {image.file && (
                                                                    <span className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg flex items-center">
                                                                        {image.file.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Tekst alternatywny (opcjonalne)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Opis zdjęcia"
                                                                value={image.alt_text || ''}
                                                                onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="self-start p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        aria-label="Usuń zdjęcie"
                                                    >
                                                        <MdDelete className="text-xl" />
                                                    </button>
                                                </div>
                                                {image.image_url && (
                                                    <div className="mt-3">
                                                        <img
                                                            src={image.image_url}
                                                            alt={image.alt_text || 'Podgląd'}
                                                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {images.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                Dodaj zdjęcia, aby przyciągnąć uwagę inwestorów
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Sekcja widełek nagród */}
                                <div className="border-t border-gray-200 pt-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">Widełki nagród dla inwestorów <span className="text-red-600">*</span></label>
                                            <p className="text-xs text-gray-500 mt-1">Wymagane przynajmniej trzy widełki</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addRewardTier}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors"
                                        >
                                            <MdAdd />
                                            Dodaj widełkę
                                        </button>
                                    </div>
                                    {rewardTiers.length < 3 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Uwaga:</strong> Musisz dodać przynajmniej trzy widełki nagród. 
                                                {rewardTiers.length > 0 && ` Dodano: ${rewardTiers.length}/3`}
                                            </p>
                                        </div>
                                    )}
                                    {/* Wizualizacja wszystkich przedziałów */}
                                    {rewardTiers.length > 0 && (
                                        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
                                            <h5 className="text-sm font-semibold text-gray-700 mb-3">Przegląd widełek:</h5>
                                            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                                                {rewardTiers
                                                    .map((tier, idx) => ({ tier, idx }))
                                                    .sort((a, b) => a.tier.min_percentage - b.tier.min_percentage)
                                                    .map(({ tier, idx }, sortedIdx) => {
                                                        const left = tier.min_percentage;
                                                        const width = (tier.max_percentage || 100) - tier.min_percentage;
                                                        const colors = [
                                                            'bg-gradient-to-r from-purple-500 to-pink-500',
                                                            'bg-gradient-to-r from-blue-500 to-cyan-500',
                                                            'bg-gradient-to-r from-green-500 to-emerald-500',
                                                            'bg-gradient-to-r from-orange-500 to-red-500',
                                                            'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                        ];
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`absolute h-full ${colors[sortedIdx % colors.length]} opacity-80 hover:opacity-100 transition-opacity`}
                                                                style={{
                                                                    left: `${left}%`,
                                                                    width: `${width}%`
                                                                }}
                                                                title={`${tier.title || `Widełka ${idx + 1}`}: ${tier.min_percentage}% - ${tier.max_percentage || 100}%`}
                                                            >
                                                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                                    {sortedIdx + 1}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                            <div className="mt-2 flex justify-between text-xs text-gray-500">
                                                <span>0%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {rewardTiers.map((tier, index) => (
                                            <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-semibold text-gray-900">Widełka {index + 1}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRewardTier(index)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        aria-label="Usuń widełkę"
                                                        title="Usuń widełkę"
                                                    >
                                                        <MdDelete className="text-lg" />
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {/* Nazwa i opis */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa widełki <span className="text-red-600">*</span></label>
                                                        <input
                                                            type="text"
                                                            placeholder="np. Wsparcie podstawowe"
                                                            value={tier.title}
                                                            onChange={(e) => updateRewardTier(index, 'title', e.target.value)}
                                                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label htmlFor={`tier-description-${index}`} className="block text-sm font-medium text-gray-700 mb-2">Opis nagrody <span className="text-red-600">*</span></label>
                                                        <textarea
                                                            id={`tier-description-${index}`}
                                                            placeholder="Opisz szczegółowo co inwestor otrzyma za tę widełkę..."
                                                            value={tier.description}
                                                            onChange={(e) => updateRewardTier(index, 'description', e.target.value)}
                                                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white resize-none"
                                                            rows={3}
                                                            required
                                                        />
                                                    </div>

                                                    {/* Slider zakresu procentowego */}
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <RangeSlider
                                                            min={0}
                                                            max={100}
                                                            value={[tier.min_percentage, tier.max_percentage || tier.min_percentage + 5]}
                                                            onChange={(range) => updateRewardTierRange(index, range)}
                                                            step={0.5}
                                                            label="Zakres procentowy celu kampanii"
                                                        />
                                                        <div className="mt-3 flex justify-between text-xs text-gray-600">
                                                            <span>Od: <strong>{tier.min_percentage}%</strong></span>
                                                            <span>Do: <strong>{tier.max_percentage || 100}%</strong></span>
                                                            <span>Zakres: <strong>{((tier.max_percentage || 100) - tier.min_percentage).toFixed(1)}%</strong></span>
                                                        </div>
                                                    </div>

                                                    {/* Data dostawy */}
                                                    <div>
                                                        <label htmlFor={`tier-delivery-${index}`} className="block text-sm font-medium text-gray-700 mb-2">Szacowana data dostawy (opcjonalne)</label>
                                                        <input
                                                            id={`tier-delivery-${index}`}
                                                            type="date"
                                                            value={tier.estimated_delivery_date || ''}
                                                            onChange={(e) => updateRewardTier(index, 'estimated_delivery_date', e.target.value || undefined)}
                                                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                                                            aria-label="Szacowana data dostawy nagrody"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {rewardTiers.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                Dodaj widełki nagród, aby zachęcić inwestorów do wsparcia
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                    >
                                        {formLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Tworzenie...
                                            </>
                                        ) : (
                                            <>
                                                <MdAdd />
                                                Utwórz kampanię
                                            </>
                                        )}
                                </button>
                                <button
                                    type="button"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setSelectedCity(null);
                                            setImages([]);
                                            setRewardTiers([]);
                                        }}
                                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista kampanii */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {campaigns.map((campaign, index) => {
                            const progress = Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100);
                            const stats = allCampaignStats[String(campaign.id)];
                            
                            return (
                                <div 
                                    key={campaign.id} 
                                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-gray-100 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Gradient background effect */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                                    
                                    <div className="relative z-10">
                                        {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                                <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
                                                    {campaign.title}
                                                </h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{campaign.description}</p>
                                    </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                                                {getStatusIcon(campaign.status)}
                                                {campaign.status}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3">
                                                <p className="text-xs text-gray-500 mb-1">Cel</p>
                                                <p className="font-bold text-gray-900">{formatCurrency(campaign.goal_amount)}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
                                                <p className="text-xs text-gray-500 mb-1">Zebrano</p>
                                                <p className="font-bold text-green-600">{formatCurrency(campaign.current_amount)}</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-semibold text-gray-600">Postęp</span>
                                                <span className="text-xs font-bold text-green-600">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-700 relative overflow-hidden"
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                </div>
                                            </div>
                            </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleShowDetails(campaign)}
                                                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-1"
                                            >
                                                            <MdVisibility />
                                                Szczegóły
                                            </button>
                                                        {campaign.status === 'active' && (stats?.investor_count || 0) > 0 && (
                                                <button
                                                    onClick={() => handleShowInvestors(String(campaign.id))}
                                                                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                                >
                                                                <MdPeople />
                                                                {stats?.investor_count || 0}
                                                </button>
                                            )}
                                            {campaign.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePublishCampaign(String(campaign.id))}
                                                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-1"
                                                >
                                                                <MdPublish />
                                                    Opublikuj
                                                </button>
                                            )}
                                            {campaign.status === 'active' && (
                                                <button
                                                    onClick={() => handleCloseCampaign(String(campaign.id))}
                                                                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                                >
                                                                <MdClose />
                                                    Zamknij
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    {campaigns.length === 0 && !loading && (
                            <div className="col-span-full text-center py-16 bg-gradient-to-br from-gray-50 to-green-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                                    <MdCampaign className="text-green-600 text-4xl" />
                                </div>
                                <p className="text-gray-600 font-semibold text-lg mb-2">Nie masz jeszcze żadnych kampanii</p>
                                <p className="text-gray-500 text-sm mb-6">Rozpocznij swoją przygodę z crowdfundingiem</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                    <MdAdd />
                                Utwórz pierwszą kampanię
                            </button>
                        </div>
                    )}
                </div>

                {/* Szczegóły kampanii */}
                {selectedCampaign && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200">
                            {/* Nagłówek - zawsze widoczny */}
                            <div className="flex justify-between items-center px-6 py-2 flex-shrink-0">
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                                    {isEditingCampaign ? 'Edytuj kampanię' : 'Szczegóły kampanii'}
                                </h3>
                                {!isEditingCampaign && (
                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                                        aria-label="Zamknij szczegóły kampanii"
                                        title="Zamknij szczegóły kampanii"
                                >
                                        <MdClose className="text-gray-500 group-hover:text-gray-700 text-2xl transition-colors" />
                                </button>
                                )}
                            </div>
                            {/* Zawartość - scrollowalna */}
                            <div className="p-6 overflow-y-auto flex-1 min-h-0">
                                {isEditingCampaign ? (
                                    <form onSubmit={handleUpdateCampaign} className="space-y-6">
                                        {/* Formularz edycji - użyj tego samego co przy tworzeniu */}
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 mb-2">Tytuł kampanii <span className="text-red-600">*</span></label>
                                                <input
                                                    id="edit-title"
                                                    type="text"
                                                    placeholder="Wprowadź tytuł kampanii"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-2">Opis kampanii</label>
                                                <textarea
                                                    id="edit-description"
                                                    placeholder="Opisz szczegółowo swoją kampanię..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white resize-none"
                                                    rows={4}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="edit-category" className="block text-sm font-semibold text-gray-700 mb-2">Kategoria <span className="text-red-600">*</span></label>
                                                    <select
                                                        id="edit-category"
                                                        value={formData.category_id}
                                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                                        required
                                                        aria-label="Wybierz kategorię kampanii"
                                                    >
                                                        <option value="">Wybierz kategorię</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                    {formData.category_id && categories.find(c => c.id === formData.category_id)?.description && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {categories.find(c => c.id === formData.category_id)?.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label htmlFor="edit-deadline" className="block text-sm font-semibold text-gray-700 mb-2">Termin zakończenia</label>
                                                    <input
                                                        id="edit-deadline"
                                                        type="date"
                                                        value={formData.deadline}
                                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                                        required
                                                        aria-label="Wybierz termin zakończenia kampanii"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <MdLocationOn className="text-green-600" />
                                                    Miasto <span className="text-red-600">*</span>
                                                </label>
                                                <RegionSearchBox
                                                    filterType="city"
                                                    placeholder="Wyszukaj miasto..."
                                                    onSelect={(region) => {
                                                        if (region) {
                                                            setSelectedCity(region);
                                                            setFormData(prev => ({ ...prev, region: region.id }));
                                                        } else {
                                                            setSelectedCity(null);
                                                            setFormData(prev => ({ ...prev, region: '' }));
                                                        }
                                                    }}
                                                    value={selectedCity}
                                                />
                                                {selectedCity && (
                                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                                        <MdCheckCircle />
                                                        Wybrano: <strong>{selectedCity.name}</strong>
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cel (PLN)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={formData.goal_amount}
                                                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                                    min="0.01"
                                                    step="0.01"
                                                    required
                                                />
                                                {formData.goal_amount && parseFloat(formData.goal_amount) <= 0 && (
                                                    <p className="text-xs text-red-600 mt-1">Cel musi być większy od 0</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sekcja zdjęć - użyj tego samego co przy tworzeniu */}
                                        <div className="border-t border-gray-200 pt-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Zdjęcia kampanii <span className="text-red-600">*</span></label>
                                                    <p className="text-xs text-gray-500 mt-1">Wymagane przynajmniej jedno zdjęcie</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addImage}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
                                                >
                                                    <MdImage />
                                                    Dodaj zdjęcie
                                                </button>
                                            </div>
                                            {images.length === 0 && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                                    <p className="text-sm text-yellow-800">
                                                        <strong>Uwaga:</strong> Musisz dodać przynajmniej jedno zdjęcie do kampanii.
                                                    </p>
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                {images.map((image, index) => (
                                                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                        <div className="flex gap-3">
                                                            {(image.preview || image.image_url) && (
                                                                <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-gray-300 bg-white">
                                                                    <img
                                                                        src={image.preview || image.image_url}
                                                                        alt={image.alt_text || `Podgląd ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                        {image.file ? 'Zdjęcie wybrane' : 'Wybierz zdjęcie'}
                                                                    </label>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => replaceImage(index)}
                                                                            className="px-4 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
                                                                        >
                                                                            {image.file ? 'Zmień zdjęcie' : 'Wybierz plik'}
                                                                        </button>
                                                                        {image.file && (
                                                                            <span className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg flex items-center">
                                                                                {image.file.name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tekst alternatywny (opcjonalne)</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Opis zdjęcia"
                                                                        value={image.alt_text || ''}
                                                                        onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(index)}
                                                                className="self-start p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                aria-label="Usuń zdjęcie"
                                                                title="Usuń zdjęcie"
                                                            >
                                                                <MdDelete className="text-xl" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sekcja widełek - użyj tego samego co przy tworzeniu */}
                                        <div className="border-t border-gray-200 pt-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700">Widełki nagród dla inwestorów <span className="text-red-600">*</span></label>
                                                    <p className="text-xs text-gray-500 mt-1">Wymagane przynajmniej trzy widełki</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addRewardTier}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors"
                                                >
                                                    <MdAdd />
                                                    Dodaj widełkę
                                                </button>
                                            </div>
                                            {rewardTiers.length < 3 && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                                    <p className="text-sm text-yellow-800">
                                                        <strong>Uwaga:</strong> Musisz dodać przynajmniej trzy widełki nagród. 
                                                        {rewardTiers.length > 0 && ` Dodano: ${rewardTiers.length}/3`}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Wizualizacja wszystkich przedziałów */}
                                            {rewardTiers.length > 0 && (
                                                <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
                                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Przegląd widełek:</h5>
                                                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                                                        {rewardTiers
                                                            .map((tier, idx) => ({ tier, idx }))
                                                            .sort((a, b) => a.tier.min_percentage - b.tier.min_percentage)
                                                            .map(({ tier, idx }, sortedIdx) => {
                                                                const left = tier.min_percentage;
                                                                const width = (tier.max_percentage || 100) - tier.min_percentage;
                                                                const colors = [
                                                                    'bg-gradient-to-r from-purple-500 to-pink-500',
                                                                    'bg-gradient-to-r from-blue-500 to-cyan-500',
                                                                    'bg-gradient-to-r from-green-500 to-emerald-500',
                                                                    'bg-gradient-to-r from-orange-500 to-red-500',
                                                                    'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                                ];
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`absolute h-full ${colors[sortedIdx % colors.length]} opacity-80 hover:opacity-100 transition-opacity`}
                                                                        style={{
                                                                            left: `${left}%`,
                                                                            width: `${width}%`
                                                                        }}
                                                                        title={`${tier.title || `Widełka ${idx + 1}`}: ${tier.min_percentage}% - ${tier.max_percentage || 100}%`}
                                                                    >
                                                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                                            {sortedIdx + 1}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                                                        <span>0%</span>
                                                        <span>100%</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-4">
                                                {rewardTiers.map((tier, index) => (
                                                    <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h4 className="font-semibold text-gray-900">Widełka {index + 1}</h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRewardTier(index)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                aria-label="Usuń widełkę"
                                                                title="Usuń widełkę"
                                                            >
                                                                <MdDelete className="text-lg" />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa widełki <span className="text-red-600">*</span></label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="np. Wsparcie podstawowe"
                                                                    value={tier.title}
                                                                    onChange={(e) => updateRewardTier(index, 'title', e.target.value)}
                                                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label htmlFor={`edit-tier-description-${index}`} className="block text-sm font-medium text-gray-700 mb-2">Opis nagrody <span className="text-red-600">*</span></label>
                                                                <textarea
                                                                    id={`edit-tier-description-${index}`}
                                                                    placeholder="Opisz szczegółowo co inwestor otrzyma za tę widełkę..."
                                                                    value={tier.description}
                                                                    onChange={(e) => updateRewardTier(index, 'description', e.target.value)}
                                                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white resize-none"
                                                                    rows={3}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                                <RangeSlider
                                                                    min={0}
                                                                    max={100}
                                                                    value={[tier.min_percentage, tier.max_percentage || tier.min_percentage + 5]}
                                                                    onChange={(range) => updateRewardTierRange(index, range)}
                                                                    step={0.5}
                                                                    label="Zakres procentowy celu kampanii"
                                                                />
                                                                <div className="mt-3 flex justify-between text-xs text-gray-600">
                                                                    <span>Od: <strong>{tier.min_percentage}%</strong></span>
                                                                    <span>Do: <strong>{tier.max_percentage || 100}%</strong></span>
                                                                    <span>Zakres: <strong>{((tier.max_percentage || 100) - tier.min_percentage).toFixed(1)}%</strong></span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label htmlFor={`edit-tier-delivery-${index}`} className="block text-sm font-medium text-gray-700 mb-2">Szacowana data dostawy (opcjonalne)</label>
                                                                <input
                                                                    id={`edit-tier-delivery-${index}`}
                                                                    type="date"
                                                                    value={tier.estimated_delivery_date || ''}
                                                                    onChange={(e) => updateRewardTier(index, 'estimated_delivery_date', e.target.value || undefined)}
                                                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                                                                    aria-label="Szacowana data dostawy nagrody"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </form>
                                ) : statsLoading ? (
                                        <div className="flex justify-center py-12">
                                    <Spinner />
                                        </div>
                                ) : (
                                        <div className="space-y-6">
                                        {/* Tytuł i opis */}
                                        <div>
                                                <h4 className="font-bold text-2xl text-gray-900 mb-2">{selectedCampaign.title}</h4>
                                                <p className="text-gray-600 leading-relaxed">{selectedCampaign.description}</p>
                                        </div>

                                        {/* Kategoria i Region */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedCampaign.category_rel && (
                                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Kategoria</p>
                                                    <p className="font-bold text-lg text-purple-700">{selectedCampaign.category_rel.name}</p>
                                                    {selectedCampaign.category_rel.description && (
                                                        <p className="text-xs text-gray-600 mt-1">{selectedCampaign.category_rel.description}</p>
                                                    )}
                                                </div>
                                            )}
                                            {selectedCampaign.region && (
                                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Miasto</p>
                                                    <p className="font-bold text-lg text-blue-700">{selectedCampaign.region}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Statystyki */}
                                        <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Cel</p>
                                                    <p className="font-bold text-xl text-gray-900">{formatCurrency(selectedCampaign.goal_amount)}</p>
                                            </div>
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Zebrano</p>
                                                    <p className="font-bold text-xl text-green-600">{formatCurrency(selectedCampaign.current_amount)}</p>
                                            </div>
                                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Inwestorów</p>
                                                    <p className="font-bold text-xl text-blue-600">{campaignStats?.investor_count || 0}</p>
                                            </div>
                                                <div className={`p-4 rounded-xl border ${getStatusColor(selectedCampaign.status)}`}>
                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Status</p>
                                                    <p className="font-bold text-xl">{selectedCampaign.status}</p>
                                            </div>
                                        </div>

                                        {/* Termin zakończenia */}
                                        {selectedCampaign.deadline && (
                                            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Termin zakończenia</p>
                                                <p className="font-bold text-lg text-orange-700">
                                                    {new Date(selectedCampaign.deadline).toLocaleDateString('pl-PL', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                {new Date(selectedCampaign.deadline) > new Date() && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Pozostało: {Math.ceil((new Date(selectedCampaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dni
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Zdjęcia */}
                                        {selectedCampaign.images && selectedCampaign.images.length > 0 && (
                                            <div>
                                                <h5 className="text-lg font-semibold text-gray-900 mb-3">Zdjęcia kampanii</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {selectedCampaign.images
                                                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                                                        .map((image) => (
                                                            <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                                                <img
                                                                    src={image.image_url.startsWith('http') ? image.image_url : `http://127.0.0.1:8000${image.image_url}`}
                                                                    alt={image.alt_text || selectedCampaign.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Widełki nagród */}
                                        {selectedCampaign.reward_tiers && selectedCampaign.reward_tiers.length > 0 && (
                                            <div>
                                                <h5 className="text-lg font-semibold text-gray-900 mb-3">Widełki nagród dla inwestorów</h5>
                                                <div className="space-y-3">
                                                    {selectedCampaign.reward_tiers
                                                        .sort((a, b) => a.min_percentage - b.min_percentage)
                                                        .map((tier, index) => (
                                                            <div key={tier.id || index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h6 className="font-semibold text-gray-900">{tier.title}</h6>
                                                                    <span className="px-2 py-1 bg-purple-200 text-purple-700 text-xs font-semibold rounded">
                                                                        {tier.min_percentage}% - {tier.max_percentage || 100}%
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-700 mb-2">{tier.description}</p>
                                                                {tier.estimated_delivery_date && (
                                                                    <p className="text-xs text-gray-500">
                                                                        Szacowana data dostawy: {new Date(tier.estimated_delivery_date).toLocaleDateString('pl-PL')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                            {/* Progress bar */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-gray-600">Postęp kampanii</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {Math.round((selectedCampaign.current_amount / selectedCampaign.goal_amount) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-700"
                                                        style={{ width: `${Math.min((selectedCampaign.current_amount / selectedCampaign.goal_amount) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                    </div>
                                )}
                                </div>
                                {/* Panel przycisków - zawsze widoczny na dole, poza scrollowalną zawartością */}
                                <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex-shrink-0 rounded-b-2xl">
                                    {!isEditingCampaign ? (
                                        <>
                                            <button
                                                onClick={() => handleShowInvestors(selectedCampaign.id)}
                                                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                            >
                                                <MdPeople />
                                                Inwestorzy
                                            </button>
                                            {selectedCampaign.status === 'draft' && (
                                                <>
                                                    <button
                                                        onClick={handleEditCampaign}
                                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                    >
                                                        <MdEdit />
                                                        Edytuj
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteCampaign}
                                                        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                    >
                                                        <MdDelete />
                                                        Usuń
                                                    </button>
                                                <button
                                                    onClick={() => handlePublishCampaign(selectedCampaign.id)}
                                                        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                >
                                                        <MdPublish />
                                                    Opublikuj
                                                </button>
                                                </>
                                            )}
                                            {selectedCampaign.status === 'active' && (
                                                <button
                                                    onClick={() => handleCloseCampaign(String(selectedCampaign.id))}
                                                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                >
                                                    <MdClose />
                                                    Zamknij kampanię
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleUpdateCampaign}
                                                disabled={formLoading}
                                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                {formLoading ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Zapisywanie...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MdSave />
                                                        Zapisz zmiany
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditingCampaign(false);
                                                    if (selectedCampaign) {
                                                        handleShowDetails(selectedCampaign);
                                                    }
                                                }}
                                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                                            >
                                                Anuluj
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                )}

                {/* Lista inwestorów */}
                {showInvestors && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                            <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                            <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-2">
                                            <MdPeople />
                                            Inwestorzy w kampanii
                                        </h3>
                                    <button
                                        onClick={handleCloseInvestors}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                                            aria-label="Zamknij listę inwestorów"
                                            title="Zamknij listę inwestorów"
                                    >
                                            <MdClose className="text-gray-500 group-hover:text-gray-700 text-2xl transition-colors" />
                                    </button>
                                </div>

                                {statsLoading ? (
                                        <div className="flex justify-center py-12">
                                    <Spinner />
                                        </div>
                                ) : investors.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                                                <MdPeople className="text-purple-600 text-2xl" />
                                            </div>
                                            <p className="text-gray-600 font-semibold text-lg">Brak inwestorów w tej kampanii</p>
                                            <p className="text-gray-500 text-sm mt-2">Inwestorzy pojawią się tutaj po dokonaniu inwestycji</p>
                                        </div>
                                ) : (
                                    <div className="space-y-3">
                                            {investors.map((investor, index) => (
                                                <div 
                                                    key={investor.id} 
                                                    className="bg-gradient-to-r from-gray-50 to-purple-50/30 p-5 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                                                    {investor.email.charAt(0).toUpperCase()}
                                                                </div>
                                                                <p className="font-bold text-gray-900">{investor.email}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4 ml-[52px]">
                                                    <div>
                                                                    <p className="text-xs text-gray-500 mb-1">Inwestycja</p>
                                                                    <p className="font-bold text-lg text-green-600">{formatCurrency(investor.amount)}</p>
                                                    </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                        investor.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                        investor.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                        {investor.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <p className="text-sm text-gray-500 font-medium">
                                                                {new Date(investor.created_at).toLocaleDateString('pl-PL', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                    <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                                    <button
                                        onClick={handleCloseInvestors}
                                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                                    >
                                        Zamknij
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </RequirePermission>
    );
}
