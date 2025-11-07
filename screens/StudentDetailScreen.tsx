import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { studentService, classService, attendanceService, sessionService } from '../services';
import { Student, Class, Attendance, Session } from '../types';
import { HANDICAP_LABELS, LATERALITY_LABELS } from '../types/student';
import StudentFormDialog from '../components/StudentFormDialog';
import { useTheme } from '../contexts/ThemeContext';

type StudentDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDetail'>;
type StudentDetailScreenRouteProp = RouteProp<RootStackParamList, 'StudentDetail'>;

interface Props {
    navigation: StudentDetailScreenNavigationProp;
    route: StudentDetailScreenRouteProp;
}

export default function StudentDetailScreen({ navigation, route }: Props) {
    const { theme } = useTheme();
    const { studentId } = route.params;
    const [student, setStudent] = useState<Student | null>(null);
    const [classe, setClasse] = useState<Class | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [attendances, setAttendances] = useState<(Attendance & { session: Session })[]>([]);
    const [attendanceStats, setAttendanceStats] = useState({
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
    });

    useEffect(() => {
        loadStudent();
    }, []);

    const loadStudent = async () => {
        try {
            const studentData = await studentService.getById(studentId);
            if (studentData) {
                setStudent(studentData);
                const classData = await classService.getById(studentData.classId);
                setClasse(classData);

                // Charger les présences
                const attendancesData = await attendanceService.getByStudent(studentId);

                // Enrichir avec les infos de séance
                const enrichedAttendances = await Promise.all(
                    attendancesData.map(async (att) => {
                        const session = await sessionService.getById(att.sessionId);
                        return { ...att, session: session! };
                    })
                );

                // Trier par date décroissante
                enrichedAttendances.sort((a, b) =>
                    new Date(b.session.date).getTime() - new Date(a.session.date).getTime()
                );

                setAttendances(enrichedAttendances);

                // Calculer les statistiques
                const stats = await attendanceService.getStudentStats(studentId);
                setAttendanceStats(stats);
            }
        } catch (error) {
            console.error('Error loading student:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (data: any) => {
        try {
            await studentService.update(studentId, data);
            setShowEditDialog(false);
            loadStudent();
        } catch (error) {
            console.error('Error updating student:', error);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer l\'élève',
            `Voulez-vous vraiment supprimer ${student?.firstName} ${student?.lastName} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await studentService.delete(studentId);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting student:', error);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="loading" size={32} color={theme.textSecondary} />
            </View>
        );
    }

    if (!student) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="account-off" size={64} color={theme.textTertiary} />
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>Élève introuvable</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }, classe && { borderTopColor: classe.color }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fiche élève</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => setShowEditDialog(true)}>
                        <MaterialCommunityIcons name="pencil" size={20} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                        <MaterialCommunityIcons name="delete" size={20} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Main Info Card */}
                <View style={styles.mainCard}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, classe && { backgroundColor: classe.color + '20' }]}>
                            <Text style={[styles.avatarText, classe && { color: classe.color }]}>
                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.studentName}>
                        {student.firstName} {student.lastName}
                    </Text>

                    {classe && (
                        <View style={styles.classTag}>
                            <View style={[styles.classColorDot, { backgroundColor: classe.color }]} />
                            <Text style={styles.classText}>{classe.name}</Text>
                        </View>
                    )}
                </View>

                {/* Tags Section */}
                {(student.handicaps?.length || student.laterality || student.customTags?.length) ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informations</Text>
                        <View style={styles.card}>
                            {/* Laterality */}
                            {student.laterality && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoLabel}>
                                        <MaterialCommunityIcons name="human" size={20} color="#666" />
                                        <Text style={styles.infoLabelText}>Latéralité</Text>
                                    </View>
                                    <Text style={styles.infoValue}>
                                        {LATERALITY_LABELS[student.laterality]}
                                    </Text>
                                </View>
                            )}

                            {/* Handicaps */}
                            {student.handicaps && student.handicaps.length > 0 && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoLabel}>
                                        <MaterialCommunityIcons name="account-heart" size={20} color="#666" />
                                        <Text style={styles.infoLabelText}>Besoins particuliers</Text>
                                    </View>
                                    <View style={styles.tagsContainer}>
                                        {student.handicaps.map((handicap) => (
                                            <View key={handicap} style={styles.tag}>
                                                <Text style={styles.tagText}>{HANDICAP_LABELS[handicap]}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Custom Tags */}
                            {student.customTags && student.customTags.length > 0 && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoLabel}>
                                        <MaterialCommunityIcons name="tag-multiple" size={20} color="#666" />
                                        <Text style={styles.infoLabelText}>Tags</Text>
                                    </View>
                                    <View style={styles.tagsContainer}>
                                        {student.customTags.map((tag) => (
                                            <View key={tag} style={[styles.tag, styles.customTag]}>
                                                <Text style={styles.tagText}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}

                {/* Notes Section */}
                {student.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <View style={styles.card}>
                            <Text style={styles.notesText}>{student.notes}</Text>
                        </View>
                    </View>
                )}

                {/* Historique des présences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historique des présences</Text>

                    {/* Statistiques */}
                    <View style={[styles.card, { marginBottom: 12 }]}>
                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                                    {attendanceStats.attendanceRate.toFixed(0)}%
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Taux</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                                    {attendanceStats.presentCount}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Présent(e)</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: '#F44336' }]}>
                                    {attendanceStats.absentCount}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Absent(e)</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: '#FF9800' }]}>
                                    {attendanceStats.lateCount}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Retards</Text>
                            </View>
                        </View>
                    </View>

                    {/* Liste des présences */}
                    {attendances.length === 0 ? (
                        <View style={styles.card}>
                            <View style={styles.placeholderContainer}>
                                <MaterialCommunityIcons name="calendar-clock" size={48} color={theme.textTertiary} />
                                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                                    Aucune présence enregistrée
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            {attendances.slice(0, 10).map((attendance, index) => (
                                <View
                                    key={attendance.id}
                                    style={[
                                        styles.attendanceItem,
                                        index < attendances.length - 1 && {
                                            borderBottomWidth: 1,
                                            borderBottomColor: theme.border
                                        }
                                    ]}
                                >
                                    <View style={styles.attendanceIcon}>
                                        {attendance.present ? (
                                            <MaterialCommunityIcons
                                                name="check-circle"
                                                size={24}
                                                color="#4CAF50"
                                            />
                                        ) : (
                                            <MaterialCommunityIcons
                                                name="close-circle"
                                                size={24}
                                                color="#F44336"
                                            />
                                        )}
                                    </View>
                                    <View style={styles.attendanceInfo}>
                                        <Text style={[styles.attendanceSubject, { color: theme.text }]}>
                                            {attendance.session.subject}
                                        </Text>
                                        <View style={styles.attendanceDetails}>
                                            <Text style={[styles.attendanceDate, { color: theme.textSecondary }]}>
                                                {new Date(attendance.session.date).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                            {attendance.late && (
                                                <>
                                                    <Text style={[styles.attendanceSeparator, { color: theme.textTertiary }]}>•</Text>
                                                    <MaterialCommunityIcons
                                                        name="clock-alert"
                                                        size={14}
                                                        color="#FF9800"
                                                    />
                                                    <Text style={[styles.attendanceLate, { color: '#FF9800' }]}>
                                                        {attendance.lateMinutes} min
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                        {attendance.notes && (
                                            <Text style={[styles.attendanceNotes, { color: theme.textSecondary }]}>
                                                {attendance.notes}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                            {attendances.length > 10 && (
                                <Text style={[styles.moreText, { color: theme.textSecondary }]}>
                                    Et {attendances.length - 10} présence(s) de plus...
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Placeholder for future sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historique des séances</Text>
                    <View style={styles.card}>
                        <View style={styles.placeholderContainer}>
                            <MaterialCommunityIcons name="calendar-clock" size={48} color={theme.textTertiary} />
                            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Aucune séance enregistrée</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Ajouté le {new Date(student.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </Text>
                </View>
            </ScrollView>

            <StudentFormDialog
                visible={showEditDialog}
                student={student}
                onDismiss={() => setShowEditDialog(false)}
                onSubmit={handleEdit}
            />
        </View>
    );
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
        backgroundColor: '#fafafa',
    },
    errorText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        marginRight: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    content: {
        flex: 1,
    },
    mainCard: {
        backgroundColor: '#ffffff',
        padding: 32,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#666',
    },
    studentName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    classTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
    },
    classColorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    classText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        marginBottom: 16,
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginLeft: 8,
    },
    infoValue: {
        fontSize: 16,
        color: '#000',
        marginLeft: 28,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginLeft: 28,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    customTag: {
        backgroundColor: '#E0F2FE',
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626',
    },
    notesText: {
        fontSize: 15,
        color: '#000',
        lineHeight: 22,
    },
    placeholderContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    placeholderText: {
        fontSize: 14,
        color: '#999',
        marginTop: 12,
    },
    footer: {
        padding: 16,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    attendanceItem: {
        flexDirection: 'row',
        paddingVertical: 12,
    },
    attendanceIcon: {
        marginRight: 12,
        paddingTop: 2,
    },
    attendanceInfo: {
        flex: 1,
    },
    attendanceSubject: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    attendanceDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    attendanceDate: {
        fontSize: 14,
    },
    attendanceSeparator: {
        fontSize: 14,
        marginHorizontal: 4,
    },
    attendanceLate: {
        fontSize: 13,
        fontWeight: '600',
    },
    attendanceNotes: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 4,
    },
    moreText: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
});
