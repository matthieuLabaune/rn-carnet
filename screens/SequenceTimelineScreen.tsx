import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { sessionService, sequenceService } from '../services';
import { Session, Sequence } from '../types';
import { SPACING } from '../utils';

type SequenceTimelineScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'SequenceTimeline'
>;
type SequenceTimelineScreenRouteProp = RouteProp<RootStackParamList, 'SequenceTimeline'>;

interface Props {
    navigation: SequenceTimelineScreenNavigationProp;
    route: SequenceTimelineScreenRouteProp;
}

type ViewMode = 'day' | 'week' | 'month';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SequenceTimelineScreen({ navigation, route }: Props) {
    const { classId, className, classColor } = route.params;
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionSequences, setSessionSequences] = useState<Map<string, Sequence>>(new Map());
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        loadData();
    }, [classId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const sessionsData = await sessionService.getByClass(classId);

            // Charger les séquences pour chaque séance
            const sequenceMap = new Map<string, Sequence>();
            await Promise.all(sessionsData.map(async (session) => {
                const sequence = await sequenceService.getSequenceBySession(session.id);
                if (sequence) {
                    sequenceMap.set(session.id, sequence);
                }
            }));

            setSessions(sessionsData);
            setSessionSequences(sequenceMap);
        } catch (error) {
            console.error('Error loading timeline data:', error);
        } finally {
            setLoading(false);
        }
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
        }
    };

    const getWeekStart = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
        return new Date(d.setDate(diff));
    };

    const getFilteredSessions = (): Session[] => {
        switch (viewMode) {
            case 'day':
                return sessions.filter(session => {
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

                return sessions.filter(session => {
                    const sessionDate = new Date(session.date);
                    return sessionDate >= weekStart && sessionDate < weekEnd;
                });

            case 'month':
                return sessions.filter(session => {
                    const sessionDate = new Date(session.date);
                    return (
                        sessionDate.getMonth() === currentDate.getMonth() &&
                        sessionDate.getFullYear() === currentDate.getFullYear()
                    );
                });
        }
    };

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
            <ScrollView style={styles.scrollContent}>
                {filteredSessions
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(session => {
                        const sequence = sessionSequences.get(session.id);
                        const sessionDate = new Date(session.date);

                        return (
                            <TouchableOpacity
                                key={session.id}
                                style={[
                                    styles.sessionCard,
                                    { borderLeftColor: classColor }
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
        const days = Array.from({ length: 7 }, (_, i) => {
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

        return (
            <ScrollView style={styles.scrollContent} horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.weekContainer}>
                    {days.map(day => {
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
                                                const sessionDate = new Date(session.date);

                                                return (
                                                    <TouchableOpacity
                                                        key={session.id}
                                                        style={[
                                                            styles.weekSessionCard,
                                                            { backgroundColor: sequence?.color || classColor }
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
                                                    </TouchableOpacity>
                                                );
                                            })
                                    )}
                                </ScrollView>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Trouver le lundi précédent le 1er du mois
        const startDay = new Date(firstDay);
        const dayOfWeek = startDay.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDay.setDate(startDay.getDate() - diff);

        // Créer un tableau de 42 jours (6 semaines max)
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
                {/* Jours de la semaine */}
                <View style={styles.weekDaysHeader}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                        <Text key={index} style={styles.weekDayLabel}>{day}</Text>
                    ))}
                </View>

                {/* Grille calendrier */}
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
                                            return (
                                                <View
                                                    key={session.id}
                                                    style={[
                                                        styles.sessionDot,
                                                        { backgroundColor: sequence?.color || classColor }
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

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={[styles.header, { backgroundColor: classColor }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Timeline</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text>Chargement...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: classColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{className}</Text>
                    <Text style={styles.headerSubtitle}>Timeline</Text>
                </View>
            </View>

            {/* Sélecteur de vue */}
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

            {/* Contenu selon le mode */}
            <View style={styles.content}>
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 2,
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
    scrollContent: {
        flex: 1,
    },

    // Day View
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
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
    dayColumn: {
        width: 120,
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
