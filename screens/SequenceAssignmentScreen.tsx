import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Checkbox, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Session } from '../types';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({
            title: `🎯 Assigner: ${sequenceName}`,
            headerStyle: { backgroundColor: classColor },
            headerTintColor: '#fff',
        });
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

            setAllSessions(sessions);
            setAssignedSessionIds(assignedIds);
            setSelectedSessionIds(assignedIds);
        } catch (error) {
            console.error('Error loading sessions:', error);
            Alert.alert('Erreur', 'Impossible de charger les séances');
        } finally {
            setLoading(false);
        }
    };

    const toggleSession = (sessionId: string) => {
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
        // Trouver les N prochaines séances non assignées
        const unassignedSessions = allSessions
            .filter(s => !isSessionAssignedToOtherSequence(s.id))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, sessionCount);

        setSelectedSessionIds(unassignedSessions.map(s => s.id));
    };

    const isSessionAssignedToOtherSequence = (sessionId: string): boolean => {
        // Pour l'instant, on vérifie juste si ce n'est pas dans les assignés actuels
        // Dans une version plus complète, on pourrait vérifier toutes les assignations
        return false;
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
            Alert.alert('Erreur', "Impossible d'assigner les séances");
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
            {/* En-tête */}
            <Card style={styles.headerCard}>
                <Card.Content>
                    <Text style={styles.headerTitle}>
                        {sessionCount} séance(s) à assigner
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {selectedSessionIds.length}/{sessionCount} séance(s) sélectionnée(s)
                    </Text>

                    {selectedSessionIds.length < sessionCount && (
                        <Button
                            mode="outlined"
                            onPress={handleQuickSelect}
                            style={styles.quickSelectButton}
                            icon="flash"
                        >
                            Sélection rapide
                        </Button>
                    )}
                </Card.Content>
            </Card>

            {/* Liste des séances */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {groupSessionsByMonth().map(group => (
                    <View key={group.monthKey} style={styles.monthGroup}>
                        <Text style={styles.monthTitle}>📅 {group.monthLabel}</Text>

                        {group.sessions.map(session => {
                            const isSelected = selectedSessionIds.includes(session.id);
                            const order = getSessionOrder(session.id);

                            return (
                                <TouchableOpacity
                                    key={session.id}
                                    onPress={() => toggleSession(session.id)}
                                    activeOpacity={0.7}
                                >
                                    <Card
                                        style={[
                                            styles.sessionCard,
                                            isSelected && styles.sessionCardSelected,
                                        ]}
                                    >
                                        <Card.Content>
                                            <View style={styles.sessionContent}>
                                                <Checkbox
                                                    status={isSelected ? 'checked' : 'unchecked'}
                                                    onPress={() => toggleSession(session.id)}
                                                />
                                                <View style={styles.sessionInfo}>
                                                    <Text style={styles.sessionDate}>
                                                        {formatDate(session.date)} • {formatTime(session.date)}
                                                    </Text>
                                                    <Text style={styles.sessionSubject}>
                                                        {session.subject}
                                                    </Text>
                                                    {session.description && (
                                                        <Text style={styles.sessionDescription}>
                                                            {session.description}
                                                        </Text>
                                                    )}
                                                </View>
                                                {order && (
                                                    <View style={styles.orderBadge}>
                                                        <Text style={styles.orderText}>← {order}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </Card.Content>
                                    </Card>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Footer avec boutons */}
            <View style={styles.footer}>
                <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
                >
                    Annuler
                </Button>
                <Button
                    mode="contained"
                    onPress={handleValidate}
                    style={[styles.validateButton, { backgroundColor: classColor }]}
                    disabled={selectedSessionIds.length === 0}
                >
                    Valider l'assignation
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerCard: {
        margin: SPACING.md,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: SPACING.sm,
    },
    quickSelectButton: {
        marginTop: SPACING.sm,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
    monthGroup: {
        marginBottom: SPACING.lg,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: SPACING.sm,
    },
    sessionCard: {
        marginBottom: SPACING.sm,
        elevation: 1,
    },
    sessionCardSelected: {
        borderColor: '#2196F3',
        borderWidth: 2,
        elevation: 3,
    },
    sessionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
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
    orderBadge: {
        backgroundColor: '#2196F3',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 36,
        alignItems: 'center',
    },
    orderText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
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
    },
    validateButton: {
        flex: 1,
    },
});
