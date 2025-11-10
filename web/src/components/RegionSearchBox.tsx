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
        <div className="relative w-full max-w-md">
            <div className="relative">
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 pr-8"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 min-w-0 flex items-center justify-center text-gray-400 hover:text-red-500 text-lg font-bold focus:outline-none bg-transparent p-0"
                        onClick={handleClear}
                        aria-label="Wyczyść wybór"
                        tabIndex={0}
                    >
                        ×
                    </button>
                )}
                {loading && <div className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            {showDropdown && results.length > 0 && !selected && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow mt-1 max-h-60 overflow-y-auto">
                    {results.map(region => (
                        <li
                            key={region.id}
                            className="px-4 py-2 hover:bg-green-100 cursor-pointer"
                            onClick={() => handleSelect(region)}
                        >
                            {region.name} <span className="text-xs text-gray-400">({region.type})</span>
                        </li>
                    ))}
                </ul>
            )}
            {showDropdown && !loading && results.length === 0 && !selected && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow mt-1 px-4 py-2 text-gray-500 text-sm">Brak wyników</div>
            )}
        </div>
    );
};

export default RegionSearchBox;
