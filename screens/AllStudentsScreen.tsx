import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { studentService, classService } from '../services';
import { Student, Class } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type AllStudentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDetail'>;

interface Props {
    navigation: AllStudentsScreenNavigationProp;
}

export default function AllStudentsScreen({ navigation }: Props) {
    const { theme } = useTheme();
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchQuery]);

    const loadData = async () => {
        try {
            const classesData = await classService.getAll();
            setClasses(classesData);

            const allStudents: Student[] = [];
            for (const classe of classesData) {
                const classStudents = await studentService.getByClass(classe.id);
                allStudents.push(...classStudents);
            }
            setStudents(allStudents);
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

    const getClassName = (classId: string) => {
        const classe = classes.find(c => c.id === classId);
        return classe?.name || 'Classe inconnue';
    };

    const getClassColor = (classId: string) => {
        const classe = classes.find(c => c.id === classId);
        return classe?.color || '#000';
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="loading" size={32} color={theme.textSecondary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />

            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <MaterialCommunityIcons name="account-group" size={28} color={theme.text} />
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Tous les élèves</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {students.length} élève{students.length !== 1 ? 's' : ''} · {classes.length} classe{classes.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
                    value={searchQuery}
                    placeholderTextColor={theme.textPlaceholder}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher un élève..."
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <MaterialCommunityIcons name="close-circle" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.list}>
                {filteredStudents.map((student) => (
                    <TouchableOpacity
                        key={student.id}
                        style={[styles.studentCard, { backgroundColor: theme.cardBackground, borderLeftColor: getClassColor(student.classId) }]}
                        onPress={() => navigation.navigate('StudentDetail', { studentId: student.id })}
                    >
                        <View style={styles.studentInfo}>
                            <Text style={[styles.studentName, { color: theme.text }]}>
                                {student.firstName} {student.lastName}
                            </Text>
                            <View style={styles.classTag}>
                                <Text style={[styles.className, { color: getClassColor(student.classId) }]}>
                                    {getClassName(student.classId)}
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={24}
                            color={theme.textTertiary}
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>
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
    headerContent: {
        marginLeft: 16,
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
    content: {
        flex: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
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
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 6,
    },
    classTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    classColorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    className: {
        fontSize: 13,
        color: '#666',
    },
    detailButton: {
        padding: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
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
