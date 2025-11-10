import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Sequence } from '../types';
import { sequenceService } from '../services';
import { SPACING } from '../utils';
import SequenceFormDialog from '../components/SequenceFormDialog';
import SpeedDialFAB from '../components/SpeedDialFAB';

type SequencePlanningScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SequencePlanning'
>;
type SequencePlanningScreenRouteProp = RouteProp<RootStackParamList, 'SequencePlanning'>;

interface Props {
    navigation: SequencePlanningScreenNavigationProp;
    route: SequencePlanningScreenRouteProp;
}

export default function SequencePlanningScreen({ navigation, route }: Props) {
    const { classId, className, classColor } = route.params;
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [statistics, setStatistics] = useState({
        totalSequences: 0,
        totalSessions: 0,
        assignedSessions: 0,
        unassignedSessions: 0,
        completionPercentage: 0,
    });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingSequence, setEditingSequence] = useState<Sequence | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({
            title: `📚 Séquences - ${className}`,
            headerStyle: { backgroundColor: classColor },
            headerTintColor: '#fff',
        });
        loadData();
    }, [classId, className, classColor]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [seqs, stats] = await Promise.all([
                sequenceService.getByClass(classId),
                sequenceService.getClassStatistics(classId),
            ]);
            setSequences(seqs);
            setStatistics(stats);
        } catch (error) {
            console.error('Error loading sequences:', error);
            Alert.alert('Erreur', 'Impossible de charger les séquences');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSequence = async (data: any) => {
        try {
            await sequenceService.create(data);
            setDialogVisible(false);
            loadData();
            Alert.alert('Succès', 'Séquence créée avec succès');
        } catch (error) {
            console.error('Error creating sequence:', error);
            Alert.alert('Erreur', 'Impossible de créer la séquence');
        }
    };

    const handleEditSequence = async (data: any) => {
        if (!editingSequence) return;

        try {
            await sequenceService.update(editingSequence.id, data);
            setDialogVisible(false);
            setEditingSequence(undefined);
            loadData();
            Alert.alert('Succès', 'Séquence modifiée avec succès');
        } catch (error) {
            console.error('Error updating sequence:', error);
            Alert.alert('Erreur', 'Impossible de modifier la séquence');
        }
    };

    const handleDeleteSequence = (sequence: Sequence) => {
        Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer la séquence "${sequence.name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await sequenceService.delete(sequence.id);
                            loadData();
                            Alert.alert('Succès', 'Séquence supprimée');
                        } catch (error) {
                            console.error('Error deleting sequence:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer la séquence');
                        }
                    },
                },
            ]
        );
    };

    const handleAssignSequence = (sequence: Sequence) => {
        navigation.navigate('SequenceAssignment', {
            sequenceId: sequence.id,
            sequenceName: sequence.name,
            sessionCount: sequence.sessionCount,
            classId,
            className,
            classColor,
        });
    };

    const handleAutoAssign = () => {
        Alert.alert(
            'Auto-assignation',
            'Voulez-vous assigner automatiquement toutes les séquences aux séances disponibles ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: async () => {
                        try {
                            await sequenceService.autoAssignSequences(classId);
                            loadData();
                            Alert.alert('Succès', 'Les séquences ont été assignées automatiquement');
                        } catch (error) {
                            console.error('Error auto-assigning:', error);
                            Alert.alert('Erreur', "Impossible d'assigner les séquences");
                        }
                    },
                },
            ]
        );
    };

    const openEditDialog = (sequence: Sequence) => {
        setEditingSequence(sequence);
        setDialogVisible(true);
    };

    const openCreateDialog = () => {
        setEditingSequence(undefined);
        setDialogVisible(true);
    };

    const closeDialog = () => {
        setDialogVisible(false);
        setEditingSequence(undefined);
    };

    const getSequenceProgress = (sequence: Sequence): { assigned: number; percentage: number } => {
        // Cette fonction sera améliorée pour récupérer le nombre réel de séances assignées
        return {
            assigned: 0,
            percentage: 0,
        };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return '✅';
            case 'in-progress':
                return '⏳';
            case 'planned':
            default:
                return '📝';
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Statistiques */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>📊 Vue d'ensemble</Text>

                    <View style={styles.progressContainer}>
                        <Text style={styles.progressLabel}>
                            Progression globale : {statistics.completionPercentage}%
                        </Text>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        backgroundColor: classColor,
                                        width: `${statistics.completionPercentage}%`,
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.totalSessions}</Text>
                            <Text style={styles.statLabel}>Séances générées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.totalSequences}</Text>
                            <Text style={styles.statLabel}>Séquences créées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.assignedSessions}</Text>
                            <Text style={styles.statLabel}>Séances assignées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.unassignedSessions}</Text>
                            <Text style={styles.statLabel}>Séances libres</Text>
                        </View>
                    </View>
                </View>

                {/* Actions rapides */}
                {sequences.length > 0 && statistics.unassignedSessions > 0 && (
                    <TouchableOpacity onPress={handleAutoAssign} style={styles.autoAssignButton}>
                        <MaterialCommunityIcons name="flash" size={20} color="#fff" />
                        <Text style={styles.autoAssignText}>Auto-assigner toutes les séquences</Text>
                    </TouchableOpacity>
                )}

                {/* Liste des séquences */}
                <View style={styles.sequencesHeader}>
                    <Text style={styles.sectionTitle}>📚 Séquences du Programme</Text>
                </View>

                {sequences.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>
                            Aucune séquence créée pour le moment.
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Créez votre première séquence pédagogique !
                        </Text>
                    </View>
                ) : (
                    sequences.map((sequence, index) => (
                        <View key={sequence.id} style={styles.sequenceCard}>
                            <View style={styles.sequenceHeader}>
                                <View style={styles.sequenceHeaderLeft}>
                                    <View
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: sequence.color },
                                        ]}
                                    />
                                    <View style={styles.sequenceHeaderText}>
                                        <Text style={styles.sequenceName}>
                                            {getStatusIcon(sequence.status)} Séquence {index + 1}
                                        </Text>
                                        <Text style={styles.sequenceTitle}>{sequence.name}</Text>
                                    </View>
                                </View>
                                <View style={styles.sequenceActions}>
                                    <TouchableOpacity
                                        onPress={() => openEditDialog(sequence)}
                                        style={styles.iconButton}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={20} color="#666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteSequence(sequence)}
                                        style={styles.iconButton}
                                    >
                                        <MaterialCommunityIcons name="delete" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {sequence.theme && (
                                <Text style={styles.sequenceTheme}>📖 {sequence.theme}</Text>
                            )}

                            {sequence.description && (
                                <Text style={styles.sequenceDescription}>
                                    {sequence.description}
                                </Text>
                            )}

                            <View style={styles.sequenceStats}>
                                <Text style={styles.sequenceStatText}>
                                    {sequence.sessionCount} séances • {getStatusLabel(sequence.status)}
                                </Text>
                            </View>

                            {sequence.objectives && sequence.objectives.length > 0 && (
                                <View style={styles.objectivesContainer}>
                                    <Text style={styles.objectivesTitle}>Objectifs :</Text>
                                    {sequence.objectives.slice(0, 2).map((obj, idx) => (
                                        <Text key={idx} style={styles.objectiveText}>
                                            • {obj}
                                        </Text>
                                    ))}
                                    {sequence.objectives.length > 2 && (
                                        <Text style={styles.objectiveMore}>
                                            +{sequence.objectives.length - 2} autre(s)
                                        </Text>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.assignButton, { backgroundColor: sequence.color }]}
                                onPress={() => handleAssignSequence(sequence)}
                            >
                                <MaterialCommunityIcons name="calendar-check" size={18} color="#fff" />
                                <Text style={styles.assignButtonText}>
                                    Assigner aux séances
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            <SpeedDialFAB
                actions={[
                    {
                        icon: 'plus',
                        label: 'Créer une séquence',
                        onPress: openCreateDialog,
                    },
                ]}
            />

            <SequenceFormDialog
                visible={dialogVisible}
                onDismiss={closeDialog}
                onSubmit={editingSequence ? handleEditSequence : handleCreateSequence}
                classId={classId}
                initialData={editingSequence}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        padding: SPACING.md,
    },
    statsCard: {
        marginBottom: SPACING.md,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: SPACING.md,
    },
    progressContainer: {
        marginBottom: SPACING.md,
    },
    progressLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    statItem: {
        flex: 1,
        minWidth: '45%',
        padding: SPACING.sm,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    autoAssignButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    autoAssignText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: SPACING.xs,
    },
    sequencesHeader: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    sequenceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sequenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    sequenceHeaderLeft: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'flex-start',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 6,
        marginRight: SPACING.sm,
    },
    sequenceHeaderText: {
        flex: 1,
    },
    sequenceName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    sequenceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sequenceActions: {
        flexDirection: 'row',
        marginLeft: SPACING.sm,
    },
    iconButton: {
        padding: 8,
    },
    sequenceTheme: {
        fontSize: 14,
        color: '#666',
        marginBottom: SPACING.xs,
    },
    sequenceDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: SPACING.sm,
        lineHeight: 20,
    },
    sequenceStats: {
        marginBottom: SPACING.sm,
    },
    sequenceStatText: {
        fontSize: 14,
        color: '#999',
    },
    objectivesContainer: {
        backgroundColor: '#f9f9f9',
        padding: SPACING.sm,
        borderRadius: 8,
        marginBottom: SPACING.sm,
    },
    objectivesTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: SPACING.xs,
    },
    objectiveText: {
        fontSize: 12,
        color: '#666',
        marginLeft: SPACING.xs,
        lineHeight: 18,
    },
    objectiveMore: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginLeft: SPACING.xs,
        marginTop: SPACING.xs,
    },
    assignButton: {
        flexDirection: 'row',
        padding: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xs,
    },
    assignButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: SPACING.xs,
    },
    fab: {
        position: 'absolute',
        right: SPACING.md,
        bottom: SPACING.md,
    },
});
