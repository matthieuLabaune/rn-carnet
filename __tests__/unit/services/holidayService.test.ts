/**
 * Tests for holidayService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { holidayService } from '../../../services/holidayService';

describe('holidayService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.clear();
    });

    describe('getHolidays', () => {
        it('should return holidays for 2024-2025 school year', async () => {
            const holidays = await holidayService.getHolidays('2024-2025');

            expect(holidays).toBeDefined();
            expect(holidays.length).toBeGreaterThan(0);
            expect(holidays[0]).toHaveProperty('id');
            expect(holidays[0]).toHaveProperty('description');
            expect(holidays[0]).toHaveProperty('start');
            expect(holidays[0]).toHaveProperty('end');
            expect(holidays[0]).toHaveProperty('zones');
            expect(holidays[0]).toHaveProperty('schoolYear');
        });

        it('should return holidays for 2025-2026 school year', async () => {
            const holidays = await holidayService.getHolidays('2025-2026');

            expect(holidays).toBeDefined();
            expect(holidays.length).toBeGreaterThan(0);
            expect(holidays[0].schoolYear).toBe('2025-2026');
        });

        it('should include common holidays for all zones', async () => {
            const holidays = await holidayService.getHolidays('2024-2025');

            const toussaint = holidays.find(h => h.description === 'Vacances de la Toussaint');
            expect(toussaint).toBeDefined();
            expect(toussaint?.zones).toEqual(['A', 'B', 'C']);

            const noel = holidays.find(h => h.description === 'Vacances de Noël');
            expect(noel).toBeDefined();
            expect(noel?.zones).toEqual(['A', 'B', 'C']);
        });

        it('should include zone-specific holidays', async () => {
            const holidays = await holidayService.getHolidays('2024-2025');

            const hiverA = holidays.find(h => h.id === 'hiver-2025-a');
            expect(hiverA).toBeDefined();
            expect(hiverA?.zones).toEqual(['A']);

            const hiverB = holidays.find(h => h.id === 'hiver-2025-b');
            expect(hiverB).toBeDefined();
            expect(hiverB?.zones).toEqual(['B']);

            const hiverC = holidays.find(h => h.id === 'hiver-2025-c');
            expect(hiverC).toBeDefined();
            expect(hiverC?.zones).toEqual(['C']);
        });

        it('should cache holidays data', async () => {
            await holidayService.getHolidays('2024-2025');

            expect(AsyncStorage.setItem).toHaveBeenCalled();
            const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
            const cacheCall = calls.find(call => call[0] === '@holidays_cache');
            expect(cacheCall).toBeDefined();
        });

        it('should use cached data when available', async () => {
            // Premier appel
            await holidayService.getHolidays('2024-2025');
            const firstCallCount = (AsyncStorage.setItem as jest.Mock).mock.calls.length;

            // Deuxième appel (devrait utiliser le cache)
            await holidayService.getHolidays('2024-2025');
            const secondCallCount = (AsyncStorage.setItem as jest.Mock).mock.calls.length;

            // Pas de nouvel appel setItem (utilise le cache)
            expect(secondCallCount).toBe(firstCallCount);
        });
    });

    describe('getHolidaysByZone', () => {
        it('should filter holidays by zone A', async () => {
            const holidays = await holidayService.getHolidaysByZone('A', '2024-2025');

            holidays.forEach(holiday => {
                expect(holiday.zones).toContain('A');
            });
        });

        it('should filter holidays by zone B', async () => {
            const holidays = await holidayService.getHolidaysByZone('B', '2024-2025');

            holidays.forEach(holiday => {
                expect(holiday.zones).toContain('B');
            });
        });

        it('should filter holidays by zone C', async () => {
            const holidays = await holidayService.getHolidaysByZone('C', '2024-2025');

            holidays.forEach(holiday => {
                expect(holiday.zones).toContain('C');
            });
        });

        it('should include common holidays for all zones', async () => {
            const holidaysA = await holidayService.getHolidaysByZone('A', '2024-2025');
            const holidaysB = await holidayService.getHolidaysByZone('B', '2024-2025');
            const holidaysC = await holidayService.getHolidaysByZone('C', '2024-2025');

            const toussaintA = holidaysA.find(h => h.description === 'Vacances de la Toussaint');
            const toussaintB = holidaysB.find(h => h.description === 'Vacances de la Toussaint');
            const toussaintC = holidaysC.find(h => h.description === 'Vacances de la Toussaint');

            expect(toussaintA).toBeDefined();
            expect(toussaintB).toBeDefined();
            expect(toussaintC).toBeDefined();
        });

        it('should have different winter holidays dates per zone', async () => {
            const holidaysA = await holidayService.getHolidaysByZone('A', '2024-2025');
            const holidaysB = await holidayService.getHolidaysByZone('B', '2024-2025');
            const holidaysC = await holidayService.getHolidaysByZone('C', '2024-2025');

            const hiverA = holidaysA.find(h => h.description === 'Vacances d\'Hiver');
            const hiverB = holidaysB.find(h => h.description === 'Vacances d\'Hiver');
            const hiverC = holidaysC.find(h => h.description === 'Vacances d\'Hiver');

            expect(hiverA?.start).not.toBe(hiverB?.start);
            expect(hiverB?.start).not.toBe(hiverC?.start);
            expect(hiverA?.start).not.toBe(hiverC?.start);
        });
    });

    describe('getPublicHolidays', () => {
        it('should return public holidays for a school year', async () => {
            const publicHolidays = await holidayService.getPublicHolidays('2024-2025');

            expect(publicHolidays).toBeDefined();
            expect(publicHolidays.length).toBeGreaterThan(0);
            expect(publicHolidays[0]).toHaveProperty('date');
            expect(publicHolidays[0]).toHaveProperty('name');
            expect(publicHolidays[0]).toHaveProperty('type');
        });

        it('should include fixed public holidays', async () => {
            const publicHolidays = await holidayService.getPublicHolidays('2024-2025');

            const jourDeLan = publicHolidays.find(h => h.name === 'Jour de l\'an');
            expect(jourDeLan).toBeDefined();
            expect(jourDeLan?.date).toMatch(/^\d{4}-01-01$/);

            const noel = publicHolidays.find(h => h.name === 'Noël');
            expect(noel).toBeDefined();
            expect(noel?.date).toMatch(/^\d{4}-12-25$/);

            const feteNationale = publicHolidays.find(h => h.name === 'Fête Nationale');
            expect(feteNationale).toBeDefined();
            expect(feteNationale?.date).toMatch(/^\d{4}-07-14$/);
        });

        it('should include mobile public holidays (Easter-based)', async () => {
            const publicHolidays = await holidayService.getPublicHolidays('2024-2025');

            const lundiPaques = publicHolidays.find(h => h.name === 'Lundi de Pâques');
            expect(lundiPaques).toBeDefined();

            const ascension = publicHolidays.find(h => h.name === 'Ascension');
            expect(ascension).toBeDefined();

            const lundiPentecote = publicHolidays.find(h => h.name === 'Lundi de Pentecôte');
            expect(lundiPentecote).toBeDefined();
        });

        it('should have holidays for both years of the school year', async () => {
            const publicHolidays = await holidayService.getPublicHolidays('2024-2025');

            const in2024 = publicHolidays.some(h => h.date.startsWith('2024-'));
            const in2025 = publicHolidays.some(h => h.date.startsWith('2025-'));

            expect(in2024).toBe(true);
            expect(in2025).toBe(true);
        });

        it('should sort holidays by date', async () => {
            const publicHolidays = await holidayService.getPublicHolidays('2024-2025');

            for (let i = 1; i < publicHolidays.length; i++) {
                expect(publicHolidays[i].date >= publicHolidays[i - 1].date).toBe(true);
            }
        });
    });

    describe('isHoliday', () => {
        it('should return true for a date during Toussaint holidays', async () => {
            const date = new Date('2024-10-25');
            const result = await holidayService.isHoliday(date, 'A', '2024-2025');

            expect(result).toBe(true);
        });

        it('should return true for a date during Christmas holidays', async () => {
            const date = new Date('2024-12-25');
            const result = await holidayService.isHoliday(date, 'B', '2024-2025');

            expect(result).toBe(true);
        });

        it('should return false for a school day', async () => {
            const date = new Date('2024-11-15');
            const result = await holidayService.isHoliday(date, 'A', '2024-2025');

            expect(result).toBe(false);
        });

        it('should respect zone-specific holidays', async () => {
            const date = new Date('2025-02-10'); // During Zone A winter holidays

            const resultA = await holidayService.isHoliday(date, 'A', '2024-2025');
            const resultB = await holidayService.isHoliday(date, 'B', '2024-2025');

            expect(resultA).toBe(true);
            expect(resultB).toBe(false); // Zone B has different dates
        });

        it('should handle dates at the start of holidays', async () => {
            const date = new Date('2024-10-19'); // First day of Toussaint
            const result = await holidayService.isHoliday(date, 'A', '2024-2025');

            expect(result).toBe(true);
        });

        it('should handle dates at the end of holidays', async () => {
            const date = new Date('2024-11-04'); // Last day of Toussaint
            const result = await holidayService.isHoliday(date, 'C', '2024-2025');

            expect(result).toBe(true);
        });
    });

    describe('isPublicHoliday', () => {
        it('should return true for New Year', async () => {
            const date = new Date('2025-01-01');
            const result = await holidayService.isPublicHoliday(date, '2024-2025');

            expect(result).toBe(true);
        });

        it('should return true for Christmas', async () => {
            const date = new Date('2024-12-25');
            const result = await holidayService.isPublicHoliday(date, '2024-2025');

            expect(result).toBe(true);
        });

        it('should return true for Bastille Day', async () => {
            const date = new Date('2025-07-14');
            const result = await holidayService.isPublicHoliday(date, '2024-2025');

            expect(result).toBe(true);
        });

        it('should return false for a regular day', async () => {
            const date = new Date('2024-11-15');
            const result = await holidayService.isPublicHoliday(date, '2024-2025');

            expect(result).toBe(false);
        });
    });

    describe('isNonWorkingDay', () => {
        it('should return true for a public holiday', async () => {
            const date = new Date('2025-01-01');
            const result = await holidayService.isNonWorkingDay(date, 'A', '2024-2025');

            expect(result).toBe(true);
        });

        it('should return true for a school holiday', async () => {
            const date = new Date('2024-10-25');
            const result = await holidayService.isNonWorkingDay(date, 'B', '2024-2025');

            expect(result).toBe(true);
        });

        it('should return false for a working day', async () => {
            const date = new Date('2024-11-15');
            const result = await holidayService.isNonWorkingDay(date, 'C', '2024-2025');

            expect(result).toBe(false);
        });

        it('should return true when public holiday falls during school holidays', async () => {
            const date = new Date('2024-12-25'); // Christmas during winter break
            const result = await holidayService.isNonWorkingDay(date, 'A', '2024-2025');

            expect(result).toBe(true);
        });
    });

    describe('clearHolidaysCache', () => {
        it('should clear the cache', async () => {
            // Créer un cache
            await holidayService.getHolidays('2024-2025');

            // Vider le cache
            await holidayService.clearHolidaysCache();

            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@holidays_cache');
        });

        it('should reload data after cache clear', async () => {
            // Premier chargement
            await holidayService.getHolidays('2024-2025');
            const firstCallCount = (AsyncStorage.setItem as jest.Mock).mock.calls.length;

            // Vider le cache
            await holidayService.clearHolidaysCache();

            // Deuxième chargement (devrait recharger les données)
            await holidayService.getHolidays('2024-2025');
            const secondCallCount = (AsyncStorage.setItem as jest.Mock).mock.calls.length;

            expect(secondCallCount).toBeGreaterThan(firstCallCount);
        });
    });
});
