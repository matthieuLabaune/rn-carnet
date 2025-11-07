import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { sessionService, classService, attendanceService, studentService } from '../services';
import { Session, Class, Attendance, Student } from '../types';
import SpeedDialFAB from '../components/SpeedDialFAB';
import { useTheme } from '../contexts/ThemeContext';

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

            const [attendancesData, studentsData] = await Promise.all([
                attendanceService.getBySession(sessionId),
                studentService.getByClass(sessionData.classId),
            ]);
            setStudents(studentsData);

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
        // TODO: Ouvrir le dialog de prise de présences
        Alert.alert('À venir', 'Le dialog de prise de présences sera implémenté prochainement');
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
});
