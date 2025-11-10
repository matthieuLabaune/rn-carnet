import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
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

interface MonthData {
    monthKey: string;
    monthLabel: string;
    sessions: (Session & { sequence?: Sequence })[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = 40;

export default function SequenceTimelineScreen({ navigation, route }: Props) {
    const { classId, className, classColor } = route.params;
    const [sessions, setSessions] = useState<(Session & { sequence?: Sequence })[]>([]);
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [classId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sessionsData, sequencesData] = await Promise.all([
                sessionService.getByClass(classId),
                sequenceService.getByClass(classId),
            ]);

            // Charger les séquences pour chaque séance
            const sessionsWithSequences = await Promise.all(
                sessionsData.map(async (session) => {
                    const sequence = await sequenceService.getSequenceBySession(session.id);
                    return { ...session, sequence: sequence || undefined };
                })
            );

            setSessions(sessionsWithSequences);
            setSequences(sequencesData);
        } catch (error) {
            console.error('Error loading timeline data:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupSessionsByMonth = (): MonthData[] => {
        const groups: { [key: string]: (Session & { sequence?: Sequence })[] } = {};

        sessions
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach((session) => {
                const date = new Date(session.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!groups[monthKey]) {
                    groups[monthKey] = [];
                }
                groups[monthKey].push(session);
            });

        return Object.entries(groups).map(([key, sessions]) => {
            const monthLabel = new Date(sessions[0].date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
            });
            return { monthKey: key, monthLabel, sessions };
        });
    };

    const renderMonthTimeline = (monthData: MonthData) => {
        const firstDate = new Date(monthData.sessions[0].date);
        const year = firstDate.getFullYear();
        const month = firstDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        return (
            <View key={monthData.monthKey} style={styles.monthContainer}>
                <TouchableOpacity
                    style={styles.monthHeader}
                    onPress={() => setSelectedMonth(selectedMonth === monthData.monthKey ? null : monthData.monthKey)}
                >
                    <Text style={styles.monthTitle}>{monthData.monthLabel}</Text>
                    <View style={styles.monthStats}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                        <Text style={styles.monthStatsText}>
                            {monthData.sessions.length} séance{monthData.sessions.length > 1 ? 's' : ''}
                        </Text>
                    </View>
                    <MaterialCommunityIcons
                        name={selectedMonth === monthData.monthKey ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>

                {selectedMonth === monthData.monthKey && (
                    <View style={styles.timelineContainer}>
                        {/* Grille des jours */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.daysScroll}
                        >
                            <View style={styles.daysGrid}>
                                {/* En-têtes des jours */}
                                <View style={styles.daysHeader}>
                                    {Array.from({ length: daysInMonth }, (_, i) => {
                                        const day = i + 1;
                                        const date = new Date(year, month, day);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const hasSession = monthData.sessions.some(
                                            (s) => new Date(s.date).getDate() === day
                                        );

                                        return (
                                            <View
                                                key={day}
                                                style={[
                                                    styles.dayCell,
                                                    isWeekend && styles.weekendCell,
                                                    hasSession && styles.hasSessionCell,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dayNumber,
                                                        isWeekend && styles.weekendText,
                                                        hasSession && styles.hasSessionText,
                                                    ]}
                                                >
                                                    {day}
                                                </Text>
                                                <Text style={styles.dayName}>
                                                    {date.toLocaleDateString('fr-FR', { weekday: 'narrow' })}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Séquences */}
                                <View style={styles.sequencesContainer}>
                                    {sequences.map((sequence) => {
                                        const sequenceSessions = monthData.sessions.filter(
                                            (s) => s.sequence?.id === sequence.id
                                        );

                                        if (sequenceSessions.length === 0) return null;

                                        return (
                                            <View key={sequence.id} style={styles.sequenceRow}>
                                                <View style={styles.sequenceLabel}>
                                                    <View
                                                        style={[
                                                            styles.sequenceColorDot,
                                                            { backgroundColor: sequence.color },
                                                        ]}
                                                    />
                                                    <Text style={styles.sequenceLabelText} numberOfLines={1}>
                                                        {sequence.name}
                                                    </Text>
                                                </View>
                                                <View style={styles.sequenceTimeline}>
                                                    {sequenceSessions.map((session) => {
                                                        const sessionDay = new Date(session.date).getDate();
                                                        const leftPosition = (sessionDay - 1) * DAY_WIDTH;

                                                        return (
                                                            <TouchableOpacity
                                                                key={session.id}
                                                                style={[
                                                                    styles.sessionBlock,
                                                                    {
                                                                        left: leftPosition,
                                                                        backgroundColor: sequence.color,
                                                                    },
                                                                ]}
                                                                onPress={() =>
                                                                    navigation.navigate('SessionDetail', {
                                                                        sessionId: session.id,
                                                                    })
                                                                }
                                                            >
                                                                <Text
                                                                    style={styles.sessionBlockText}
                                                                    numberOfLines={1}
                                                                >
                                                                    {session.subject}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        );
                                    })}

                                    {/* Séances sans séquence */}
                                    {monthData.sessions.filter((s) => !s.sequence).length > 0 && (
                                        <View style={styles.sequenceRow}>
                                            <View style={styles.sequenceLabel}>
                                                <View
                                                    style={[
                                                        styles.sequenceColorDot,
                                                        { backgroundColor: '#ccc' },
                                                    ]}
                                                />
                                                <Text style={styles.sequenceLabelText}>Sans séquence</Text>
                                            </View>
                                            <View style={styles.sequenceTimeline}>
                                                {monthData.sessions
                                                    .filter((s) => !s.sequence)
                                                    .map((session) => {
                                                        const sessionDay = new Date(session.date).getDate();
                                                        const leftPosition = (sessionDay - 1) * DAY_WIDTH;

                                                        return (
                                                            <TouchableOpacity
                                                                key={session.id}
                                                                style={[
                                                                    styles.sessionBlock,
                                                                    {
                                                                        left: leftPosition,
                                                                        backgroundColor: '#ccc',
                                                                    },
                                                                ]}
                                                                onPress={() =>
                                                                    navigation.navigate('SessionDetail', {
                                                                        sessionId: session.id,
                                                                    })
                                                                }
                                                            >
                                                                <Text
                                                                    style={styles.sessionBlockText}
                                                                    numberOfLines={1}
                                                                >
                                                                    {session.subject}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: classColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Timeline</Text>
                    <Text style={styles.headerSubtitle}>{className}</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <MaterialCommunityIcons name="loading" size={48} color="#ccc" />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : sessions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="calendar-blank" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>Aucune séance</Text>
                        <Text style={styles.emptyText}>
                            Créez des séances pour visualiser la timeline
                        </Text>
                    </View>
                ) : (
                    groupSessionsByMonth().map((monthData) => renderMonthTimeline(monthData))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: SPACING.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: SPACING.md,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    monthContainer: {
        marginBottom: SPACING.md,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: SPACING.md,
        marginHorizontal: SPACING.md,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    monthTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        textTransform: 'capitalize',
    },
    monthStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: SPACING.sm,
    },
    monthStatsText: {
        fontSize: 14,
        color: '#666',
    },
    timelineContainer: {
        marginTop: SPACING.sm,
        backgroundColor: '#fff',
        marginHorizontal: SPACING.md,
        borderRadius: 12,
        padding: SPACING.sm,
    },
    daysScroll: {
        flex: 1,
    },
    daysGrid: {
        minWidth: SCREEN_WIDTH - 32,
    },
    daysHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#e0e0e0',
        paddingBottom: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    dayCell: {
        width: DAY_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    weekendCell: {
        backgroundColor: '#f9f9f9',
    },
    hasSessionCell: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    weekendText: {
        color: '#999',
    },
    hasSessionText: {
        color: '#4CAF50',
        fontWeight: '700',
    },
    dayName: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    sequencesContainer: {
        gap: SPACING.sm,
    },
    sequenceRow: {
        flexDirection: 'row',
        minHeight: 50,
    },
    sequenceLabel: {
        width: 120,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: SPACING.xs,
        gap: 6,
    },
    sequenceColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    sequenceLabelText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    sequenceTimeline: {
        flex: 1,
        position: 'relative',
        minHeight: 40,
    },
    sessionBlock: {
        position: 'absolute',
        width: DAY_WIDTH - 4,
        height: 36,
        borderRadius: 6,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    sessionBlockText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
});
