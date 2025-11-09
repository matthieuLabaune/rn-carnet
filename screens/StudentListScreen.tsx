import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, TextInput, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { studentService } from '../services';
import { Student } from '../types';
import StudentFormDialog from '../components/StudentFormDialog';
import CustomFAB from '../components/CustomFAB';
import { useTheme } from '../contexts/ThemeContext';

type StudentListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentList'>;
type StudentListScreenRouteProp = RouteProp<RootStackParamList, 'StudentList'>;

interface Props {
    navigation: StudentListScreenNavigationProp;
    route: StudentListScreenRouteProp;
}

export default function StudentListScreen({ navigation, route }: Props) {
    const { theme } = useTheme();
    const { classId, className, classColor } = route.params;
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showStudentDialog, setShowStudentDialog] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadStudents();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        filterStudents();
    }, [students, searchQuery]);

    const loadStudents = async () => {
        try {
            const data = await studentService.getByClass(classId);
            setStudents(data);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        if (!searchQuery.trim()) {
            setFilteredStudents(students);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = students.filter(student =>
            student.firstName.toLowerCase().includes(query) ||
            student.lastName.toLowerCase().includes(query)
        );
        setFilteredStudents(filtered);
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
            if (editingStudent) {
                await studentService.update(editingStudent.id, data);
            } else {
                await studentService.create({ ...data, classId });
            }
            setShowStudentDialog(false);
            setEditingStudent(undefined);
            loadStudents();
        } catch (error) {
            console.error('Error saving student:', error);
        }
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setShowStudentDialog(true);
    };

    const handleDeleteStudent = (student: Student) => {
        Alert.alert(
            'Supprimer l\'élève',
            `Voulez-vous vraiment supprimer ${student.firstName} ${student.lastName} ?`,
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await studentService.delete(student.id);
                            loadStudents();
                        } catch (error) {
                            console.error('Error deleting student:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleDialogDismiss = () => {
        setShowStudentDialog(false);
        setEditingStudent(undefined);
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

            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{className}</Text>
                    <Text style={styles.headerSubtitle}>
                        {students.length} élève{students.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher un élève..."
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {filteredStudents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-off" size={64} color="#ddd" />
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'Aucun résultat' : 'Aucun élève'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? 'Essayez avec un autre terme de recherche'
                                : 'Ajoutez votre premier élève avec le bouton +'
                            }
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {filteredStudents.map((student, index) => (
                            <TouchableOpacity
                                key={student.id}
                                style={[
                                    styles.studentCard,
                                    { borderLeftColor: classColor },
                                    index === 0 && styles.firstCard
                                ]}
                                onPress={() => navigation.navigate('StudentDetail', { studentId: student.id })}
                            >
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>
                                        {student.firstName} {student.lastName}
                                    </Text>
                                    {student.notes && (
                                        <Text style={styles.studentNotes} numberOfLines={2}>
                                            {student.notes}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.studentActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleEditStudent(student);
                                        }}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={18} color="#666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleDeleteStudent(student);
                                        }}
                                    >
                                        <MaterialCommunityIcons name="delete" size={18} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <CustomFAB
                icon="plus"
                onPress={() => setShowStudentDialog(true)}
                backgroundColor={classColor}
            />

            <StudentFormDialog
                visible={showStudentDialog}
                student={editingStudent}
                onDismiss={handleDialogDismiss}
                onSubmit={handleAddStudent}
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
        flexDirection: 'row',
        alignItems: 'center',
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
    backText: {
        fontSize: 28,
        color: '#000',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: 28,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingLeft: 40,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    clearButtonText: {
        fontSize: 20,
        color: '#999',
    },
    content: {
        flex: 1,
    },
    list: {
        padding: 16,
    },
    studentCard: {
        backgroundColor: '#ffffff',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderLeftWidth: 6,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    firstCard: {
        marginTop: 8,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    studentNotes: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    studentActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
});
