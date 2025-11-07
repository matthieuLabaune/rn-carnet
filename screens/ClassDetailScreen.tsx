import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { studentService, sessionService } from '../services';
import { Student, Session } from '../types';
import StudentFormDialog from '../components/StudentFormDialog';
import SessionFormDialog from '../components/SessionFormDialog';
import SpeedDialFAB from '../components/SpeedDialFAB';
import { useTheme } from '../contexts/ThemeContext';

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
            const [studentsData, sessionsData] = await Promise.all([
                studentService.getByClass(classId),
                sessionService.getByClass(classId),
            ]);
            setStudents(studentsData);
            setSessions(sessionsData);
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
            <StatusBar barStyle={theme.statusBarStyle} />

            <View style={[styles.header, { backgroundColor: theme.surface, borderTopColor: classColor, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.backText, { color: theme.text }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{className}</Text>
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
                                <TouchableOpacity style={styles.viewAllButton}>
                                    <Text style={[styles.viewAllText, { color: classColor }]}>
                                        Voir toutes les séances ({sessions.length})
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
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderTopWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: {
        fontSize: 28,
        color: '#000',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
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
});
