jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { evaluationResultService } from '../../../services/evaluationResultService';

declare global {
    var mockDb: any;
}

describe('evaluationResultService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getByEvaluationId', () => {
        it('should return all results for an evaluation', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'result-1',
                    evaluation_id: 'eval-1',
                    student_id: 'student-1',
                    competence_id: 'competence-1',
                    niveau: 'atteint',
                    score: 18,
                    commentaire: 'Très bien',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
                {
                    id: 'result-2',
                    evaluation_id: 'eval-1',
                    student_id: 'student-2',
                    competence_id: 'competence-2',
                    niveau: 'partiellement-atteint',
                    score: 12,
                    commentaire: 'À revoir',
                    created_at: '2024-01-02',
                    updated_at: '2024-01-02',
                },
            ]);

            const result = await evaluationResultService.getByEvaluationId('eval-1');

            expect(result).toHaveLength(2);
            expect(result[0].niveau).toBe('atteint');
            expect(result[0].score).toBe(18);
            expect(result[1].niveau).toBe('partiellement-atteint');
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE evaluation_id = ?'),
                ['eval-1']
            );
        });

        it('should return empty array when no results exist', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await evaluationResultService.getByEvaluationId('eval-1');

            expect(result).toHaveLength(0);
        });
    });

    describe('getByStudentId', () => {
        it('should return all results for a student', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'result-1',
                    evaluation_id: 'eval-1',
                    student_id: 'student-1',
                    competence_id: 'comp-1',
                    niveau: 'acquis',
                    score: 18,
                    commentaire: null,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ]);

            const result = await evaluationResultService.getByStudentId('student-1');

            expect(result).toHaveLength(1);
            expect(result[0].studentId).toBe('student-1');
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE student_id = ?'),
                ['student-1']
            );
        });
    });

    describe('getByStudentAndEvaluation', () => {
        it('should return results for a student in a specific evaluation', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'result-1',
                    evaluation_id: 'eval-1',
                    student_id: 'student-1',
                    competence_id: 'comp-1',
                    niveau: 'acquis',
                    score: 18,
                    commentaire: 'Excellent',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
                {
                    id: 'result-2',
                    evaluation_id: 'eval-1',
                    student_id: 'student-1',
                    competence_id: 'comp-2',
                    niveau: 'partiellement-atteint',
                    score: 14,
                    commentaire: 'Bien',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ]);

            const result = await evaluationResultService.getByStudentAndEvaluation(
                'student-1',
                'eval-1'
            );

            expect(result).toHaveLength(2);
            expect(result[0].evaluationId).toBe('eval-1');
            expect(result[0].studentId).toBe('student-1');
        });
    });

    describe('getById', () => {
        it('should return a specific result', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'result-1',
                evaluation_id: 'eval-1',
                student_id: 'student-1',
                competence_id: 'comp-1',
                niveau: 'acquis',
                score: 20,
                commentaire: 'Parfait',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            });

            const result = await evaluationResultService.getById('result-1');

            expect(result).toBeDefined();
            expect(result?.score).toBe(20);
            expect(result?.commentaire).toBe('Parfait');
        });

        it('should return null when result not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await evaluationResultService.getById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('upsert', () => {
        it('should create a new result', async () => {
            const newResult = {
                id: 'result-new',
                evaluationId: 'eval-1',
                studentId: 'student-1',
                competenceId: 'comp-1',
                niveau: 'atteint' as const,
                score: 18,
                commentaire: 'Très bien',
            };

            global.mockDb.getFirstAsync
                .mockResolvedValueOnce(null) // No existing result
                .mockResolvedValueOnce({
                    id: newResult.id,
                    evaluation_id: newResult.evaluationId,
                    student_id: newResult.studentId,
                    competence_id: newResult.competenceId,
                    niveau: newResult.niveau,
                    score: newResult.score,
                    commentaire: newResult.commentaire,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const result = await evaluationResultService.upsert(newResult);

            expect(result).toBeDefined();
            expect(result.score).toBe(18);
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT'),
                expect.any(Array)
            );
        });

        it('should update an existing result', async () => {
            const existingResult = {
                id: 'result-1',
                evaluation_id: 'eval-1',
                student_id: 'student-1',
                competence_id: 'comp-1',
                niveau: 'partiellement-atteint',
                score: 12,
                commentaire: 'Moyen',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            const updateData = {
                id: 'result-1',
                evaluationId: 'eval-1',
                studentId: 'student-1',
                competenceId: 'comp-1',
                niveau: 'atteint' as const,
                score: 18,
                commentaire: 'Bien mieux !',
            };

            global.mockDb.getFirstAsync
                .mockResolvedValueOnce(existingResult) // Found existing
                .mockResolvedValueOnce({
                    ...existingResult,
                    niveau: updateData.niveau,
                    score: updateData.score,
                    commentaire: updateData.commentaire,
                });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const result = await evaluationResultService.upsert(updateData);

            expect(result).toBeDefined();
            expect(result.score).toBe(18);
            expect(result.commentaire).toBe('Bien mieux !');
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.any(Array)
            );
        });
    });

    describe('bulkUpsert', () => {
        it('should upsert multiple results', async () => {
            const results = [
                {
                    id: 'result-1',
                    evaluationId: 'eval-1',
                    studentId: 'student-1',
                    competenceId: 'comp-1',
                    niveau: 'atteint' as const,
                    score: 18,
                },
                {
                    id: 'result-2',
                    evaluationId: 'eval-1',
                    studentId: 'student-2',
                    competenceId: 'comp-1',
                    niveau: 'partiellement-atteint' as const,
                    score: 12,
                },
            ];

            global.mockDb.getFirstAsync = jest.fn()
                .mockResolvedValueOnce(null) // First result doesn't exist
                .mockResolvedValueOnce({ // getById for first result
                    id: 'result-1',
                    evaluation_id: 'eval-1',
                    student_id: 'student-1',
                    competence_id: 'comp-1',
                    niveau: 'atteint',
                    score: 18,
                    commentaire: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .mockResolvedValueOnce(null) // Second result doesn't exist
                .mockResolvedValueOnce({ // getById for second result
                    id: 'result-2',
                    evaluation_id: 'eval-1',
                    student_id: 'student-2',
                    competence_id: 'comp-1',
                    niveau: 'partiellement-atteint',
                    score: 12,
                    commentaire: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationResultService.bulkUpsert(results);

            expect(global.mockDb.runAsync).toHaveBeenCalledTimes(2);
        });
    });

    describe('update', () => {
        it('should update a result with niveau', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationResultService.update('result-1', { niveau: 'depasse' });

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE evaluation_results'),
                expect.arrayContaining(['depasse'])
            );
        });

        it('should update a result with score', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationResultService.update('result-1', { score: 20 });

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE evaluation_results'),
                expect.arrayContaining([20])
            );
        });

        it('should update a result with commentaire', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationResultService.update('result-1', { commentaire: 'Excellent travail' });

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE evaluation_results'),
                expect.arrayContaining(['Excellent travail'])
            );
        });

        it('should update multiple fields at once', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationResultService.update('result-1', {
                niveau: 'atteint',
                score: 15,
                commentaire: 'Bien',
            });

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE evaluation_results'),
                expect.arrayContaining(['atteint', 15, 'Bien'])
            );
        });

        it('should only update updated_at when no fields provided', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationResultService.update('result-1', {});

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                'UPDATE evaluation_results SET updated_at = ? WHERE id = ?',
                expect.arrayContaining(['result-1'])
            );
        });
    });

    describe('delete', () => {
        it('should delete a result', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await evaluationResultService.delete('result-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM evaluation_results'),
                ['result-1']
            );
        });
    });

    describe('getStudentCompetenceStats', () => {
        it('should return statistics for a student on a competence', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'result-1',
                    evaluation_id: 'eval-1',
                    student_id: 'student-1',
                    competence_id: 'comp-1',
                    niveau: 'atteint',
                    score: 18,
                    commentaire: null,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
                {
                    id: 'result-2',
                    evaluation_id: 'eval-2',
                    student_id: 'student-1',
                    competence_id: 'comp-1',
                    niveau: 'depasse',
                    score: 20,
                    commentaire: null,
                    created_at: '2024-01-05',
                    updated_at: '2024-01-05',
                },
            ]);

            const result = await evaluationResultService.getStudentCompetenceStats(
                'student-1',
                'comp-1'
            );

            expect(result.totalEvaluations).toBe(2);
            expect(result.averageScore).toBe(19);
            expect(result.niveauDistribution).toBeDefined();
        });
    });

    describe('getEvaluationCompletionStatus', () => {
        it('should return completion status for an evaluation', async () => {
            const mockCountResult = { count: 15 };
            global.mockDb.getFirstAsync = jest.fn().mockResolvedValue(mockCountResult);

            const result = await evaluationResultService.getEvaluationCompletionStatus(
                'eval-1',
                5,
                3
            );

            expect(result.totalResults).toBe(15);
            expect(result.expectedResults).toBe(15);
            expect(result.completionPercentage).toBe(100);
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('COUNT(*)'),
                ['eval-1']
            );
        });
    });
});
