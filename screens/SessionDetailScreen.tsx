import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { sessionService, classService, attendanceService, studentService, evaluationService } from '../services';
import { Session, Class, Attendance, Student, Evaluation } from '../types';
import SpeedDialFAB from '../components/SpeedDialFAB';
import AttendanceDialog from '../components/AttendanceDialog';
import { useTheme } from '../contexts/ThemeContext';
import { EVALUATION_TYPE_LABELS, NOTATION_SYSTEM_LABELS } from '../types/evaluation';

type SessionDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionDetail'>;
type SessionDetailScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;

interface Props {
    navigation: SessionDetailScreenNavigationProp;
    route: SessionDetailScreenRouteProp;
}

interface AttendanceWithStudent {
    attendance: Attendance;
    student: Student;
}

export default function SessionDetailScreen({ navigation, route }: Props) {
    const { theme } = useTheme();
    const { sessionId } = route.params;
    const [session, setSession] = useState<Session | null>(null);
    const [classData, setClassData] = useState<Class | null>(null);
    const [attendances, setAttendances] = useState<AttendanceWithStudent[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [linkedEvaluation, setLinkedEvaluation] = useState<Evaluation | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);

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
            const sessionData = await sessionService.getById(sessionId);
            if (!sessionData) {
                Alert.alert('Erreur', 'Séance introuvable');
                navigation.goBack();
                return;
            }
            setSession(sessionData);

            const classInfo = await classService.getById(sessionData.classId);
            setClassData(classInfo);

            const [attendancesData, studentsData, evaluationData] = await Promise.all([
                attendanceService.getBySession(sessionId),
                studentService.getByClass(sessionData.classId),
                evaluationService.getBySessionId(sessionId),
            ]);
            setStudents(studentsData);
            setLinkedEvaluation(evaluationData);

            // Enrichir les présences avec les infos élèves
            const enrichedAttendances: AttendanceWithStudent[] = attendancesData
                .map(attendance => {
                    const student = studentsData.find(s => s.id === attendance.studentId);
                    return student ? { attendance, student } : null;
                })
                .filter((item): item is AttendanceWithStudent => item !== null);

            setAttendances(enrichedAttendances);
        } catch (error) {
            console.error('Error loading session:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#4CAF50';
            case 'in_progress': return '#2196F3';
            case 'cancelled': return '#F44336';
            default: return '#FF9800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Terminée';
            case 'in_progress': return 'En cours';
            case 'cancelled': return 'Annulée';
            default: return 'Planifiée';
        }
    };

    const getAttendanceStats = () => {
        const recorded = attendances.length;
        const total = students.length;
        const present = attendances.filter(a => a.attendance.present).length;
        const absent = attendances.filter(a => !a.attendance.present).length;
        const late = attendances.filter(a => a.attendance.late).length;
        const notRecorded = total - recorded;

        return { recorded, total, present, absent, late, notRecorded };
    };

    const handleTakeAttendance = () => {
        setShowAttendanceDialog(true);
    };

    const handleSaveAttendances = async (attendancesData: Array<{
        studentId: string;
        present: boolean;
        late: boolean;
        lateMinutes?: number;
        notes?: string;
    }>) => {
        try {
            // Préparer les données avec sessionId
            const attendancesToSave = attendancesData.map(att => ({
                sessionId,
                studentId: att.studentId,
                present: att.present,
                late: att.late,
                lateMinutes: att.lateMinutes,
                notes: att.notes,
            }));

            // Enregistrer en batch
            await attendanceService.upsertBulk(attendancesToSave);
            
            setShowAttendanceDialog(false);
            await loadData(); // Recharger les données
            Alert.alert('Succès', 'Présences enregistrées');
        } catch (error) {
            console.error('Error saving attendances:', error);
            Alert.alert('Erreur', 'Impossible d\'enregistrer les présences');
        }
    };

    const getExistingAttendances = (): Map<string, any> => {
        const map = new Map();
        attendances.forEach(({ attendance }) => {
            map.set(attendance.studentId, {
                studentId: attendance.studentId,
                present: attendance.present,
                late: attendance.late,
                lateMinutes: attendance.lateMinutes,
                notes: attendance.notes,
            });
        });
        return map;
    };

    if (loading || !session || !classData) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={theme.statusBarStyle} />
                <View style={styles.loadingContainer}>
                    <Text style={{ color: theme.text }}>Chargement...</Text>
                </View>
            </View>
        );
    }

    const stats = getAttendanceStats();
    const statusColor = getStatusColor(session.status);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: classData.color }]}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{classData.name}</Text>
                    <Text style={styles.headerSubtitle}>{session.subject}</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Infos séance */}
                <Card style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Card.Content>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
                            <Text style={[styles.infoText, { color: theme.text }]}>
                                {new Date(session.date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.textSecondary} />
                            <Text style={[styles.infoText, { color: theme.text }]}>
                                {session.duration} minutes
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={theme.textSecondary} />
                            <Chip 
                                mode="flat"
                                style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
                                textStyle={{ color: statusColor, fontSize: 12 }}
                            >
                                {getStatusLabel(session.status)}
                            </Chip>
                        </View>

                        {session.description && (
                            <View style={[styles.infoRow, { marginTop: 12 }]}>
                                <MaterialCommunityIcons name="text" size={20} color={theme.textSecondary} />
                                <Text style={[styles.infoText, { color: theme.textSecondary, flex: 1 }]}>
                                    {session.description}
                                </Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Statistiques présences */}
                <Card style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Card.Content>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Présences</Text>
                        
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.present}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Présents</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.absent}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Absents</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.late}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Retards</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.textSecondary }]}>{stats.notRecorded}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Non saisis</Text>
                            </View>
                        </View>

                        {stats.recorded > 0 && (
                            <View style={[styles.progressBar, { backgroundColor: theme.background }]}>
                                <View 
                                    style={[
                                        styles.progressFill,
                                        { 
                                            width: `${(stats.present / stats.total) * 100}%`,
                                            backgroundColor: '#4CAF50'
                                        }
                                    ]} 
                                />
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Section Évaluation liée */}
                {linkedEvaluation ? (
                    <Card style={[styles.card, { backgroundColor: theme.surface }]}>
                        <Card.Content>
                            <View style={styles.evaluationHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                    Évaluation liée
                                </Text>
                                <MaterialCommunityIcons name="link-variant" size={20} color={theme.textSecondary} />
                            </View>
                            <TouchableOpacity
                                style={[styles.evaluationCard, { backgroundColor: theme.cardBackground }]}
                                onPress={() => navigation.navigate('EvaluationDetail', { evaluationId: linkedEvaluation.id })}
                            >
                                <Text style={[styles.evaluationTitle, { color: theme.text }]}>
                                    {linkedEvaluation.titre}
                                </Text>
                                <View style={styles.evaluationBadges}>
                                    <View style={[styles.evaluationBadge, { backgroundColor: theme.surfaceVariant }]}>
                                        <Text style={[styles.evaluationBadgeText, { color: theme.textSecondary }]}>
                                            {EVALUATION_TYPE_LABELS[linkedEvaluation.type]}
                                        </Text>
                                    </View>
                                    <View style={[styles.evaluationBadge, { backgroundColor: theme.surfaceVariant }]}>
                                        <Text style={[styles.evaluationBadgeText, { color: theme.textSecondary }]}>
                                            {NOTATION_SYSTEM_LABELS[linkedEvaluation.notationSystem]}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.evaluationFooter}>
                                    <MaterialCommunityIcons name="star-box-multiple" size={14} color={theme.textTertiary} />
                                    <Text style={[styles.evaluationCompetences, { color: theme.textTertiary }]}>
                                        {linkedEvaluation.competenceIds.length} compétence{linkedEvaluation.competenceIds.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                ) : (
                    <Card style={[styles.card, { backgroundColor: theme.surface }]}>
                        <Card.Content>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Évaluation
                            </Text>
                            <TouchableOpacity
                                style={[styles.createEvaluationButton, { borderColor: classData?.color }]}
                                onPress={() => {
                                    if (session && classData) {
                                        navigation.navigate('EvaluationsList', { classId: classData.id });
                                    }
                                }}
                            >
                                <MaterialCommunityIcons name="clipboard-plus" size={20} color={classData?.color} />
                                <Text style={[styles.createEvaluationText, { color: classData?.color }]}>
                                    Créer une évaluation pour cette séance
                                </Text>
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                )}

                {/* Liste des élèves */}
                <Card style={[styles.card, { backgroundColor: theme.surface, marginBottom: 80 }]}>
                    <Card.Content>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Élèves ({stats.total})
                        </Text>

                        {students.map(student => {
                            const attendance = attendances.find(a => a.student.id === student.id);
                            return (
                                <View key={student.id} style={[styles.studentItem, { borderBottomColor: theme.border }]}>
                                    <View style={styles.studentInfo}>
                                        <Text style={[styles.studentName, { color: theme.text }]}>
                                            {student.firstName} {student.lastName}
                                        </Text>
                                        {attendance?.attendance.notes && (
                                            <Text style={[styles.studentNotes, { color: theme.textSecondary }]}>
                                                {attendance.attendance.notes}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.studentStatus}>
                                        {attendance ? (
                                            <>
                                                {attendance.attendance.present ? (
                                                    <>
                                                        <MaterialCommunityIcons 
                                                            name="check-circle" 
                                                            size={24} 
                                                            color="#4CAF50" 
                                                        />
                                                        {attendance.attendance.late && (
                                                            <MaterialCommunityIcons 
                                                                name="clock-alert" 
                                                                size={20} 
                                                                color="#FF9800"
                                                                style={{ marginLeft: 4 }}
                                                            />
                                                        )}
                                                    </>
                                                ) : (
                                                    <MaterialCommunityIcons 
                                                        name="close-circle" 
                                                        size={24} 
                                                        color="#F44336" 
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <MaterialCommunityIcons 
                                                name="help-circle-outline" 
                                                size={24} 
                                                color={theme.textSecondary}
                                            />
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* SpeedDial FAB avec actions multiples */}
            <SpeedDialFAB
                backgroundColor={classData.color}
                actions={[
                    {
                        icon: 'clipboard-check',
                        label: 'Prendre les présences',
                        onPress: handleTakeAttendance,
                        color: classData.color,
                    },
                    {
                        icon: 'pencil',
                        label: 'Modifier la séance',
                        onPress: () => Alert.alert('À venir', 'Modification de séance'),
                        color: classData.color,
                    },
                ]}
            />

            {/* Dialog de prise de présences */}
            {session && classData && (
                <AttendanceDialog
                    visible={showAttendanceDialog}
                    onDismiss={() => setShowAttendanceDialog(false)}
                    onSubmit={handleSaveAttendances}
                    students={students}
                    existingAttendances={getExistingAttendances()}
                    sessionDate={session.date}
                    classColor={classData.color}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 16,
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
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        flex: 1,
    },
    card: {
        margin: 16,
        marginBottom: 0,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 16,
        marginLeft: 12,
    },
    statusChip: {
        marginLeft: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    studentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    studentNotes: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    studentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    evaluationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    evaluationCard: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    evaluationTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
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
        gap: 4,
    },
    evaluationCompetences: {
        fontSize: 12,
    },
    createEvaluationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderWidth: 1.5,
        borderRadius: 8,
        borderStyle: 'dashed',
    },
    createEvaluationText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
