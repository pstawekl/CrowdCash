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
            <RegionSearchBox
                onSelect={region => setCountry(region && region.type === 'country' ? { id: region.id, name: region.name } : null)}
                placeholder="Wybierz kraj"
                filterType="country"
            />
            {country && (
                <div className="flex gap-2">
                    <input
                        className="input input-bordered w-full"
                        placeholder="NIP"
                        value={nip}
                        onChange={e => setNip(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="btn btn-outline ml-2"
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
                        {loadingGus ? 'Pobieranie...' : 'Pobierz dane z GUS'}
                    </button>
                </div>
            )}
            {gusError && <div className="text-error text-sm mt-1">{gusError}</div>}
            {country && city && !citySearchLoading && (
                <RegionSearchBox
                    onSelect={region => setCity(region && region.type === 'city' ? { id: region.id, name: region.name, type: 'city' } : null)}
                    placeholder="Wybierz miasto firmy"
                    filterType="city"
                    countryId={country?.id}
                    value={city}
                />
            )}
            {country && city && !citySearchLoading && (
                <>
                    <input
                        className="input input-bordered w-full"
                        placeholder="Nazwa firmy"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        required
                    />
                    <input
                        className="input input-bordered w-full"
                        placeholder="Ulica"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        required
                    />
                    <div className="flex gap-2">
                        <input
                            className="input input-bordered w-full"
                            placeholder="Nr domu"
                            value={buildingNumber}
                            onChange={e => setBuildingNumber(e.target.value)}
                            required
                        />
                        <input
                            className="input input-bordered w-full"
                            placeholder="Nr mieszkania (opcjonalnie)"
                            value={apartmentNumber}
                            onChange={e => setApartmentNumber(e.target.value)}
                        />
                    </div>
                    <input
                        className="input input-bordered w-full"
                        placeholder="Kod pocztowy"
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        required
                        disabled={!!city}
                    />
                </>
            )}
        </div>
    );
};

export default EntrepreneurForm;
