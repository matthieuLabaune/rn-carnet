/**
 * Service de gestion des paramètres de l'application
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, SchoolYearSettings } from '../types/settings';

const SETTINGS_KEY = '@app_settings';

/**
 * Paramètres par défaut de l'application
 */
const DEFAULT_SETTINGS: AppSettings = {
    theme: {
        mode: 'light',
    },
    notifications: true,
    sound: true,
    vibration: true,
    schoolYear: {
        zone: 'A',
        schoolYearStart: '2024-09-02',
        schoolYearEnd: '2025-07-05',
    },
};

/**
 * Récupère les paramètres de l'application
 */
export async function getSettings(): Promise<AppSettings> {
    try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!stored) {
            return DEFAULT_SETTINGS;
        }

        const settings: AppSettings = JSON.parse(stored);

        // Fusionner avec les valeurs par défaut pour gérer les nouvelles propriétés
        return {
            ...DEFAULT_SETTINGS,
            ...settings,
            schoolYear: settings.schoolYear || DEFAULT_SETTINGS.schoolYear,
        };
    } catch (error) {
        console.error('Error loading settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Sauvegarde les paramètres de l'application
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
    try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
        throw new Error('Impossible de sauvegarder les paramètres');
    }
}

/**
 * Met à jour partiellement les paramètres
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    try {
        const current = await getSettings();
        const updated = {
            ...current,
            ...updates,
        };
        await saveSettings(updated);
        return updated;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw new Error('Impossible de mettre à jour les paramètres');
    }
}

/**
 * Récupère les paramètres de l'année scolaire
 */
export async function getSchoolYearSettings(): Promise<SchoolYearSettings> {
    const settings = await getSettings();
    return settings.schoolYear || DEFAULT_SETTINGS.schoolYear!;
}

/**
 * Met à jour les paramètres de l'année scolaire
 */
export async function updateSchoolYearSettings(schoolYear: SchoolYearSettings): Promise<void> {
    await updateSettings({ schoolYear });
}

/**
 * Réinitialise les paramètres aux valeurs par défaut
 */
export async function resetSettings(): Promise<AppSettings> {
    await saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
}

/**
 * Supprime tous les paramètres
 */
export async function clearSettings(): Promise<void> {
    try {
        await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
        console.error('Error clearing settings:', error);
        throw new Error('Impossible de supprimer les paramètres');
    }
}

export const settingsService = {
    getSettings,
    saveSettings,
    updateSettings,
    getSchoolYearSettings,
    updateSchoolYearSettings,
    resetSettings,
    clearSettings,
};
