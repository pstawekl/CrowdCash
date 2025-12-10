import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import API from '../utils/api';

export interface Region {
    id: string;
    name: string;
    type: 'country' | 'state' | 'city';
    country_id?: string;
    state_id?: string;
}

interface RegionSearchBoxProps {
    filterType?: 'country' | 'state' | 'city';
    placeholder?: string;
    onSelect: (region: Region | null) => void;
    value?: Region | null;
}

const RegionSearchBox: React.FC<RegionSearchBoxProps> = ({
    filterType = 'city',
    placeholder = 'Wyszukaj...',
    onSelect,
    value,
}) => {
    const [searchQuery, setSearchQuery] = useState(value?.name || '');
    const [results, setResults] = useState<Region[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (value) {
            setSearchQuery(value.name);
        }
    }, [value]);

    const searchRegions = async (query: string) => {
        if (query.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setLoading(true);
        try {
            const res = await API.get('/regions/search', {
                params: { q: query, type: filterType },
            });
            setResults(Array.isArray(res.data) ? res.data : []);
            setShowResults(true);
        } catch (error) {
            console.error('Błąd wyszukiwania regionów:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        searchRegions(text);
    };

    const handleSelectRegion = (region: Region) => {
        setSearchQuery(region.name);
        setShowResults(false);
        onSelect(region);
    };

    const handleClear = () => {
        setSearchQuery('');
        setResults([]);
        setShowResults(false);
        onSelect(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    onFocus={() => {
                        if (searchQuery.length >= 2) {
                            setShowResults(true);
                        }
                    }}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                        <Text style={styles.clearText}>✕</Text>
                    </TouchableOpacity>
                )}
                {loading && (
                    <ActivityIndicator size="small" color="#4caf50" style={styles.loader} />
                )}
            </View>
            {showResults && results.length > 0 && (
                <View style={styles.resultsContainer}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleSelectRegion(item)}
                            >
                                <Text style={styles.resultText}>{item.name}</Text>
                                <Text style={styles.resultType}>{item.type}</Text>
                            </TouchableOpacity>
                        )}
                        style={styles.resultsList}
                        nestedScrollEnabled
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    clearText: {
        fontSize: 18,
        color: '#999',
    },
    loader: {
        marginLeft: 8,
    },
    resultsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginTop: 4,
        maxHeight: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 1000,
    },
    resultsList: {
        maxHeight: 200,
    },
    resultItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultText: {
        fontSize: 16,
        flex: 1,
    },
    resultType: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
        marginLeft: 8,
    },
});

export default RegionSearchBox;

