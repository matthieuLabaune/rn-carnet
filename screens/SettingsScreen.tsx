import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { seedDatabase, TeacherType } from '../utils/seedData';

export default function SettingsScreen() {
    const { theme, themeMode, setThemeMode, isDark } = useTheme();
    const [notifications, setNotifications] = React.useState(true);
    const [isSeeding, setIsSeeding] = React.useState(false);

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
                { text: 'Effacer', style: 'destructive', onPress: () => { } },
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
