import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, FAB, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Establishment, EstablishmentSuggestion } from '../types';
import { establishmentService } from '../services';
import EstablishmentSearchBar from '../components/EstablishmentSearchBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EstablishmentManagementScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [establishments, setEstablishments] = useState<Establishment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState<EstablishmentSuggestion | null>(null);

    // Form state pour ajout/modification manuelle
    const [formData, setFormData] = useState<{
        name: string;
        address: string;
        city: string;
        postalCode: string;
        phone: string;
        email: string;
        type: 'ecole' | 'college' | 'lycee' | 'lycee_professionnel' | 'autre';
    }>({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        email: '',
        type: 'autre',
    });

    useEffect(() => {
        loadEstablishments();
    }, []);

    const loadEstablishments = async () => {
        try {
            setLoading(true);
            const data = await establishmentService.getAll();
            setEstablishments(data);
        } catch (error) {
            console.error('Error loading establishments:', error);
            Alert.alert('Erreur', 'Impossible de charger les établissements');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (establishment?: Establishment) => {
        if (establishment) {
            setEditingEstablishment(establishment);
            setFormData({
                name: establishment.name,
                address: establishment.address || '',
                city: establishment.city || '',
                postalCode: establishment.postalCode || '',
                phone: establishment.phone || '',
                email: establishment.email || '',
                type: establishment.type || 'autre',
            });
        } else {
            setEditingEstablishment(null);
            setSelectedSuggestion(null);
            setFormData({
                name: '',
                address: '',
                city: '',
                postalCode: '',
                phone: '',
                email: '',
                type: 'autre',
            });
        }
        setShowDialog(true);
    };

    const handleSelectSuggestion = (suggestion: EstablishmentSuggestion) => {
        setSelectedSuggestion(suggestion);
        setFormData({
            name: suggestion.nom_etablissement,
            address: suggestion.adresse_1 || '',
            city: suggestion.nom_commune || '',
            postalCode: suggestion.code_postal || '',
            phone: suggestion.telephone || '',
            email: suggestion.mail || '',
            type: getTypeFromLibelle(suggestion.libelle_nature || suggestion.type_etablissement),
        });
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erreur', 'Le nom de l\'établissement est requis');
            return;
        }

        try {
            if (editingEstablishment) {
                await establishmentService.update(editingEstablishment.id, formData);
                Alert.alert('Succès', 'Établissement modifié');
            } else {
                await establishmentService.create({
                    ...formData,
                    uai: selectedSuggestion?.code_etablissement,
                });
                Alert.alert('Succès', 'Établissement ajouté');
            }
            setShowDialog(false);
            loadEstablishments();
        } catch (error: any) {
            console.error('Error saving establishment:', error);
            if (error.message?.includes('UNIQUE constraint')) {
                Alert.alert('Erreur', 'Cet établissement (UAI) existe déjà');
            } else {
                Alert.alert('Erreur', 'Impossible de sauvegarder l\'établissement');
            }
        }
    };

    const handleDelete = (establishment: Establishment) => {
        Alert.alert(
            'Supprimer l\'établissement',
            `Êtes-vous sûr de vouloir supprimer "${establishment.name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await establishmentService.delete(establishment.id);
                            Alert.alert('Succès', 'Établissement supprimé');
                            loadEstablishments();
                        } catch (error) {
                            console.error('Error deleting establishment:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer l\'établissement');
                        }
                    },
                },
            ]
        );
    };

    const getTypeFromLibelle = (libelle?: string): 'ecole' | 'college' | 'lycee' | 'lycee_professionnel' | 'autre' => {
        if (!libelle) return 'autre';
        const lower = libelle.toLowerCase();
        if (lower.includes('école') || lower.includes('ecole') || lower.includes('maternelle')) return 'ecole';
        if (lower.includes('collège') || lower.includes('college')) return 'college';
        if (lower.includes('lycée professionnel') || lower.includes('lp')) return 'lycee_professionnel';
        if (lower.includes('lycée') || lower.includes('lycee')) return 'lycee';
        return 'autre';
    };

    const getTypeLabel = (type?: string): string => {
        switch (type) {
            case 'ecole': return 'École';
            case 'college': return 'Collège';
            case 'lycee': return 'Lycée';
            case 'lycee_professionnel': return 'Lycée Professionnel';
            default: return 'Autre';
        }
    };

    const getTypeIcon = (type?: string): any => {
        switch (type) {
            case 'ecole': return 'school';
            case 'college': return 'town-hall';
            case 'lycee': return 'bank';
            case 'lycee_professionnel': return 'tools';
            default: return 'domain';
        }
    };

    const getTypeColor = (type?: string): string => {
        switch (type) {
            case 'ecole': return '#4CAF50';
            case 'college': return '#2196F3';
            case 'lycee': return '#9C27B0';
            case 'lycee_professionnel': return '#FF9800';
            default: return '#757575';
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Établissements</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <Text>Chargement...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Établissements</Text>
                    <Text style={styles.headerSubtitle}>
                        {establishments.length} établissement{establishments.length > 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView}>
                {establishments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="domain" size={80} color="#E0E0E0" />
                        <Text style={styles.emptyTitle}>Aucun établissement</Text>
                        <Text style={styles.emptySubtitle}>
                            Ajoutez votre premier établissement en recherchant dans l'annuaire
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {establishments.map((establishment) => (
                            <TouchableOpacity
                                key={establishment.id}
                                style={styles.card}
                                onPress={() => handleOpenDialog(establishment)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: `${getTypeColor(establishment.type)}20` }]}>
                                    <MaterialCommunityIcons
                                        name={getTypeIcon(establishment.type)}
                                        size={32}
                                        color={getTypeColor(establishment.type)}
                                    />
                                </View>

                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{establishment.name}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleDelete(establishment)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <MaterialCommunityIcons name="delete-outline" size={24} color="#F44336" />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.typeLabel}>{getTypeLabel(establishment.type)}</Text>

                                    {establishment.address && (
                                        <Text style={styles.infoText}>📍 {establishment.address}</Text>
                                    )}
                                    {establishment.city && establishment.postalCode && (
                                        <Text style={styles.infoText}>
                                            {establishment.city} {establishment.postalCode}
                                        </Text>
                                    )}
                                    {establishment.phone && (
                                        <Text style={styles.infoText}>📞 {establishment.phone}</Text>
                                    )}
                                    {establishment.uai && (
                                        <Text style={styles.uaiText}>UAI: {establishment.uai}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => handleOpenDialog()}
            />

            {/* Dialog Ajout/Modification */}
            <Portal>
                <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)} style={styles.dialog}>
                    <Dialog.Title>
                        {editingEstablishment ? 'Modifier l\'établissement' : 'Nouvel établissement'}
                    </Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView>
                            {!editingEstablishment && (
                                <View style={styles.searchSection}>
                                    <Text style={styles.sectionTitle}>Rechercher dans l'annuaire</Text>
                                    <EstablishmentSearchBar
                                        onSelect={handleSelectSuggestion}
                                        placeholder="Lycée Amblard Valence..."
                                    />
                                    <Text style={styles.orText}>ou saisir manuellement</Text>
                                </View>
                            )}

                            <TextInput
                                label="Nom de l'établissement *"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                style={styles.input}
                                mode="outlined"
                            />

                            <TextInput
                                label="Adresse"
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                                style={styles.input}
                                mode="outlined"
                            />

                            <View style={styles.row}>
                                <TextInput
                                    label="Ville"
                                    value={formData.city}
                                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                                    style={[styles.input, styles.halfInput]}
                                    mode="outlined"
                                />
                                <TextInput
                                    label="Code postal"
                                    value={formData.postalCode}
                                    onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                                    style={[styles.input, styles.halfInput]}
                                    mode="outlined"
                                    keyboardType="numeric"
                                />
                            </View>

                            <TextInput
                                label="Téléphone"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                style={styles.input}
                                mode="outlined"
                                keyboardType="phone-pad"
                            />

                            <TextInput
                                label="Email"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                style={styles.input}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setShowDialog(false)}>Annuler</Button>
                        <Button onPress={handleSubmit}>
                            {editingEstablishment ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginRight: 15,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    list: {
        padding: 16,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    typeLabel: {
        fontSize: 12,
        color: '#007AFF',
        backgroundColor: '#F0F8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    uaiText: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#007AFF',
    },
    dialog: {
        maxHeight: '80%',
    },
    searchSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    orText: {
        textAlign: 'center',
        color: '#999',
        marginVertical: 16,
        fontSize: 14,
    },
    input: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
});
