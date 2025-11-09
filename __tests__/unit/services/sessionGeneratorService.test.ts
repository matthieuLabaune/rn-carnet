/**
 * Tests pour sessionGeneratorService
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as sessionGeneratorService from '../../../services/sessionGeneratorService';
import * as settingsService from '../../../services/settingsService';
import * as scheduleService from '../../../services/scheduleService';
import * as sessionService from '../../../services/sessionService';
import * as holidayService from '../../../services/holidayService';
import type { ScheduleSlot } from '../../../types/schedule';
import type { Session } from '../../../types/session';
import type { SchoolYearSettings } from '../../../types/settings';

// Mock des services
jest.mock('../../../services/settingsService');
jest.mock('../../../services/scheduleService');
jest.mock('../../../services/sessionService');
jest.mock('../../../services/holidayService');

const mockSettingsService = settingsService as jest.Mocked<typeof settingsService>;
const mockScheduleService = scheduleService as jest.Mocked<typeof scheduleService>;
const mockSessionService = sessionService.sessionService as any;
const mockHolidayService = holidayService as jest.Mocked<typeof holidayService>;

describe('sessionGeneratorService', () => {
    const mockSettings: SchoolYearSettings = {
        zone: 'A',
        schoolYearStart: '2024-09-02', // Lundi
        schoolYearEnd: '2024-09-29',   // Dimanche (4 semaines exactes)
    };

    const mockScheduleSlots: ScheduleSlot[] = [
        {
            id: 'slot1',
            classId: 'class1',
            dayOfWeek: 1, // Lundi
            startTime: '09:00',
            duration: 60,
            subject: 'Mathématiques',
            frequency: 'weekly',
            createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
            id: 'slot2',
            classId: 'class1',
            dayOfWeek: 3, // Mercredi
            startTime: '14:00',
            duration: 90,
            subject: 'Français',
            frequency: 'weekly',
            createdAt: '2024-01-01T00:00:00.000Z',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks par défaut
        mockSettingsService.getSchoolYearSettings.mockResolvedValue(mockSettings);
        mockScheduleService.getByClass.mockResolvedValue(mockScheduleSlots);
        mockSessionService.deleteByClass = jest.fn() as any;
        mockSessionService.create = jest.fn().mockImplementation((data: any) =>
            Promise.resolve({
                id: `session_${Date.now()}_${Math.random()}`,
                ...data,
                createdAt: new Date().toISOString(),
            } as Session)
        );

        // Par défaut, aucun jour férié ni vacances
        mockHolidayService.isNonWorkingDay.mockImplementation(async (date: Date) => {
            const day = date.getDay();
            return day === 0 || day === 6; // Seulement weekends
        });
    });

    describe('generateSessions', () => {
        it('devrait générer des séances pour tous les créneaux hebdomadaires', async () => {
            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // Période: 2024-09-02 au 2024-09-29 (4 semaines exactes)
            // 4 lundis (2,9,16,23) + 4 mercredis (4,11,18,25) = 8 séances
            expect(result.totalGenerated).toBe(8);
            expect(result.startDate).toBe('2024-09-02');
            expect(result.endDate).toBe('2024-09-29');
            expect(mockSessionService.create).toHaveBeenCalledTimes(8);
        });

        it('devrait exclure les weekends', async () => {
            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // Vérifier qu'aucune séance n'est créée le weekend
            const createCalls = (mockSessionService.create as jest.Mock).mock.calls;
            createCalls.forEach((call: any) => {
                const sessionData = call[0];
                const date = new Date(sessionData.date);
                const day = date.getDay();
                expect(day).not.toBe(0); // Pas dimanche
                expect(day).not.toBe(6); // Pas samedi
            });
        });

        it('devrait exclure les jours fériés', async () => {
            // Réinitialiser complètement le mock
            mockScheduleService.getByClass.mockResolvedValue(mockScheduleSlots);

            // Mock: 2024-09-16 (lundi) est un jour férié
            mockHolidayService.isNonWorkingDay.mockImplementation(async (date: Date) => {
                const day = date.getDay();
                if (day === 0 || day === 6) return true; // Weekends

                // Utiliser la même conversion de date que le service
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const dayNum = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${dayNum}`;

                return dateStr === '2024-09-16'; // Jour férié (lundi de la semaine 3)
            });

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // 3 lundis (2,9,23 au lieu de 2,9,16,23) + 4 mercredis = 7 séances
            expect(result.totalGenerated).toBe(7);
            expect(result.skippedDays).toBeGreaterThan(8); // Weekends + 1 férié
        });

        it('devrait exclure les vacances scolaires', async () => {
            // Réinitialiser le mock des schedule slots
            mockScheduleService.getByClass.mockResolvedValue(mockScheduleSlots);

            // Mock: 2024-09-16 au 2024-09-22 sont en vacances (semaine 3)
            mockHolidayService.isNonWorkingDay.mockImplementation(async (date: Date) => {
                const day = date.getDay();
                if (day === 0 || day === 6) return true; // Weekends

                // Utiliser la même conversion que le service
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const dayNum = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${dayNum}`;

                return dateStr >= '2024-09-16' && dateStr <= '2024-09-22'; // Vacances semaine 3
            });

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // Semaine 3 (16-22) exclue: 3 lundis (2,9,23) + 3 mercredis (4,11,25) = 6 séances
            expect(result.totalGenerated).toBe(6);
        });

        it('devrait supprimer les séances existantes si deleteExisting=true', async () => {
            await sessionGeneratorService.generateSessions({
                classId: 'class1',
                deleteExisting: true,
            });

            expect(mockSessionService.deleteByClass).toHaveBeenCalledWith('class1');
            expect(mockSessionService.deleteByClass).toHaveBeenCalledTimes(1);
        });

        it('ne devrait pas créer de séances en mode preview', async () => {
            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
                preview: true,
            });

            expect(result.totalGenerated).toBe(8);
            expect(result.sessionsCreated).toEqual([]);
            expect(mockSessionService.create).not.toHaveBeenCalled();
        });

        it('ne devrait pas supprimer les séances en mode preview', async () => {
            await sessionGeneratorService.generateSessions({
                classId: 'class1',
                preview: true,
                deleteExisting: true,
            });

            expect(mockSessionService.deleteByClass).not.toHaveBeenCalled();
        });

        it('devrait créer des séances avec les bonnes données', async () => {
            await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            const firstCall = (mockSessionService.create as jest.Mock).mock.calls[0][0];
            expect(firstCall).toEqual({
                classId: 'class1',
                subject: 'Mathématiques',
                date: '2024-09-02', // Premier lundi
                duration: 60,
                status: 'planned',
            });
        });
    });

    describe('generateSessions - fréquence biweekly', () => {
        beforeEach(() => {
            // Configuration avec créneaux bimensuels
            const biweeklySlots: ScheduleSlot[] = [
                {
                    id: 'slot1',
                    classId: 'class1',
                    dayOfWeek: 1, // Lundi
                    startTime: '09:00',
                    duration: 60,
                    subject: 'Mathématiques',
                    frequency: 'biweekly',
                    startWeek: 0, // Semaines paires (0, 2, ...)
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
                {
                    id: 'slot2',
                    classId: 'class1',
                    dayOfWeek: 1, // Lundi
                    startTime: '14:00',
                    duration: 90,
                    subject: 'Français',
                    frequency: 'biweekly',
                    startWeek: 1, // Semaines impaires (1, 3, ...)
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
            ];
            mockScheduleService.getByClass.mockResolvedValue(biweeklySlots);
        });

        it('devrait alterner correctement les créneaux biweekly', async () => {
            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // 4 lundis: semaines 0,1,2,3
            // startWeek=0 -> semaines 0,2 (2 séances Math)
            // startWeek=1 -> semaines 1,3 (2 séances Français)
            // Total: 4 séances
            expect(result.totalGenerated).toBe(4);

            const createCalls = (mockSessionService.create as jest.Mock).mock.calls;
            const mathSessions = createCalls.filter((call: any) => call[0].subject === 'Mathématiques');
            const frenchSessions = createCalls.filter((call: any) => call[0].subject === 'Français');

            expect(mathSessions.length).toBe(2); // Semaines 0, 2
            expect(frenchSessions.length).toBe(2); // Semaines 1, 3
        });

        it('devrait respecter startWeek=0 (semaines paires)', async () => {
            const slots: ScheduleSlot[] = [
                {
                    id: 'slot1',
                    classId: 'class1',
                    dayOfWeek: 1,
                    startTime: '09:00',
                    duration: 60,
                    subject: 'Mathématiques',
                    frequency: 'biweekly',
                    startWeek: 0,
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
            ];
            mockScheduleService.getByClass.mockResolvedValue(slots);

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // 4 lundis, semaines 0 et 2 seulement
            expect(result.totalGenerated).toBe(2);

            const dates = (mockSessionService.create as jest.Mock).mock.calls.map(
                (call: any) => call[0].date
            );
            expect(dates).toEqual(['2024-09-02', '2024-09-16']); // Semaines 0 et 2
        });

        it('devrait respecter startWeek=1 (semaines impaires)', async () => {
            const slots: ScheduleSlot[] = [
                {
                    id: 'slot1',
                    classId: 'class1',
                    dayOfWeek: 1,
                    startTime: '09:00',
                    duration: 60,
                    subject: 'Français',
                    frequency: 'biweekly',
                    startWeek: 1,
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
            ];
            mockScheduleService.getByClass.mockResolvedValue(slots);

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // 4 lundis, semaines 1 et 3 seulement
            expect(result.totalGenerated).toBe(2);

            const dates = (mockSessionService.create as jest.Mock).mock.calls.map(
                (call: any) => call[0].date
            );
            expect(dates).toEqual(['2024-09-09', '2024-09-23']); // Semaines 1 et 3
        });
    });

    describe('generateSessions - cas limites', () => {
        it('devrait gérer une période courte (1 semaine)', async () => {
            mockSettingsService.getSchoolYearSettings.mockResolvedValue({
                zone: 'A',
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2024-09-08', // 1 semaine seulement
            });

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            // 1 lundi + 1 mercredi = 2 séances
            expect(result.totalGenerated).toBe(2);
        });

        it('devrait gérer une année complète', async () => {
            mockSettingsService.getSchoolYearSettings.mockResolvedValue({
                zone: 'A',
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2025-07-04', // Année complète (~40 semaines)
            });

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
                preview: true, // Preview pour ne pas créer réellement
            });

            // Environ 40 semaines * 2 créneaux/semaine = ~80 séances
            // (moins les vacances/fériés)
            expect(result.totalGenerated).toBeGreaterThan(50);
        });

        it('devrait lever une erreur si pas de paramètres d\'année scolaire', async () => {
            mockSettingsService.getSchoolYearSettings.mockResolvedValue(null as any);

            await expect(
                sessionGeneratorService.generateSessions({ classId: 'class1' })
            ).rejects.toThrow('Les paramètres de l\'année scolaire ne sont pas configurés');
        });

        it('devrait lever une erreur si zone non configurée', async () => {
            mockSettingsService.getSchoolYearSettings.mockResolvedValue({
                zone: undefined,
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2024-09-30',
            } as any);

            await expect(
                sessionGeneratorService.generateSessions({ classId: 'class1' })
            ).rejects.toThrow('Zone et dates de l\'année scolaire doivent être configurées');
        });

        it('devrait lever une erreur si pas de créneaux', async () => {
            mockScheduleService.getByClass.mockResolvedValue([]);

            await expect(
                sessionGeneratorService.generateSessions({ classId: 'class1' })
            ).rejects.toThrow('Aucun créneau d\'emploi du temps configuré pour cette classe');
        });

        it('devrait gérer les différentes zones (A, B, C)', async () => {
            // Test avec zone B
            mockSettingsService.getSchoolYearSettings.mockResolvedValue({
                zone: 'B',
                schoolYearStart: '2024-09-02',
                schoolYearEnd: '2024-09-29',
            });

            mockHolidayService.isNonWorkingDay.mockImplementation(async (date: Date, zone: string) => {
                const day = date.getDay();
                if (day === 0 || day === 6) return true;

                // Vacances spécifiques à zone B
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const dayNum = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${dayNum}`;

                return zone === 'B' && dateStr >= '2024-09-20' && dateStr <= '2024-09-25';
            });

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
            });

            expect(mockHolidayService.isNonWorkingDay).toHaveBeenCalledWith(
                expect.any(Date),
                'B'
            );
        });
    });

    describe('previewGeneration', () => {
        it('devrait retourner le nombre de séances sans les créer', async () => {
            const result = await sessionGeneratorService.previewGeneration('class1');

            expect(result.totalGenerated).toBe(8);
            expect(result.sessionsCreated).toEqual([]);
            expect(mockSessionService.create).not.toHaveBeenCalled();
        });
    });

    describe('regenerateSessions', () => {
        it('devrait supprimer puis recréer toutes les séances', async () => {
            const result = await sessionGeneratorService.regenerateSessions('class1');

            expect(mockSessionService.deleteByClass).toHaveBeenCalledWith('class1');
            expect(result.totalGenerated).toBe(8);
            expect(mockSessionService.create).toHaveBeenCalledTimes(8);
        });
    });

    describe('getGenerationStats', () => {
        it('devrait gérer les statistiques de génération', async () => {
            const stats = await sessionGeneratorService.getGenerationStats('class1');

            expect(stats.scheduleSlots).toBe(2);
            expect(stats.estimatedSessions).toBe(8);
            expect(stats.schoolYearDays).toBe(28); // Du 2 au 29 septembre
            expect(stats.workingDays).toBeGreaterThan(0);
        });

        it('devrait retourner des zéros si pas de configuration', async () => {
            mockSettingsService.getSchoolYearSettings.mockResolvedValue({
                zone: 'A',
                schoolYearStart: undefined,
                schoolYearEnd: undefined,
            } as any);

            const stats = await sessionGeneratorService.getGenerationStats('class1');

            expect(stats.scheduleSlots).toBe(0);
            expect(stats.estimatedSessions).toBe(0);
            expect(stats.schoolYearDays).toBe(0);
            expect(stats.workingDays).toBe(0);
        });
    });

    describe('cas réels de calendrier français', () => {
        it('devrait exclure la Toussaint 2024 (zone A)', async () => {
            mockSettingsService.getSchoolYearSettings.mockResolvedValue({
                zone: 'A',
                schoolYearStart: '2024-10-14', // Semaine avant Toussaint
                schoolYearEnd: '2024-11-08',   // Semaine après Toussaint
            });

            // Toussaint zone A: 19 oct - 4 nov 2024
            mockHolidayService.isNonWorkingDay.mockImplementation(async (date: Date) => {
                const day = date.getDay();
                if (day === 0 || day === 6) return true;

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const dayNum = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${dayNum}`;

                return dateStr >= '2024-10-19' && dateStr <= '2024-11-04';
            });

            const result = await sessionGeneratorService.generateSessions({
                classId: 'class1',
                preview: true,
            });

            // Vérifier qu'aucune séance n'est créée pendant les vacances
            const createCalls = (mockSessionService.create as jest.Mock).mock.calls;
            createCalls.forEach((call: any) => {
                const date = call[0].date;
                expect(date < '2024-10-19' || date > '2024-11-04').toBe(true);
            });
        });
    });
});
