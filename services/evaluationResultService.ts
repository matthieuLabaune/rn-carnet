/**
 * EvaluationResult Service
 * CRUD operations for evaluation results
 */

import { getDatabase } from './database';
import { EvaluationResult, Niveau } from '../types';

export const evaluationResultService = {
  /**
   * Get all results for an evaluation
   */
  async getByEvaluationId(evaluationId: string): Promise<EvaluationResult[]> {
    const db = getDatabase();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM evaluation_results WHERE evaluation_id = ? ORDER BY created_at',
      [evaluationId]
    );
    return result.map((row) => ({
      id: row.id,
      evaluationId: row.evaluation_id,
      studentId: row.student_id,
      competenceId: row.competence_id,
      niveau: row.niveau as Niveau | undefined,
      score: row.score,
      commentaire: row.commentaire,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Get all results for a student
   */
  async getByStudentId(studentId: string): Promise<EvaluationResult[]> {
    const db = getDatabase();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM evaluation_results WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
    return result.map((row) => ({
      id: row.id,
      evaluationId: row.evaluation_id,
      studentId: row.student_id,
      competenceId: row.competence_id,
      niveau: row.niveau as Niveau | undefined,
      score: row.score,
      commentaire: row.commentaire,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Get results for a student in a specific evaluation
   */
  async getByStudentAndEvaluation(
    studentId: string,
    evaluationId: string
  ): Promise<EvaluationResult[]> {
    const db = getDatabase();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM evaluation_results WHERE student_id = ? AND evaluation_id = ?',
      [studentId, evaluationId]
    );
    return result.map((row) => ({
      id: row.id,
      evaluationId: row.evaluation_id,
      studentId: row.student_id,
      competenceId: row.competence_id,
      niveau: row.niveau as Niveau | undefined,
      score: row.score,
      commentaire: row.commentaire,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Get a specific result
   */
  async getById(id: string): Promise<EvaluationResult | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM evaluation_results WHERE id = ?',
      [id]
    );
    if (!result) return null;
    return {
      id: result.id,
      evaluationId: result.evaluation_id,
      studentId: result.student_id,
      competenceId: result.competence_id,
      niveau: result.niveau as Niveau | undefined,
      score: result.score,
      commentaire: result.commentaire,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  },

  /**
   * Create or update a result (upsert)
   */
  async upsert(result: Omit<EvaluationResult, 'createdAt' | 'updatedAt'>): Promise<EvaluationResult> {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Check if result already exists
    const existing = await db.getFirstAsync<any>(
      'SELECT id FROM evaluation_results WHERE evaluation_id = ? AND student_id = ? AND competence_id = ?',
      [result.evaluationId, result.studentId, result.competenceId]
    );

    if (existing) {
      // Update existing
      await db.runAsync(
        `UPDATE evaluation_results 
         SET niveau = ?, score = ?, commentaire = ?, updated_at = ?
         WHERE evaluation_id = ? AND student_id = ? AND competence_id = ?`,
        [
          result.niveau || null,
          result.score || null,
          result.commentaire || null,
          now,
          result.evaluationId,
          result.studentId,
          result.competenceId,
        ]
      );
      return {
        ...result,
        id: existing.id,
        createdAt: existing.created_at,
        updatedAt: now,
      };
    } else {
      // Insert new
      await db.runAsync(
        `INSERT INTO evaluation_results (id, evaluation_id, student_id, competence_id, niveau, score, commentaire, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.id,
          result.evaluationId,
          result.studentId,
          result.competenceId,
          result.niveau || null,
          result.score || null,
          result.commentaire || null,
          now,
          now,
        ]
      );
      return {
        ...result,
        createdAt: now,
        updatedAt: now,
      };
    }
  },

  /**
   * Bulk upsert results
   */
  async bulkUpsert(results: Omit<EvaluationResult, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    for (const result of results) {
      await this.upsert(result);
    }
  },

  /**
   * Update a result
   */
  async update(
    id: string,
    updates: Partial<Omit<EvaluationResult, 'id' | 'evaluationId' | 'studentId' | 'competenceId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.niveau !== undefined) {
      fields.push('niveau = ?');
      values.push(updates.niveau || null);
    }
    if (updates.score !== undefined) {
      fields.push('score = ?');
      values.push(updates.score || null);
    }
    if (updates.commentaire !== undefined) {
      fields.push('commentaire = ?');
      values.push(updates.commentaire || null);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE evaluation_results SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  /**
   * Delete a result
   */
  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM evaluation_results WHERE id = ?', [id]);
  },

  /**
   * Delete all results for an evaluation
   */
  async deleteByEvaluationId(evaluationId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM evaluation_results WHERE evaluation_id = ?', [evaluationId]);
  },

  /**
   * Get student statistics for a competence
   */
  async getStudentCompetenceStats(studentId: string, competenceId: string): Promise<{
    totalEvaluations: number;
    averageScore?: number;
    niveauDistribution?: Record<Niveau, number>;
  }> {
    const db = getDatabase();
    
    const results = await db.getAllAsync<any>(
      'SELECT * FROM evaluation_results WHERE student_id = ? AND competence_id = ?',
      [studentId, competenceId]
    );

    const totalEvaluations = results.length;
    
    // Calculate average score if using points
    const scoresWithValues = results.filter(r => r.score !== null);
    const averageScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, r) => sum + r.score, 0) / scoresWithValues.length
      : undefined;

    // Calculate niveau distribution if using niveaux
    const niveauxWithValues = results.filter(r => r.niveau !== null);
    const niveauDistribution = niveauxWithValues.length > 0
      ? niveauxWithValues.reduce((acc, r) => {
          acc[r.niveau as Niveau] = (acc[r.niveau as Niveau] || 0) + 1;
          return acc;
        }, {} as Record<Niveau, number>)
      : undefined;

    return {
      totalEvaluations,
      averageScore,
      niveauDistribution,
    };
  },

  /**
   * Get completion status for an evaluation
   */
  async getEvaluationCompletionStatus(evaluationId: string, totalStudents: number, totalCompetences: number): Promise<{
    totalResults: number;
    expectedResults: number;
    completionPercentage: number;
  }> {
    const db = getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM evaluation_results WHERE evaluation_id = ?',
      [evaluationId]
    );
    
    const totalResults = result?.count || 0;
    const expectedResults = totalStudents * totalCompetences;
    const completionPercentage = expectedResults > 0 
      ? Math.round((totalResults / expectedResults) * 100)
      : 0;

    return {
      totalResults,
      expectedResults,
      completionPercentage,
    };
  },
};
