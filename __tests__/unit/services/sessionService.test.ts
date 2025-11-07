jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { sessionService } from '../../../services/sessionService';

declare global {
    var mockDb: any;
}

describe('sessionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getByClass', () => {
        it('should return all sessions for a class', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'session-1',
                    class_id: 'class-1',
                    subject: 'Mathématiques',
                    description: 'Addition',
                    date: '2024-01-15',
                    duration: 60,
                    status: 'planned',
                    timer_preset: null,
                    created_at: '2024-01-01',
                    completed_at: null,
                },
                {
                    id: 'session-2',
                    class_id: 'class-1',
                    subject: 'Français',
                    description: 'Lecture',
                    date: '2024-01-16',
                    duration: 45,
                    status: 'completed',
                    timer_preset: '{"workDuration":25,"breakDuration":5}',
                    created_at: '2024-01-02',
                    completed_at: '2024-01-16T10:00:00Z',
                },
            ]);

            const result = await sessionService.getByClass('class-1');

            expect(result).toHaveLength(2);
            expect(result[0].subject).toBe('Mathématiques');
            expect(result[0].duration).toBe(60);
            expect(result[1].timerPreset).toEqual({ workDuration: 25, breakDuration: 5 });
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['class-1']
            );
        });

        it('should return empty array when no sessions exist', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await sessionService.getByClass('class-1');

            expect(result).toHaveLength(0);
        });

        it('should handle database errors', async () => {
            global.mockDb.getAllAsync.mockRejectedValue(new Error('Database error'));

            await expect(sessionService.getByClass('class-1')).rejects.toThrow('Database error');
        });
    });

    describe('getAll', () => {
        it('should return all sessions', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'session-1',
                    class_id: 'class-1',
                    subject: 'Sciences',
                    description: 'Expérience',
                    date: '2024-01-20',
                    duration: 90,
                    status: 'in_progress',
                    timer_preset: null,
                    created_at: '2024-01-01',
                    completed_at: null,
                },
            ]);

            const result = await sessionService.getAll();

            expect(result).toHaveLength(1);
            expect(result[0].subject).toBe('Sciences');
            expect(result[0].status).toBe('in_progress');
        });
    });

    describe('getById', () => {
        it('should return a session by id', async () => {
            const mockSession = {
                id: 'session-1',
                class_id: 'class-1',
                subject: 'Histoire',
                description: 'Moyen Âge',
                date: '2024-01-15',
                duration: 60,
                status: 'planned',
                timer_preset: null,
                created_at: '2024-01-01',
                completed_at: null,
            };

            global.mockDb.getFirstAsync.mockResolvedValue(mockSession);

            const result = await sessionService.getById('session-1');

            expect(result).toBeDefined();
            expect(result?.subject).toBe('Histoire');
            expect(result?.duration).toBe(60);
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['session-1']
            );
        });

        it('should return null when session not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await sessionService.getById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new session', async () => {
            const newSession = {
                classId: 'class-1',
                subject: 'Géographie',
                description: 'Les continents',
                date: '2024-01-20',
                duration: 60,
                status: 'planned' as const,
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 1,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id',
                class_id: newSession.classId,
                subject: newSession.subject,
                description: newSession.description,
                date: newSession.date,
                duration: newSession.duration,
                status: newSession.status,
                timer_preset: null,
                created_at: new Date().toISOString(),
                completed_at: null,
            });

            const result = await sessionService.create(newSession);

            expect(result).toBeDefined();
            expect(result.subject).toBe(newSession.subject);
            expect(result.duration).toBe(newSession.duration);
            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should create session with timer preset', async () => {
            const timerPreset = {
                name: 'Pomodoro Court',
                totalDuration: 25,
                steps: [
                    { name: 'Travail', duration: 20, color: '#4CAF50' },
                    { name: 'Pause', duration: 5, color: '#2196F3' },
                ],
            };

            const newSession = {
                classId: 'class-1',
                subject: 'Arts',
                description: 'Dessin',
                date: '2024-01-20',
                duration: 45,
                status: 'planned' as const,
                timerPreset,
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 2,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id-2',
                class_id: newSession.classId,
                subject: newSession.subject,
                description: newSession.description,
                date: newSession.date,
                duration: newSession.duration,
                status: newSession.status,
                timer_preset: JSON.stringify(timerPreset),
                created_at: new Date().toISOString(),
                completed_at: null,
            });

            const result = await sessionService.create(newSession);

            expect(result).toBeDefined();
            expect(result.timerPreset?.name).toBe('Pomodoro Court');
            expect(result.timerPreset?.steps).toHaveLength(2);
        });
    });

    describe('update', () => {
        it('should update an existing session', async () => {
            const existingSession = {
                id: 'session-1',
                class_id: 'class-1',
                subject: 'Old Subject',
                description: 'Old Description',
                date: '2024-01-15',
                duration: 60,
                status: 'planned',
                timer_preset: null,
                created_at: '2024-01-01',
                completed_at: null,
            };

            global.mockDb.getFirstAsync
                .mockResolvedValueOnce(existingSession)
                .mockResolvedValueOnce({
                    ...existingSession,
                    subject: 'New Subject',
                    description: 'New Description',
                });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const updates = { subject: 'New Subject', description: 'New Description' };
            await sessionService.update('session-1', updates);

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should handle update errors', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            await expect(
                sessionService.update('nonexistent-id', {
                    subject: 'Test',
                })
            ).rejects.toThrow('Session not found');
        });
    });

    describe('delete', () => {
        it('should delete a session', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sessionService.delete('session-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM sessions'),
                ['session-1']
            );
        });

        it('should handle cascade deletes (attendance)', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sessionService.delete('session-1');

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });
    });

    describe('complete', () => {
        it('should mark session as completed', async () => {
            const existingSession = {
                id: 'session-1',
                class_id: 'class-1',
                subject: 'Maths',
                description: 'Test',
                date: '2024-01-15',
                duration: 60,
                status: 'planned',
                timer_preset: null,
                created_at: '2024-01-01',
                completed_at: null,
            };

            global.mockDb.getFirstAsync.mockResolvedValue({
                ...existingSession,
                status: 'completed',
                completed_at: new Date().toISOString(),
            });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const result = await sessionService.complete('session-1');

            expect(result.status).toBe('completed');
            expect(result.completedAt).toBeDefined();
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE sessions SET status'),
                expect.arrayContaining(['completed', expect.any(String), 'session-1'])
            );
        });
    });

    describe('getStats', () => {
        it('should return statistics for a class', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                totalSessions: 10,
                totalDuration: 600,
                averageDuration: 60,
            });

            const result = await sessionService.getStats('class-1');

            expect(result.totalSessions).toBe(10);
            expect(result.totalDuration).toBe(600);
            expect(result.averageDuration).toBe(60);
        });

        it('should return statistics for all classes', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                totalSessions: 25,
                totalDuration: 1500,
                averageDuration: 60,
            });

            const result = await sessionService.getStats();

            expect(result.totalSessions).toBe(25);
            expect(result.totalDuration).toBe(1500);
        });
    });
});
