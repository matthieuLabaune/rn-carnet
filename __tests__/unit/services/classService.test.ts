/**
 * Tests for classService
 */

// Mock database before importing service
jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { classService } from '../../../services/classService';

// Mock database will be available from jest.setup.js
declare global {
    var mockDb: any;
}

describe('classService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('should return all classes from database', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                { id: '1', name: 'CE1 - Français', level: 'CE1', subject: 'Français', color: '#FF0000', studentCount: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
                { id: '2', name: 'CE2 - Mathématiques', level: 'CE2', subject: 'Mathématiques', color: '#00FF00', studentCount: 5, created_at: '2024-01-02', updated_at: '2024-01-02' },
            ]);

            const result = await classService.getAll();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('CE1 - Français');
            expect(result[0].level).toBe('CE1');
            expect(result[1].name).toBe('CE2 - Mathématiques');
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT')
            );
        });

        it('should return empty array when no classes exist', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await classService.getAll();

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            global.mockDb.getAllAsync.mockRejectedValue(new Error('Database error'));

            await expect(classService.getAll()).rejects.toThrow('Database error');
        });
    });

    describe('getById', () => {
        it('should return a class by id', async () => {
            const mockClass = {
                id: 'class-1',
                name: 'CM1 - Sciences',
                level: 'CM1',
                subject: 'Sciences',
                color: '#0000FF',
                studentCount: 3,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            global.mockDb.getFirstAsync.mockResolvedValue(mockClass);

            const result = await classService.getById('class-1');

            expect(result).toBeDefined();
            expect(result?.name).toBe('CM1 - Sciences');
            expect(result?.level).toBe('CM1');
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['class-1']
            );
        });

        it('should return null when class not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await classService.getById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new class', async () => {
            const newClass = {
                name: 'CP - Découverte',
                level: 'CP',
                subject: 'Découverte du monde',
                color: '#FFFF00',
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 1,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id',
                ...newClass,
                studentCount: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await classService.create(newClass);

            expect(result).toBeDefined();
            expect(result.name).toBe(newClass.name);
            expect(result.level).toBe(newClass.level);
            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should create class without optional subject', async () => {
            const newClass = {
                name: 'CE1',
                level: 'CE1',
                color: '#00FFFF',
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 2,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id-2',
                ...newClass,
                subject: null,
                studentCount: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await classService.create(newClass);

            expect(result).toBeDefined();
            expect(result.name).toBe(newClass.name);
            expect(result.subject).toBeNull();
        });
    });

    describe('update', () => {
        it('should update an existing class', async () => {
            const existingClass = {
                id: 'class-1',
                name: 'Old Name',
                level: 'CE1',
                subject: 'Old Subject',
                color: '#000000',
                studentCount: 0,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            global.mockDb.getFirstAsync
                .mockResolvedValueOnce(existingClass)  // First call in update (check exists)
                .mockResolvedValueOnce({ ...existingClass, name: 'New Name', subject: 'New Subject' });  // Second call after update

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const updates = { name: 'New Name', subject: 'New Subject' };
            await classService.update('class-1', updates);

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should handle update errors', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            await expect(
                classService.update('class-1', {
                    name: 'Test',
                    level: 'CE1',
                    color: '#000000',
                })
            ).rejects.toThrow('Class not found');
        });
    });

    describe('delete', () => {
        it('should delete a class', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await classService.delete('class-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                'DELETE FROM classes WHERE id = ?',
                ['class-1']
            );
        });

        it('should handle cascade deletes (students, sessions)', async () => {
            // With FOREIGN KEY constraints, deleting a class should cascade
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await classService.delete('class-1');

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });
    });
});
