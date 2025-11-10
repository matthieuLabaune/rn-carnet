import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Dimensions } from 'react-native';
import { Text, SegmentedButtons, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Sequence, Session, Class } from '../types';
import { sequenceService, sessionService, classService } from '../services';
import { SPACING } from '../utils';
import SequenceFormDialog from '../components/SequenceFormDialog';

type SequencePlanningScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SequencePlanning'
>;
type SequencePlanningScreenRouteProp = RouteProp<RootStackParamList, 'SequencePlanning'>;

interface Props {
    navigation: SequencePlanningScreenNavigationProp;
    route: SequencePlanningScreenRouteProp;
}

type ViewMode = 'list' | 'day' | 'week' | 'month';

interface SequenceWithClass extends Sequence {
    class?: Class;
}

export default function SequencePlanningScreen({ navigation, route }: Props) {
    const { classId, className, classColor } = route.params;
    const [sequences, setSequences] = useState<SequenceWithClass[]>([]);
    const [allClasses, setAllClasses] = useState<Class[]>([]);
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [sessionSequences, setSessionSequences] = useState<Map<string, Sequence>>(new Map());
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [statistics, setStatistics] = useState({
        totalSequences: 0,
        totalSessions: 0,
        assignedSessions: 0,
        unassignedSessions: 0,
        completionPercentage: 0,
    });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingSequence, setEditingSequence] = useState<Sequence | undefined>();
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (viewMode !== 'list') {
            loadTimelineData();
        }
    }, [selectedClassIds, viewMode]);

    const loadData = async () => {
        try {
            setLoading(true);
            const classes = await classService.getAll();
            setAllClasses(classes);

            // Initialiser selectedClassIds avec toutes les classes si vide
            if (selectedClassIds.length === 0) {
                setSelectedClassIds(classes.map(c => c.id));
            }

            // En mode liste, charger toutes les séquences de toutes les classes
            const allSequences: SequenceWithClass[] = [];
            const allStats = {
                totalSequences: 0,
                totalSessions: 0,
                assignedSessions: 0,
                unassignedSessions: 0,
                completionPercentage: 0,
            };

            for (const cls of classes) {
                const classSeqs = await sequenceService.getByClass(cls.id);
                const sequencesWithClass = classSeqs.map(seq => ({
                    ...seq,
                    class: cls,
                }));
                allSequences.push(...sequencesWithClass);

                const classStats = await sequenceService.getClassStatistics(cls.id);
                allStats.totalSequences += classStats.totalSequences;
                allStats.totalSessions += classStats.totalSessions;
                allStats.assignedSessions += classStats.assignedSessions;
                allStats.unassignedSessions += classStats.unassignedSessions;
            }

            // Calculer le pourcentage global
            if (allStats.totalSessions > 0) {
                allStats.completionPercentage = Math.round(
                    (allStats.assignedSessions / allStats.totalSessions) * 100
                );
            }

            setSequences(allSequences);
            setStatistics(allStats);
        } catch (error) {
            console.error('Error loading sequences:', error);
            Alert.alert('Erreur', 'Impossible de charger les séquences');
        } finally {
            setLoading(false);
        }
    };

    const loadTimelineData = async () => {
        try {
            // Charger toutes les séances des classes sélectionnées
            const allSessionsData: Session[] = [];
            for (const classId of selectedClassIds) {
                const classSessions = await sessionService.getByClass(classId);
                allSessionsData.push(...classSessions);
            }

            // Charger les séquences pour chaque séance
            const sequenceMap = new Map<string, Sequence>();
            await Promise.all(allSessionsData.map(async (session) => {
                const sequence = await sequenceService.getSequenceBySession(session.id);
                if (sequence) {
                    sequenceMap.set(session.id, sequence);
                }
            }));

            setAllSessions(allSessionsData);
            setSessionSequences(sequenceMap);
        } catch (error) {
            console.error('Error loading timeline data:', error);
        }
    };

    const toggleClassFilter = (classId: string) => {
        setSelectedClassIds(prev => {
            if (prev.includes(classId)) {
                // Ne pas permettre de tout désélectionner
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== classId);
            } else {
                return [...prev, classId];
            }
        });
    };

    const getClassById = (classId: string): Class | undefined => {
        return allClasses.find(c => c.id === classId);
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);

        switch (viewMode) {
            case 'day':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
        }

        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getDateRangeLabel = () => {
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };

        switch (viewMode) {
            case 'day':
                return currentDate.toLocaleDateString('fr-FR', options);

            case 'week':
                const weekStart = getWeekStart(currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', options)}`;

            case 'month':
                return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

            default:
                return '';
        }
    };

    const getWeekStart = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const getFilteredSessions = (): Session[] => {
        const filtered = allSessions.filter(session =>
            selectedClassIds.includes(session.classId)
        );

        switch (viewMode) {
            case 'day':
                return filtered.filter(session => {
                    const sessionDate = new Date(session.date);
                    return (
                        sessionDate.getDate() === currentDate.getDate() &&
                        sessionDate.getMonth() === currentDate.getMonth() &&
                        sessionDate.getFullYear() === currentDate.getFullYear()
                    );
                });

            case 'week':
                const weekStart = getWeekStart(currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);

                return filtered.filter(session => {
                    const sessionDate = new Date(session.date);
                    return sessionDate >= weekStart && sessionDate < weekEnd;
                });

            case 'month':
                return filtered.filter(session => {
                    const sessionDate = new Date(session.date);
                    return (
                        sessionDate.getMonth() === currentDate.getMonth() &&
                        sessionDate.getFullYear() === currentDate.getFullYear()
                    );
                });

            default:
                return filtered;
        }
    };

    // CRUD Operations (conservées de l'ancien code)
    const handleCreateSequence = async (data: any) => {
        try {
            await sequenceService.create(data);
            setDialogVisible(false);
            loadData();
            Alert.alert('Succès', 'Séquence créée avec succès');
        } catch (error) {
            console.error('Error creating sequence:', error);
            Alert.alert('Erreur', 'Impossible de créer la séquence');
        }
    };

    const handleEditSequence = async (data: any) => {
        if (!editingSequence) return;

        try {
            await sequenceService.update(editingSequence.id, data);
            setDialogVisible(false);
            setEditingSequence(undefined);
            loadData();
            Alert.alert('Succès', 'Séquence modifiée avec succès');
        } catch (error) {
            console.error('Error updating sequence:', error);
            Alert.alert('Erreur', 'Impossible de modifier la séquence');
        }
    };

    const handleDeleteSequence = (sequence: Sequence) => {
        Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer la séquence "${sequence.name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await sequenceService.delete(sequence.id);
                            loadData();
                            Alert.alert('Succès', 'Séquence supprimée');
                        } catch (error) {
                            console.error('Error deleting sequence:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer la séquence');
                        }
                    },
                },
            ]
        );
    };

    const handleAssignSequence = (sequence: Sequence) => {
        navigation.navigate('SequenceAssignment', {
            sequenceId: sequence.id,
            sequenceName: sequence.name,
            sessionCount: sequence.sessionCount,
            classId,
            className,
            classColor,
        });
    };

    const openEditDialog = (sequence: Sequence) => {
        setEditingSequence(sequence);
        setDialogVisible(true);
    };

    const openCreateDialog = () => {
        setEditingSequence(undefined);
        setDialogVisible(true);
    };

    const closeDialog = () => {
        setDialogVisible(false);
        setEditingSequence(undefined);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return 'check-circle';
            case 'in-progress':
                return 'progress-clock';
            case 'planned':
            default:
                return 'calendar-clock';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Terminée';
            case 'in-progress':
                return 'En cours';
            case 'planned':
            default:
                return 'Planifiée';
        }
    };

    // Render Methods pour Timeline (similaire à SequenceTimelineScreen)
    const renderDayView = () => {
        const filteredSessions = getFilteredSessions();

        if (filteredSessions.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="calendar-blank" size={64} color="#CCC" />
                    <Text style={styles.emptyText}>Aucune séance ce jour</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.timelineScrollContent}>
                {filteredSessions
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(session => {
                        const sequence = sessionSequences.get(session.id);
                        const sessionDate = new Date(session.date);
                        const sessionClass = getClassById(session.classId);

                        return (
                            <TouchableOpacity
                                key={session.id}
                                style={[
                                    styles.sessionCard,
                                    { borderLeftColor: sessionClass?.color || '#ccc' }
                                ]}
                                onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                            >
                                <View style={styles.sessionTime}>
                                    <Text style={styles.sessionTimeText}>
                                        {sessionDate.toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                    <Text style={styles.sessionDuration}>{session.duration} min</Text>
                                </View>

                                <View style={styles.sessionContent}>
                                    <View style={styles.sessionClassTag}>
                                        <View style={[styles.classColorDot, { backgroundColor: sessionClass?.color }]} />
                                        <Text style={styles.sessionClassName}>{sessionClass?.name}</Text>
                                    </View>
                                    <Text style={styles.sessionSubject}>{session.subject}</Text>
                                    {session.description && (
                                        <Text style={styles.sessionDescription} numberOfLines={2}>
                                            {session.description}
                                        </Text>
                                    )}
                                    {sequence && (
                                        <View style={[styles.sequenceBadge, { backgroundColor: sequence.color }]}>
                                            <Text style={styles.sequenceBadgeText}>{sequence.name}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
            </ScrollView>
        );
    };

    const renderWeekView = () => {
        const weekStart = getWeekStart(currentDate);
        // Seulement 6 jours : Lundi à Samedi (index 0-5)
        const days = Array.from({ length: 6 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return date;
        });

        const filteredSessions = getFilteredSessions();
        const sessionsByDay = new Map<string, Session[]>();

        filteredSessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const dayKey = sessionDate.toISOString().split('T')[0];

            if (!sessionsByDay.has(dayKey)) {
                sessionsByDay.set(dayKey, []);
            }
            sessionsByDay.get(dayKey)!.push(session);
        });

        // Diviser les jours en 2 rangées de 3
        const firstRow = days.slice(0, 3); // Lun, Mar, Mer
        const secondRow = days.slice(3, 6); // Jeu, Ven, Sam

        const renderDayColumn = (day: Date) => {
            const dayKey = day.toISOString().split('T')[0];
            const daySessions = sessionsByDay.get(dayKey) || [];
            const isToday = day.toDateString() === new Date().toDateString();

            return (
                <View key={dayKey} style={styles.dayColumn}>
                    <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
                        <Text style={[styles.dayName, isToday && styles.todayText]}>
                            {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                            {day.getDate()}
                        </Text>
                    </View>

                    <ScrollView style={styles.daySessionsContainer}>
                        {daySessions.length === 0 ? (
                            <View style={styles.noSession}>
                                <Text style={styles.noSessionText}>—</Text>
                            </View>
                        ) : (
                            daySessions
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(session => {
                                    const sequence = sessionSequences.get(session.id);
                                    const sessionClass = getClassById(session.classId);
                                    const sessionDate = new Date(session.date);

                                    return (
                                        <TouchableOpacity
                                            key={session.id}
                                            style={[
                                                styles.weekSessionCard,
                                                { backgroundColor: sequence?.color || sessionClass?.color || '#ccc' }
                                            ]}
                                            onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                                        >
                                            <Text style={styles.weekSessionTime}>
                                                {sessionDate.toLocaleTimeString('fr-FR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Text>
                                            <Text style={styles.weekSessionSubject} numberOfLines={2}>
                                                {session.subject}
                                            </Text>
                                            <Text style={styles.weekSessionClass} numberOfLines={1}>
                                                {sessionClass?.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                        )}
                    </ScrollView>
                </View>
            );
        };

        return (
            <ScrollView style={styles.timelineScrollContent} showsVerticalScrollIndicator={false}>
                {/* Première rangée : Lun, Mar, Mer */}
                <View style={styles.weekRow}>
                    {firstRow.map(day => renderDayColumn(day))}
                </View>

                {/* Deuxième rangée : Jeu, Ven, Sam */}
                <View style={styles.weekRow}>
                    {secondRow.map(day => renderDayColumn(day))}
                </View>
            </ScrollView>
        );
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);

        const startDay = new Date(firstDay);
        const dayOfWeek = startDay.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDay.setDate(startDay.getDate() - diff);

        const calendarDays: Date[] = [];
        for (let i = 0; i < 42; i++) {
            const day = new Date(startDay);
            day.setDate(day.getDate() + i);
            calendarDays.push(day);
        }

        const filteredSessions = getFilteredSessions();
        const sessionsByDay = new Map<string, Session[]>();

        filteredSessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const dayKey = sessionDate.toISOString().split('T')[0];

            if (!sessionsByDay.has(dayKey)) {
                sessionsByDay.set(dayKey, []);
            }
            sessionsByDay.get(dayKey)!.push(session);
        });

        return (
            <View style={styles.monthContainer}>
                <View style={styles.weekDaysHeader}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                        <Text key={index} style={styles.weekDayLabel}>{day}</Text>
                    ))}
                </View>

                <View style={styles.calendarGrid}>
                    {calendarDays.map((day, index) => {
                        const dayKey = day.toISOString().split('T')[0];
                        const daySessions = sessionsByDay.get(dayKey) || [];
                        const isCurrentMonth = day.getMonth() === month;
                        const isToday = day.toDateString() === new Date().toDateString();

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.calendarDay,
                                    isToday && styles.calendarDayToday,
                                    !isCurrentMonth && styles.calendarDayOtherMonth
                                ]}
                                onPress={() => {
                                    setCurrentDate(day);
                                    setViewMode('day');
                                }}
                            >
                                <Text style={[
                                    styles.calendarDayNumber,
                                    !isCurrentMonth && styles.calendarDayNumberOther,
                                    isToday && styles.calendarDayNumberToday
                                ]}>
                                    {day.getDate()}
                                </Text>

                                {daySessions.length > 0 && (
                                    <View style={styles.sessionIndicators}>
                                        {daySessions.slice(0, 3).map((session) => {
                                            const sequence = sessionSequences.get(session.id);
                                            const sessionClass = getClassById(session.classId);
                                            return (
                                                <View
                                                    key={session.id}
                                                    style={[
                                                        styles.sessionDot,
                                                        { backgroundColor: sequence?.color || sessionClass?.color || '#ccc' }
                                                    ]}
                                                />
                                            );
                                        })}
                                        {daySessions.length > 3 && (
                                            <Text style={styles.moreIndicator}>+{daySessions.length - 3}</Text>
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderListView = () => {
        return (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Statistiques */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Vue d'ensemble</Text>

                    <View style={styles.progressContainer}>
                        <Text style={styles.progressLabel}>
                            Progression globale : {statistics.completionPercentage}%
                        </Text>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        backgroundColor: classColor,
                                        width: `${statistics.completionPercentage}%`,
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.totalSessions}</Text>
                            <Text style={styles.statLabel}>Séances générées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.totalSequences}</Text>
                            <Text style={styles.statLabel}>Séquences créées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.assignedSessions}</Text>
                            <Text style={styles.statLabel}>Séances assignées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{statistics.unassignedSessions}</Text>
                            <Text style={styles.statLabel}>Séances libres</Text>
                        </View>
                    </View>
                </View>

                {/* Liste des séquences */}
                <View style={styles.sequencesHeader}>
                    <Text style={styles.sectionTitle}>Séquences du Programme</Text>
                </View>

                {sequences.length === 0 ? (
                    <TouchableOpacity
                        style={styles.emptyCard}
                        onPress={openCreateDialog}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>
                            Aucune séquence créée pour le moment.
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Créez votre première séquence pédagogique !
                        </Text>
                    </TouchableOpacity>
                ) : (
                    sequences.map((sequence, index) => (
                        <TouchableOpacity
                            key={sequence.id}
                            style={styles.sequenceCard}
                            onPress={() => navigation.navigate('SequenceDetail', { sequenceId: sequence.id })}
                            activeOpacity={0.7}
                        >
                            <View style={styles.sequenceHeader}>
                                <View style={styles.sequenceHeaderLeft}>
                                    <View
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: sequence.color },
                                        ]}
                                    />
                                    <View style={styles.sequenceHeaderText}>
                                        <View style={styles.sequenceNameRow}>
                                            <MaterialCommunityIcons
                                                name={getStatusIcon(sequence.status)}
                                                size={16}
                                                color="#666"
                                            />
                                            <Text style={styles.sequenceName}>Séquence {sequence.order}</Text>
                                            {sequence.class && (
                                                <View
                                                    style={[
                                                        styles.classTag,
                                                        {
                                                            backgroundColor: sequence.class.color + '20',
                                                            borderColor: sequence.class.color
                                                        }
                                                    ]}
                                                >
                                                    <View style={[styles.classTagDot, { backgroundColor: sequence.class.color }]} />
                                                    <Text style={[styles.classTagText, { color: sequence.class.color }]}>
                                                        {sequence.class.name}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.sequenceTitle}>{sequence.name}</Text>
                                    </View>
                                </View>
                                <View style={styles.sequenceActions}>
                                    <TouchableOpacity
                                        onPress={() => openEditDialog(sequence)}
                                        style={styles.iconButton}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={20} color="#666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteSequence(sequence)}
                                        style={styles.iconButton}
                                    >
                                        <MaterialCommunityIcons name="delete" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {sequence.theme && (
                                <View style={styles.sequenceThemeContainer}>
                                    <MaterialCommunityIcons name="book-open-variant" size={14} color="#666" />
                                    <Text style={styles.sequenceTheme}>{sequence.theme}</Text>
                                </View>
                            )}

                            {sequence.description && (
                                <Text style={styles.sequenceDescription}>
                                    {sequence.description}
                                </Text>
                            )}

                            <View style={styles.sequenceStats}>
                                <Text style={styles.sequenceStatText}>
                                    {sequence.sessionCount} séances • {getStatusLabel(sequence.status)}
                                </Text>
                            </View>

                            {sequence.objectives && sequence.objectives.length > 0 && (
                                <View style={styles.objectivesContainer}>
                                    <Text style={styles.objectivesTitle}>Objectifs :</Text>
                                    {sequence.objectives.slice(0, 2).map((obj, idx) => (
                                        <Text key={idx} style={styles.objectiveText}>
                                            • {obj}
                                        </Text>
                                    ))}
                                    {sequence.objectives.length > 2 && (
                                        <Text style={styles.objectiveMore}>
                                            +{sequence.objectives.length - 2} autre(s)
                                        </Text>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.assignButton, { backgroundColor: sequence.color }]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleAssignSequence(sequence);
                                }}
                            >
                                <MaterialCommunityIcons name="calendar-check" size={18} color="#fff" />
                                <Text style={styles.assignButtonText}>
                                    Assigner aux séances
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Séquences Pédagogiques</Text>
                        <Text style={styles.headerSubtitle}>
                            {sequences.length} séquence{sequences.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    {sequences.length > 0 && viewMode === 'list' && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={openCreateDialog}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Onglets de navigation */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, viewMode === 'list' && styles.tabActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <MaterialCommunityIcons
                            name="format-list-bulleted"
                            size={20}
                            color={viewMode === 'list' ? '#007AFF' : 'rgba(255, 255, 255, 0.9)'}
                        />
                        <Text style={[styles.tabText, viewMode === 'list' && styles.tabTextActive]}>
                            Liste
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, viewMode !== 'list' && styles.tabActive]}
                        onPress={() => setViewMode('day')}
                    >
                        <MaterialCommunityIcons
                            name="calendar-month"
                            size={20}
                            color={viewMode !== 'list' ? '#007AFF' : 'rgba(255, 255, 255, 0.9)'}
                        />
                        <Text style={[styles.tabText, viewMode !== 'list' && styles.tabTextActive]}>
                            Calendrier
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sélecteur de vue calendrier (seulement en mode calendrier) */}
            {viewMode !== 'list' && (
                <View style={styles.controlsContainer}>
                    <SegmentedButtons
                        value={viewMode}
                        onValueChange={(value) => setViewMode(value as ViewMode)}
                        buttons={[
                            { value: 'day', label: 'Jour', icon: 'calendar-today' },
                            { value: 'week', label: 'Semaine', icon: 'calendar-week' },
                            { value: 'month', label: 'Mois', icon: 'calendar-month' },
                        ]}
                        style={styles.segmentedButtons}
                    />
                </View>
            )}

            {/* Filtres classes (seulement en mode timeline) */}
            {viewMode !== 'list' && (
                <>
                    <TouchableOpacity
                        style={styles.filterToggle}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <MaterialCommunityIcons
                            name={showFilters ? 'filter' : 'filter-outline'}
                            size={20}
                            color={classColor}
                        />
                        <Text style={[styles.filterToggleText, { color: classColor }]}>
                            Filtrer par classe ({selectedClassIds.length})
                        </Text>
                        <MaterialCommunityIcons
                            name={showFilters ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={classColor}
                        />
                    </TouchableOpacity>

                    {showFilters && (
                        <View style={styles.filtersContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {allClasses.map(cls => (
                                    <Chip
                                        key={cls.id}
                                        selected={selectedClassIds.includes(cls.id)}
                                        onPress={() => toggleClassFilter(cls.id)}
                                        style={[
                                            styles.filterChip,
                                            selectedClassIds.includes(cls.id) && { backgroundColor: cls.color }
                                        ]}
                                        textStyle={[
                                            styles.filterChipText,
                                            selectedClassIds.includes(cls.id) && { color: '#FFFFFF' }
                                        ]}
                                        icon={() => (
                                            <View style={[styles.chipDot, { backgroundColor: cls.color }]} />
                                        )}
                                    >
                                        {cls.name}
                                    </Chip>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Navigation date */}
                    <View style={styles.dateNavigation}>
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateDate('prev')}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={24} color={classColor} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dateLabel} onPress={goToToday}>
                            <Text style={styles.dateLabelText}>{getDateRangeLabel()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateDate('next')}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={24} color={classColor} />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Contenu selon le mode */}
            <View style={styles.content}>
                {viewMode === 'list' && renderListView()}
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
            </View>

            <SequenceFormDialog
                visible={dialogVisible}
                onDismiss={closeDialog}
                onSubmit={editingSequence ? handleEditSequence : handleCreateSequence}
                classId={classId}
                initialData={editingSequence}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#007AFF',
        paddingTop: 60,
        paddingBottom: 0,
        borderBottomWidth: 0,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 21,
        gap: 6,
    },
    tabActive: {
        backgroundColor: '#FFFFFF',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    tabTextActive: {
        color: '#007AFF',
    },
    controlsContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    segmentedButtons: {
        backgroundColor: '#FFFFFF',
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        gap: 8,
    },
    filterToggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    filtersContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    filterChip: {
        marginRight: SPACING.xs,
    },
    filterChipText: {
        fontSize: 13,
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dateNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    navButton: {
        padding: 8,
    },
    dateLabel: {
        flex: 1,
        alignItems: 'center',
    },
    dateLabelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: SPACING.md,
    },
    timelineScrollContent: {
        flex: 1,
    },

    // List View Styles
    statsCard: {
        marginBottom: SPACING.md,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: SPACING.md,
    },
    progressContainer: {
        marginBottom: SPACING.md,
    },
    progressLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    statItem: {
        flex: 1,
        minWidth: '45%',
        padding: SPACING.sm,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    sequencesHeader: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        minHeight: 200,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: SPACING.xs,
        textAlign: 'center',
        marginTop: SPACING.md,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    sequenceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sequenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    sequenceHeaderLeft: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'flex-start',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 6,
        marginRight: SPACING.sm,
    },
    sequenceHeaderText: {
        flex: 1,
    },
    sequenceNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
        flexWrap: 'wrap',
    },
    sequenceName: {
        fontSize: 12,
        color: '#666',
    },
    classTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        gap: 4,
    },
    classTagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    classTagText: {
        fontSize: 10,
        fontWeight: '600',
    },
    sequenceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sequenceActions: {
        flexDirection: 'row',
        marginLeft: SPACING.sm,
    },
    iconButton: {
        padding: 8,
    },
    sequenceThemeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.xs,
    },
    sequenceTheme: {
        fontSize: 14,
        color: '#666',
    },
    sequenceDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: SPACING.sm,
        lineHeight: 20,
    },
    sequenceStats: {
        marginBottom: SPACING.sm,
    },
    sequenceStatText: {
        fontSize: 14,
        color: '#999',
    },
    objectivesContainer: {
        backgroundColor: '#f9f9f9',
        padding: SPACING.sm,
        borderRadius: 8,
        marginBottom: SPACING.sm,
    },
    objectivesTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: SPACING.xs,
    },
    objectiveText: {
        fontSize: 12,
        color: '#666',
        marginLeft: SPACING.xs,
        lineHeight: 18,
    },
    objectiveMore: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginLeft: SPACING.xs,
        marginTop: SPACING.xs,
    },
    assignButton: {
        flexDirection: 'row',
        padding: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xs,
    },
    assignButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: SPACING.xs,
    },

    // Timeline Views Styles (Day/Week/Month)
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    sessionCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.xs,
        borderRadius: 12,
        padding: SPACING.md,
        flexDirection: 'row',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionTime: {
        marginRight: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    sessionTimeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    sessionDuration: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    sessionContent: {
        flex: 1,
    },
    sessionClassTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    classColorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    sessionClassName: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    sessionSubject: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    sessionDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    sequenceBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        marginTop: 8,
    },
    sequenceBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Week View
    weekContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.xs,
    },
    weekRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
    },
    dayColumn: {
        flex: 1,
        marginHorizontal: SPACING.xs,
    },
    dayHeader: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: SPACING.xs,
    },
    todayHeader: {
        backgroundColor: '#007AFF',
    },
    dayName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
    },
    dayNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 2,
    },
    todayText: {
        color: '#FFFFFF',
    },
    daySessionsContainer: {
        flex: 1,
    },
    noSession: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    noSessionText: {
        fontSize: 24,
        color: '#DDD',
    },
    weekSessionCard: {
        padding: SPACING.sm,
        borderRadius: 8,
        marginBottom: SPACING.xs,
    },
    weekSessionTime: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    weekSessionSubject: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    weekSessionClass: {
        fontSize: 10,
        color: '#FFFFFF',
        opacity: 0.8,
        marginTop: 2,
    },

    // Month View
    monthContainer: {
        padding: SPACING.sm,
    },
    weekDaysHeader: {
        flexDirection: 'row',
        marginBottom: SPACING.xs,
    },
    weekDayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        padding: 4,
        borderWidth: 0.5,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    calendarDayToday: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    calendarDayOtherMonth: {
        backgroundColor: '#FAFAFA',
    },
    calendarDayNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    calendarDayNumberOther: {
        color: '#CCC',
    },
    calendarDayNumberToday: {
        color: '#007AFF',
    },
    sessionIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        flexWrap: 'wrap',
        gap: 2,
    },
    sessionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    moreIndicator: {
        fontSize: 8,
        color: '#666',
        marginLeft: 2,
    },
});
