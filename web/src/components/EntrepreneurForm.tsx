import React, { useEffect, useState } from 'react';
import RegionSearchBox from '../components/RegionSearchBox';
import API from '../utils/api';

interface EntrepreneurFormProps {
    onChange: (data: EntrepreneurFormData) => void;
}

export interface EntrepreneurFormData {
    companyName: string;
    nip: string;
    city: { id: string; name: string } | null;
    street: string;
    buildingNumber: string;
    apartmentNumber: string;
    postalCode: string;
    country: { id: string; name: string } | null;
}

const EntrepreneurForm: React.FC<EntrepreneurFormProps> = ({ onChange }) => {
    const [companyName, setCompanyName] = useState('');
    const [nip, setNip] = useState('');
    const [city, setCity] = useState<{ id: string; name: string; type: "country" | "state" | "city" } | null>(null);
    const [street, setStreet] = useState('');
    const [buildingNumber, setBuildingNumber] = useState('');
    const [apartmentNumber, setApartmentNumber] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState<{ id: string; name: string } | null>(null);
    const [loadingGus, setLoadingGus] = useState(false);
    const [gusError, setGusError] = useState<string | null>(null);
    const [gusData, setGusData] = useState<any>(null);
    const [citySearchLoading, setCitySearchLoading] = useState(false);

    React.useEffect(() => {
        onChange({ companyName, nip, city, street, buildingNumber, apartmentNumber, postalCode, country });
    }, [companyName, nip, city, street, buildingNumber, apartmentNumber, postalCode, country, onChange]);

    // Automatyczne uzupełnianie kodu pocztowego po wyborze miasta
    useEffect(() => {
        if (city) {
            API.get(`/regions/city/${city.id}`)
                .then((res) => {
                    if (res.data && res.data.postal_code) {
                        setPostalCode(res.data.postal_code);
                    }
                })
                .catch(() => { });
        }
    }, [city]);

    // Automatyczne wyszukiwanie miasta po pobraniu danych z GUS
    useEffect(() => {
        if (gusData && gusData.city && country) {
            setCitySearchLoading(true);
            API.get(`/regions/search`, {
                params: {
                    q: gusData.city,
                    type: 'city',
                    country_id: country.id
                }
            })
                .then(res => {
                    if (res.data && res.data.length > 0) {
                        setCity({ id: res.data[0].id, name: res.data[0].name, type: 'city' });
                    } else {
                        setCity(null);
                    }
                })
                .finally(() => setCitySearchLoading(false));
        }
    }, [gusData, country]);

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kraj
                </label>
                <RegionSearchBox
                    onSelect={region => setCountry(region && region.type === 'country' ? { id: region.id, name: region.name } : null)}
                    placeholder="Wybierz kraj"
                    filterType="country"
                />
            </div>
            {country && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        NIP
                    </label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                            placeholder="NIP"
                            value={nip}
                            onChange={e => setNip(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            disabled={!nip || loadingGus}
                            onClick={async () => {
                                setLoadingGus(true);
                                setGusError(null);
                                try {
                                    const res = await API.get(`/regions/gus/company/${nip}`);
                                    if (res.data) {
                                        setGusData(res.data);
                                        if (res.data.company_name) setCompanyName(res.data.company_name);
                                        if (res.data.street) setStreet(res.data.street);
                                        if (res.data.building_number) setBuildingNumber(res.data.building_number);
                                        if (res.data.apartment_number) setApartmentNumber(res.data.apartment_number);
                                        if (res.data.postal_code) setPostalCode(res.data.postal_code);
                                        // Miasto zostanie ustawione automatycznie przez useEffect
                                    }
                                } catch {
                                    setGusError('Nie udało się pobrać danych z GUS.');
                                } finally {
                                    setLoadingGus(false);
                                }
                            }}
                        >
                            {loadingGus ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Pobierz z GUS'
                            )}
                        </button>
                    </div>
                </div>
            )}
            {gusError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {gusError}
                </div>
            )}
            {country && city && !citySearchLoading && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Miasto
                    </label>
                    <RegionSearchBox
                        onSelect={region => setCity(region && region.type === 'city' ? { id: region.id, name: region.name, type: 'city' } : null)}
                        placeholder="Wybierz miasto firmy"
                        filterType="city"
                        countryId={country?.id}
                        value={city}
                    />
                </div>
            )}
            {country && city && !citySearchLoading && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nazwa firmy
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                            placeholder="Nazwa firmy"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ulica
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                            placeholder="Ulica"
                            value={street}
                            onChange={e => setStreet(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nr domu
                            </label>
                            <input
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                                placeholder="Nr domu"
                                value={buildingNumber}
                                onChange={e => setBuildingNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nr mieszkania <span className="text-gray-400 font-normal">(opcjonalnie)</span>
                            </label>
                            <input
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white"
                                placeholder="Nr mieszkania"
                                value={apartmentNumber}
                                onChange={e => setApartmentNumber(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kod pocztowy
                        </label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Kod pocztowy"
                            value={postalCode}
                            onChange={e => setPostalCode(e.target.value)}
                            required
                            disabled={!!city}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default EntrepreneurForm;
