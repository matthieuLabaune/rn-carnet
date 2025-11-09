/**
 * Types pour la gestion des vacances scolaires et jours fériés
 */

/**
 * Période de vacances scolaires
 */
export interface Holiday {
    /** Identifiant unique */
    id: string;
    /** Description de la période (ex: "Vacances de Noël") */
    description: string;
    /** Date de début (ISO format) */
    start: string;
    /** Date de fin (ISO format) */
    end: string;
    /** Zones concernées (A, B, C, ou toutes) */
    zones: string[];
    /** Année scolaire concernée (ex: "2024-2025") */
    schoolYear: string;
}

/**
 * Jour férié français
 */
export interface PublicHoliday {
    /** Date du jour férié (ISO format) */
    date: string;
    /** Nom du jour férié (ex: "Noël") */
    name: string;
    /** Type de jour férié */
    type: 'public' | 'religious' | 'commemorative';
}

/**
 * Réponse de l'API des vacances scolaires
 */
export interface HolidaysApiResponse {
    holidays: Holiday[];
    publicHolidays: PublicHoliday[];
    lastUpdated: string;
}

/**
 * Cache des données de vacances
 */
export interface HolidaysCache {
    data: HolidaysApiResponse;
    timestamp: number;
    schoolYear: string;
}
