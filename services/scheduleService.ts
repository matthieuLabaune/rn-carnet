/**
 * Service de gestion de l'emploi du temps
 */

import { getDatabase } from './database';
import type { ScheduleSlot, CreateScheduleSlotData, UpdateScheduleSlotData } from '../types/schedule';

const generateId = () => `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Récupérer tous les créneaux d'une classe
 */
export async function getByClass(classId: string): Promise<ScheduleSlot[]> {
    const db = getDatabase();

    const slots = await db.getAllAsync<any>(
        'SELECT * FROM schedule_slots WHERE class_id = ? ORDER BY day_of_week, start_time',
        [classId]
    );

    return slots.map(mapToScheduleSlot);
}

/**
 * Récupérer tous les créneaux (toutes classes)
 */
export async function getAll(): Promise<ScheduleSlot[]> {
    const db = getDatabase();

    const slots = await db.getAllAsync<any>(
        'SELECT * FROM schedule_slots ORDER BY class_id, day_of_week, start_time'
    );

    return slots.map(mapToScheduleSlot);
}

/**
 * Récupérer un créneau par son ID
 */
export async function getById(id: string): Promise<ScheduleSlot | null> {
    const db = getDatabase();

    const slot = await db.getFirstAsync<any>(
        'SELECT * FROM schedule_slots WHERE id = ?',
        [id]
    );

    if (!slot) return null;

    return mapToScheduleSlot(slot);
}

/**
 * Créer un nouveau créneau
 */
export async function create(data: CreateScheduleSlotData): Promise<ScheduleSlot> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    // Validation
    if (data.dayOfWeek < 1 || data.dayOfWeek > 7) {
        throw new Error('dayOfWeek doit être entre 1 (lundi) et 7 (dimanche)');
    }

    if (!['weekly', 'biweekly'].includes(data.frequency)) {
        throw new Error('frequency doit être "weekly" ou "biweekly"');
    }

    if (data.frequency === 'biweekly' && data.startWeek !== undefined && ![0, 1].includes(data.startWeek)) {
        throw new Error('startWeek doit être 0 ou 1 pour une fréquence biweekly');
    }

    await db.runAsync(
        `INSERT INTO schedule_slots (id, class_id, day_of_week, start_time, duration, subject, frequency, start_week, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            data.classId,
            data.dayOfWeek,
            data.startTime,
            data.duration,
            data.subject,
            data.frequency,
            data.startWeek ?? null,
            now,
        ]
    );

    const created = await getById(id);
    if (!created) throw new Error('Failed to create schedule slot');

    return created;
}

/**
 * Mettre à jour un créneau
 */
export async function update(id: string, data: UpdateScheduleSlotData): Promise<ScheduleSlot> {
    const db = getDatabase();

    // Validation
    if (data.dayOfWeek !== undefined && (data.dayOfWeek < 1 || data.dayOfWeek > 7)) {
        throw new Error('dayOfWeek doit être entre 1 (lundi) et 7 (dimanche)');
    }

    if (data.frequency !== undefined && !['weekly', 'biweekly'].includes(data.frequency)) {
        throw new Error('frequency doit être "weekly" ou "biweekly"');
    }

    if (data.startWeek !== undefined && ![0, 1].includes(data.startWeek)) {
        throw new Error('startWeek doit être 0 ou 1');
    }

    // Construire la requête dynamiquement
    const updates: string[] = [];
    const values: any[] = [];

    if (data.dayOfWeek !== undefined) {
        updates.push('day_of_week = ?');
        values.push(data.dayOfWeek);
    }
    if (data.startTime !== undefined) {
        updates.push('start_time = ?');
        values.push(data.startTime);
    }
    if (data.duration !== undefined) {
        updates.push('duration = ?');
        values.push(data.duration);
    }
    if (data.subject !== undefined) {
        updates.push('subject = ?');
        values.push(data.subject);
    }
    if (data.frequency !== undefined) {
        updates.push('frequency = ?');
        values.push(data.frequency);
    }
    if (data.startWeek !== undefined) {
        updates.push('start_week = ?');
        values.push(data.startWeek);
    }

    if (updates.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(id);

    await db.runAsync(
        `UPDATE schedule_slots SET ${updates.join(', ')} WHERE id = ?`,
        values
    );

    const updated = await getById(id);
    if (!updated) throw new Error('Failed to update schedule slot');

    return updated;
}

/**
 * Supprimer un créneau
 */
export async function deleteSlot(id: string): Promise<void> {
    const db = getDatabase();

    await db.runAsync('DELETE FROM schedule_slots WHERE id = ?', [id]);
}

/**
 * Supprimer tous les créneaux d'une classe
 */
export async function deleteByClass(classId: string): Promise<void> {
    const db = getDatabase();

    await db.runAsync('DELETE FROM schedule_slots WHERE class_id = ?', [classId]);
}

/**
 * Obtenir les statistiques des créneaux
 */
export async function getStats(classId?: string): Promise<{
    totalSlots: number;
    weeklySlots: number;
    biweeklySlots: number;
    totalWeeklyMinutes: number;
}> {
    const db = getDatabase();

    const query = classId
        ? `SELECT
            COUNT(*) as totalSlots,
            SUM(CASE WHEN frequency = 'weekly' THEN 1 ELSE 0 END) as weeklySlots,
            SUM(CASE WHEN frequency = 'biweekly' THEN 1 ELSE 0 END) as biweeklySlots,
            SUM(CASE WHEN frequency = 'weekly' THEN duration ELSE duration / 2 END) as totalWeeklyMinutes
           FROM schedule_slots
           WHERE class_id = ?`
        : `SELECT
            COUNT(*) as totalSlots,
            SUM(CASE WHEN frequency = 'weekly' THEN 1 ELSE 0 END) as weeklySlots,
            SUM(CASE WHEN frequency = 'biweekly' THEN 1 ELSE 0 END) as biweeklySlots,
            SUM(CASE WHEN frequency = 'weekly' THEN duration ELSE duration / 2 END) as totalWeeklyMinutes
           FROM schedule_slots`;

    const params = classId ? [classId] : [];
    const result = await db.getFirstAsync<any>(query, params);

    return {
        totalSlots: result?.totalSlots || 0,
        weeklySlots: result?.weeklySlots || 0,
        biweeklySlots: result?.biweeklySlots || 0,
        totalWeeklyMinutes: result?.totalWeeklyMinutes || 0,
    };
}

/**
 * Mapper les données de la base vers le type ScheduleSlot
 */
function mapToScheduleSlot(row: any): ScheduleSlot {
    return {
        id: row.id,
        classId: row.class_id,
        dayOfWeek: row.day_of_week,
        startTime: row.start_time,
        duration: row.duration,
        subject: row.subject,
        frequency: row.frequency,
        startWeek: row.start_week,
        createdAt: row.created_at,
    };
}

export const scheduleService = {
    getByClass,
    getAll,
    getById,
    create,
    update,
    delete: deleteSlot,
    deleteByClass,
    getStats,
};
