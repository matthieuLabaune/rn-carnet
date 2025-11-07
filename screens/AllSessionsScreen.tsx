import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { sessionService, classService } from '../services';
import { Session, Class } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AllSessionsScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation<NavigationProp>();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const classesData = await classService.getAll();
            setClasses(classesData);

            const allSessions: Session[] = [];
            for (const classe of classesData) {
                const classSessions = await sessionService.getByClass(classe.id);
                allSessions.push(...classSessions);
            }

            allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSessions(allSessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClassName = (classId: string) => {
        const classe = classes.find(c => c.id === classId);
        return classe?.name || 'Classe inconnue';
    };

    const getClassColor = (classId: string) => {
        const classe = classes.find(c => c.id === classId);
        return classe?.color || '#000';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
                return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
            case 'in_progress':
                return { backgroundColor: '#FFF3E0', color: '#F57C00' };
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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />

            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <MaterialCommunityIcons name="calendar-text" size={28} color={theme.text} />
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Toutes les séances</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
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
                            Créez des séances depuis vos classes
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {sessions.map((session) => (
                            <TouchableOpacity 
                                key={session.id} 
                                style={[styles.sessionCard, { backgroundColor: theme.cardBackground }]}
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
                                    <View style={styles.classTag}>
                                        <View style={[styles.classColorDot, { backgroundColor: getClassColor(session.classId) }]} />
                                        <Text style={[styles.className, { color: theme.textSecondary }]}>{getClassName(session.classId)}</Text>
                                    </View>
                                    <View style={styles.dateInfo}>
                                        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.textTertiary} />
                                        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                                            {new Date(session.date).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
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
    content: {
        flex: 1,
    },
    list: {
        padding: 16,
    },
    sessionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1,
        marginRight: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sessionDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    sessionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 13,
        color: '#999',
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
