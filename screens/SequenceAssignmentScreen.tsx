import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Session, Sequence } from '../types';
import { sessionService, sequenceService } from '../services';
import { SPACING } from '../utils';
import { formatDate, formatTime } from '../utils/formatters';

type SequenceAssignmentScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SequenceAssignment'
>;
type SequenceAssignmentScreenRouteProp = RouteProp<RootStackParamList, 'SequenceAssignment'>;

interface Props {
    navigation: SequenceAssignmentScreenNavigationProp;
    route: SequenceAssignmentScreenRouteProp;
}

export default function SequenceAssignmentScreen({ navigation, route }: Props) {
    const { sequenceId, sequenceName, sessionCount, classId, className, classColor } = route.params;
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [assignedSessionIds, setAssignedSessionIds] = useState<string[]>([]);
    const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
    const [sessionSequences, setSessionSequences] = useState<Map<string, Sequence>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [sequenceId, classId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Récupérer toutes les séances de la classe
            const sessions = await sessionService.getByClass(classId);

            // Récupérer les séances déjà assignées à cette séquence
            const assignedSessions = await sequenceService.getSessionsBySequence(sequenceId);
            const assignedIds = assignedSessions.map(s => s.id);

            // Récupérer toutes les séquences assignées pour chaque séance
            const sequenceMap = new Map<string, Sequence>();
            await Promise.all(sessions.map(async (session) => {
                const sequence = await sequenceService.getSequenceBySession(session.id);
                if (sequence && sequence.id !== sequenceId) {
                    sequenceMap.set(session.id, sequence);
                }
            }));

            setAllSessions(sessions);
            setAssignedSessionIds(assignedIds);
            setSelectedSessionIds(assignedIds);
            setSessionSequences(sequenceMap);
        } catch (error) {
            console.error('Error loading sessions:', error);
            Alert.alert('Erreur', 'Impossible de charger les séances');
        } finally {
            setLoading(false);
        }
    };

    const toggleSession = (sessionId: string) => {
        // Vérifier si la séance est assignée à une autre séquence
        if (sessionSequences.has(sessionId)) {
            const otherSequence = sessionSequences.get(sessionId)!;
            Alert.alert(
                'Séance déjà assignée',
                `Cette séance est déjà assignée à la séquence "${otherSequence.name}". Veuillez d'abord la désassigner.`
            );
            return;
        }

        setSelectedSessionIds(prev => {
            if (prev.includes(sessionId)) {
                return prev.filter(id => id !== sessionId);
            } else {
                // Vérifier si on n'a pas dépassé le nombre de séances
                if (prev.length >= sessionCount) {
                    Alert.alert(
                        'Limite atteinte',
                        `Cette séquence ne nécessite que ${sessionCount} séance(s)`
                    );
                    return prev;
                }
                return [...prev, sessionId];
            }
        });
    };

    const handleQuickSelect = () => {
        // Trouver les N prochaines séances non assignées à d'autres séquences
        const availableSessions = allSessions
            .filter(s => !sessionSequences.has(s.id))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, sessionCount);

        if (availableSessions.length < sessionCount) {
            Alert.alert(
                'Séances insuffisantes',
                `Seulement ${availableSessions.length} séance(s) disponible(s) sur les ${sessionCount} nécessaires. Certaines séances sont déjà assignées à d'autres séquences.`
            );
        }

        setSelectedSessionIds(availableSessions.map(s => s.id));
    };

    const isSessionAssignedToOtherSequence = (sessionId: string): boolean => {
        return sessionSequences.has(sessionId);
    };

    const handleValidate = async () => {
        if (selectedSessionIds.length === 0) {
            Alert.alert('Attention', 'Veuillez sélectionner au moins une séance');
            return;
        }

        if (selectedSessionIds.length > sessionCount) {
            Alert.alert(
                'Trop de séances',
                `Cette séquence nécessite ${sessionCount} séance(s), vous en avez sélectionné ${selectedSessionIds.length}`
            );
            return;
        }

        try {
            await sequenceService.assignSessionsToSequence(sequenceId, selectedSessionIds);
            Alert.alert('Succès', 'Les séances ont été assignées à la séquence', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            console.error('Error assigning sessions:', error);
            const errorMessage = error instanceof Error ? error.message : "Impossible d'assigner les séances";
            Alert.alert('Erreur', errorMessage);
        }
    };

    const groupSessionsByMonth = () => {
        const groups: { [key: string]: Session[] } = {};

        allSessions
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach(session => {
                const date = new Date(session.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthLabel = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });

                if (!groups[monthKey]) {
                    groups[monthKey] = [];
                }
                groups[monthKey].push(session);
            });

        return Object.entries(groups).map(([key, sessions]) => {
            const monthLabel = new Date(sessions[0].date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
            });
            return { monthKey: key, monthLabel, sessions };
        });
    };

    const getSessionOrder = (sessionId: string): number | null => {
        const index = selectedSessionIds.indexOf(sessionId);
        return index >= 0 ? index + 1 : null;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: classColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{sequenceName}</Text>
                    <Text style={styles.headerSubtitle}>
                        {selectedSessionIds.length}/{sessionCount} séance(s) sélectionnée(s)
                    </Text>
                </View>
            </View>

            {/* Quick Select Button */}
            {selectedSessionIds.length < sessionCount && (
                <View style={styles.quickSelectContainer}>
                    <TouchableOpacity
                        onPress={handleQuickSelect}
                        style={styles.quickSelectButton}
                    >
                        <MaterialCommunityIcons name="flash" size={18} color="#007AFF" />
                        <Text style={styles.quickSelectText}>Sélection rapide des {sessionCount} prochaines séances</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Liste des séances */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {groupSessionsByMonth().map(group => (
                    <View key={group.monthKey} style={styles.monthGroup}>
                        <Text style={styles.monthTitle}>{group.monthLabel}</Text>

                        {group.sessions.map(session => {
                            const isSelected = selectedSessionIds.includes(session.id);
                            const order = getSessionOrder(session.id);
                            const otherSequence = sessionSequences.get(session.id);
                            const isAssignedToOther = !!otherSequence;

                            return (
                                <TouchableOpacity
                                    key={session.id}
                                    onPress={() => toggleSession(session.id)}
                                    activeOpacity={isAssignedToOther ? 0.5 : 0.7}
                                    disabled={isAssignedToOther}
                                    style={[
                                        styles.sessionCard,
                                        isSelected && styles.sessionCardSelected,
                                        isAssignedToOther && styles.sessionCardDisabled,
                                    ]}
                                >
                                    <View style={styles.sessionContent}>
                                        <TouchableOpacity
                                            onPress={() => toggleSession(session.id)}
                                            style={styles.checkboxContainer}
                                            disabled={isAssignedToOther}
                                        >
                                            <MaterialCommunityIcons
                                                name={
                                                    isAssignedToOther
                                                        ? 'lock'
                                                        : isSelected
                                                            ? 'checkbox-marked'
                                                            : 'checkbox-blank-outline'
                                                }
                                                size={24}
                                                color={isAssignedToOther ? '#999' : isSelected ? '#007AFF' : '#999'}
                                            />
                                        </TouchableOpacity>
                                        <View style={styles.sessionInfo}>
                                            <Text style={[styles.sessionDate, isAssignedToOther && styles.disabledText]}>
                                                {formatDate(session.date)} • {formatTime(session.date)}
                                            </Text>
                                            <Text style={[styles.sessionSubject, isAssignedToOther && styles.disabledText]}>
                                                {session.subject}
                                            </Text>
                                            {session.description && (
                                                <Text style={[styles.sessionDescription, isAssignedToOther && styles.disabledText]}>
                                                    {session.description}
                                                </Text>
                                            )}
                                            {otherSequence && (
                                                <View style={[styles.assignedBadge, { backgroundColor: otherSequence.color }]}>
                                                    <MaterialCommunityIcons name="link-variant" size={12} color="#FFFFFF" />
                                                    <Text style={styles.assignedBadgeText}>
                                                        {otherSequence.name}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        {order && !isAssignedToOther && (
                                            <View style={[styles.orderBadge, { backgroundColor: classColor }]}>
                                                <Text style={styles.orderText}>{order}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Footer avec boutons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
                >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleValidate}
                    style={[
                        styles.validateButton,
                        { backgroundColor: classColor },
                        selectedSessionIds.length === 0 && styles.validateButtonDisabled,
                    ]}
                    disabled={selectedSessionIds.length === 0}
                >
                    <Text style={styles.validateButtonText}>Valider l'assignation</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    quickSelectContainer: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.xs,
    },
    quickSelectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#fff',
    },
    quickSelectText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: SPACING.xs,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
    monthGroup: {
        marginBottom: SPACING.lg,
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#999',
        marginBottom: SPACING.sm,
        textTransform: 'lowercase',
    },
    sessionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionCardSelected: {
        borderColor: '#007AFF',
        borderWidth: 2,
        elevation: 4,
    },
    sessionCardDisabled: {
        opacity: 0.5,
        backgroundColor: '#f5f5f5',
    },
    sessionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxContainer: {
        marginRight: SPACING.sm,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    sessionSubject: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    sessionDescription: {
        fontSize: 12,
        color: '#999',
    },
    disabledText: {
        color: '#bbb',
    },
    assignedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 6,
        gap: 4,
    },
    assignedBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    orderBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        minWidth: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    bottomPadding: {
        height: SPACING.xl,
    },
    footer: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
        gap: SPACING.md,
    },
    cancelButton: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#999',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    validateButton: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    validateButtonDisabled: {
        opacity: 0.5,
    },
    validateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
