import { EstablishmentSuggestion } from '../types';

/**
 * Service pour rechercher des établissements scolaires via l'API Data Gouv
 * Documentation: https://data.education.gouv.fr/explore/dataset/fr-en-annuaire-education
 */

const API_BASE_URL = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records';

export class EstablishmentApiService {
    /**
     * Recherche des établissements par nom
     * @param query Le nom de l'établissement à rechercher
     * @param limit Nombre maximum de résultats (défaut: 10)
     * @returns Liste des établissements trouvés
     */
    static async searchEstablishments(query: string, limit: number = 10): Promise<EstablishmentSuggestion[]> {
        if (!query || query.trim().length < 2) {
            return [];
        }

        try {
            // Construction de la requête avec recherche sur le nom
            const params = new URLSearchParams({
                where: `nom_etablissement LIKE "${query}"`,
                limit: limit.toString(),
                select: 'nom_etablissement,adresse_1,code_postal,nom_commune,telephone,mail,code_etablissement,type_etablissement,libelle_nature',
            });

            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            
            if (!response.ok) {
                console.error('API Error:', response.status, response.statusText);
                return [];
            }

            const data = await response.json();
            
            if (!data.results || !Array.isArray(data.results)) {
                return [];
            }

            // Transformation des résultats
            return data.results.map((result: any) => ({
                nom_etablissement: result.nom_etablissement || '',
                adresse_1: result.adresse_1 || '',
                code_postal: result.code_postal || '',
                nom_commune: result.nom_commune || '',
                telephone: result.telephone || '',
                mail: result.mail || '',
                code_etablissement: result.code_etablissement || '',
                type_etablissement: result.type_etablissement || '',
                libelle_nature: result.libelle_nature || '',
            }));
        } catch (error) {
            console.error('Error searching establishments:', error);
            return [];
        }
    }

    /**
     * Recherche d'un établissement par code UAI
     * @param uai Code UAI de l'établissement
     * @returns Établissement trouvé ou null
     */
    static async getByUAI(uai: string): Promise<EstablishmentSuggestion | null> {
        if (!uai) return null;

        try {
            const params = new URLSearchParams({
                where: `code_etablissement = "${uai}"`,
                limit: '1',
            });

            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            
            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                return null;
            }

            const result = data.results[0];
            return {
                nom_etablissement: result.nom_etablissement || '',
                adresse_1: result.adresse_1 || '',
                code_postal: result.code_postal || '',
                nom_commune: result.nom_commune || '',
                telephone: result.telephone || '',
                mail: result.mail || '',
                code_etablissement: result.code_etablissement || '',
                type_etablissement: result.type_etablissement || '',
                libelle_nature: result.libelle_nature || '',
            };
        } catch (error) {
            console.error('Error fetching establishment by UAI:', error);
            return null;
        }
    }

    /**
     * Recherche des établissements par ville
     * @param city Nom de la ville
     * @param limit Nombre maximum de résultats
     * @returns Liste des établissements trouvés
     */
    static async searchByCity(city: string, limit: number = 20): Promise<EstablishmentSuggestion[]> {
        if (!city || city.trim().length < 2) {
            return [];
        }

        try {
            const params = new URLSearchParams({
                where: `nom_commune LIKE "${city}"`,
                limit: limit.toString(),
            });

            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            
            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            
            if (!data.results || !Array.isArray(data.results)) {
                return [];
            }

            return data.results.map((result: any) => ({
                nom_etablissement: result.nom_etablissement || '',
                adresse_1: result.adresse_1 || '',
                code_postal: result.code_postal || '',
                nom_commune: result.nom_commune || '',
                telephone: result.telephone || '',
                mail: result.mail || '',
                code_etablissement: result.code_etablissement || '',
                type_etablissement: result.type_etablissement || '',
                libelle_nature: result.libelle_nature || '',
            }));
        } catch (error) {
            console.error('Error searching establishments by city:', error);
            return [];
        }
    }

    /**
     * Formate une suggestion d'établissement pour l'affichage
     * @param suggestion La suggestion à formater
     * @returns Texte formaté
     */
    static formatSuggestion(suggestion: EstablishmentSuggestion): string {
        const parts = [
            suggestion.nom_etablissement,
            suggestion.nom_commune,
            suggestion.code_postal,
        ].filter(Boolean);

        return parts.join(' - ');
    }

    /**
     * Détermine le type d'établissement à partir du libellé
     * @param libelle Le libellé de l'établissement
     * @returns Type normalisé
     */
    static getEstablishmentType(libelle?: string): 'ecole' | 'college' | 'lycee' | 'lycee_professionnel' | 'autre' {
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
