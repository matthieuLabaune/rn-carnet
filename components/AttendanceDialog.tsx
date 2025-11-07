import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Student } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface StudentAttendanceData {
    studentId: string;
    present: boolean;
    late: boolean;
    lateMinutes?: number;
    notes?: string;
}

interface StudentAttendance {
    studentId: string;
    student: Student;
    present: boolean;
    late: boolean;
    lateMinutes?: number;
    notes?: string;
}

interface Props {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (attendances: StudentAttendanceData[]) => void;
    students: Student[];
    existingAttendances?: Map<string, StudentAttendanceData>;
    sessionDate: string;
    classColor: string;
}

export default function AttendanceDialog({
    visible,
    onDismiss,
    onSubmit,
    students,
    existingAttendances,
    sessionDate,
    classColor,
}: Props) {
    const { theme } = useTheme();
    const [attendances, setAttendances] = useState<StudentAttendance[]>([]);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            // Initialiser les présences avec les données existantes ou par défaut
            const initialAttendances: StudentAttendance[] = students.map(student => {
                const existing = existingAttendances?.get(student.id);
                return {
                    studentId: student.id,
                    student,
                    present: existing?.present ?? true,
                    late: existing?.late ?? false,
                    lateMinutes: existing?.lateMinutes,
                    notes: existing?.notes,
                };
            });
            setAttendances(initialAttendances);
        }
    }, [visible, students, existingAttendances]);

    const handleTogglePresence = (studentId: string) => {
        setAttendances(prev =>
            prev.map(att =>
                att.studentId === studentId
                    ? {
                          ...att,
                          present: !att.present,
                          late: att.present ? false : att.late, // Reset late if becoming absent
                          lateMinutes: att.present ? undefined : att.lateMinutes,
                      }
                    : att
            )
        );
    };

    const handleToggleLate = (studentId: string) => {
        setAttendances(prev =>
            prev.map(att =>
                att.studentId === studentId && att.present
                    ? {
                          ...att,
                          late: !att.late,
                          lateMinutes: !att.late ? 5 : undefined,
                      }
                    : att
            )
        );
    };

    const handleLateMinutesChange = (studentId: string, minutes: string) => {
        const numMinutes = parseInt(minutes) || 0;
        setAttendances(prev =>
            prev.map(att =>
                att.studentId === studentId ? { ...att, lateMinutes: numMinutes } : att
            )
        );
    };

    const handleNotesChange = (studentId: string, notes: string) => {
        setAttendances(prev =>
            prev.map(att => (att.studentId === studentId ? { ...att, notes } : att))
        );
    };

    const handleSubmit = () => {
        const formattedAttendances: StudentAttendanceData[] = attendances.map(att => ({
            studentId: att.studentId,
            present: att.present,
            late: att.late,
            lateMinutes: att.lateMinutes,
            notes: att.notes,
        }));

        onSubmit(formattedAttendances);
    };

    const handleMarkAllPresent = () => {
        setAttendances(prev =>
            prev.map(att => ({
                ...att,
                present: true,
                late: false,
                lateMinutes: undefined,
            }))
        );
    };

    const handleMarkAllAbsent = () => {
        Alert.alert(
            'Confirmation',
            'Marquer tous les élèves comme absents ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: () => {
                        setAttendances(prev =>
                            prev.map(att => ({
                                ...att,
                                present: false,
                                late: false,
                                lateMinutes: undefined,
                            }))
                        );
                    },
                },
            ]
        );
    };

    const stats = {
        present: attendances.filter(a => a.present).length,
        absent: attendances.filter(a => !a.present).length,
        late: attendances.filter(a => a.late).length,
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: classColor }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Prendre les présences</Text>
                        <Text style={styles.headerSubtitle}>
                            {new Date(sessionDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                        <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={[styles.statsBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                        <Text style={[styles.statText, { color: theme.text }]}>{stats.present}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="close-circle" size={20} color="#F44336" />
                        <Text style={[styles.statText, { color: theme.text }]}>{stats.absent}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="clock-alert" size={20} color="#FF9800" />
                        <Text style={[styles.statText, { color: theme.text }]}>{stats.late}</Text>
                    </View>
                </View>

                {/* Quick actions */}
                <View style={[styles.quickActions, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        style={[styles.quickButton, { backgroundColor: theme.surfaceVariant }]}
                        onPress={handleMarkAllPresent}
                    >
                        <MaterialCommunityIcons name="check-all" size={18} color="#4CAF50" />
                        <Text style={[styles.quickButtonText, { color: theme.text }]}>Tous présents</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickButton, { backgroundColor: theme.surfaceVariant }]}
                        onPress={handleMarkAllAbsent}
                    >
                        <MaterialCommunityIcons name="close-box-multiple" size={18} color="#F44336" />
                        <Text style={[styles.quickButtonText, { color: theme.text }]}>Tous absents</Text>
                    </TouchableOpacity>
                </View>

                {/* Students list */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {attendances.map((attendance, index) => (
                        <View
                            key={attendance.studentId}
                            style={[
                                styles.studentCard,
                                { backgroundColor: theme.surface, borderBottomColor: theme.border },
                            ]}
                        >
                            <View style={styles.studentRow}>
                                <View style={styles.studentInfo}>
                                    <Text style={[styles.studentName, { color: theme.text }]}>
                                        {attendance.student.firstName} {attendance.student.lastName}
                                    </Text>
                                    {expandedStudent === attendance.studentId && attendance.notes && (
                                        <Text style={[styles.notesPreview, { color: theme.textSecondary }]}>
                                            {attendance.notes}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.studentControls}>
                                    {attendance.present && attendance.late && (
                                        <MaterialCommunityIcons
                                            name="clock-alert"
                                            size={20}
                                            color="#FF9800"
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                    <Switch
                                        value={attendance.present}
                                        onValueChange={() => handleTogglePresence(attendance.studentId)}
                                        color={classColor}
                                    />
                                    <TouchableOpacity
                                        style={styles.expandButton}
                                        onPress={() =>
                                            setExpandedStudent(
                                                expandedStudent === attendance.studentId ? null : attendance.studentId
                                            )
                                        }
                                    >
                                        <MaterialCommunityIcons
                                            name={expandedStudent === attendance.studentId ? 'chevron-up' : 'chevron-down'}
                                            size={24}
                                            color={theme.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Expanded details */}
                            {expandedStudent === attendance.studentId && (
                                <View style={styles.expandedContent}>
                                    {attendance.present && (
                                        <View style={styles.lateSection}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.lateToggleButton,
                                                    attendance.late && { 
                                                        backgroundColor: '#FFF3E0',
                                                        borderColor: '#FF9800'
                                                    }
                                                ]}
                                                onPress={() => handleToggleLate(attendance.studentId)}
                                                activeOpacity={0.7}
                                            >
                                                <MaterialCommunityIcons
                                                    name={attendance.late ? 'clock-check' : 'clock-outline'}
                                                    size={20}
                                                    color={attendance.late ? '#FF9800' : theme.textSecondary}
                                                />
                                                <Text style={[
                                                    styles.lateToggleText,
                                                    { color: attendance.late ? '#FF9800' : theme.text }
                                                ]}>
                                                    {attendance.late ? 'En retard' : 'Marquer en retard'}
                                                </Text>
                                            </TouchableOpacity>
                                            
                                            {attendance.late && (
                                                <View style={styles.minutesInput}>
                                                    <Text style={[styles.minutesLabel, { color: theme.textSecondary }]}>
                                                        Retard de
                                                    </Text>
                                                    <TextInput
                                                        style={[
                                                            styles.input,
                                                            {
                                                                backgroundColor: theme.background,
                                                                color: theme.text,
                                                                borderColor: theme.border,
                                                            },
                                                        ]}
                                                        placeholder="5"
                                                        placeholderTextColor={theme.textTertiary}
                                                        keyboardType="number-pad"
                                                        value={attendance.lateMinutes?.toString() || ''}
                                                        onChangeText={text => handleLateMinutesChange(attendance.studentId, text)}
                                                    />
                                                    <Text style={[styles.minutesLabel, { color: theme.textSecondary }]}>
                                                        min
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    <View style={styles.notesSection}>
                                        <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>Notes</Text>
                                        <TextInput
                                            style={[
                                                styles.notesInput,
                                                {
                                                    backgroundColor: theme.background,
                                                    color: theme.text,
                                                    borderColor: theme.border,
                                                },
                                            ]}
                                            placeholder="Remarques, justificatif d'absence..."
                                            placeholderTextColor={theme.textTertiary}
                                            multiline
                                            numberOfLines={3}
                                            value={attendance.notes || ''}
                                            onChangeText={text => handleNotesChange(attendance.studentId, text)}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 16,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
    },
    quickButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 8,
    },
    quickButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    studentCard: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    notesPreview: {
        fontSize: 14,
        marginTop: 4,
        fontStyle: 'italic',
    },
    studentControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandButton: {
        marginLeft: 8,
        padding: 4,
    },
    expandedContent: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    lateSection: {
        marginBottom: 12,
    },
    lateToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
        gap: 8,
        marginBottom: 12,
    },
    lateToggleText: {
        fontSize: 15,
        fontWeight: '600',
    },
    lateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -8,
    },
    lateLabel: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 8,
    },
    minutesInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        width: 70,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        textAlign: 'center',
    },
    minutesLabel: {
        fontSize: 14,
    },
    notesSection: {
        marginTop: 8,
    },
    notesLabel: {
        fontSize: 13,
        marginBottom: 6,
        fontWeight: '500',
    },
    notesInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
    },
});
