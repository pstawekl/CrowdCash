import React, { useEffect, useState } from 'react';
import API from '../utils/api';

interface Region {
    id: string;
    name: string;
    type: 'country' | 'state' | 'city';
}

interface RegionSearchBoxProps {
    onSelect: (region: Region | null) => void;
    placeholder?: string;
    filterType?: 'all' | 'country' | 'state' | 'city';
    countryId?: string;
    disabled?: boolean;
    value?: Region | null; // dodane wsparcie dla value
}

const RegionSearchBox: React.FC<RegionSearchBoxProps> = ({ onSelect, placeholder, filterType = 'all', countryId, disabled, value }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Region[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selected, setSelected] = useState<Region | null>(null);

    // Synchronizacja value z zewnątrz
    useEffect(() => {
        if (value) {
            setSelected(value);
            setQuery(value.name);
        } else {
            setSelected(null);
            setQuery('');
        }
    }, [value]);

    useEffect(() => {
        if (selected) return; // nie szukaj jeśli wybrano
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        setLoading(true);
        const params: Record<string, string> = { q: query };
        if (filterType !== 'all') params.type = filterType;
        if (countryId) params.country_id = countryId;
        API.get('/regions/search', { params })
            .then(res => {
                let data = res.data || [];
                if (filterType !== 'all') {
                    data = data.filter((r: Region) => r.type === filterType);
                }
                setResults(data);
                setShowDropdown(true);
                console.log("regions searchbox results", data);
            })
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, [query, selected, filterType, countryId]);

    const handleSelect = (region: Region) => {
        setQuery(region.name);
        setShowDropdown(false);
        setSelected(region);
        onSelect(region);
    };

    const handleClear = () => {
        setQuery('');
        setSelected(null);
        setShowDropdown(false);
        setResults([]);
        onSelect(null);
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 focus:bg-white pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={placeholder || 'Wyszukaj region, miasto...'}
                    value={selected ? selected.name : query}
                    onChange={e => {
                        setQuery(e.target.value);
                        onSelect(null);
                    }}
                    onFocus={() => query.length >= 2 && setShowDropdown(true)}
                    autoComplete="off"
                    disabled={!!selected || disabled}
                />
                {selected && (
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none bg-transparent p-0 rounded-full hover:bg-red-50 transition-colors"
                        onClick={handleClear}
                        aria-label="Wyczyść wybór"
                        tabIndex={0}
                    >
                        ×
                    </button>
                )}
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>
            {showDropdown && results.length > 0 && !selected && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {results.map(region => (
                        <li
                            key={region.id}
                            className="px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelect(region)}
                        >
                            <span className="font-medium text-gray-900">{region.name}</span>
                            <span className="text-xs text-gray-400 ml-2">({region.type})</span>
                        </li>
                    ))}
                </ul>
            )}
            {showDropdown && !loading && results.length === 0 && !selected && query.length >= 2 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 px-4 py-3 text-gray-500 text-sm">
                    Brak wyników
                </div>
            )}
        </div>
    );
};

export default RegionSearchBox;
