/**
 * Evaluation Service
 * CRUD operations for evaluations
 */

import { getDatabase } from './database';
import { Evaluation, EvaluationType, NotationSystem } from '../types';

export const evaluationService = {
    /**
     * Get all evaluations for a class
     */
    async getByClassId(classId: string): Promise<Evaluation[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM evaluations WHERE class_id = ? ORDER BY date DESC',
            [classId]
        );
        return result.map((row) => ({
            id: row.id,
            classId: row.class_id,
            sessionId: row.session_id,
            titre: row.titre,
            date: row.date,
            type: row.type as EvaluationType,
            notationSystem: row.notation_system as NotationSystem,
            maxPoints: row.max_points,
            competenceIds: JSON.parse(row.competence_ids),
            isHomework: row.is_homework === 1,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Get evaluation by session ID
     */
    async getBySessionId(sessionId: string): Promise<Evaluation | null> {
        const db = getDatabase();
        const result = await db.getFirstAsync<any>(
            'SELECT * FROM evaluations WHERE session_id = ?',
            [sessionId]
        );
        if (!result) return null;
        return {
            id: result.id,
            classId: result.class_id,
            sessionId: result.session_id,
            titre: result.titre,
            date: result.date,
            type: result.type as EvaluationType,
            notationSystem: result.notation_system as NotationSystem,
            maxPoints: result.max_points,
            competenceIds: JSON.parse(result.competence_ids),
            isHomework: result.is_homework === 1,
            description: result.description,
            createdAt: result.created_at,
            updatedAt: result.updated_at,
        };
    },

    /**
     * Get standalone evaluations (not linked to sessions)
     */
    async getStandaloneByClassId(classId: string): Promise<Evaluation[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM evaluations WHERE class_id = ? AND session_id IS NULL ORDER BY date DESC',
            [classId]
        );
        return result.map((row) => ({
            id: row.id,
            classId: row.class_id,
            sessionId: row.session_id,
            titre: row.titre,
            date: row.date,
            type: row.type as EvaluationType,
            notationSystem: row.notation_system as NotationSystem,
            maxPoints: row.max_points,
            competenceIds: JSON.parse(row.competence_ids),
            isHomework: row.is_homework === 1,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Get a single evaluation by ID
     */
    async getById(id: string): Promise<Evaluation | null> {
        const db = getDatabase();
        const result = await db.getFirstAsync<any>(
            'SELECT * FROM evaluations WHERE id = ?',
            [id]
        );
        if (!result) return null;
        return {
            id: result.id,
            classId: result.class_id,
            sessionId: result.session_id,
            titre: result.titre,
            date: result.date,
            type: result.type as EvaluationType,
            notationSystem: result.notation_system as NotationSystem,
            maxPoints: result.max_points,
            competenceIds: JSON.parse(result.competence_ids),
            isHomework: result.is_homework === 1,
            description: result.description,
            createdAt: result.created_at,
            updatedAt: result.updated_at,
        };
    },

    /**
     * Create a new evaluation
     */
    async create(evaluation: Omit<Evaluation, 'createdAt' | 'updatedAt'>): Promise<Evaluation> {
        const db = getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `INSERT INTO evaluations (id, class_id, session_id, titre, date, type, notation_system, max_points, competence_ids, is_homework, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                evaluation.id,
                evaluation.classId,
                evaluation.sessionId || null,
                evaluation.titre,
                evaluation.date,
                evaluation.type,
                evaluation.notationSystem,
                evaluation.maxPoints || null,
                JSON.stringify(evaluation.competenceIds),
                evaluation.isHomework ? 1 : 0,
                evaluation.description || null,
                now,
                now,
            ]
        );
        return {
            ...evaluation,
            createdAt: now,
            updatedAt: now,
        };
    },

    /**
     * Update an evaluation
     */
    async update(
        id: string,
        updates: Partial<Omit<Evaluation, 'id' | 'classId' | 'createdAt' | 'updatedAt'>>
    ): Promise<void> {
        const db = getDatabase();
        const now = new Date().toISOString();
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.sessionId !== undefined) {
            fields.push('session_id = ?');
            values.push(updates.sessionId || null);
        }
        if (updates.titre !== undefined) {
            fields.push('titre = ?');
            values.push(updates.titre);
        }
        if (updates.date !== undefined) {
            fields.push('date = ?');
            values.push(updates.date);
        }
        if (updates.type !== undefined) {
            fields.push('type = ?');
            values.push(updates.type);
        }
        if (updates.notationSystem !== undefined) {
            fields.push('notation_system = ?');
            values.push(updates.notationSystem);
        }
        if (updates.maxPoints !== undefined) {
            fields.push('max_points = ?');
            values.push(updates.maxPoints || null);
        }
        if (updates.competenceIds !== undefined) {
            fields.push('competence_ids = ?');
            values.push(JSON.stringify(updates.competenceIds));
        }
        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description || null);
        }

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE evaluations SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },

    /**
     * Delete an evaluation (will cascade delete all results)
     */
    async delete(id: string): Promise<void> {
        const db = getDatabase();
        await db.runAsync('DELETE FROM evaluations WHERE id = ?', [id]);
    },

    /**
     * Get evaluations count by class
     */
    async getCountByClassId(classId: string): Promise<number> {
        const db = getDatabase();
        const result = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM evaluations WHERE class_id = ?',
            [classId]
        );
        return result?.count || 0;
    },

    /**
     * Get evaluations involving a specific competence
     */
    async getByCompetenceId(competenceId: string): Promise<Evaluation[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            `SELECT * FROM evaluations WHERE competence_ids LIKE ? ORDER BY date DESC`,
            [`%"${competenceId}"%`]
        );
        return result.map((row) => ({
            id: row.id,
            classId: row.class_id,
            sessionId: row.session_id,
            titre: row.titre,
            date: row.date,
            type: row.type as EvaluationType,
            notationSystem: row.notation_system as NotationSystem,
            maxPoints: row.max_points,
            competenceIds: JSON.parse(row.competence_ids),
            isHomework: row.is_homework === 1,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },
};
