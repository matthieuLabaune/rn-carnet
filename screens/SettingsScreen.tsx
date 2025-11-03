import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const [darkMode, setDarkMode] = React.useState(false);
    const [notifications, setNotifications] = React.useState(true);

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
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <MaterialCommunityIcons name="cog" size={28} color="#000" />
                <Text style={styles.headerTitle}>Paramètres</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Apparence */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Apparence</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="theme-light-dark" size={24} color="#666" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingLabel}>Mode sombre</Text>
                                <Text style={styles.settingDescription}>Activer le thème sombre</Text>
                            </View>
                        </View>
                        <Switch value={darkMode} onValueChange={setDarkMode} />
                    </View>
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="bell" size={24} color="#666" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingLabel}>Rappels de séances</Text>
                                <Text style={styles.settingDescription}>Recevoir des notifications</Text>
                            </View>
                        </View>
                        <Switch value={notifications} onValueChange={setNotifications} />
                    </View>
                </View>

                {/* Données */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Données</Text>

                    <TouchableOpacity style={styles.settingRow} onPress={handleExportData}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="export" size={24} color="#666" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingLabel}>Exporter</Text>
                                <Text style={styles.settingDescription}>Sauvegarder vos données</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow} onPress={handleImportData}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="import" size={24} color="#666" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingLabel}>Importer</Text>
                                <Text style={styles.settingDescription}>Restaurer vos données</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.settingRow, styles.dangerRow]} onPress={handleClearData}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="delete-forever" size={24} color="#DC2626" style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, styles.dangerText]}>Effacer toutes les données</Text>
                                <Text style={styles.settingDescription}>Action irréversible</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                {/* À propos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>À propos</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <MaterialCommunityIcons name="information" size={24} color="#666" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingLabel}>Version</Text>
                                <Text style={styles.settingDescription}>1.0.0</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>RN-Carnet © 2025</Text>
                    <Text style={styles.footerSubtext}>Assistant pédagogique pour enseignants</Text>
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
