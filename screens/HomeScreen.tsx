import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { classService } from '../services';
import { Class } from '../types';
import { RootStackParamList } from '../navigation/types';
import ClassFormDialog from '../components/ClassFormDialog';
import CustomFAB from '../components/CustomFAB';
import { useTheme } from '../contexts/ThemeContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassDetail'>;

interface Props {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
    const { theme } = useTheme();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadClasses();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [loading]);

    const loadClasses = async () => {
        try {
            const data = await classService.getAll();
            setClasses(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = () => setShowDialog(true);

    const handleSubmitClass = async (data: { name: string; level: string; subject: string; color: string }) => {
        try {
            await classService.create(data);
            setShowDialog(false);
            loadClasses();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleClassPress = (item: Class) => {
        navigation.navigate('ClassDetail', {
            classId: item.id,
            className: item.name,
            classColor: item.color,
        });
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
                <MaterialCommunityIcons name="google-classroom" size={28} color={theme.text} />
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Mes Classes</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {classes.length} {classes.length > 1 ? 'classes' : 'classe'}
                    </Text>
                </View>
            </View>

            {classes.length === 0 ? (
                <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
                    <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
                        <MaterialCommunityIcons name="google-classroom" size={64} color={theme.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Commencez ici</Text>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            Créez votre première classe pour organiser vos élèves et séances
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                            onPress={handleCreateClass}
                        >
                            <Text style={styles.emptyButtonText}>Créer une classe</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            ) : (
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <FlatList
                        data={classes}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.classCard, { backgroundColor: theme.cardBackground, borderLeftColor: item.color }]}
                                activeOpacity={0.7}
                                onPress={() => handleClassPress(item)}
                            >
                                <View style={styles.classContent}>
                                    <View style={styles.classHeader}>
                                        <Text style={[styles.className, { color: theme.text }]}>{item.name}</Text>
                                        <View style={[styles.badge, { backgroundColor: item.color + '15' }]}>
                                            <Text style={[styles.badgeText, { color: item.color }]}>
                                                {item.studentCount || 0}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.classDetails}>
                                        <Text style={[styles.classLevel, { color: theme.textSecondary }]}>{item.level}</Text>
                                        {item.subject && (
                                            <>
                                                <View style={[styles.dot, { backgroundColor: theme.border }]} />
                                                <Text style={[styles.classSubject, { color: theme.textSecondary }]}>{item.subject}</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </Animated.View>
            )}

            <CustomFAB
                icon="plus"
                onPress={handleCreateClass}
                backgroundColor={theme.primary}
            />

            <ClassFormDialog
                visible={showDialog}
                onDismiss={() => setShowDialog(false)}
                onSubmit={handleSubmitClass}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        position: 'relative',
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
        paddingBottom: 24,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
        marginBottom: 20,
    },
    emptyButton: {
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    classCard: {
        backgroundColor: '#ffffff',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderLeftWidth: 6,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
    },
    classContent: {
        padding: 16,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    className: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    classDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    classLevel: {
        fontSize: 14,
        color: '#666',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#ccc',
        marginHorizontal: 8,
    },
    classSubject: {
        fontSize: 14,
        color: '#666',
    },
});
