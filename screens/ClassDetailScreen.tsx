import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { studentService, sessionService, evaluationService } from '../services';
import { Student, Session, Evaluation } from '../types';
import StudentFormDialog from '../components/StudentFormDialog';
import SessionFormDialog from '../components/SessionFormDialog';
import SpeedDialFAB from '../components/SpeedDialFAB';
import { useTheme } from '../contexts/ThemeContext';
import { EVALUATION_TYPE_LABELS, NOTATION_SYSTEM_LABELS } from '../types/evaluation';

type ClassDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassDetail'>;
type ClassDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClassDetail'>;

interface Props {
    navigation: ClassDetailScreenNavigationProp;
    route: ClassDetailScreenRouteProp;
}

export default function ClassDetailScreen({ navigation, route }: Props) {
    const { theme } = useTheme();
    const { classId, className, classColor } = route.params;
    const [students, setStudents] = useState<Student[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showStudentDialog, setShowStudentDialog] = useState(false);
    const [showSessionDialog, setShowSessionDialog] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    const loadData = async () => {
        try {
            const [studentsData, sessionsData, evaluationsData] = await Promise.all([
                studentService.getByClass(classId),
                sessionService.getByClass(classId),
                evaluationService.getByClassId(classId),
            ]);
            setStudents(studentsData);
            setSessions(sessionsData);
            setEvaluations(evaluationsData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (data: {
        firstName: string;
        lastName: string;
        notes?: string;
        handicaps?: any[];
        laterality?: any;
        customTags?: string[];
    }) => {
        try {
            await studentService.create({ ...data, classId });
            setShowStudentDialog(false);
            loadData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleAddSession = async (data: { subject: string; description?: string; date: string; duration: number }) => {
        try {
            await sessionService.create({
                ...data,
                classId,
                status: 'planned' as const,
            });
            setShowSessionDialog(false);
            loadData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.loadingDot, { backgroundColor: theme.text }]} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            <View style={[styles.header, { backgroundColor: classColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{className}</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Students Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Élèves</Text>
                        <Text style={[styles.sectionCount, { color: theme.textTertiary, backgroundColor: theme.surfaceVariant }]}>{students.length}</Text>
                    </View>

                    {students.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucun élève pour le moment</Text>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: classColor }]}
                                onPress={() => setShowStudentDialog(true)}
                            >
                                <Text style={styles.addButtonText}>Ajouter un élève</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            {students.slice(0, 3).map((student) => (
                                <TouchableOpacity
                                    key={student.id}
                                    style={[styles.itemCard, { backgroundColor: theme.cardBackground }]}
                                    onPress={() => navigation.navigate('StudentDetail', { studentId: student.id })}
                                >
                                    <Text style={[styles.itemName, { color: theme.text }]}>
                                        {student.firstName} {student.lastName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {students.length > 3 && (
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={() => navigation.navigate('StudentList', { classId, className, classColor })}
                                >
                                    <Text style={[styles.viewAllText, { color: classColor }]}>
                                        Voir tous les élèves ({students.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {students.length <= 3 && students.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.addButton, styles.addButtonSecondary, { borderColor: classColor }]}
                                    onPress={() => setShowStudentDialog(true)}
                                >
                                    <Text style={[styles.addButtonTextSecondary, { color: classColor }]}>+ Ajouter un élève</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Schedule / Emploi du temps Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.scheduleCard, { backgroundColor: theme.cardBackground }]}
                        onPress={() => navigation.navigate('ScheduleManagement', { classId, className })}
                    >
                        <View style={styles.scheduleIconContainer}>
                            <MaterialCommunityIcons name="calendar-clock" size={32} color={classColor} />
                        </View>
                        <View style={styles.scheduleContent}>
                            <Text style={[styles.scheduleTitle, { color: theme.text }]}>
                                Emploi du temps
                            </Text>
                            <Text style={[styles.scheduleSubtitle, { color: theme.textSecondary }]}>
                                Configurer et générer les séances automatiquement
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Sessions Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Séances</Text>
                        <Text style={styles.sectionCount}>{sessions.length}</Text>
                    </View>

                    {sessions.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Aucune séance programmée</Text>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: classColor }]}
                                onPress={() => setShowSessionDialog(true)}
                            >
                                <Text style={styles.addButtonText}>Créer une séance</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            {sessions.slice(0, 3).map((session) => (
                                <TouchableOpacity
                                    key={session.id}
                                    style={styles.itemCard}
                                    onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                                >
                                    <View style={styles.sessionHeader}>
                                        <Text style={styles.itemName}>{session.subject}</Text>
                                        <View style={[styles.statusBadge, getStatusStyle(session.status)]}>
                                            <Text style={styles.statusText}>{getStatusLabel(session.status)}</Text>
                                        </View>
                                    </View>
                                    {session.description && (
                                        <Text style={styles.sessionDescription}>{session.description}</Text>
                                    )}
                                    <Text style={styles.sessionDate}>
                                        {new Date(session.date).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                        })}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {sessions.length > 3 && (
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={() => navigation.navigate('SessionList', { classId })}
                                >
                                    <Text style={[styles.viewAllText, { color: classColor }]}>
                                        Voir toutes les séances ({sessions.length}) →
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Evaluations Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Évaluations</Text>
                        <Text style={[styles.sectionCount, { color: theme.textTertiary, backgroundColor: theme.surfaceVariant }]}>{evaluations.length}</Text>
                    </View>

                    {evaluations.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune évaluation créée</Text>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: classColor }]}
                                onPress={() => navigation.navigate('EvaluationsList', { classId })}
                            >
                                <Text style={styles.addButtonText}>Créer une évaluation</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            {evaluations.slice(0, 3).map((evaluation) => (
                                <View
                                    key={evaluation.id}
                                    style={[styles.itemCard, { backgroundColor: theme.cardBackground }]}
                                >
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('EvaluationDetail', { evaluationId: evaluation.id })}
                                    >
                                        <View style={styles.evaluationHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.itemName, { color: theme.text }]}>
                                                    {evaluation.titre}
                                                </Text>
                                                <Text style={[styles.sessionDate, { color: theme.textTertiary }]}>
                                                    {new Date(evaluation.date).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </Text>
                                            </View>
                                            {evaluation.sessionId && (
                                                <TouchableOpacity
                                                    onPress={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            const session = await sessionService.getById(evaluation.sessionId!);
                                                            if (session) {
                                                                navigation.navigate('SessionDetail', { sessionId: evaluation.sessionId! });
                                                            }
                                                        } catch (error) {
                                                            console.error('Error navigating to session:', error);
                                                        }
                                                    }}
                                                    style={[styles.linkIconButton, { backgroundColor: theme.surfaceVariant }]}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="link-variant"
                                                        size={18}
                                                        color={theme.primary}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <View style={styles.evaluationBadges}>
                                            <View style={[styles.evaluationBadge, { backgroundColor: theme.surfaceVariant }]}>
                                                <Text style={[styles.evaluationBadgeText, { color: theme.textSecondary }]}>
                                                    {EVALUATION_TYPE_LABELS[evaluation.type]}
                                                </Text>
                                            </View>
                                            <View style={[styles.evaluationBadge, { backgroundColor: theme.surfaceVariant }]}>
                                                <Text style={[styles.evaluationBadgeText, { color: theme.textSecondary }]}>
                                                    {NOTATION_SYSTEM_LABELS[evaluation.notationSystem]}
                                                </Text>
                                            </View>
                                            {evaluation.isHomework && (
                                                <View style={[styles.evaluationBadge, { backgroundColor: theme.surfaceVariant, borderColor: theme.primary, borderWidth: 1 }]}>
                                                    <Text style={[styles.evaluationBadgeText, { color: theme.primary }]}>
                                                        DM
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.evaluationFooter}>
                                            <View style={styles.evaluationCompetences}>
                                                <MaterialCommunityIcons
                                                    name="star-box-multiple"
                                                    size={14}
                                                    color={theme.textTertiary}
                                                />
                                                <Text style={[styles.evaluationCompetencesText, { color: theme.textTertiary }]}>
                                                    {evaluation.competenceIds.length} compétence{evaluation.competenceIds.length > 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {evaluations.length > 3 && (
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={() => navigation.navigate('EvaluationsList', { classId })}
                                >
                                    <Text style={[styles.viewAllText, { color: classColor }]}>
                                        Voir toutes les évaluations ({evaluations.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {evaluations.length <= 3 && evaluations.length > 0 && (
                                <TouchableOpacity
                                    style={styles.viewAllButton}
                                    onPress={() => navigation.navigate('EvaluationsList', { classId })}
                                >
                                    <Text style={[styles.viewAllText, { color: classColor }]}>
                                        Voir toutes les évaluations ({evaluations.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <SpeedDialFAB
                backgroundColor={classColor}
                actions={[
                    {
                        icon: 'account-plus',
                        label: 'Ajouter un élève',
                        onPress: () => setShowStudentDialog(true),
                    },
                    {
                        icon: 'calendar-plus',
                        label: 'Créer une séance',
                        onPress: () => setShowSessionDialog(true),
                    },
                    {
                        icon: 'clipboard-text',
                        label: 'Évaluations',
                        onPress: () => navigation.navigate('EvaluationsList', { classId }),
                    },
                ]}
            />

            <StudentFormDialog
                visible={showStudentDialog}
                onDismiss={() => setShowStudentDialog(false)}
                onSubmit={handleAddStudent}
            />

            <SessionFormDialog
                visible={showSessionDialog}
                onDismiss={() => setShowSessionDialog(false)}
                onSubmit={handleAddSession}
            />
        </View>
    );
}

function getStatusStyle(status: string) {
    switch (status) {
        case 'completed':
            return { backgroundColor: '#E8F5E9' };
        case 'in_progress':
            return { backgroundColor: '#FFF3E0' };
        default:
            return { backgroundColor: '#F5F5F5' };
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'completed':
            return 'Terminée';
        case 'in_progress':
            return 'En cours';
        default:
            return 'Programmée';
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#000',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backText: {
        fontSize: 28,
        color: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    sectionCount: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 16,
    },
    addButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    itemCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    sessionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    sessionDate: {
        fontSize: 13,
        color: '#999',
    },
    viewAllButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 15,
        fontWeight: '600',
    },
    addButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        marginTop: 8,
    },
    addButtonTextSecondary: {
        fontWeight: '600',
        fontSize: 15,
    },
    scheduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 6,
        borderLeftColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    scheduleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    scheduleContent: {
        flex: 1,
    },
    scheduleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    scheduleSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    evaluationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    linkIconButton: {
        padding: 8,
        borderRadius: 8,
    },
    evaluationBadges: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    evaluationBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    evaluationBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    evaluationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    evaluationCompetences: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    evaluationCompetencesText: {
        fontSize: 12,
    },
});
