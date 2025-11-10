import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Sequence, Class } from '../types';
import { sequenceService, classService } from '../services';
import { SPACING } from '../utils';

type SequencesIndexScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SequencesIndex'
>;
type SequencesIndexScreenRouteProp = RouteProp<RootStackParamList, 'SequencesIndex'>;

interface Props {
    navigation: SequencesIndexScreenNavigationProp;
    route: SequencesIndexScreenRouteProp;
}

interface SequenceWithClass extends Sequence {
    class?: Class;
}

export default function SequencesIndexScreen({ navigation, route }: Props) {
    const [sequences, setSequences] = useState<SequenceWithClass[]>([]);
    const [allClasses, setAllClasses] = useState<Class[]>([]);
    const [filteredSequences, setFilteredSequences] = useState<SequenceWithClass[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        filterSequences();
    }, [sequences, searchQuery, selectedClassId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const classes = await classService.getAll();
            setAllClasses(classes);

            // Charger toutes les séquences de toutes les classes
            const allSequences: SequenceWithClass[] = [];
            for (const cls of classes) {
                const classSequences = await sequenceService.getByClass(cls.id);
                const sequencesWithClass = classSequences.map(seq => ({
                    ...seq,
                    class: cls,
                }));
                allSequences.push(...sequencesWithClass);
            }

            // Trier par classe puis par ordre
            allSequences.sort((a, b) => {
                if (a.class?.name !== b.class?.name) {
                    return (a.class?.name || '').localeCompare(b.class?.name || '');
                }
                return a.order - b.order;
            });

            setSequences(allSequences);
        } catch (error) {
            console.error('Error loading sequences:', error);
            Alert.alert('Erreur', 'Impossible de charger les séquences');
        } finally {
            setLoading(false);
        }
    };

    const filterSequences = () => {
        let filtered = sequences;

        // Filtre par classe
        if (selectedClassId) {
            filtered = filtered.filter(seq => seq.classId === selectedClassId);
        }

        // Filtre par recherche
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(seq =>
                seq.name.toLowerCase().includes(query) ||
                seq.theme?.toLowerCase().includes(query) ||
                seq.description?.toLowerCase().includes(query)
            );
        }

        setFilteredSequences(filtered);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return 'check-circle';
            case 'in-progress':
                return 'progress-clock';
            case 'planned':
            default:
                return 'calendar-clock';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Terminée';
            case 'in-progress':
                return 'En cours';
            case 'planned':
            default:
                return 'Planifiée';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#4CAF50';
            case 'in-progress':
                return '#2196F3';
            case 'planned':
            default:
                return '#FF9800';
        }
    };

    const handleSequencePress = (sequence: SequenceWithClass) => {
        // Navigation vers le détail de la séquence
        navigation.navigate('SequenceDetail', {
            sequenceId: sequence.id,
        });
    };

    const handleViewModeChange = (mode: 'list' | 'calendar') => {
        if (mode === 'calendar' && allClasses.length > 0) {
            // Naviguer vers l'écran SequencePlanning en mode timeline
            navigation.navigate('SequencePlanning', {
                classId: allClasses[0].id,
                className: 'Toutes les classes',
                classColor: '#007AFF',
            });
        } else {
            setViewMode(mode);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Séquences Pédagogiques</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text>Chargement...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Séquences Pédagogiques</Text>
                        <Text style={styles.headerSubtitle}>
                            {filteredSequences.length} séquence{filteredSequences.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>

                {/* Onglets de navigation */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, viewMode === 'list' && styles.tabActive]}
                        onPress={() => handleViewModeChange('list')}
                    >
                        <MaterialCommunityIcons
                            name="format-list-bulleted"
                            size={20}
                            color={viewMode === 'list' ? '#007AFF' : 'rgba(255, 255, 255, 0.9)'}
                        />
                        <Text style={[styles.tabText, viewMode === 'list' && styles.tabTextActive]}>
                            Liste
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, viewMode === 'calendar' && styles.tabActive]}
                        onPress={() => handleViewModeChange('calendar')}
                    >
                        <MaterialCommunityIcons
                            name="calendar-month"
                            size={20}
                            color={viewMode === 'calendar' ? '#007AFF' : 'rgba(255, 255, 255, 0.9)'}
                        />
                        <Text style={[styles.tabText, viewMode === 'calendar' && styles.tabTextActive]}>
                            Calendrier
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Rechercher une séquence..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    iconColor="#007AFF"
                />
            </View>

            {/* Filtres par classe */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Chip
                        selected={selectedClassId === null}
                        onPress={() => setSelectedClassId(null)}
                        style={[
                            styles.filterChip,
                            selectedClassId === null && styles.filterChipSelected
                        ]}
                        textStyle={styles.filterChipText}
                    >
                        Toutes
                    </Chip>
                    {allClasses.map(cls => (
                        <Chip
                            key={cls.id}
                            selected={selectedClassId === cls.id}
                            onPress={() => setSelectedClassId(cls.id)}
                            style={[
                                styles.filterChip,
                                selectedClassId === cls.id && { backgroundColor: cls.color }
                            ]}
                            textStyle={[
                                styles.filterChipText,
                                selectedClassId === cls.id && { color: '#FFFFFF' }
                            ]}
                            icon={() => (
                                <View style={[styles.chipDot, { backgroundColor: cls.color }]} />
                            )}
                        >
                            {cls.name}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {/* Liste des séquences */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {filteredSequences.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons
                            name="book-open-page-variant"
                            size={64}
                            color="#CCC"
                        />
                        <Text style={styles.emptyText}>
                            {searchQuery || selectedClassId
                                ? 'Aucune séquence trouvée'
                                : 'Aucune séquence créée'
                            }
                        </Text>
                        {!searchQuery && !selectedClassId && (
                            <Text style={styles.emptySubtext}>
                                Créez des séquences depuis le détail d'une classe
                            </Text>
                        )}
                    </View>
                ) : (
                    filteredSequences.map((sequence, index) => (
                        <TouchableOpacity
                            key={sequence.id}
                            style={styles.sequenceCard}
                            onPress={() => handleSequencePress(sequence)}
                            activeOpacity={0.7}
                        >
                            {/* Header avec classe */}
                            <View style={styles.sequenceHeader}>
                                <View style={styles.classTag}>
                                    <View style={[styles.classColorDot, { backgroundColor: sequence.class?.color }]} />
                                    <Text style={styles.className}>{sequence.class?.name}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sequence.status) }]}>
                                    <MaterialCommunityIcons
                                        name={getStatusIcon(sequence.status)}
                                        size={14}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.statusText}>
                                        {getStatusLabel(sequence.status)}
                                    </Text>
                                </View>
                            </View>

                            {/* Titre et infos */}
                            <View style={styles.sequenceContent}>
                                <View style={styles.sequenceTitleRow}>
                                    <View style={[styles.sequenceColorDot, { backgroundColor: sequence.color }]} />
                                    <Text style={styles.sequenceTitle}>{sequence.name}</Text>
                                </View>

                                {sequence.theme && (
                                    <View style={styles.sequenceThemeContainer}>
                                        <MaterialCommunityIcons name="book-open-variant" size={14} color="#666" />
                                        <Text style={styles.sequenceTheme}>{sequence.theme}</Text>
                                    </View>
                                )}

                                {sequence.description && (
                                    <Text style={styles.sequenceDescription} numberOfLines={2}>
                                        {sequence.description}
                                    </Text>
                                )}

                                <View style={styles.sequenceFooter}>
                                    <View style={styles.sequenceInfo}>
                                        <MaterialCommunityIcons name="calendar-multiple" size={16} color="#999" />
                                        <Text style={styles.sequenceInfoText}>
                                            {sequence.sessionCount} séance{sequence.sessionCount !== 1 ? 's' : ''}
                                        </Text>
                                    </View>

                                    {sequence.objectives && sequence.objectives.length > 0 && (
                                        <View style={styles.sequenceInfo}>
                                            <MaterialCommunityIcons name="target" size={16} color="#999" />
                                            <Text style={styles.sequenceInfoText}>
                                                {sequence.objectives.length} objectif{sequence.objectives.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#007AFF',
        paddingTop: 60,
        paddingBottom: 0,
        borderBottomWidth: 0,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 21,
        gap: 6,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    tabTextActive: {
        color: '#007AFF',
    },
    searchContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchBar: {
        elevation: 0,
        backgroundColor: '#F5F5F5',
    },
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    filterChip: {
        marginRight: SPACING.xs,
    },
    filterChipSelected: {
        backgroundColor: '#007AFF',
    },
    filterChipText: {
        fontSize: 13,
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    sequenceCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.xs,
        borderRadius: 12,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sequenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    classTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    classColorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    className: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    sequenceContent: {
        gap: SPACING.xs,
    },
    sequenceTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sequenceColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    sequenceTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    sequenceThemeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sequenceTheme: {
        fontSize: 14,
        color: '#666',
    },
    sequenceDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    sequenceFooter: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.xs,
    },
    sequenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sequenceInfoText: {
        fontSize: 13,
        color: '#999',
    },
});
