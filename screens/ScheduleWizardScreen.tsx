import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { ScheduleSlot } from '../types/schedule';
import { SchoolYearSettings } from '../types/settings';
import { getByClass, deleteSlot, create, update } from '../services/scheduleService';
import { getSchoolYearSettings } from '../services/settingsService';
import { previewGeneration, generateSessions, regenerateSessions } from '../services/sessionGeneratorService';
import ScheduleSlotFormDialog from '../components/ScheduleSlotFormDialog';
import WizardStepper from '../components/WizardStepper';
import { COLORS } from '../utils/theme';

type ScheduleWizardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScheduleWizard'>;
type ScheduleWizardScreenRouteProp = RouteProp<RootStackParamList, 'ScheduleWizard'>;

interface Props {
    navigation: ScheduleWizardScreenNavigationProp;
    route: ScheduleWizardScreenRouteProp;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const WIZARD_STEPS = [
    { label: 'Créneaux' },
    { label: 'Vérification' },
    { label: 'Génération' },
];

export default function ScheduleWizardScreen({ navigation, route }: Props) {
    const { classId, className, classColor } = route.params;
    const [currentStep, setCurrentStep] = useState(0);
    const [slots, setSlots] = useState<ScheduleSlot[]>([]);
    const [settings, setSettings] = useState<SchoolYearSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showSlotDialog, setShowSlotDialog] = useState(false);
    const [editingSlot, setEditingSlot] = useState<ScheduleSlot | undefined>();
    const [previewData, setPreviewData] = useState<{
        totalGenerated: number;
        startDate: string;
        endDate: string;
        skippedDays: number;
    } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [slotsData, settingsData] = await Promise.all([
                getByClass(classId),
                getSchoolYearSettings(),
            ]);
            setSlots(slotsData);
            setSettings(settingsData);

            if (settingsData?.schoolYearStart && settingsData?.schoolYearEnd && slotsData.length > 0) {
                const preview = await previewGeneration(classId);
                setPreviewData(preview);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = () => {
        setEditingSlot(undefined);
        setShowSlotDialog(true);
    };

    const handleEditSlot = (slot: ScheduleSlot) => {
        setEditingSlot(slot);
        setShowSlotDialog(true);
    };

    const handleSubmitSlot = async (data: {
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
            await loadData();
            setShowSlotDialog(false);
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
                            await loadData();
                        } catch (error) {
                            console.error('Error deleting slot:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer le créneau');
                        }
                    },
                },
            ]
        );
    };

    const handleNext = async () => {
        if (currentStep === 0) {
            // Vérifier qu'il y a au moins un créneau
            if (slots.length === 0) {
                Alert.alert('Créneaux manquants', 'Ajoutez au moins un créneau avant de continuer.');
                return;
            }
        }

        if (currentStep === 1) {
            // Vérifier la configuration de l'année scolaire
            if (!settings?.schoolYearStart || !settings?.schoolYearEnd) {
                Alert.alert(
                    'Configuration manquante',
                    'Configurez l\'année scolaire dans les paramètres avant de générer les séances.',
                    [
                        {
                            text: 'Ouvrir les paramètres',
                            onPress: () => navigation.navigate('MainTabs', { screen: 'Settings' } as any),
                        },
                        { text: 'Annuler', style: 'cancel' },
                    ]
                );
                return;
            }
        }

        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleGenerate = async (deleteExisting: boolean) => {
        const action = deleteExisting ? 'régénérer' : 'générer';
        const message = deleteExisting
            ? 'Toutes les séances existantes seront supprimées et remplacées. Continuer ?'
            : `${previewData?.totalGenerated} séance(s) seront créées. Continuer ?`;

        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} les séances`,
            message,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: async () => {
                        setGenerating(true);
                        try {
                            const result = deleteExisting
                                ? await regenerateSessions(classId)
                                : await generateSessions({ classId });

                            Alert.alert(
                                'Succès',
                                `${result.totalGenerated} séance(s) créée(s) !`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            navigation.navigate('SessionList', { classId });
                                        },
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error('Error generating sessions:', error);
                            Alert.alert('Erreur', error.message || 'Impossible de générer les séances');
                        } finally {
                            setGenerating(false);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Grouper les créneaux par jour
    const slotsByDay = DAYS_OF_WEEK.map((dayName, index) => {
        const daySlots = slots.filter(slot => slot.dayOfWeek === index + 1);
        return { day: dayName, dayOfWeek: index + 1, slots: daySlots };
    }).filter(day => day.slots.length > 0);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={classColor} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: classColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Emploi du temps</Text>
                    <Text style={styles.headerSubtitle}>{className}</Text>
                </View>
            </View>

            {/* Stepper */}
            <WizardStepper steps={WIZARD_STEPS} currentStep={currentStep} accentColor={classColor} />

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {currentStep === 0 && renderStep1()}
                {currentStep === 1 && renderStep2()}
                {currentStep === 2 && renderStep3()}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
                <TouchableOpacity
                    style={[styles.navButton, styles.previousButton]}
                    onPress={handlePrevious}
                >
                    <MaterialCommunityIcons name="chevron-left" size={20} color="#666" />
                    <Text style={styles.previousButtonText}>
                        {currentStep === 0 ? 'Annuler' : 'Précédent'}
                    </Text>
                </TouchableOpacity>

                {currentStep < 2 ? (
                    <TouchableOpacity
                        style={[styles.navButton, styles.nextButton, { backgroundColor: classColor }]}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>Suivant</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.navButton, styles.nextButton, { backgroundColor: classColor }]}
                        onPress={() => handleGenerate(false)}
                        disabled={generating || !previewData || previewData.totalGenerated === 0}
                    >
                        {generating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>Générer</Text>
                                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* FAB for adding slots (only on step 1) */}
            {currentStep === 0 && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: classColor }]}
                    onPress={handleAddSlot}
                >
                    <MaterialCommunityIcons name="plus" size={28} color="white" />
                </TouchableOpacity>
            )}

            {/* Slot Dialog */}
            <ScheduleSlotFormDialog
                visible={showSlotDialog}
                onDismiss={() => setShowSlotDialog(false)}
                onSubmit={handleSubmitSlot}
                initialData={editingSlot}
            />
        </View>
    );

    // STEP 1: Configuration des créneaux
    function renderStep1() {
        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Configurer les créneaux</Text>
                <Text style={styles.stepDescription}>
                    Ajoutez les créneaux de votre emploi du temps. Vous pourrez ensuite générer automatiquement toutes les séances de l'année.
                </Text>

                {slots.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-blank" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun créneau configuré</Text>
                        <Text style={styles.emptySubtext}>
                            Tapez sur le bouton + pour ajouter votre premier créneau
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
            </View>
        );
    }

    // STEP 2: Résumé de l'emploi du temps
    function renderStep2() {
        const weeklySlots = slots.filter(s => s.frequency === 'weekly').length;
        const biweeklySlots = slots.filter(s => s.frequency === 'biweekly').length;

        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Vérification de l'emploi du temps</Text>
                <Text style={styles.stepDescription}>
                    Vérifiez votre emploi du temps avant de générer les séances.
                </Text>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="calendar-clock" size={24} color={classColor} />
                        <Text style={styles.summaryLabel}>Total de créneaux</Text>
                        <Text style={styles.summaryValue}>{slots.length}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color={classColor} />
                        <Text style={styles.summaryLabel}>Hebdomadaires</Text>
                        <Text style={styles.summaryValue}>{weeklySlots}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="clock-time-two-outline" size={24} color={classColor} />
                        <Text style={styles.summaryLabel}>Bimensuels</Text>
                        <Text style={styles.summaryValue}>{biweeklySlots}</Text>
                    </View>
                </View>

                {/* Liste récapitulative */}
                <Text style={styles.sectionTitle}>Détail des créneaux</Text>
                <View style={styles.slotsContainer}>
                    {slotsByDay.map((day) => (
                        <View key={day.dayOfWeek} style={styles.daySection}>
                            <Text style={styles.dayTitle}>{day.day}</Text>
                            {day.slots
                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                .map((slot) => (
                                    <View
                                        key={slot.id}
                                        style={[styles.slotCard, { borderLeftColor: classColor }]}
                                    >
                                        <View style={styles.slotContent}>
                                            <View style={styles.slotTime}>
                                                <MaterialCommunityIcons name="clock-outline" size={20} color={classColor} />
                                                <Text style={[styles.slotTimeText, { color: classColor }]}>{slot.startTime}</Text>
                                                <Text style={styles.slotDuration}>{slot.duration} min</Text>
                                            </View>
                                            <Text style={styles.slotSubject}>{slot.subject}</Text>
                                            {slot.frequency === 'biweekly' && (
                                                <View style={styles.slotBadges}>
                                                    <View style={[styles.badge, { backgroundColor: `${classColor}20` }]}>
                                                        <Text style={[styles.badgeText, { color: classColor }]}>
                                                            Bimensuel (S{slot.startWeek === 0 ? 'paires' : 'impaires'})
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    // STEP 3: Génération des séances
    function renderStep3() {
        if (!settings?.schoolYearStart || !settings?.schoolYearEnd) {
            return (
                <View style={styles.stepContent}>
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={80} color={COLORS.warning} />
                        <Text style={styles.errorTitle}>Configuration manquante</Text>
                        <Text style={styles.errorText}>
                            Configurez d'abord l'année scolaire et la zone dans les paramètres
                        </Text>
                        <TouchableOpacity
                            style={[styles.settingsButton, { backgroundColor: classColor }]}
                            onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' } as any)}
                        >
                            <Text style={styles.settingsButtonText}>Ouvrir les paramètres</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Génération des séances</Text>
                <Text style={styles.stepDescription}>
                    Les séances seront créées automatiquement en respectant l'emploi du temps, les vacances scolaires et les jours fériés.
                </Text>

                {/* Paramètres de l'année scolaire */}
                <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>Année scolaire</Text>
                    <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="map-marker" size={20} color={classColor} />
                        <Text style={styles.summaryLabel}>Zone</Text>
                        <Text style={styles.summaryValue}>{settings.zone}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="calendar-start" size={20} color={classColor} />
                        <Text style={styles.summaryLabel}>Début</Text>
                        <Text style={styles.summaryValue}>{formatDate(settings.schoolYearStart)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <MaterialCommunityIcons name="calendar-end" size={20} color={classColor} />
                        <Text style={styles.summaryLabel}>Fin</Text>
                        <Text style={styles.summaryValue}>{formatDate(settings.schoolYearEnd)}</Text>
                    </View>
                </View>

                {/* Prévisualisation */}
                {previewData && (
                    <View style={[styles.previewCard, { borderColor: classColor }]}>
                        <View style={styles.previewHeader}>
                            <MaterialCommunityIcons name="eye" size={32} color={classColor} />
                            <View style={styles.previewHeaderText}>
                                <Text style={[styles.previewTitle, { color: classColor }]}>{previewData.totalGenerated}</Text>
                                <Text style={styles.previewSubtitle}>
                                    séance{previewData.totalGenerated > 1 ? 's' : ''} seront créée{previewData.totalGenerated > 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.previewStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Jours exclus</Text>
                                <Text style={styles.statValue}>{previewData.skippedDays}</Text>
                                <Text style={styles.statHint}>weekends, vacances, fériés</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Option régénérer */}
                <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={() => handleGenerate(true)}
                    disabled={generating || !previewData || previewData.totalGenerated === 0}
                >
                    {generating ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="refresh" size={24} color={COLORS.error} />
                            <Text style={styles.regenerateButtonText}>
                                Régénérer (supprimer l'existant)
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e5e5e5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
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
    content: {
        flex: 1,
    },
    stepContent: {
        padding: 16,
        paddingBottom: 100,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 15,
        color: '#666',
        marginBottom: 24,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginTop: 24,
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    summaryLabel: {
        flex: 1,
        fontSize: 16,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
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
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    previewHeaderText: {
        flex: 1,
    },
    previewTitle: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    previewSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    previewStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    statHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: COLORS.error,
        gap: 12,
    },
    regenerateButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.error,
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    settingsButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    settingsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    navigationButtons: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    navButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    previousButton: {
        backgroundColor: '#f0f0f0',
    },
    previousButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    nextButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
