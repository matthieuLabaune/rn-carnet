import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { sessionService, classService } from '../services';
import { Session, Class } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type SessionListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionList'>;
type SessionListScreenRouteProp = RouteProp<RootStackParamList, 'SessionList'>;

interface Props {
    navigation: SessionListScreenNavigationProp;
    route: SessionListScreenRouteProp;
}

export default function SessionListScreen({ navigation, route }: Props) {
    const { theme } = useTheme();
    const { classId } = route.params;
    const [sessions, setSessions] = useState<Session[]>([]);
    const [classData, setClassData] = useState<Class | null>(null);
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
            const [classInfo, sessionsData] = await Promise.all([
                classService.getById(classId),
                sessionService.getByClass(classId),
            ]);

            setClassData(classInfo);

            // Trier par date décroissante
            sessionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSessions(sessionsData);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
                return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
            case 'in_progress':
                return { backgroundColor: '#FFF3E0', color: '#F57C00' };
            case 'cancelled':
                return { backgroundColor: '#FFEBEE', color: '#C62828' };
            default:
                return { backgroundColor: '#F5F5F5', color: '#666' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Terminée';
            case 'in_progress':
                return 'En cours';
            case 'cancelled':
                return 'Annulée';
            default:
                return 'Programmée';
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="loading" size={32} color={theme.textSecondary} />
            </View>
        );
    }

    if (!classData) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons name="alert-circle" size={64} color={theme.textTertiary} />
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>Classe introuvable</Text>
            </View>
        );
    }

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
                    <Text style={styles.headerSubtitle}>
                        {sessions.length} séance{sessions.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {sessions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="calendar-blank" size={64} color={theme.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune séance</Text>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            Créez des séances depuis le détail de la classe
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {sessions.map((session) => (
                            <TouchableOpacity
                                key={session.id}
                                style={[styles.sessionCard, { backgroundColor: theme.surface, borderLeftColor: classData?.color }]}
                                onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                            >
                                <View style={styles.sessionHeader}>
                                    <View style={styles.sessionTitleRow}>
                                        <Text style={[styles.sessionSubject, { color: theme.text }]}>{session.subject}</Text>
                                        <View style={[styles.statusBadge, getStatusStyle(session.status)]}>
                                            <Text style={[styles.statusText, { color: getStatusStyle(session.status).color }]}>
                                                {getStatusLabel(session.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    {session.description && (
                                        <Text style={[styles.sessionDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                                            {session.description}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.sessionFooter}>
                                    <View style={styles.dateInfo}>
                                        <MaterialCommunityIcons name="calendar" size={16} color={theme.textSecondary} />
                                        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                                            {new Date(session.date).toLocaleDateString('fr-FR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <View style={styles.durationInfo}>
                                        <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textSecondary} />
                                        <Text style={[styles.durationText, { color: theme.textSecondary }]}>
                                            {session.duration} min
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    errorText: {
        fontSize: 16,
        marginTop: 12,
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
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    list: {
        padding: 16,
        gap: 12,
    },
    sessionCard: {
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderLeftWidth: 6,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    sessionHeader: {
        marginBottom: 12,
    },
    sessionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    sessionSubject: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sessionDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    sessionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    dateText: {
        fontSize: 13,
    },
    durationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    durationText: {
        fontSize: 13,
    },
});
