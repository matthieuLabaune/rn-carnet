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

type ClassListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClassDetail'>;

interface Props {
    navigation: ClassListScreenNavigationProp;
}

export default function ClassListScreen({ navigation }: Props) {
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
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Toutes les classes</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {classes.length} {classes.length > 1 ? 'classes' : 'classe'}
                    </Text>
                </View>
            </View>

            {classes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="google-classroom" size={80} color={theme.border} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune classe</Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                        Commencez par créer votre première classe
                    </Text>
                </View>
            ) : (
                <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
                    <FlatList
                        data={classes}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                activeOpacity={0.7}
                                onPress={() => handleClassPress(item)}
                            >
                                <View style={[styles.colorBar, { backgroundColor: item.color }]} />
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                                        <MaterialCommunityIcons
                                            name="chevron-right"
                                            size={24}
                                            color={theme.textTertiary}
                                        />
                                    </View>
                                    <View style={styles.cardDetails}>
                                        <View style={styles.detailItem}>
                                            <MaterialCommunityIcons
                                                name="school"
                                                size={16}
                                                color={theme.textSecondary}
                                            />
                                            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                                                {item.level}
                                            </Text>
                                        </View>
                                        <View style={styles.detailItem}>
                                            <MaterialCommunityIcons
                                                name="book-open-variant"
                                                size={16}
                                                color={theme.textSecondary}
                                            />
                                            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                                                {item.subject}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </Animated.View>
            )}

            <CustomFAB icon="plus" onPress={handleCreateClass} />

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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    headerContent: {
        marginLeft: 15,
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    listContainer: {
        flex: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    colorBar: {
        width: 6,
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    cardDetails: {
        flexDirection: 'row',
        gap: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
    },
});
