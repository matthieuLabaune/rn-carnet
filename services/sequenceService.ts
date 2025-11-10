import { getDatabase } from './database';
import { Sequence, SequenceFormData, SessionSequence } from '../types';
import { Session } from '../types/session';

// Type pour les données brutes de la base (JSON stringifiés)
interface SequenceRow {
    id: string;
    class_id: string;
    name: string;
    description: string | null;
    color: string;
    order_num: number;
    session_count: number;
    theme: string | null;
    objectives: string | null;
    resources: string | null;
    status: 'planned' | 'in-progress' | 'completed';
    created_at: string;
    updated_at: string | null;
}

// Fonction utilitaire pour parser une séquence de la base
const parseSequence = (row: SequenceRow): Sequence => ({
    id: row.id,
    classId: row.class_id,
    name: row.name,
    description: row.description || undefined,
    color: row.color,
    order: row.order_num,
    sessionCount: row.session_count,
    theme: row.theme || undefined,
    objectives: row.objectives ? JSON.parse(row.objectives) : undefined,
    resources: row.resources ? JSON.parse(row.resources) : undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
});

export const sequenceService = {
    /**
     * Créer une nouvelle séquence pédagogique
     */
    create: async (data: SequenceFormData): Promise<Sequence> => {
        const db = getDatabase();
        const id = `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        // Obtenir le prochain order_num pour cette classe
        const result = await db.getFirstAsync<{ max_order: number | null }>(
            'SELECT MAX(order_num) as max_order FROM sequences WHERE class_id = ?',
            [data.classId]
        );
        const orderNum = (result?.max_order ?? -1) + 1;

        await db.runAsync(
            `INSERT INTO sequences (
                id, class_id, name, description, color, order_num, session_count,
                theme, objectives, resources, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.classId,
                data.name,
                data.description || null,
                data.color,
                orderNum,
                data.sessionCount,
                data.theme || null,
                data.objectives ? JSON.stringify(data.objectives) : null,
                data.resources ? JSON.stringify(data.resources) : null,
                'planned',
                now
            ]
        );

        const sequence = await db.getFirstAsync<SequenceRow>(
            'SELECT * FROM sequences WHERE id = ?',
            [id]
        );

        if (!sequence) {
            throw new Error('Failed to create sequence');
        }

        return parseSequence(sequence);
    },

    /**
     * Obtenir toutes les séquences d'une classe
     */
    getByClass: async (classId: string): Promise<Sequence[]> => {
        const db = getDatabase();
        const sequences = await db.getAllAsync<SequenceRow>(
            'SELECT * FROM sequences WHERE class_id = ? ORDER BY order_num ASC',
            [classId]
        );

        return sequences.map(parseSequence);
    },

    /**
     * Obtenir une séquence par ID
     */
    getById: async (id: string): Promise<Sequence | null> => {
        const db = getDatabase();
        const sequence = await db.getFirstAsync<SequenceRow>(
            'SELECT * FROM sequences WHERE id = ?',
            [id]
        );

        if (!sequence) return null;

        return parseSequence(sequence);
    },

    /**
     * Mettre à jour une séquence
     */
    update: async (id: string, data: Partial<SequenceFormData>): Promise<void> => {
        const db = getDatabase();
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            values.push(data.description || null);
        }
        if (data.color !== undefined) {
            updates.push('color = ?');
            values.push(data.color);
        }
        if (data.sessionCount !== undefined) {
            updates.push('session_count = ?');
            values.push(data.sessionCount);
        }
        if (data.theme !== undefined) {
            updates.push('theme = ?');
            values.push(data.theme || null);
        }
        if (data.objectives !== undefined) {
            updates.push('objectives = ?');
            values.push(data.objectives ? JSON.stringify(data.objectives) : null);
        }
        if (data.resources !== undefined) {
            updates.push('resources = ?');
            values.push(data.resources ? JSON.stringify(data.resources) : null);
        }

        updates.push('updated_at = ?');
        values.push(now);

        values.push(id);

        await db.runAsync(
            `UPDATE sequences SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
    },

    /**
     * Mettre à jour le statut d'une séquence
     */
    updateStatus: async (id: string, status: 'planned' | 'in-progress' | 'completed'): Promise<void> => {
        const db = getDatabase();
        const now = new Date().toISOString();

        await db.runAsync(
            'UPDATE sequences SET status = ?, updated_at = ? WHERE id = ?',
            [status, now, id]
        );
    },

    /**
     * Supprimer une séquence
     */
    delete: async (id: string): Promise<void> => {
        const db = getDatabase();
        await db.runAsync('DELETE FROM sequences WHERE id = ?', [id]);
    },

    /**
     * Réordonner les séquences d'une classe
     */
    reorder: async (classId: string, sequenceIds: string[]): Promise<void> => {
        const db = getDatabase();

        for (let i = 0; i < sequenceIds.length; i++) {
            await db.runAsync(
                'UPDATE sequences SET order_num = ? WHERE id = ? AND class_id = ?',
                [i, sequenceIds[i], classId]
            );
        }
    },

    /**
     * Assigner des séances à une séquence
     */
    assignSessionsToSequence: async (sequenceId: string, sessionIds: string[]): Promise<void> => {
        const db = getDatabase();

        // Supprimer les assignations existantes pour ces séances
        const placeholders = sessionIds.map(() => '?').join(',');
        await db.runAsync(
            `DELETE FROM session_sequences WHERE session_id IN (${placeholders})`,
            sessionIds
        );

        // Créer les nouvelles assignations
        for (let i = 0; i < sessionIds.length; i++) {
            await db.runAsync(
                'INSERT INTO session_sequences (session_id, sequence_id, order_in_sequence) VALUES (?, ?, ?)',
                [sessionIds[i], sequenceId, i + 1]
            );
        }

        // Mettre à jour le statut de la séquence
        const assignedCount = sessionIds.length;
        const sequence = await sequenceService.getById(sequenceId);
        
        if (sequence) {
            let newStatus: 'planned' | 'in-progress' | 'completed' = 'planned';
            
            if (assignedCount > 0 && assignedCount < sequence.sessionCount) {
                newStatus = 'in-progress';
            } else if (assignedCount >= sequence.sessionCount) {
                newStatus = 'completed';
            }
            
            await sequenceService.updateStatus(sequenceId, newStatus);
        }
    },

    /**
     * Obtenir toutes les séances d'une séquence
     */
    getSessionsBySequence: async (sequenceId: string): Promise<(Session & { orderInSequence: number })[]> => {
        const db = getDatabase();
        const sessions = await db.getAllAsync<Session & { orderInSequence: number }>(
            `SELECT s.*, ss.order_in_sequence as orderInSequence 
             FROM sessions s
             INNER JOIN session_sequences ss ON s.id = ss.session_id
             WHERE ss.sequence_id = ?
             ORDER BY ss.order_in_sequence ASC`,
            [sequenceId]
        );

        return sessions;
    },

    /**
     * Obtenir la séquence d'une séance
     */
    getSequenceBySession: async (sessionId: string): Promise<(Sequence & { orderInSequence: number }) | null> => {
        const db = getDatabase();
        const result = await db.getFirstAsync<SequenceRow & { orderInSequence: number }>(
            `SELECT seq.*, ss.order_in_sequence as orderInSequence
             FROM sequences seq
             INNER JOIN session_sequences ss ON seq.id = ss.sequence_id
             WHERE ss.session_id = ?`,
            [sessionId]
        );

        if (!result) return null;

        return {
            ...parseSequence(result),
            orderInSequence: result.orderInSequence
        };
    },

    /**
     * Désassigner une séance d'une séquence
     */
    unassignSession: async (sessionId: string): Promise<void> => {
        const db = getDatabase();
        
        // Récupérer la séquence avant de supprimer
        const sequenceData = await db.getFirstAsync<{ sequence_id: string }>(
            'SELECT sequence_id FROM session_sequences WHERE session_id = ?',
            [sessionId]
        );

        // Supprimer l'assignation
        await db.runAsync(
            'DELETE FROM session_sequences WHERE session_id = ?',
            [sessionId]
        );

        // Mettre à jour le statut de la séquence si nécessaire
        if (sequenceData) {
            const remainingSessions = await sequenceService.getSessionsBySequence(sequenceData.sequence_id);
            const sequence = await sequenceService.getById(sequenceData.sequence_id);
            
            if (sequence) {
                let newStatus: 'planned' | 'in-progress' | 'completed' = 'planned';
                
                if (remainingSessions.length > 0 && remainingSessions.length < sequence.sessionCount) {
                    newStatus = 'in-progress';
                } else if (remainingSessions.length >= sequence.sessionCount) {
                    newStatus = 'completed';
                }
                
                await sequenceService.updateStatus(sequenceData.sequence_id, newStatus);
            }
        }
    },

    /**
     * Obtenir les statistiques d'une classe
     */
    getClassStatistics: async (classId: string): Promise<{
        totalSequences: number;
        totalSessions: number;
        assignedSessions: number;
        unassignedSessions: number;
        completionPercentage: number;
    }> => {
        const db = getDatabase();

        const sequences = await sequenceService.getByClass(classId);
        const totalSequences = sequences.length;

        const totalSessionsResult = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM sessions WHERE class_id = ?',
            [classId]
        );
        const totalSessions = totalSessionsResult?.count || 0;

        const assignedSessionsResult = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(DISTINCT ss.session_id) as count 
             FROM session_sequences ss
             INNER JOIN sequences seq ON ss.sequence_id = seq.id
             WHERE seq.class_id = ?`,
            [classId]
        );
        const assignedSessions = assignedSessionsResult?.count || 0;

        const unassignedSessions = totalSessions - assignedSessions;
        const completionPercentage = totalSessions > 0 
            ? Math.round((assignedSessions / totalSessions) * 100)
            : 0;

        return {
            totalSequences,
            totalSessions,
            assignedSessions,
            unassignedSessions,
            completionPercentage
        };
    },

    /**
     * Auto-assigner les séquences aux séances générées (ordre séquentiel)
     */
    autoAssignSequences: async (classId: string): Promise<void> => {
        const db = getDatabase();

        // Récupérer toutes les séquences triées par ordre
        const sequences = await sequenceService.getByClass(classId);

        // Récupérer toutes les séances non assignées, triées par date
        const unassignedSessions = await db.getAllAsync<Session>(
            `SELECT s.* FROM sessions s
             WHERE s.class_id = ?
             AND s.id NOT IN (SELECT session_id FROM session_sequences)
             ORDER BY s.date ASC`,
            [classId]
        );

        let sessionIndex = 0;

        // Pour chaque séquence, assigner le nombre de séances nécessaires
        for (const sequence of sequences) {
            const sessionsToAssign: string[] = [];

            for (let i = 0; i < sequence.sessionCount && sessionIndex < unassignedSessions.length; i++) {
                sessionsToAssign.push(unassignedSessions[sessionIndex].id);
                sessionIndex++;
            }

            if (sessionsToAssign.length > 0) {
                await sequenceService.assignSessionsToSequence(sequence.id, sessionsToAssign);
            }
        }
    }
};
