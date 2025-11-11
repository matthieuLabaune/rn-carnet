import { getDatabase } from './database';
import { Establishment, EstablishmentSuggestion } from '../types';

class EstablishmentService {
    /**
     * Récupère tous les établissements
     */
    async getAll(): Promise<Establishment[]> {
        const db = getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM establishments ORDER BY name ASC'
        );

        return result.map(row => this.mapRowToEstablishment(row));
    }

    /**
     * Récupère un établissement par son ID
     */
    async getById(id: string): Promise<Establishment | null> {
        const db = getDatabase();
        const result = await db.getFirstAsync<any>(
            'SELECT * FROM establishments WHERE id = ?',
            [id]
        );

        return result ? this.mapRowToEstablishment(result) : null;
    }

    /**
     * Récupère un établissement par son code UAI
     */
    async getByUAI(uai: string): Promise<Establishment | null> {
        const db = getDatabase();
        const result = await db.getFirstAsync<any>(
            'SELECT * FROM establishments WHERE uai = ?',
            [uai]
        );

        return result ? this.mapRowToEstablishment(result) : null;
    }

    /**
     * Crée un nouvel établissement
     */
    async create(data: Omit<Establishment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Establishment> {
        const db = getDatabase();
        const id = this.generateId();
        const now = new Date().toISOString();

        await db.runAsync(
            `INSERT INTO establishments (
        id, name, address, city, postal_code, phone, email, uai, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.name,
                data.address || null,
                data.city || null,
                data.postalCode || null,
                data.phone || null,
                data.email || null,
                data.uai || null,
                data.type || 'autre',
                now,
                now,
            ]
        );

        const establishment = await this.getById(id);
        if (!establishment) {
            throw new Error('Failed to create establishment');
        }

        return establishment;
    }

    /**
     * Crée un établissement à partir d'une suggestion de l'API
     */
    async createFromSuggestion(suggestion: EstablishmentSuggestion): Promise<Establishment> {
        const type = this.getTypeFromLibelle(suggestion.libelle_nature || suggestion.type_etablissement);

        return this.create({
            name: suggestion.nom_etablissement,
            address: suggestion.adresse_1,
            city: suggestion.nom_commune,
            postalCode: suggestion.code_postal,
            phone: suggestion.telephone,
            email: suggestion.mail,
            uai: suggestion.code_etablissement,
            type,
        });
    }

    /**
     * Met à jour un établissement
     */
    async update(id: string, data: Partial<Omit<Establishment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Establishment> {
        const db = getDatabase();
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.address !== undefined) {
            updates.push('address = ?');
            values.push(data.address);
        }
        if (data.city !== undefined) {
            updates.push('city = ?');
            values.push(data.city);
        }
        if (data.postalCode !== undefined) {
            updates.push('postal_code = ?');
            values.push(data.postalCode);
        }
        if (data.phone !== undefined) {
            updates.push('phone = ?');
            values.push(data.phone);
        }
        if (data.email !== undefined) {
            updates.push('email = ?');
            values.push(data.email);
        }
        if (data.uai !== undefined) {
            updates.push('uai = ?');
            values.push(data.uai);
        }
        if (data.type !== undefined) {
            updates.push('type = ?');
            values.push(data.type);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        if (updates.length > 0) {
            await db.runAsync(
                `UPDATE establishments SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        const establishment = await this.getById(id);
        if (!establishment) {
            throw new Error('Failed to update establishment');
        }

        return establishment;
    }

    /**
     * Supprime un établissement
     */
    async delete(id: string): Promise<void> {
        const db = getDatabase();
        await db.runAsync('DELETE FROM establishments WHERE id = ?', [id]);
    }

    /**
     * Compte le nombre de classes associées à un établissement
     */
    async countClasses(establishmentId: string): Promise<number> {
        const db = getDatabase();
        
        // Note: la colonne establishment_id n'existe pas encore dans la table classes
        // Elle sera ajoutée dans une prochaine migration
        try {
            const result = await db.getFirstAsync<{ count: number }>(
                'SELECT COUNT(*) as count FROM classes WHERE establishment_id = ?',
                [establishmentId]
            );
            return result?.count || 0;
        } catch (error) {
            // Si la colonne n'existe pas encore, retourner 0
            return 0;
        }
    }

    /**
     * Génère un ID unique
     */
    private generateId(): string {
        return `establishment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Convertit une ligne de base de données en objet Establishment
     */
    private mapRowToEstablishment(row: any): Establishment {
        return {
            id: row.id,
            name: row.name,
            address: row.address || undefined,
            city: row.city || undefined,
            postalCode: row.postal_code || undefined,
            phone: row.phone || undefined,
            email: row.email || undefined,
            uai: row.uai || undefined,
            type: row.type || 'autre',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    /**
     * Détermine le type d'établissement à partir du libellé
     */
    private getTypeFromLibelle(libelle?: string): 'ecole' | 'college' | 'lycee' | 'lycee_professionnel' | 'autre' {
        if (!libelle) return 'autre';

        const lower = libelle.toLowerCase();
        
        if (lower.includes('école') || lower.includes('ecole') || lower.includes('élémentaire') || lower.includes('maternelle')) {
            return 'ecole';
        }
        if (lower.includes('collège') || lower.includes('college')) {
            return 'college';
        }
        if (lower.includes('lycée professionnel') || lower.includes('lycee professionnel') || lower.includes('lp')) {
            return 'lycee_professionnel';
        }
        if (lower.includes('lycée') || lower.includes('lycee')) {
            return 'lycee';
        }
        
        return 'autre';
    }
}

export const establishmentService = new EstablishmentService();
