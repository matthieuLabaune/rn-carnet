/**
 * Tests for studentService
 */

jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { studentService } from '../../../services/studentService';

declare global {
    var mockDb: any;
}

describe('studentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getByClass', () => {
        it('should return students for a specific class', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: '1',
                    class_id: 'class-1',
                    first_name: 'Jean',
                    last_name: 'Dupont',
                    birth_date: '2015-05-10',
                    handicaps: '["dyslexia"]',
                    laterality: 'left',
                    notes: 'Test notes',
                    custom_tags: '["Leader"]',
                    photo_url: null,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ]);

            const result = await studentService.getByClass('class-1');

            expect(result).toHaveLength(1);
            expect(result[0].firstName).toBe('Jean');
            expect(result[0].lastName).toBe('Dupont');
            expect(result[0].handicaps).toContain('dyslexia');
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['class-1']
            );
        });

        it('should parse handicaps correctly', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: '2',
                    class_id: 'class-1',
                    first_name: 'Marie',
                    last_name: 'Martin',
                    birth_date: '2016-03-15',
                    handicaps: '["dyslexia","adhd"]',
                    laterality: null,
                    notes: null,
                    custom_tags: null,
                    photo_url: null,
                    created_at: '2024-01-02',
                    updated_at: '2024-01-02',
                },
            ]);

            const result = await studentService.getByClass('class-1');

            expect(result[0].handicaps).toHaveLength(2);
            expect(result[0].handicaps).toContain('dyslexia');
            expect(result[0].handicaps).toContain('adhd');
        });

        it('should return empty array when no students', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await studentService.getByClass('class-1');

            expect(result).toEqual([]);
        });
    });

    describe('getById', () => {
        it('should return a student by id', async () => {
            const mockStudent = {
                id: 'student-1',
                class_id: 'class-1',
                first_name: 'Paul',
                last_name: 'Bernard',
                birth_date: '2014-08-20',
                handicaps: null,
                laterality: 'right',
                notes: 'Important notes',
                custom_tags: '["Leader","Autonome"]',
                photo_url: null,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            global.mockDb.getFirstAsync.mockResolvedValue(mockStudent);

            const result = await studentService.getById('student-1');

            expect(result).toBeDefined();
            expect(result?.firstName).toBe('Paul');
            expect(result?.lastName).toBe('Bernard');
            expect(result?.customTags).toContain('Leader');
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['student-1']
            );
        });

        it('should return null when student not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await studentService.getById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new student with all fields', async () => {
            const newStudent = {
                classId: 'class-1',
                firstName: 'Sophie',
                lastName: 'Leroy',
                birthDate: '2015-12-05',
                handicaps: ['dyslexia' as const],
                laterality: 'left' as const,
                notes: 'Test student',
                customTags: ['Creative'],
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 1,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id',
                class_id: newStudent.classId,
                first_name: newStudent.firstName,
                last_name: newStudent.lastName,
                birth_date: newStudent.birthDate,
                handicaps: JSON.stringify(newStudent.handicaps),
                laterality: newStudent.laterality,
                notes: newStudent.notes,
                custom_tags: JSON.stringify(newStudent.customTags),
                photo_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await studentService.create(newStudent);

            expect(result).toBeDefined();
            expect(result.firstName).toBe(newStudent.firstName);
            expect(result.handicaps).toContain('dyslexia');
            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should create student with minimal fields', async () => {
            const newStudent = {
                classId: 'class-1',
                firstName: 'Lucas',
                lastName: 'Petit',
                birthDate: '2016-07-15',
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 2,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'generated-id-2',
                class_id: newStudent.classId,
                first_name: newStudent.firstName,
                last_name: newStudent.lastName,
                birth_date: newStudent.birthDate,
                handicaps: null,
                laterality: null,
                notes: null,
                custom_tags: null,
                photo_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await studentService.create(newStudent);

            expect(result).toBeDefined();
            expect(result.firstName).toBe(newStudent.firstName);
            expect(result.handicaps).toBeUndefined();
            expect(result.customTags).toBeUndefined();
        });
    });

    describe('update', () => {
        it('should update student information', async () => {
            const existingStudent = {
                id: 'student-1',
                class_id: 'class-1',
                first_name: 'Old Name',
                last_name: 'Old Last',
                birth_date: '2015-01-01',
                handicaps: null,
                laterality: null,
                notes: 'Old notes',
                custom_tags: null,
                photo_url: null,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            global.mockDb.getFirstAsync
                .mockResolvedValueOnce(existingStudent)
                .mockResolvedValueOnce({
                    ...existingStudent,
                    first_name: 'New Name',
                    handicaps: '["adhd"]',
                });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const updates = { firstName: 'New Name', handicaps: ['adhd' as const] };
            await studentService.update('student-1', updates);

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete a student', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await studentService.delete('student-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                'DELETE FROM students WHERE id = ?',
                ['student-1']
            );
        });
    });
});
