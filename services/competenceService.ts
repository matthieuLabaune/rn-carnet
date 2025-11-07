/**
 * Competence Service
 * CRUD operations for competences
 */

import { getDatabase } from './database';
import { Competence, CompetenceDomaine } from '../types';

export const competenceService = {
    /**
     * Get all competences
     */
    async getAll(): Promise<Competence[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM competences ORDER BY domaine, nom'
        );
        return result.map((row) => ({
            id: row.id,
            nom: row.nom,
            description: row.description,
            domaine: row.domaine,
            couleur: row.couleur,
            isPredefined: row.is_predefined === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Get competences by domain
     */
    async getByDomain(domaine: CompetenceDomaine): Promise<Competence[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM competences WHERE domaine = ? ORDER BY nom',
            [domaine]
        );
        return result.map((row) => ({
            id: row.id,
            nom: row.nom,
            description: row.description,
            domaine: row.domaine,
            couleur: row.couleur,
            isPredefined: row.is_predefined === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Get predefined competences only
     */
    async getPredefined(): Promise<Competence[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM competences WHERE is_predefined = 1 ORDER BY domaine, nom'
        );
        return result.map((row) => ({
            id: row.id,
            nom: row.nom,
            description: row.description,
            domaine: row.domaine,
            couleur: row.couleur,
            isPredefined: true,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Get custom competences only
     */
    async getCustom(): Promise<Competence[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM competences WHERE is_predefined = 0 ORDER BY domaine, nom'
        );
        return result.map((row) => ({
            id: row.id,
            nom: row.nom,
            description: row.description,
            domaine: row.domaine,
            couleur: row.couleur,
            isPredefined: false,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Get a single competence by ID
     */
    async getById(id: string): Promise<Competence | null> {
        const db = getDatabase();
        const result = await db.getFirstAsync<any>(
            'SELECT * FROM competences WHERE id = ?',
            [id]
        );
        if (!result) return null;
        return {
            id: result.id,
            nom: result.nom,
            description: result.description,
            domaine: result.domaine,
            couleur: result.couleur,
            isPredefined: result.is_predefined === 1,
            createdAt: result.created_at,
            updatedAt: result.updated_at,
        };
    },

    /**
     * Get multiple competences by IDs
     */
    async getByIds(ids: string[]): Promise<Competence[]> {
        if (ids.length === 0) return [];
        const db = getDatabase();
        const placeholders = ids.map(() => '?').join(',');
        const result = await db.getAllAsync<any>(
            `SELECT * FROM competences WHERE id IN (${placeholders}) ORDER BY nom`,
            ids
        );
        return result.map((row) => ({
            id: row.id,
            nom: row.nom,
            description: row.description,
            domaine: row.domaine,
            couleur: row.couleur,
            isPredefined: row.is_predefined === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /**
     * Create a new competence
     */
    async create(competence: Omit<Competence, 'createdAt' | 'updatedAt'>): Promise<Competence> {
        const db = getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `INSERT INTO competences (id, nom, description, domaine, couleur, is_predefined, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                competence.id,
                competence.nom,
                competence.description || null,
                competence.domaine,
                competence.couleur,
                competence.isPredefined ? 1 : 0,
                now,
                now,
            ]
        );
        return {
            ...competence,
            createdAt: now,
            updatedAt: now,
        };
    },

    /**
     * Update a competence (only custom ones can be updated)
     */
    async update(
        id: string,
        updates: Partial<Omit<Competence, 'id' | 'isPredefined' | 'createdAt' | 'updatedAt'>>
    ): Promise<void> {
        const db = getDatabase();
        const now = new Date().toISOString();
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.nom !== undefined) {
            fields.push('nom = ?');
            values.push(updates.nom);
        }
        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description);
        }
        if (updates.domaine !== undefined) {
            fields.push('domaine = ?');
            values.push(updates.domaine);
        }
        if (updates.couleur !== undefined) {
            fields.push('couleur = ?');
            values.push(updates.couleur);
        }

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE competences SET ${fields.join(', ')} WHERE id = ? AND is_predefined = 0`,
            values
        );
    },

    /**
     * Delete a competence (only custom ones can be deleted)
     */
    async delete(id: string): Promise<void> {
        const db = getDatabase();
        await db.runAsync('DELETE FROM competences WHERE id = ? AND is_predefined = 0', [id]);
    },

    /**
     * Bulk insert competences (for seeding)
     */
    async bulkInsert(competences: Omit<Competence, 'createdAt' | 'updatedAt'>[]): Promise<void> {
        const db = getDatabase();
        const now = new Date().toISOString();

        for (const competence of competences) {
            await db.runAsync(
                `INSERT OR IGNORE INTO competences (id, nom, description, domaine, couleur, is_predefined, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    competence.id,
                    competence.nom,
                    competence.description || null,
                    competence.domaine,
                    competence.couleur,
                    competence.isPredefined ? 1 : 0,
                    now,
                    now,
                ]
            );
        }
    },
};
