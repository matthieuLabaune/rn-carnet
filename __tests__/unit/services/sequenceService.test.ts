/**
 * Tests for sequenceService
 */

// Mock database before importing service
jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { sequenceService } from '../../../services/sequenceService';
import { Sequence } from '../../../types';

// Mock database will be available from jest.setup.js
declare global {
    var mockDb: any;
}

describe('sequenceService', () => {
    const mockSequenceRow = {
        id: 'seq_1',
        class_id: 'class_1',
        name: 'La Révolution française',
        description: 'De 1789 à 1799',
        color: '#2196F3',
        order_num: 0,
        session_count: 5,
        theme: 'Histoire moderne',
        objectives: JSON.stringify(['Comprendre les causes', 'Analyser les phases']),
        resources: JSON.stringify(['Manuel p.42', 'Vidéo']),
        status: 'planned',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: null,
    };

    const mockParsedSequence: Sequence = {
        id: 'seq_1',
        classId: 'class_1',
        name: 'La Révolution française',
        description: 'De 1789 à 1799',
        color: '#2196F3',
        order: 0,
        sessionCount: 5,
        theme: 'Histoire moderne',
        objectives: ['Comprendre les causes', 'Analyser les phases'],
        resources: ['Manuel p.42', 'Vidéo'],
        status: 'planned',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: undefined,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.mockDb.getAllAsync.mockClear();
        global.mockDb.getFirstAsync.mockClear();
        global.mockDb.runAsync.mockClear();
    });

    describe('create', () => {
        it('should create a new sequence', async () => {
            global.mockDb.getFirstAsync.mockResolvedValueOnce({ max_order: 0 });
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync.mockResolvedValueOnce(mockSequenceRow);

            const newSequence = {
                classId: 'class_1',
                name: 'La Révolution française',
                description: 'De 1789 à 1799',
                color: '#2196F3',
                sessionCount: 5,
                theme: 'Histoire moderne',
                objectives: ['Comprendre les causes', 'Analyser les phases'],
                resources: ['Manuel p.42', 'Vidéo'],
            };

            const result = await sequenceService.create(newSequence);

            expect(result).toBeDefined();
            expect(result.name).toBe('La Révolution française');
            expect(result.sessionCount).toBe(5);
            expect(result.objectives).toEqual(['Comprendre les causes', 'Analyser les phases']);
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO sequences'),
                expect.any(Array)
            );
        });

        it('should auto-increment order_num', async () => {
            global.mockDb.getFirstAsync.mockResolvedValueOnce({ max_order: 3 });
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync.mockResolvedValueOnce({
                ...mockSequenceRow,
                order_num: 4,
            });

            const newSequence = {
                classId: 'class_1',
                name: 'Nouvelle séquence',
                color: '#4CAF50',
                sessionCount: 3,
            };

            const result = await sequenceService.create(newSequence);

            expect(result.order).toBe(4);
        });

        it('should handle missing optional fields', async () => {
            global.mockDb.getFirstAsync.mockResolvedValueOnce({ max_order: null });
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync.mockResolvedValueOnce({
                ...mockSequenceRow,
                description: null,
                theme: null,
                objectives: null,
                resources: null,
            });

            const newSequence = {
                classId: 'class_1',
                name: 'Séquence simple',
                color: '#FF9800',
                sessionCount: 2,
            };

            const result = await sequenceService.create(newSequence);

            expect(result.description).toBeUndefined();
            expect(result.theme).toBeUndefined();
            expect(result.objectives).toBeUndefined();
            expect(result.resources).toBeUndefined();
        });
    });

    describe('getByClass', () => {
        it('should return all sequences for a class', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                mockSequenceRow,
                {
                    ...mockSequenceRow,
                    id: 'seq_2',
                    name: 'L\'Empire napoléonien',
                    order_num: 1,
                },
            ]);

            const result = await sequenceService.getByClass('class_1');

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('La Révolution française');
            expect(result[1].name).toBe('L\'Empire napoléonien');
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY order_num ASC'),
                ['class_1']
            );
        });

        it('should return empty array when no sequences exist', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await sequenceService.getByClass('class_1');

            expect(result).toEqual([]);
        });

        it('should parse JSON fields correctly', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([mockSequenceRow]);

            const result = await sequenceService.getByClass('class_1');

            expect(result[0].objectives).toEqual(['Comprendre les causes', 'Analyser les phases']);
            expect(result[0].resources).toEqual(['Manuel p.42', 'Vidéo']);
        });
    });

    describe('getById', () => {
        it('should return a sequence by id', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(mockSequenceRow);

            const result = await sequenceService.getById('seq_1');

            expect(result).toBeDefined();
            expect(result?.name).toBe('La Révolution française');
            expect(result?.sessionCount).toBe(5);
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM sequences WHERE id = ?'),
                ['seq_1']
            );
        });

        it('should return null when sequence not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await sequenceService.getById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a sequence', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sequenceService.update('seq_1', {
                name: 'Nouveau nom',
                sessionCount: 7,
            });

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE sequences SET'),
                expect.arrayContaining(['Nouveau nom', 7])
            );
        });

        it('should handle partial updates', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sequenceService.update('seq_1', {
                description: 'Nouvelle description',
            });

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('description = ?'),
                expect.any(Array)
            );
        });

        it('should update timestamp', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sequenceService.update('seq_1', { name: 'Test' });

            const args = global.mockDb.runAsync.mock.calls[0];
            expect(args[0]).toContain('updated_at = ?');
        });
    });

    describe('updateStatus', () => {
        it('should update sequence status', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sequenceService.updateStatus('seq_1', 'in-progress');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE sequences SET status = ?'),
                ['in-progress', expect.any(String), 'seq_1']
            );
        });

        it('should accept all valid statuses', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sequenceService.updateStatus('seq_1', 'planned');
            await sequenceService.updateStatus('seq_2', 'in-progress');
            await sequenceService.updateStatus('seq_3', 'completed');

            expect(global.mockDb.runAsync).toHaveBeenCalledTimes(3);
        });
    });

    describe('delete', () => {
        it('should delete a sequence', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sequenceService.delete('seq_1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                'DELETE FROM sequences WHERE id = ?',
                ['seq_1']
            );
        });
    });

    describe('reorder', () => {
        it('should reorder sequences', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await sequenceService.reorder('class_1', ['seq_3', 'seq_1', 'seq_2']);

            expect(global.mockDb.runAsync).toHaveBeenCalledTimes(3);
            expect(global.mockDb.runAsync).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('UPDATE sequences SET order_num = ?'),
                [0, 'seq_3', 'class_1']
            );
            expect(global.mockDb.runAsync).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('UPDATE sequences SET order_num = ?'),
                [1, 'seq_1', 'class_1']
            );
        });
    });

    describe('assignSessionsToSequence', () => {
        it('should assign sessions to a sequence', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync.mockResolvedValue({
                ...mockSequenceRow,
                session_count: 3,
            });

            await sequenceService.assignSessionsToSequence('seq_1', [
                'session_1',
                'session_2',
                'session_3',
            ]);

            // Delete existing + 3 inserts + update status
            expect(global.mockDb.runAsync).toHaveBeenCalled();
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM session_sequences'),
                expect.any(Array)
            );
        });

        it('should update status based on assignment progress', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            
            // First call: get sequence
            global.mockDb.getFirstAsync.mockResolvedValueOnce({
                ...mockSequenceRow,
                session_count: 5,
            });

            await sequenceService.assignSessionsToSequence('seq_1', [
                'session_1',
                'session_2',
                'session_3',
            ]);

            // Should be in-progress (3 out of 5 assigned)
            const statusUpdateCall = global.mockDb.runAsync.mock.calls.find((call: any[]) =>
                call[0].includes('UPDATE sequences SET status')
            );
            expect(statusUpdateCall).toBeDefined();
            expect(statusUpdateCall[1]).toContain('in-progress');
        });

        it('should mark as completed when all sessions assigned', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync.mockResolvedValueOnce({
                ...mockSequenceRow,
                session_count: 2,
            });

            await sequenceService.assignSessionsToSequence('seq_1', [
                'session_1',
                'session_2',
            ]);

            const statusUpdateCall = global.mockDb.runAsync.mock.calls.find((call: any[]) =>
                call[0].includes('UPDATE sequences SET status')
            );
            expect(statusUpdateCall[1]).toContain('completed');
        });
    });

    describe('getSessionsBySequence', () => {
        it('should return sessions for a sequence', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'session_1',
                    class_id: 'class_1',
                    subject: 'Histoire',
                    date: '2024-01-15',
                    duration: 60,
                    status: 'planned',
                    orderInSequence: 1,
                },
                {
                    id: 'session_2',
                    class_id: 'class_1',
                    subject: 'Histoire',
                    date: '2024-01-22',
                    duration: 60,
                    status: 'planned',
                    orderInSequence: 2,
                },
            ]);

            const result = await sequenceService.getSessionsBySequence('seq_1');

            expect(result).toHaveLength(2);
            expect(result[0].orderInSequence).toBe(1);
            expect(result[1].orderInSequence).toBe(2);
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY ss.order_in_sequence ASC'),
                ['seq_1']
            );
        });
    });

    describe('getSequenceBySession', () => {
        it('should return sequence for a session', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                ...mockSequenceRow,
                orderInSequence: 3,
            });

            const result = await sequenceService.getSequenceBySession('session_1');

            expect(result).toBeDefined();
            expect(result?.name).toBe('La Révolution française');
            expect(result?.orderInSequence).toBe(3);
        });

        it('should return null when no sequence assigned', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await sequenceService.getSequenceBySession('session_1');

            expect(result).toBeNull();
        });
    });

    describe('unassignSession', () => {
        it('should unassign a session from sequence', async () => {
            global.mockDb.getFirstAsync
                .mockResolvedValueOnce({ sequence_id: 'seq_1' })
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce({ ...mockSequenceRow, session_count: 5 });
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getAllAsync.mockResolvedValue([]);

            await sequenceService.unassignSession('session_1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                'DELETE FROM session_sequences WHERE session_id = ?',
                ['session_1']
            );
        });

        it('should update sequence status after unassignment', async () => {
            global.mockDb.getFirstAsync
                .mockResolvedValueOnce({ sequence_id: 'seq_1' })
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce({ ...mockSequenceRow, session_count: 5 });
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getAllAsync.mockResolvedValue([
                { id: 'session_2', orderInSequence: 1 },
            ]);

            await sequenceService.unassignSession('session_1');

            const statusUpdateCall = global.mockDb.runAsync.mock.calls.find((call: any[]) =>
                call[0].includes('UPDATE sequences SET status')
            );
            expect(statusUpdateCall).toBeDefined();
        });
    });

    describe('getClassStatistics', () => {
        it('should return statistics for a class', async () => {
            // Reset all mocks
            jest.clearAllMocks();
            global.mockDb.getAllAsync.mockReset();
            global.mockDb.getFirstAsync.mockReset();
            
            // Setup fresh mocks for this test
            global.mockDb.getAllAsync.mockResolvedValue([
                mockSequenceRow,
                { ...mockSequenceRow, id: 'seq_2' },
            ]);
            global.mockDb.getFirstAsync
                .mockResolvedValueOnce({ count: 120 })
                .mockResolvedValueOnce({ count: 30 });

            const result = await sequenceService.getClassStatistics('class_1');

            expect(result.totalSequences).toBe(2);
            expect(result.totalSessions).toBe(120);
            expect(result.assignedSessions).toBe(30);
            expect(result.unassignedSessions).toBe(90);
            expect(result.completionPercentage).toBe(25);
        });

        it('should handle zero sessions', async () => {
            // Reset all mocks
            jest.clearAllMocks();
            global.mockDb.getAllAsync.mockReset();
            global.mockDb.getFirstAsync.mockReset();
            
            // Setup fresh mocks for this test
            global.mockDb.getAllAsync.mockResolvedValue([]);
            global.mockDb.getFirstAsync
                .mockResolvedValueOnce({ count: 0 })
                .mockResolvedValueOnce({ count: 0 });

            const result = await sequenceService.getClassStatistics('class_1');

            expect(result.totalSequences).toBe(0);
            expect(result.totalSessions).toBe(0);
            expect(result.assignedSessions).toBe(0);
            expect(result.completionPercentage).toBe(0);
        });
    });

    describe('autoAssignSequences', () => {
        it('should auto-assign sequences to available sessions', async () => {
            const sequences = [
                { ...mockParsedSequence, sessionCount: 3 },
                { ...mockParsedSequence, id: 'seq_2', sessionCount: 2 },
            ];

            const sessions = [
                { id: 'session_1', date: '2024-01-01' },
                { id: 'session_2', date: '2024-01-08' },
                { id: 'session_3', date: '2024-01-15' },
                { id: 'session_4', date: '2024-01-22' },
                { id: 'session_5', date: '2024-01-29' },
            ];

            global.mockDb.getAllAsync
                .mockResolvedValueOnce(sequences.map((s, i) => ({
                    ...mockSequenceRow,
                    id: s.id,
                    session_count: s.sessionCount,
                    order_num: i,
                })))
                .mockResolvedValueOnce(sessions);

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync.mockResolvedValue(mockSequenceRow);

            await sequenceService.autoAssignSequences('class_1');

            // Should have assigned sessions to sequences
            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should handle insufficient sessions', async () => {
            const sequences = [
                { ...mockParsedSequence, sessionCount: 10 },
            ];

            const sessions = [
                { id: 'session_1', date: '2024-01-01' },
                { id: 'session_2', date: '2024-01-08' },
            ];

            global.mockDb.getAllAsync
                .mockResolvedValueOnce([{
                    ...mockSequenceRow,
                    session_count: 10,
                }])
                .mockResolvedValueOnce(sessions);

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });
            global.mockDb.getFirstAsync.mockResolvedValue(mockSequenceRow);

            await sequenceService.autoAssignSequences('class_1');

            // Should assign only the available sessions (2 out of 10)
            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });
    });
});
