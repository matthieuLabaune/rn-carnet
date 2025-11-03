import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { studentService, classService } from '../services';
import { Student, Class } from '../types';
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

                {/* Placeholder for future sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historique des séances</Text>
                    <View style={styles.card}>
                        <View style={styles.placeholderContainer}>
                            <MaterialCommunityIcons name="calendar-clock" size={48} color="#ddd" />
                            <Text style={styles.placeholderText}>Aucune séance enregistrée</Text>
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
});
