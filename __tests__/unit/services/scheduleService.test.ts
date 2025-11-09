jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { scheduleService } from '../../../services/scheduleService';

declare global {
    var mockDb: any;
}

describe('scheduleService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getByClass', () => {
        it('should return all schedule slots for a class', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'slot-1',
                    class_id: 'class-1',
                    day_of_week: 1,
                    start_time: '08:00',
                    duration: 60,
                    subject: 'Mathématiques',
                    frequency: 'weekly',
                    start_week: null,
                    created_at: '2024-01-01',
                },
                {
                    id: 'slot-2',
                    class_id: 'class-1',
                    day_of_week: 3,
                    start_time: '10:00',
                    duration: 90,
                    subject: 'Français',
                    frequency: 'biweekly',
                    start_week: 0,
                    created_at: '2024-01-01',
                },
            ]);

            const result = await scheduleService.getByClass('class-1');

            expect(result).toHaveLength(2);
            expect(result[0].subject).toBe('Mathématiques');
            expect(result[0].dayOfWeek).toBe(1);
            expect(result[0].frequency).toBe('weekly');
            expect(result[1].subject).toBe('Français');
            expect(result[1].frequency).toBe('biweekly');
            expect(result[1].startWeek).toBe(0);
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE class_id = ?'),
                ['class-1']
            );
        });

        it('should return empty array when no slots exist', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await scheduleService.getByClass('class-1');

            expect(result).toEqual([]);
        });

        it('should order slots by day and time', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            await scheduleService.getByClass('class-1');

            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY day_of_week, start_time'),
                ['class-1']
            );
        });
    });

    describe('getAll', () => {
        it('should return all schedule slots from all classes', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'slot-1',
                    class_id: 'class-1',
                    day_of_week: 1,
                    start_time: '08:00',
                    duration: 60,
                    subject: 'Mathématiques',
                    frequency: 'weekly',
                    start_week: null,
                    created_at: '2024-01-01',
                },
                {
                    id: 'slot-2',
                    class_id: 'class-2',
                    day_of_week: 2,
                    start_time: '09:00',
                    duration: 45,
                    subject: 'Histoire',
                    frequency: 'weekly',
                    start_week: null,
                    created_at: '2024-01-01',
                },
            ]);

            const result = await scheduleService.getAll();

            expect(result).toHaveLength(2);
            expect(result[0].classId).toBe('class-1');
            expect(result[1].classId).toBe('class-2');
        });
    });

    describe('getById', () => {
        it('should return a schedule slot by id', async () => {
            const mockSlot = {
                id: 'slot-1',
                class_id: 'class-1',
                day_of_week: 1,
                start_time: '08:00',
                duration: 60,
                subject: 'Mathématiques',
                frequency: 'weekly',
                start_week: null,
                created_at: '2024-01-01',
            };

            global.mockDb.getFirstAsync.mockResolvedValue(mockSlot);

            const result = await scheduleService.getById('slot-1');

            expect(result).toBeDefined();
            expect(result?.subject).toBe('Mathématiques');
            expect(result?.dayOfWeek).toBe(1);
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['slot-1']
            );
        });

        it('should return null when slot not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await scheduleService.getById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new weekly schedule slot', async () => {
            const newSlot = {
                classId: 'class-1',
                dayOfWeek: 1,
                startTime: '08:00',
                duration: 60,
                subject: 'Mathématiques',
                frequency: 'weekly' as const,
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 1,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id',
                class_id: newSlot.classId,
                day_of_week: newSlot.dayOfWeek,
                start_time: newSlot.startTime,
                duration: newSlot.duration,
                subject: newSlot.subject,
                frequency: newSlot.frequency,
                start_week: null,
                created_at: new Date().toISOString(),
            });

            const result = await scheduleService.create(newSlot);

            expect(result.subject).toBe('Mathématiques');
            expect(result.frequency).toBe('weekly');
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO schedule_slots'),
                expect.arrayContaining([
                    expect.any(String),
                    'class-1',
                    1,
                    '08:00',
                    60,
                    'Mathématiques',
                    'weekly',
                    null,
                    expect.any(String),
                ])
            );
        });

        it('should create a biweekly schedule slot with start week', async () => {
            const newSlot = {
                classId: 'class-1',
                dayOfWeek: 3,
                startTime: '10:00',
                duration: 90,
                subject: 'Français',
                frequency: 'biweekly' as const,
                startWeek: 1,
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 1,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id',
                class_id: newSlot.classId,
                day_of_week: newSlot.dayOfWeek,
                start_time: newSlot.startTime,
                duration: newSlot.duration,
                subject: newSlot.subject,
                frequency: newSlot.frequency,
                start_week: newSlot.startWeek,
                created_at: new Date().toISOString(),
            });

            const result = await scheduleService.create(newSlot);

            expect(result.frequency).toBe('biweekly');
            expect(result.startWeek).toBe(1);
        });

        it('should reject invalid dayOfWeek', async () => {
            const invalidSlot = {
                classId: 'class-1',
                dayOfWeek: 8,
                startTime: '08:00',
                duration: 60,
                subject: 'Test',
                frequency: 'weekly' as const,
            };

            await expect(scheduleService.create(invalidSlot)).rejects.toThrow(
                'dayOfWeek doit être entre 1 (lundi) et 7 (dimanche)'
            );
        });

        it('should reject invalid frequency', async () => {
            const invalidSlot = {
                classId: 'class-1',
                dayOfWeek: 1,
                startTime: '08:00',
                duration: 60,
                subject: 'Test',
                frequency: 'invalid' as any,
            };

            await expect(scheduleService.create(invalidSlot)).rejects.toThrow(
                'frequency doit être "weekly" ou "biweekly"'
            );
        });

        it('should reject invalid startWeek for biweekly', async () => {
            const invalidSlot = {
                classId: 'class-1',
                dayOfWeek: 1,
                startTime: '08:00',
                duration: 60,
                subject: 'Test',
                frequency: 'biweekly' as const,
                startWeek: 2,
            };

            await expect(scheduleService.create(invalidSlot)).rejects.toThrow(
                'startWeek doit être 0 ou 1 pour une fréquence biweekly'
            );
        });
    });

    describe('update', () => {
        it('should update schedule slot fields', async () => {
            const updates = {
                subject: 'Géométrie',
                duration: 90,
            };

            global.mockDb.runAsync.mockResolvedValue({
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'slot-1',
                class_id: 'class-1',
                day_of_week: 1,
                start_time: '08:00',
                duration: 90,
                subject: 'Géométrie',
                frequency: 'weekly',
                start_week: null,
                created_at: '2024-01-01',
            });

            const result = await scheduleService.update('slot-1', updates);

            expect(result.subject).toBe('Géométrie');
            expect(result.duration).toBe(90);
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE schedule_slots SET'),
                expect.arrayContaining(['Géométrie', 90, 'slot-1'])
            );
        });

        it('should update frequency from weekly to biweekly', async () => {
            const updates = {
                frequency: 'biweekly' as const,
                startWeek: 0,
            };

            global.mockDb.runAsync.mockResolvedValue({
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'slot-1',
                class_id: 'class-1',
                day_of_week: 1,
                start_time: '08:00',
                duration: 60,
                subject: 'Mathématiques',
                frequency: 'biweekly',
                start_week: 0,
                created_at: '2024-01-01',
            });

            const result = await scheduleService.update('slot-1', updates);

            expect(result.frequency).toBe('biweekly');
            expect(result.startWeek).toBe(0);
        });

        it('should reject invalid dayOfWeek', async () => {
            await expect(
                scheduleService.update('slot-1', { dayOfWeek: 0 })
            ).rejects.toThrow('dayOfWeek doit être entre 1 (lundi) et 7 (dimanche)');
        });

        it('should reject update with no fields', async () => {
            await expect(scheduleService.update('slot-1', {})).rejects.toThrow(
                'No fields to update'
            );
        });
    });

    describe('delete', () => {
        it('should delete a schedule slot', async () => {
            global.mockDb.runAsync.mockResolvedValue({
                changes: 1,
            });

            await scheduleService.delete('slot-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                'DELETE FROM schedule_slots WHERE id = ?',
                ['slot-1']
            );
        });
    });

    describe('deleteByClass', () => {
        it('should delete all slots for a class', async () => {
            global.mockDb.runAsync.mockResolvedValue({
                changes: 3,
            });

            await scheduleService.deleteByClass('class-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                'DELETE FROM schedule_slots WHERE class_id = ?',
                ['class-1']
            );
        });
    });

    describe('getStats', () => {
        it('should return statistics for a class', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                totalSlots: 5,
                weeklySlots: 3,
                biweeklySlots: 2,
                totalWeeklyMinutes: 300,
            });

            const result = await scheduleService.getStats('class-1');

            expect(result.totalSlots).toBe(5);
            expect(result.weeklySlots).toBe(3);
            expect(result.biweeklySlots).toBe(2);
            expect(result.totalWeeklyMinutes).toBe(300);
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE class_id = ?'),
                ['class-1']
            );
        });

        it('should return statistics for all classes', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                totalSlots: 10,
                weeklySlots: 6,
                biweeklySlots: 4,
                totalWeeklyMinutes: 600,
            });

            const result = await scheduleService.getStats();

            expect(result.totalSlots).toBe(10);
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.not.stringContaining('WHERE'),
                []
            );
        });

        it('should return zeros when no slots exist', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await scheduleService.getStats('class-1');

            expect(result.totalSlots).toBe(0);
            expect(result.weeklySlots).toBe(0);
            expect(result.biweeklySlots).toBe(0);
            expect(result.totalWeeklyMinutes).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle Monday (1) and Sunday (7) correctly', async () => {
            const mondaySlot = {
                classId: 'class-1',
                dayOfWeek: 1,
                startTime: '08:00',
                duration: 60,
                subject: 'Monday Class',
                frequency: 'weekly' as const,
            };

            const sundaySlot = {
                classId: 'class-1',
                dayOfWeek: 7,
                startTime: '10:00',
                duration: 60,
                subject: 'Sunday Class',
                frequency: 'weekly' as const,
            };

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync
                .mockResolvedValueOnce({
                    id: 'slot-mon',
                    class_id: mondaySlot.classId,
                    day_of_week: mondaySlot.dayOfWeek,
                    start_time: mondaySlot.startTime,
                    duration: mondaySlot.duration,
                    subject: mondaySlot.subject,
                    frequency: mondaySlot.frequency,
                    start_week: null,
                    created_at: new Date().toISOString(),
                })
                .mockResolvedValueOnce({
                    id: 'slot-sun',
                    class_id: sundaySlot.classId,
                    day_of_week: sundaySlot.dayOfWeek,
                    start_time: sundaySlot.startTime,
                    duration: sundaySlot.duration,
                    subject: sundaySlot.subject,
                    frequency: sundaySlot.frequency,
                    start_week: null,
                    created_at: new Date().toISOString(),
                });

            const resultMonday = await scheduleService.create(mondaySlot);
            const resultSunday = await scheduleService.create(sundaySlot);

            expect(resultMonday.dayOfWeek).toBe(1);
            expect(resultSunday.dayOfWeek).toBe(7);
        });

        it('should handle time formats correctly', async () => {
            const earlySlot = {
                classId: 'class-1',
                dayOfWeek: 1,
                startTime: '07:30',
                duration: 60,
                subject: 'Early Class',
                frequency: 'weekly' as const,
            };

            const lateSlot = {
                classId: 'class-1',
                dayOfWeek: 1,
                startTime: '18:45',
                duration: 90,
                subject: 'Late Class',
                frequency: 'weekly' as const,
            };

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync
                .mockResolvedValueOnce({
                    id: 'slot-early',
                    class_id: earlySlot.classId,
                    day_of_week: earlySlot.dayOfWeek,
                    start_time: earlySlot.startTime,
                    duration: earlySlot.duration,
                    subject: earlySlot.subject,
                    frequency: earlySlot.frequency,
                    start_week: null,
                    created_at: new Date().toISOString(),
                })
                .mockResolvedValueOnce({
                    id: 'slot-late',
                    class_id: lateSlot.classId,
                    day_of_week: lateSlot.dayOfWeek,
                    start_time: lateSlot.startTime,
                    duration: lateSlot.duration,
                    subject: lateSlot.subject,
                    frequency: lateSlot.frequency,
                    start_week: null,
                    created_at: new Date().toISOString(),
                });

            const resultEarly = await scheduleService.create(earlySlot);
            const resultLate = await scheduleService.create(lateSlot);

            expect(resultEarly.startTime).toBe('07:30');
            expect(resultLate.startTime).toBe('18:45');
        });
    });
});
