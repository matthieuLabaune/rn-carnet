import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert, Platform } from 'react-native';
import { Text, Switch, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { seedDatabase, TeacherType } from '../utils/seedData';
import { resetDatabase } from '../services/database';
import { RootStackParamList } from '../navigation/types';
import { getSchoolYearSettings, updateSchoolYearSettings } from '../services/settingsService';
import type { SchoolYearSettings } from '../types/settings';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { theme, themeMode, setThemeMode, isDark } = useTheme();
    const [notifications, setNotifications] = React.useState(true);
    const [isSeeding, setIsSeeding] = React.useState(false);

    // School year settings
    const [schoolYearSettings, setSchoolYearSettings] = React.useState<SchoolYearSettings>({
        zone: 'A',
        schoolYearStart: '2024-09-02',
        schoolYearEnd: '2025-07-05',
    });
    const [showStartDatePicker, setShowStartDatePicker] = React.useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = React.useState(false);

    // Load school year settings on mount
    React.useEffect(() => {
        loadSchoolYearSettings();
    }, []);

    const loadSchoolYearSettings = async () => {
        try {
            const settings = await getSchoolYearSettings();
            setSchoolYearSettings(settings);
        } catch (error) {
            console.error('Error loading school year settings:', error);
        }
    };

    const handleZoneChange = async (zone: 'A' | 'B' | 'C') => {
        try {
            const updatedSettings = { ...schoolYearSettings, zone };
            await updateSchoolYearSettings(updatedSettings);
            setSchoolYearSettings(updatedSettings);
            Alert.alert('Succès', `Zone scolaire mise à jour : ${zone}`);
        } catch (error) {
            console.error('Error updating zone:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour la zone');
        }
    };

    const handleStartDateChange = async (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            try {
                const updatedSettings = { ...schoolYearSettings, schoolYearStart: dateString };
                await updateSchoolYearSettings(updatedSettings);
                setSchoolYearSettings(updatedSettings);
            } catch (error) {
                console.error('Error updating start date:', error);
                Alert.alert('Erreur', 'Impossible de mettre à jour la date de début');
            }
        }
    };

    const handleEndDateChange = async (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            try {
                const updatedSettings = { ...schoolYearSettings, schoolYearEnd: dateString };
                await updateSchoolYearSettings(updatedSettings);
                setSchoolYearSettings(updatedSettings);
            } catch (error) {
                console.error('Error updating end date:', error);
                Alert.alert('Erreur', 'Impossible de mettre à jour la date de fin');
            }
        }
    };

    const handleSeedData = () => {
        Alert.alert(
            'Générer des données de test',
            'Choisissez le type d\'enseignant pour générer des classes et données adaptées :',
            [
                {
                    text: 'Annuler',
                    style: 'cancel'
                },
                {
                    text: '👨‍🏫 Primaire',
                    onPress: () => generateSeedData('primary'),
                },
                {
                    text: '🎓 Secondaire',
                    onPress: () => generateSeedData('secondary'),
                },
            ]
        );
    };

    const generateSeedData = async (teacherType: TeacherType) => {
        setIsSeeding(true);
        try {
            await seedDatabase(teacherType);
            Alert.alert(
                'Succès',
                `Données de test générées avec succès pour ${teacherType === 'primary' ? 'le primaire' : 'le secondaire'} !`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error seeding database:', error);
            Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de la génération des données',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSeeding(false);
        }
    };

    const handleExportData = () => {
        Alert.alert(
            'Exporter les données',
            'Fonctionnalité à venir',
            [{ text: 'OK' }]
        );
    };

    const handleImportData = () => {
        Alert.alert(
            'Importer des données',
            'Fonctionnalité à venir',
            [{ text: 'OK' }]
        );
    };

    const handleClearData = () => {
        Alert.alert(
            'Effacer toutes les données',
            'Cette action est irréversible. Voulez-vous continuer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Effacer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await resetDatabase();
                            Alert.alert(
                                'Succès',
                                'Toutes les données ont été effacées. L\'application va redémarrer.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            // Navigate to home to refresh
                                            navigation.reset({
                                                index: 0,
                                                routes: [{ name: 'MainTabs' }],
                                            });
                                        }
                                    }
                                ]
                            );
                        } catch (error) {
                            console.error('Error clearing database:', error);
                            Alert.alert(
                                'Erreur',
                                'Impossible d\'effacer les données',
                                [{ text: 'OK' }]
                            );
                        }
                    }
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />

            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <MaterialCommunityIcons name="cog" size={28} color={theme.text} />
                <Text style={[styles.headerTitle, { color: theme.text }]}>Paramètres</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Apparence */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Apparence</Text>

                    <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.textSecondary} style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Mode sombre</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                                    {themeMode === 'system' ? 'Automatique' : themeMode === 'dark' ? 'Activé' : 'Désactivé'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={themeMode === 'dark'}
                            onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
                        />
                    </View>
                </View>

                {/* Établissements */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Établissements</Text>

                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
                        onPress={() => navigation.navigate('EstablishmentManagement')}
                    >
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="domain" size={24} color={theme.textSecondary} style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Gérer mes établissements</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                                    Ajouter et configurer vos établissements
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Année scolaire */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Année scolaire</Text>

                    {/* Zone scolaire */}
                    <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons
                                name="map-marker"
                                size={24}
                                color={theme.textSecondary}
                                style={styles.settingIcon}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Zone</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                                    Calendrier des vacances scolaires
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Zone selector buttons */}
                    <View style={styles.zoneSelector}>
                        {(['A', 'B', 'C'] as const).map((zone) => (
                            <TouchableOpacity
                                key={zone}
                                style={[
                                    styles.zoneButton,
                                    {
                                        backgroundColor: schoolYearSettings.zone === zone
                                            ? theme.primary
                                            : theme.cardBackground,
                                        borderColor: schoolYearSettings.zone === zone
                                            ? theme.primary
                                            : theme.border,
                                    }
                                ]}
                                onPress={() => handleZoneChange(zone)}
                            >
                                <Text
                                    style={[
                                        styles.zoneButtonText,
                                        {
                                            color: schoolYearSettings.zone === zone
                                                ? '#FFFFFF'
                                                : theme.text
                                        }
                                    ]}
                                >
                                    Zone {zone}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Date de début */}
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: theme.cardBackground, marginTop: 8 }]}
                        onPress={() => setShowStartDatePicker(true)}
                    >
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons
                                name="calendar-start"
                                size={24}
                                color={theme.textSecondary}
                                style={styles.settingIcon}
                            />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Début année scolaire</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                                    {new Date(schoolYearSettings.schoolYearStart).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {showStartDatePicker && (
                        <DateTimePicker
                            value={new Date(schoolYearSettings.schoolYearStart)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleStartDateChange}
                        />
                    )}

                    {/* Date de fin */}
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
                        onPress={() => setShowEndDatePicker(true)}
                    >
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons
                                name="calendar-end"
                                size={24}
                                color={theme.textSecondary}
                                style={styles.settingIcon}
                            />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Fin année scolaire</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                                    {new Date(schoolYearSettings.schoolYearEnd).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {showEndDatePicker && (
                        <DateTimePicker
                            value={new Date(schoolYearSettings.schoolYearEnd)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleEndDateChange}
                            minimumDate={new Date(schoolYearSettings.schoolYearStart)}
                        />
                    )}
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Pédagogie</Text>

                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
                        onPress={() => navigation.navigate('CompetencesManagement')}
                    >
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons
                                name="star-box-multiple"
                                size={24}
                                color={theme.primary}
                                style={styles.settingIcon}
                            />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>
                                    Compétences
                                </Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                                    Gérer la bibliothèque de compétences
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Notifications</Text>

                    <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="bell" size={24} color={theme.textSecondary} style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Rappels de séances</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Recevoir des notifications</Text>
                            </View>
                        </View>
                        <Switch value={notifications} onValueChange={setNotifications} />
                    </View>
                </View>

                {/* Données */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Données</Text>

                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
                        onPress={handleSeedData}
                        disabled={isSeeding}
                    >
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons
                                name="database-plus"
                                size={24}
                                color={isSeeding ? theme.textTertiary : theme.primary}
                                style={styles.settingIcon}
                            />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>
                                    {isSeeding ? 'Génération en cours...' : 'Générer données de test'}
                                </Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                                    Créer classes, élèves et séances
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.cardBackground }]} onPress={handleExportData}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="export" size={24} color={theme.textSecondary} style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Exporter</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Sauvegarder vos données</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.cardBackground }]} onPress={handleImportData}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="import" size={24} color={theme.textSecondary} style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Importer</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Restaurer vos données</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, { backgroundColor: theme.cardBackground }, styles.dangerRow]} onPress={handleClearData}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="delete-forever" size={24} color="#DC2626" style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, styles.dangerText]}>Effacer toutes les données</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Action irréversible</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                {/* À propos */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>À propos</Text>

                    <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="information" size={24} color={theme.textSecondary} style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
                                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>1.0.0</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>RN-Carnet © 2025</Text>
                    <Text style={[styles.footerSubtext, { color: theme.textTertiary }]}>Assistant pédagogique pour enseignants</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginLeft: 16,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    settingRow: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: '#666',
    },
    dangerRow: {
        borderWidth: 1,
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
    },
    dangerText: {
        color: '#DC2626',
    },
    zoneSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    zoneButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    zoneButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
    footerSubtext: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 4,
    },
});
