import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getSettings,
    saveSettings,
    updateSettings,
    getSchoolYearSettings,
    updateSchoolYearSettings,
    resetSettings,
    clearSettings,
} from '../../../services/settingsService';
import { AppSettings } from '../../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('settingsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSettings', () => {
        it('should return default settings when no settings exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const settings = await getSettings();

            expect(settings).toEqual({
                theme: { mode: 'light' },
                notifications: true,
                sound: true,
                vibration: true,
                schoolYear: {
                    zone: 'A',
                    schoolYearStart: '2024-09-02',
                    schoolYearEnd: '2025-07-05',
                },
            });
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('@app_settings');
        });

        it('should return stored settings when they exist', async () => {
            const storedSettings: AppSettings = {
                theme: { mode: 'dark' },
                notifications: false,
                sound: true,
                vibration: false,
                schoolYear: {
                    zone: 'B',
                    schoolYearStart: '2024-09-01',
                    schoolYearEnd: '2025-07-10',
                },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(storedSettings)
            );

            const settings = await getSettings();

            expect(settings).toEqual(storedSettings);
        });

        it('should merge with defaults for backward compatibility', async () => {
            // Old settings without schoolYear property
            const oldSettings = {
                theme: { mode: 'light' },
                notifications: true,
                sound: false,
                vibration: true,
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(oldSettings)
            );

            const settings = await getSettings();

            expect(settings.schoolYear).toEqual({
                zone: 'A',
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2025-07-05',
            });
            expect(settings.sound).toBe(false);
            expect(settings.vibration).toBe(true);
        });

        it('should handle JSON parse errors gracefully', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

            const settings = await getSettings();

            // Should return defaults on parse error
            expect(settings.theme.mode).toBe('light');
            expect(settings.schoolYear?.zone).toBe('A');
        });

        it('should handle AsyncStorage errors gracefully', async () => {
            (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
                new Error('Storage error')
            );

            const settings = await getSettings();

            // Should return defaults on error
            expect(settings.theme.mode).toBe('light');
            expect(settings.schoolYear?.zone).toBe('A');
        });
    });

    describe('saveSettings', () => {
        it('should save settings to AsyncStorage', async () => {
            const newSettings: AppSettings = {
                theme: { mode: 'dark' },
                notifications: false,
                sound: true,
                vibration: false,
                schoolYear: {
                    zone: 'C',
                    schoolYearStart: '2024-09-03',
                    schoolYearEnd: '2025-07-08',
                },
            };

            await saveSettings(newSettings);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                JSON.stringify(newSettings)
            );
        });

        it('should handle AsyncStorage errors when saving', async () => {
            (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
                new Error('Storage error')
            );

            const newSettings: AppSettings = {
                theme: { mode: 'dark' },
                notifications: false,
                sound: true,
                vibration: false,
            };

            await expect(saveSettings(newSettings)).rejects.toThrow();
        });
    });

    describe('updateSettings', () => {
        it('should update specific settings properties', async () => {
            const existingSettings: AppSettings = {
                theme: { mode: 'light' },
                notifications: true,
                sound: true,
                vibration: true,
                schoolYear: {
                    zone: 'A',
                    schoolYearStart: '2024-09-02',
                    schoolYearEnd: '2025-07-05',
                },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(existingSettings)
            );
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await updateSettings({ notifications: false, sound: false });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                JSON.stringify({
                    ...existingSettings,
                    notifications: false,
                    sound: false,
                })
            );
        });

        it('should update theme mode', async () => {
            const existingSettings: AppSettings = {
                theme: { mode: 'light' },
                notifications: true,
                sound: true,
                vibration: true,
                schoolYear: {
                    zone: 'A',
                    schoolYearStart: '2024-09-02',
                    schoolYearEnd: '2025-07-05',
                },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(existingSettings)
            );
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await updateSettings({ theme: { mode: 'dark' } });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                JSON.stringify({
                    ...existingSettings,
                    theme: { mode: 'dark' },
                })
            );
        });

        it('should handle partial schoolYear updates', async () => {
            const existingSettings: AppSettings = {
                theme: { mode: 'light' },
                notifications: true,
                sound: true,
                vibration: true,
                schoolYear: {
                    zone: 'A',
                    schoolYearStart: '2024-09-02',
                    schoolYearEnd: '2025-07-05',
                },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(existingSettings)
            );
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await updateSettings({
                schoolYear: {
                    zone: 'B',
                    schoolYearStart: '2024-09-01',
                    schoolYearEnd: '2025-07-10',
                },
            });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                JSON.stringify({
                    ...existingSettings,
                    schoolYear: {
                        zone: 'B',
                        schoolYearStart: '2024-09-01',
                        schoolYearEnd: '2025-07-10',
                    },
                })
            );
        });
    });

    describe('getSchoolYearSettings', () => {
        it('should return school year settings when they exist', async () => {
            const settings: AppSettings = {
                theme: { mode: 'light' },
                notifications: true,
                sound: true,
                vibration: true,
                schoolYear: {
                    zone: 'B',
                    schoolYearStart: '2024-09-01',
                    schoolYearEnd: '2025-07-10',
                },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(settings)
            );

            const schoolYear = await getSchoolYearSettings();

            expect(schoolYear).toEqual({
                zone: 'B',
                schoolYearStart: '2024-09-01',
                schoolYearEnd: '2025-07-10',
            });
        });

        it('should return default school year settings when none exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const schoolYear = await getSchoolYearSettings();

            expect(schoolYear).toEqual({
                zone: 'A',
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2025-07-05',
            });
        });

        it('should return default school year for old settings without schoolYear', async () => {
            const oldSettings = {
                theme: { mode: 'light' },
                notifications: true,
                sound: true,
                vibration: true,
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(oldSettings)
            );

            const schoolYear = await getSchoolYearSettings();

            expect(schoolYear).toEqual({
                zone: 'A',
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2025-07-05',
            });
        });
    });

    describe('updateSchoolYearSettings', () => {
        it('should update only school year settings', async () => {
            const existingSettings: AppSettings = {
                theme: { mode: 'dark' },
                notifications: false,
                sound: true,
                vibration: false,
                schoolYear: {
                    zone: 'A',
                    schoolYearStart: '2024-09-02',
                    schoolYearEnd: '2025-07-05',
                },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(existingSettings)
            );
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await updateSchoolYearSettings({
                zone: 'C',
                schoolYearStart: '2024-09-03',
                schoolYearEnd: '2025-07-08',
            });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                JSON.stringify({
                    theme: { mode: 'dark' },
                    notifications: false,
                    sound: true,
                    vibration: false,
                    schoolYear: {
                        zone: 'C',
                        schoolYearStart: '2024-09-03',
                        schoolYearEnd: '2025-07-08',
                    },
                })
            );
        });

        it('should preserve other settings when updating school year', async () => {
            const existingSettings: AppSettings = {
                theme: { mode: 'dark' },
                notifications: false,
                sound: false,
                vibration: true,
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(existingSettings)
            );
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await updateSchoolYearSettings({
                zone: 'B',
                schoolYearStart: '2025-09-01',
                schoolYearEnd: '2026-07-10',
            });

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                JSON.stringify({
                    theme: { mode: 'dark' },
                    notifications: false,
                    sound: false,
                    vibration: true,
                    schoolYear: {
                        zone: 'B',
                        schoolYearStart: '2025-09-01',
                        schoolYearEnd: '2026-07-10',
                    },
                })
            );
        });
    });

    describe('resetSettings', () => {
        it('should reset settings to defaults', async () => {
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await resetSettings();

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                JSON.stringify({
                    theme: { mode: 'light' },
                    notifications: true,
                    sound: true,
                    vibration: true,
                    schoolYear: {
                        zone: 'A',
                        schoolYearStart: '2024-09-02',
                        schoolYearEnd: '2025-07-05',
                    },
                })
            );
        });

        it('should handle AsyncStorage errors when resetting', async () => {
            (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
                new Error('Storage error')
            );

            await expect(resetSettings()).rejects.toThrow();
        });
    });

    describe('clearSettings', () => {
        it('should remove settings from AsyncStorage', async () => {
            await clearSettings();

            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@app_settings');
        });

        it('should handle AsyncStorage errors when clearing', async () => {
            (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
                new Error('Storage error')
            );

            await expect(clearSettings()).rejects.toThrow();
        });
    });

    describe('integration scenarios', () => {
        it('should handle complete settings lifecycle', async () => {
            // Start with no settings
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            let settings = await getSettings();
            expect(settings.schoolYear?.zone).toBe('A');

            // Update school year
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(settings)
            );
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            await updateSchoolYearSettings({
                zone: 'B',
                schoolYearStart: '2024-09-01',
                schoolYearEnd: '2025-07-10',
            });

            // Verify update
            const updatedSettings = {
                ...settings,
                schoolYear: {
                    zone: 'B',
                    schoolYearStart: '2024-09-01',
                    schoolYearEnd: '2025-07-10',
                },
            };
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(updatedSettings)
            );
            settings = await getSettings();
            expect(settings.schoolYear?.zone).toBe('B');

            // Reset to defaults
            await resetSettings();
            expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
                '@app_settings',
                expect.stringContaining('"zone":"A"')
            );
        });

        it('should handle all three zones', async () => {
            const existingSettings: AppSettings = {
                theme: { mode: 'light' },
                notifications: true,
                sound: true,
                vibration: true,
            };

            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            // Test zone A
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
                JSON.stringify(existingSettings)
            );
            await updateSchoolYearSettings({
                zone: 'A',
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2025-07-05',
            });
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                expect.stringContaining('"zone":"A"')
            );

            // Test zone B
            await updateSchoolYearSettings({
                zone: 'B',
                schoolYearStart: '2024-09-01',
                schoolYearEnd: '2025-07-10',
            });
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                expect.stringContaining('"zone":"B"')
            );

            // Test zone C
            await updateSchoolYearSettings({
                zone: 'C',
                schoolYearStart: '2024-09-03',
                schoolYearEnd: '2025-07-08',
            });
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@app_settings',
                expect.stringContaining('"zone":"C"')
            );
        });
    });
});
