import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { getByClass, create, update, deleteSlot } from '../services/scheduleService';
import { previewGeneration } from '../services/sessionGeneratorService';
import { getSchoolYearSettings } from '../services/settingsService';
import type { ScheduleSlot } from '../types/schedule';
import ScheduleSlotFormDialog from '../components/ScheduleSlotFormDialog';
import { COLORS } from '../utils/theme';

type ScheduleManagementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScheduleManagement'>;
type ScheduleManagementScreenRouteProp = RouteProp<RootStackParamList, 'ScheduleManagement'>;

interface Props {
    navigation: ScheduleManagementScreenNavigationProp;
    route: ScheduleManagementScreenRouteProp;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function ScheduleManagementScreen({ navigation, route }: Props) {
    const { classId, className, classColor } = route.params;
    const [slots, setSlots] = useState<ScheduleSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingSlot, setEditingSlot] = useState<ScheduleSlot | undefined>();
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    useEffect(() => {
        loadSlots();
        loadPreview();
    }, []);

    const loadSlots = async () => {
        try {
            const data = await getByClass(classId);
            setSlots(data);
        } catch (error) {
            console.error('Error loading schedule slots:', error);
            Alert.alert('Erreur', 'Impossible de charger l\'emploi du temps');
        } finally {
            setLoading(false);
        }
    };

    const loadPreview = async () => {
        try {
            const settings = await getSchoolYearSettings();
            if (!settings?.schoolYearStart || !settings?.schoolYearEnd) {
                return;
            }
            // Ne pas faire de preview s'il n'y a pas de créneaux (c'est normal au début)
            if (slots.length === 0) {
                setPreviewCount(null);
                return;
            }
            const preview = await previewGeneration(classId);
            setPreviewCount(preview.totalGenerated);
        } catch (error) {
            // Ne pas logger d'erreur si c'est juste l'absence de créneaux
            if (!(error instanceof Error) || !error.message.includes('Aucun créneau')) {
                console.error('Error loading preview:', error);
            }
            setPreviewCount(null);
        }
    };

    const handleAddSlot = () => {
        setEditingSlot(undefined);
        setShowDialog(true);
    };

    const handleEditSlot = (slot: ScheduleSlot) => {
        setEditingSlot(slot);
        setShowDialog(true);
    };

    const handleSubmit = async (data: {
        dayOfWeek: number;
        startTime: string;
        duration: number;
        subject: string;
        frequency: 'weekly' | 'biweekly';
        startWeek?: number;
    }) => {
        try {
            if (editingSlot) {
                await update(editingSlot.id, data);
            } else {
                await create({ classId, ...data });
            }
            await loadSlots();
            await loadPreview();
            setShowDialog(false);
        } catch (error) {
            console.error('Error saving slot:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le créneau');
        }
    };

    const handleDeleteSlot = (slot: ScheduleSlot) => {
        Alert.alert(
            'Supprimer le créneau',
            `Voulez-vous vraiment supprimer ce créneau de ${slot.subject} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSlot(slot.id);
                            await loadSlots();
                            await loadPreview();
                        } catch (error) {
                            console.error('Error deleting slot:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer le créneau');
                        }
                    },
                },
            ]
        );
    };

    const handleGenerateSessions = () => {
        navigation.navigate('SessionGeneration', { classId, className, classColor });
    };

    // Grouper les créneaux par jour
    const slotsByDay = DAYS_OF_WEEK.map((dayName, index) => {
        const daySlots = slots.filter(slot => slot.dayOfWeek === index + 1);
        return { day: dayName, dayOfWeek: index + 1, slots: daySlots };
    }).filter(day => day.slots.length > 0);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header avec bouton retour */}
            <View style={[styles.headerBar, { backgroundColor: classColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('ClassDetail', { classId, className, classColor })}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Emploi du temps</Text>
                    <Text style={styles.headerSubtitle}>{className}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Aperçu génération */}
                {previewCount !== null && previewCount > 0 && (
                    <TouchableOpacity
                        style={styles.previewCard}
                        onPress={handleGenerateSessions}
                    >
                        <View style={styles.previewIcon}>
                            <MaterialCommunityIcons name="calendar-clock" size={32} color={classColor} />
                        </View>
                        <View style={styles.previewContent}>
                            <Text style={styles.previewTitle}>Générer les séances</Text>
                            <Text style={styles.previewText}>
                                {previewCount} séance{previewCount > 1 ? 's' : ''} seront créée{previewCount > 1 ? 's' : ''}
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                    </TouchableOpacity>
                )}

                {/* Configuration manquante */}
                {previewCount === 0 && slots.length > 0 && (
                    <View style={styles.warningCard}>
                        <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.warning} />
                        <Text style={styles.warningText}>
                            Configurez l'année scolaire dans les paramètres pour générer les séances
                        </Text>
                    </View>
                )}

                {/* Liste des créneaux par jour */}
                {slots.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun créneau configuré</Text>
                        <Text style={styles.emptySubtext}>
                            Ajoutez des créneaux pour générer automatiquement les séances
                        </Text>
                    </View>
                ) : (
                    <View style={styles.slotsContainer}>
                        {slotsByDay.map((day) => (
                            <View key={day.dayOfWeek} style={styles.daySection}>
                                <Text style={styles.dayTitle}>{day.day}</Text>
                                {day.slots
                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                    .map((slot) => (
                                        <TouchableOpacity
                                            key={slot.id}
                                            style={[styles.slotCard, { borderLeftColor: classColor }]}
                                            onPress={() => handleEditSlot(slot)}
                                        >
                                            <View style={styles.slotContent}>
                                                <View style={styles.slotTime}>
                                                    <MaterialCommunityIcons name="clock-outline" size={20} color={classColor} />
                                                    <Text style={[styles.slotTimeText, { color: classColor }]}>{slot.startTime}</Text>
                                                    <Text style={styles.slotDuration}>{slot.duration} min</Text>
                                                </View>
                                                <Text style={styles.slotSubject}>{slot.subject}</Text>
                                                <View style={styles.slotBadges}>
                                                    {slot.frequency === 'biweekly' && (
                                                        <View style={[styles.badge, { backgroundColor: `${classColor}20` }]}>
                                                            <Text style={[styles.badgeText, { color: classColor }]}>
                                                                Bimensuel (S{slot.startWeek === 0 ? 'paires' : 'impaires'})
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteSlot(slot)}
                                            >
                                                <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.error} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleAddSlot}>
                <MaterialCommunityIcons name="plus" size={28} color="white" />
            </TouchableOpacity>

            {/* Dialog */}
            <ScheduleSlotFormDialog
                visible={showDialog}
                onDismiss={() => setShowDialog(false)}
                onSubmit={handleSubmit}
                initialData={editingSlot}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e5e5e5',
    },
    scrollView: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor appliquée dynamiquement via classColor
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    previewIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    previewContent: {
        flex: 1,
    },
    previewTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    previewText: {
        fontSize: 14,
        color: '#666',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#856404',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    slotsContainer: {
        padding: 16,
        gap: 16,
    },
    daySection: {
        gap: 12,
    },
    dayTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    slotCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 6,
        // borderLeftColor appliquée dynamiquement via classColor
    },
    slotContent: {
        flex: 1,
        gap: 8,
    },
    slotTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    slotTimeText: {
        fontSize: 16,
        fontWeight: '600',
        // color appliquée dynamiquement via classColor
    },
    slotDuration: {
        fontSize: 14,
        color: '#666',
    },
    slotSubject: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    slotBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        // backgroundColor appliquée dynamiquement via classColor
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        // color appliquée dynamiquement via classColor
    },
    deleteButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
