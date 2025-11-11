import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Sequence, Session, Class } from '../types';
import { sequenceService, sessionService, classService } from '../services';
import { SPACING } from '../utils';
import SequenceFormDialog from '../components/SequenceFormDialog';

type SequenceDetailScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SequenceDetail'
>;
type SequenceDetailScreenRouteProp = RouteProp<RootStackParamList, 'SequenceDetail'>;

interface Props {
    navigation: SequenceDetailScreenNavigationProp;
    route: SequenceDetailScreenRouteProp;
}

export default function SequenceDetailScreen({ navigation, route }: Props) {
    const { sequenceId } = route.params;
    const [sequence, setSequence] = useState<Sequence | null>(null);
    const [classData, setClassData] = useState<Class | null>(null);
    const [assignedSessions, setAssignedSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, [sequenceId]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    const loadData = async () => {
        try {
            setLoading(true);
            const seq = await sequenceService.getById(sequenceId);
            if (!seq) {
                Alert.alert('Erreur', 'Séquence introuvable');
                navigation.goBack();
                return;
            }
            setSequence(seq);

            const cls = await classService.getById(seq.classId);
            setClassData(cls);

            const sessions = await sequenceService.getSessionsBySequence(sequenceId);
            // Trier par date
            sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setAssignedSessions(sessions);
        } catch (error) {
            console.error('Error loading sequence detail:', error);
            Alert.alert('Erreur', 'Impossible de charger les détails de la séquence');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (data: any) => {
        if (!sequence) return;
        try {
            await sequenceService.update(sequence.id, data);
            setDialogVisible(false);
            loadData();
            Alert.alert('Succès', 'Séquence modifiée avec succès');
        } catch (error) {
            console.error('Error updating sequence:', error);
            Alert.alert('Erreur', 'Impossible de modifier la séquence');
        }
    };

    const handleDelete = () => {
        if (!sequence) return;
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
                            Alert.alert('Succès', 'Séquence supprimée');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting sequence:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer la séquence');
                        }
                    },
                },
            ]
        );
    };

    const handleAssignSessions = () => {
        if (!sequence || !classData) return;
        navigation.navigate('SequenceAssignment', {
            sequenceId: sequence.id,
            sequenceName: sequence.name,
            sessionCount: sequence.sessionCount,
            classId: sequence.classId,
            className: classData.name,
            classColor: classData.color,
        });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed':
                return { icon: 'check-circle' as const, label: 'Terminée', color: '#4CAF50' };
            case 'in-progress':
                return { icon: 'progress-clock' as const, label: 'En cours', color: '#2196F3' };
            case 'planned':
            default:
                return { icon: 'calendar-clock' as const, label: 'Planifiée', color: '#FF9800' };
        }
    };

    if (loading || !sequence || !classData) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={[styles.header, { backgroundColor: classData?.color || '#007AFF' }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chargement...</Text>
                </View>
            </View>
        );
    }

    const statusInfo = getStatusInfo(sequence.status);
    const progress = sequence.sessionCount > 0 ? (assignedSessions.length / sequence.sessionCount) : 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: sequence.color }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{sequence.name}</Text>
                    <Text style={styles.headerSubtitle}>Séquence {sequence.order}</Text>
                </View>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setDialogVisible(true)}
                >
                    <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                >
                    <MaterialCommunityIcons name="delete" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Classe et statut */}
                <View style={styles.section}>
                    <View style={styles.classCard}>
                        <View style={[styles.classColorDot, { backgroundColor: classData.color }]} />
                        <Text style={styles.className}>{classData.name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        <MaterialCommunityIcons name={statusInfo.icon} size={16} color="#fff" />
                        <Text style={styles.statusText}>{statusInfo.label}</Text>
                    </View>
                </View>

                {/* Thème */}
                {sequence.theme && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="book-open-variant" size={20} color="#666" />
                            <Text style={styles.sectionTitle}>Thème</Text>
                        </View>
                        <Text style={styles.themeText}>{sequence.theme}</Text>
                    </View>
                )}

                {/* Description */}
                {sequence.description && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="text" size={20} color="#666" />
                            <Text style={styles.sectionTitle}>Description</Text>
                        </View>
                        <Text style={styles.descriptionText}>{sequence.description}</Text>
                    </View>
                )}

                {/* Objectifs */}
                {sequence.objectives && sequence.objectives.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="target" size={20} color="#666" />
                            <Text style={styles.sectionTitle}>Objectifs pédagogiques</Text>
                        </View>
                        {sequence.objectives.map((objective, index) => (
                            <View key={index} style={styles.objectiveItem}>
                                <MaterialCommunityIcons name="check" size={16} color={sequence.color} />
                                <Text style={styles.objectiveText}>{objective}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Progression */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="chart-line" size={20} color="#666" />
                        <Text style={styles.sectionTitle}>Progression</Text>
                    </View>
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>
                                {assignedSessions.length} / {sequence.sessionCount} séances assignées
                            </Text>
                            <Text style={styles.progressPercentage}>
                                {Math.round(progress * 100)}%
                            </Text>
                        </View>
                        <ProgressBar
                            progress={progress}
                            color={sequence.color}
                            style={styles.progressBar}
                        />
                    </View>
                </View>

                {/* Séances assignées */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="calendar-check" size={20} color="#666" />
                        <Text style={styles.sectionTitle}>
                            Séances ({assignedSessions.length})
                        </Text>
                    </View>

                    {assignedSessions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>Aucune séance assignée</Text>
                            <TouchableOpacity
                                style={[styles.assignButton, { backgroundColor: sequence.color }]}
                                onPress={handleAssignSessions}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                                <Text style={styles.assignButtonText}>Assigner des séances</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {assignedSessions.map((session, index) => {
                                const sessionDate = new Date(session.date);
                                return (
                                    <TouchableOpacity
                                        key={session.id}
                                        style={[styles.sessionCard, { borderLeftColor: sequence.color }]}
                                        onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                                    >
                                        <View style={styles.sessionNumber}>
                                            <Text style={[styles.sessionNumberText, { color: sequence.color }]}>
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <View style={styles.sessionContent}>
                                            <Text style={styles.sessionSubject}>{session.subject}</Text>
                                            <View style={styles.sessionMeta}>
                                                <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                                                <Text style={styles.sessionDate}>
                                                    {sessionDate.toLocaleDateString('fr-FR', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </Text>
                                                <MaterialCommunityIcons name="clock-outline" size={14} color="#666" style={{ marginLeft: 12 }} />
                                                <Text style={styles.sessionDuration}>{session.duration} min</Text>
                                            </View>
                                            {session.description && (
                                                <Text style={styles.sessionDescription} numberOfLines={2}>
                                                    {session.description}
                                                </Text>
                                            )}
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity
                                style={[styles.assignButton, { backgroundColor: sequence.color }]}
                                onPress={handleAssignSessions}
                            >
                                <MaterialCommunityIcons name="calendar-edit" size={20} color="#fff" />
                                <Text style={styles.assignButtonText}>Modifier les assignations</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Dialog d'édition */}
            <SequenceFormDialog
                visible={dialogVisible}
                onDismiss={() => setDialogVisible(false)}
                onSubmit={handleEdit}
                classId={sequence.classId}
                initialData={sequence}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    classCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 8,
        marginBottom: SPACING.sm,
        gap: 8,
    },
    classColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    className: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    themeText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    descriptionText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    objectiveItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.xs,
        gap: 8,
    },
    objectiveText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    progressCard: {
        backgroundColor: '#F5F5F5',
        padding: SPACING.sm,
        borderRadius: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    progressLabel: {
        fontSize: 14,
        color: '#666',
    },
    progressPercentage: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    emptyText: {
        fontSize: 15,
        color: '#999',
        marginTop: SPACING.sm,
        marginBottom: SPACING.md,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: SPACING.sm,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        marginBottom: SPACING.xs,
        borderLeftWidth: 4,
    },
    sessionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    sessionNumberText: {
        fontSize: 14,
        fontWeight: '700',
    },
    sessionContent: {
        flex: 1,
    },
    sessionSubject: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    sessionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sessionDate: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    sessionDuration: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    sessionDescription: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        marginTop: SPACING.sm,
        gap: 8,
    },
    assignButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
