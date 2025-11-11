import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EstablishmentSuggestion } from '../types';
import { EstablishmentApiService } from '../services';

interface Props {
    onSelect: (suggestion: EstablishmentSuggestion) => void;
    placeholder?: string;
    initialValue?: string;
}

export default function EstablishmentSearchBar({ onSelect, placeholder, initialValue }: Props) {
    const [query, setQuery] = useState(initialValue || '');
    const [suggestions, setSuggestions] = useState<EstablishmentSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const searchEstablishments = async () => {
            if (query.trim().length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setLoading(true);
            try {
                const results = await EstablishmentApiService.searchEstablishments(query, 10);
                setSuggestions(results);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error searching establishments:', error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce la recherche
        const timeoutId = setTimeout(() => {
            searchEstablishments();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelectSuggestion = (suggestion: EstablishmentSuggestion) => {
        setQuery(EstablishmentApiService.formatSuggestion(suggestion));
        setShowSuggestions(false);
        onSelect(suggestion);
    };

    const getEstablishmentIcon = (type?: string): any => {
        if (!type) return 'school';
        
        const lower = type.toLowerCase();
        if (lower.includes('maternelle')) return 'baby-face';
        if (lower.includes('école') || lower.includes('ecole') || lower.includes('élémentaire')) return 'school';
        if (lower.includes('collège') || lower.includes('college')) return 'town-hall';
        if (lower.includes('lycée') || lower.includes('lycee')) return 'bank';
        
        return 'school';
    };

    const renderSuggestion = ({ item }: { item: EstablishmentSuggestion }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSelectSuggestion(item)}
            activeOpacity={0.7}
        >
            <View style={styles.suggestionIcon}>
                <MaterialCommunityIcons
                    name={getEstablishmentIcon(item.libelle_nature || item.type_etablissement)}
                    size={24}
                    color="#007AFF"
                />
            </View>
            <View style={styles.suggestionContent}>
                <Text style={styles.suggestionName}>{item.nom_etablissement}</Text>
                <View style={styles.suggestionDetails}>
                    {item.libelle_nature && (
                        <Text style={styles.suggestionType}>{item.libelle_nature}</Text>
                    )}
                    <Text style={styles.suggestionLocation}>
                        {[item.nom_commune, item.code_postal].filter(Boolean).join(' - ')}
                    </Text>
                </View>
                {item.adresse_1 && (
                    <Text style={styles.suggestionAddress} numberOfLines={1}>
                        📍 {item.adresse_1}
                    </Text>
                )}
                {item.telephone && (
                    <Text style={styles.suggestionPhone}>
                        📞 {item.telephone}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder={placeholder || "Rechercher un établissement..."}
                onChangeText={setQuery}
                value={query}
                style={styles.searchBar}
                iconColor="#007AFF"
                onFocus={() => {
                    if (suggestions.length > 0) {
                        setShowSuggestions(true);
                    }
                }}
                right={() => loading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                ) : null}
            />

            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item, index) => item.code_etablissement || `suggestion-${index}`}
                        renderItem={renderSuggestion}
                        style={styles.suggestionsList}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                    />
                </View>
            )}

            {showSuggestions && !loading && query.length >= 2 && suggestions.length === 0 && (
                <View style={styles.noResults}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#999" />
                    <Text style={styles.noResultsText}>Aucun établissement trouvé</Text>
                    <Text style={styles.noResultsHint}>
                        Essayez de rechercher avec le nom complet ou la ville
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        zIndex: 1000,
    },
    searchBar: {
        elevation: 2,
        backgroundColor: '#FFFFFF',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        maxHeight: 400,
        zIndex: 1001,
    },
    suggestionsList: {
        maxHeight: 400,
    },
    suggestionItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        alignItems: 'flex-start',
    },
    suggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F8FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    suggestionDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    suggestionType: {
        fontSize: 12,
        color: '#007AFF',
        backgroundColor: '#F0F8FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    suggestionLocation: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    suggestionAddress: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    suggestionPhone: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    noResults: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginTop: 8,
        elevation: 2,
    },
    noResultsText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        fontWeight: '600',
    },
    noResultsHint: {
        fontSize: 13,
        color: '#999',
        marginTop: 4,
        textAlign: 'center',
    },
});
