import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { classService, sequenceService, sessionService } from '../services';
import { Class, Sequence, Session } from '../types';
import { SPACING } from '../utils';
import ClassFormDialog from '../components/ClassFormDialog';
import SequenceFormDialog from '../components/SequenceFormDialog';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
    navigation: HomeScreenNavigationProp;
}

interface Stats {
    totalClasses: number;
    totalSequences: number;
    totalSessions: number;
    upcomingSessions: number;
}

export default function HomeScreen({ navigation }: Props) {
    const [stats, setStats] = useState<Stats>({
        totalClasses: 0,
        totalSequences: 0,
        totalSessions: 0,
        upcomingSessions: 0,
    });
    const [upcomingSessions, setUpcomingSessions] = useState<(Session & { class?: Class })[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showClassDialog, setShowClassDialog] = useState(false);
    const [showSequenceDialog, setShowSequenceDialog] = useState(false);
    const [selectedClassForSequence, setSelectedClassForSequence] = useState<Class | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadDashboardData();
        });
        return unsubscribe;
    }, [navigation]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Charger toutes les classes
            const classes = await classService.getAll();

            // Charger toutes les séquences
            let allSequences: Sequence[] = [];
            for (const cls of classes) {
                const sequences = await sequenceService.getByClass(cls.id);
                allSequences = [...allSequences, ...sequences];
            }

            // Charger toutes les séances
            let allSessions: (Session & { class?: Class })[] = [];
            for (const cls of classes) {
                const sessions = await sessionService.getByClass(cls.id);
                const sessionsWithClass = sessions.map(s => ({ ...s, class: cls }));
                allSessions = [...allSessions, ...sessionsWithClass];
            }

            // Séances à venir (futures uniquement)
            const now = new Date();
            const upcoming = allSessions
                .filter(s => new Date(s.date) >= now)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5);

            // Activité récente (séances passées récentes + séquences créées récemment)
            const recentSessions = allSessions
                .filter(s => new Date(s.date) < now)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map(s => ({
                    type: 'session',
                    date: new Date(s.date),
                    title: s.subject,
                    subtitle: s.class?.name,
                    color: s.class?.color,
                    icon: 'calendar-check',
                }));

            const recentSequences = allSequences
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 2)
                .map(seq => {
                    const cls = classes.find(c => c.id === seq.classId);
                    return {
                        type: 'sequence',
                        date: new Date(seq.createdAt || 0),
                        title: seq.name,
                        subtitle: cls?.name,
                        color: seq.color,
                        icon: 'book-open-variant',
                    };
                });

            const activity = [...recentSessions, ...recentSequences]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 5);

            setStats({
                totalClasses: classes.length,
                totalSequences: allSequences.length,
                totalSessions: allSessions.length,
                upcomingSessions: upcoming.length,
            });
            setUpcomingSessions(upcoming);
            setRecentActivity(activity);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (data: { name: string; level: string; subject: string; color: string }) => {
        try {
            await classService.create(data);
            setShowClassDialog(false);
            loadDashboardData();
        } catch (error) {
            console.error('Error creating class:', error);
        }
    };

    const handleCreateSequence = async (data: any) => {
        try {
            if (selectedClassForSequence) {
                await sequenceService.create({
                    ...data,
                    classId: selectedClassForSequence.id,
                });
                setShowSequenceDialog(false);
                setSelectedClassForSequence(null);
                loadDashboardData();
            }
        } catch (error) {
            console.error('Error creating sequence:', error);
        }
    };

    const openSequenceDialog = async () => {
        // Récupérer la première classe disponible
        const classes = await classService.getAll();
        if (classes.length > 0) {
            setSelectedClassForSequence(classes[0]);
            setShowSequenceDialog(true);
        } else {
            // Demander de créer une classe d'abord
            alert('Veuillez d\'abord créer une classe');
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
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
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Tableau de bord</Text>
                    <Text style={styles.headerSubtitle}>
                        {new Date().toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => {/* TODO: Notifications */ }}
                >
                    <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Statistiques globales */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
                            <MaterialCommunityIcons name="google-classroom" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{stats.totalClasses}</Text>
                            <Text style={styles.statLabel}>
                                Classe{stats.totalClasses > 1 ? 's' : ''}
                            </Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{stats.totalSequences}</Text>
                            <Text style={styles.statLabel}>
                                Séquence{stats.totalSequences > 1 ? 's' : ''}
                            </Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
                            <MaterialCommunityIcons name="calendar" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{stats.totalSessions}</Text>
                            <Text style={styles.statLabel}>
                                Séance{stats.totalSessions > 1 ? 's' : ''}
                            </Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#9C27B0' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{stats.upcomingSessions}</Text>
                            <Text style={styles.statLabel}>À venir</Text>
                        </View>
                    </View>
                </View>

                {/* Actions rapides */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions rapides</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowClassDialog(true)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionText}>Créer une classe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={openSequenceDialog}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
                                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionText}>Créer une séquence</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {/* Navigation vers liste des séances */ }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
                                <MaterialCommunityIcons name="clipboard-check" size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionText}>Prendre présences</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Prochaines séances */}
                {upcomingSessions.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Prochaines séances</Text>
                            <Text style={styles.seeAllButton}>Tout voir</Text>
                        </View>
                        {upcomingSessions.map((session, index) => {
                            const sessionDate = new Date(session.date);
                            const isToday = sessionDate.toDateString() === new Date().toDateString();
                            const isTomorrow = sessionDate.toDateString() ===
                                new Date(Date.now() + 86400000).toDateString();

                            let dateLabel = sessionDate.toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                            });

                            if (isToday) dateLabel = "Aujourd'hui";
                            if (isTomorrow) dateLabel = "Demain";

                            return (
                                <TouchableOpacity
                                    key={session.id}
                                    style={styles.sessionCard}
                                    onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                                >
                                    <View style={[styles.sessionColorBar, { backgroundColor: session.class?.color }]} />
                                    <View style={styles.sessionContent}>
                                        <View style={styles.sessionHeader}>
                                            <Text style={styles.sessionSubject}>{session.subject}</Text>
                                            <Text style={[
                                                styles.sessionDateBadge,
                                                isToday && styles.sessionDateBadgeToday
                                            ]}>
                                                {dateLabel}
                                            </Text>
                                        </View>
                                        <View style={styles.sessionMeta}>
                                            <View style={styles.sessionMetaItem}>
                                                <MaterialCommunityIcons name="google-classroom" size={14} color="#666" />
                                                <Text style={styles.sessionMetaText}>{session.class?.name}</Text>
                                            </View>
                                            <View style={styles.sessionMetaItem}>
                                                <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                                                <Text style={styles.sessionMetaText}>{session.duration} min</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Activité récente */}
                {recentActivity.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Activité récente</Text>
                        {recentActivity.map((item, index) => (
                            <View key={index} style={styles.activityItem}>
                                <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
                                    <MaterialCommunityIcons
                                        name={item.icon}
                                        size={20}
                                        color={item.color}
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>{item.title}</Text>
                                    <View style={styles.activityMeta}>
                                        <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                                        <Text style={styles.activityDate}>
                                            {item.date.toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Visualisation progression */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Progression</Text>
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <MaterialCommunityIcons name="chart-line" size={24} color="#2196F3" />
                            <Text style={styles.progressTitle}>Taux d'activité</Text>
                        </View>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>Séances réalisées</Text>
                            <Text style={styles.progressValue}>
                                {stats.totalSessions - stats.upcomingSessions} / {stats.totalSessions}
                            </Text>
                        </View>
                        <ProgressBar
                            progress={stats.totalSessions > 0
                                ? (stats.totalSessions - stats.upcomingSessions) / stats.totalSessions
                                : 0
                            }
                            color="#2196F3"
                            style={styles.progressBar}
                        />
                        <Text style={styles.progressPercentage}>
                            {stats.totalSessions > 0
                                ? Math.round(((stats.totalSessions - stats.upcomingSessions) / stats.totalSessions) * 100)
                                : 0
                            }% complété
                        </Text>
                    </View>
                </View>

                {/* Widget Réglages */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.settingsWidget}
                        onPress={() => navigation.navigate('Settings')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsContent}>
                            <View style={styles.settingsIcon}>
                                <MaterialCommunityIcons name="cog" size={24} color="#666" />
                            </View>
                            <View style={styles.settingsText}>
                                <Text style={styles.settingsTitle}>Réglages</Text>
                                <Text style={styles.settingsSubtitle}>
                                    Préférences, thème et génération de données
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Espace en bas */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Dialogs */}
            <ClassFormDialog
                visible={showClassDialog}
                onDismiss={() => setShowClassDialog(false)}
                onSubmit={handleCreateClass}
            />
            {selectedClassForSequence && (
                <SequenceFormDialog
                    visible={showSequenceDialog}
                    onDismiss={() => {
                        setShowSequenceDialog(false);
                        setSelectedClassForSequence(null);
                    }}
                    onSubmit={handleCreateSequence}
                    classId={selectedClassForSequence.id}
                />
            )}
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
        backgroundColor: '#007AFF',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: SPACING.md,
    },
    section: {
        marginBottom: SPACING.lg,
        paddingHorizontal: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: SPACING.sm,
    },
    seeAllButton: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    statCard: {
        width: (width - SPACING.md * 2 - SPACING.sm) / 2,
        padding: SPACING.md,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: SPACING.xs,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
        textAlign: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: SPACING.md,
        alignItems: 'center',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xs,
    },
    actionText: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center',
        fontWeight: '600',
    },
    sessionCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: SPACING.xs,
        overflow: 'hidden',
        alignItems: 'center',
    },
    sessionColorBar: {
        width: 4,
        height: '100%',
        alignSelf: 'stretch',
    },
    sessionContent: {
        flex: 1,
        padding: SPACING.sm,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sessionSubject: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    sessionDateBadge: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        fontWeight: '600',
    },
    sessionDateBadgeToday: {
        backgroundColor: '#FFE0B2',
        color: '#E65100',
    },
    sessionMeta: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    sessionMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sessionMetaText: {
        fontSize: 13,
        color: '#666',
    },
    activityItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: SPACING.sm,
        borderRadius: 12,
        marginBottom: SPACING.xs,
        alignItems: 'center',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    activityMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activitySubtitle: {
        fontSize: 13,
        color: '#666',
    },
    activityDate: {
        fontSize: 12,
        color: '#999',
    },
    progressCard: {
        backgroundColor: '#FFFFFF',
        padding: SPACING.md,
        borderRadius: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        gap: 8,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    progressLabel: {
        fontSize: 14,
        color: '#666',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginBottom: SPACING.xs,
    },
    progressPercentage: {
        fontSize: 13,
        color: '#2196F3',
        fontWeight: '600',
        textAlign: 'center',
    },
    settingsWidget: {
        backgroundColor: '#FFFFFF',
        padding: SPACING.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    settingsText: {
        flex: 1,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    settingsSubtitle: {
        fontSize: 13,
        color: '#666',
    },
});
