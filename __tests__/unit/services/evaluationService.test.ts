jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { evaluationService } from '../../../services/evaluationService';

declare global {
    var mockDb: any;
}

describe('evaluationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getByClassId', () => {
        it('should return all evaluations for a class', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'eval-1',
                    class_id: 'class-1',
                    session_id: null,
                    titre: 'Évaluation Maths',
                    date: '2024-01-15',
                    type: 'formative',
                    notation_system: 'points',
                    max_points: 20,
                    competence_ids: '["comp-1","comp-2"]',
                    is_homework: 0,
                    description: 'Addition et soustraction',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
                {
                    id: 'eval-2',
                    class_id: 'class-1',
                    session_id: 'session-1',
                    titre: 'Contrôle Français',
                    date: '2024-01-16',
                    type: 'summative',
                    notation_system: 'levels',
                    max_points: null,
                    competence_ids: '["comp-3"]',
                    is_homework: 1,
                    description: null,
                    created_at: '2024-01-02',
                    updated_at: '2024-01-02',
                },
            ]);

            const result = await evaluationService.getByClassId('class-1');

            expect(result).toHaveLength(2);
            expect(result[0].titre).toBe('Évaluation Maths');
            expect(result[0].notationSystem).toBe('points');
            expect(result[0].competenceIds).toEqual(['comp-1', 'comp-2']);
            expect(result[1].isHomework).toBe(true);
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ['class-1']
            );
        });

        it('should return empty array when no evaluations exist', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await evaluationService.getByClassId('class-1');

            expect(result).toHaveLength(0);
        });
    });

    describe('getBySessionId', () => {
        it('should return evaluation linked to session', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'eval-1',
                class_id: 'class-1',
                session_id: 'session-1',
                titre: 'Éval de séance',
                date: '2024-01-15',
                type: 'formative',
                notation_system: 'points',
                max_points: 10,
                competence_ids: '["comp-1"]',
                is_homework: 0,
                description: 'Test',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            });

            const result = await evaluationService.getBySessionId('session-1');

            expect(result).toBeDefined();
            expect(result?.titre).toBe('Éval de séance');
            expect(result?.sessionId).toBe('session-1');
        });

        it('should return null when no evaluation linked', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await evaluationService.getBySessionId('session-1');

            expect(result).toBeNull();
        });
    });

    describe('getStandaloneByClassId', () => {
        it('should return evaluations not linked to sessions', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'eval-1',
                    class_id: 'class-1',
                    session_id: null,
                    titre: 'Évaluation autonome',
                    date: '2024-01-15',
                    type: 'formative',
                    notation_system: 'points',
                    max_points: 20,
                    competence_ids: '["comp-1"]',
                    is_homework: 1,
                    description: 'DM',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ]);

            const result = await evaluationService.getStandaloneByClassId('class-1');

            expect(result).toHaveLength(1);
            expect(result[0].sessionId).toBeNull();
            expect(result[0].isHomework).toBe(true);
        });
    });

    describe('getById', () => {
        it('should return an evaluation by id', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'eval-1',
                class_id: 'class-1',
                session_id: null,
                titre: 'Test Evaluation',
                date: '2024-01-15',
                type: 'diagnostic',
                notation_system: 'levels',
                max_points: null,
                competence_ids: '["comp-1","comp-2"]',
                is_homework: 0,
                description: 'Évaluation diagnostique',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            });

            const result = await evaluationService.getById('eval-1');

            expect(result).toBeDefined();
            expect(result?.titre).toBe('Test Evaluation');
            expect(result?.type).toBe('diagnostic');
            expect(result?.competenceIds).toHaveLength(2);
        });

        it('should return null when evaluation not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await evaluationService.getById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new evaluation', async () => {
            const newEval = {
                id: 'eval-new-1',
                classId: 'class-1',
                sessionId: undefined,
                titre: 'Nouvelle Éval',
                date: '2024-01-20',
                type: 'formative' as const,
                notationSystem: 'points' as const,
                maxPoints: 20,
                competenceIds: ['comp-1', 'comp-2'],
                isHomework: false,
                description: 'Test description',
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 1,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: newEval.id,
                class_id: newEval.classId,
                session_id: newEval.sessionId,
                titre: newEval.titre,
                date: newEval.date,
                type: newEval.type,
                notation_system: newEval.notationSystem,
                max_points: newEval.maxPoints,
                competence_ids: JSON.stringify(newEval.competenceIds),
                is_homework: 0,
                description: newEval.description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await evaluationService.create(newEval);

            expect(result).toBeDefined();
            expect(result.titre).toBe(newEval.titre);
            expect(result.competenceIds).toHaveLength(2);
            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should create evaluation as homework', async () => {
            const newEval = {
                id: 'eval-new-2',
                classId: 'class-1',
                sessionId: undefined,
                titre: 'DM',
                date: '2024-01-20',
                type: 'formative' as const,
                notationSystem: 'niveaux' as const,
                maxPoints: undefined,
                competenceIds: ['comp-1'],
                isHomework: true,
                description: 'Devoir maison',
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 2,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: newEval.id,
                class_id: newEval.classId,
                session_id: newEval.sessionId,
                titre: newEval.titre,
                date: newEval.date,
                type: newEval.type,
                notation_system: newEval.notationSystem,
                max_points: newEval.maxPoints,
                competence_ids: JSON.stringify(newEval.competenceIds),
                is_homework: 1,
                description: newEval.description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await evaluationService.create(newEval);

            expect(result).toBeDefined();
            expect(result.isHomework).toBe(true);
            expect(result.notationSystem).toBe('niveaux');
        });
    });

    describe('update', () => {
        it('should update an existing evaluation', async () => {
            const existing = {
                id: 'eval-1',
                class_id: 'class-1',
                session_id: null,
                titre: 'Old Title',
                date: '2024-01-15',
                type: 'formative',
                notation_system: 'points',
                max_points: 20,
                competence_ids: '["comp-1"]',
                is_homework: 0,
                description: 'Old desc',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            global.mockDb.getFirstAsync
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce({
                    ...existing,
                    titre: 'New Title',
                    description: 'New desc',
                });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const updates = { titre: 'New Title', description: 'New desc' };
            await evaluationService.update('eval-1', updates);

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should handle update errors', async () => {
            global.mockDb.runAsync.mockRejectedValue(new Error('Update failed'));

            await expect(
                evaluationService.update('nonexistent-id', {
                    titre: 'Test',
                })
            ).rejects.toThrow('Update failed');
        });
    });

    describe('delete', () => {
        it('should delete an evaluation', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationService.delete('eval-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM evaluations'),
                ['eval-1']
            );
        });
    });

    describe('getByCompetenceId', () => {
        it('should return evaluations using a competence', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'eval-1',
                    class_id: 'class-1',
                    session_id: null,
                    titre: 'Éval with comp',
                    date: '2024-01-15',
                    type: 'formative',
                    notation_system: 'points',
                    max_points: 20,
                    competence_ids: '["comp-1","comp-2"]',
                    is_homework: 0,
                    description: null,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ]);

            const result = await evaluationService.getByCompetenceId('comp-1');

            expect(result).toHaveLength(1);
            expect(result[0].competenceIds).toContain('comp-1');
        });
    });
});
