/**
 * Types pour la gestion de l'emploi du temps et la génération de séances
 */

/**
 * Créneau horaire hebdomadaire dans l'emploi du temps
 */
export interface ScheduleSlot {
    /** Identifiant unique du créneau */
    id: string;
    /** ID de la classe concernée */
    classId: string;
    /** Jour de la semaine (1=Lundi, 2=Mardi, ..., 7=Dimanche) */
    dayOfWeek: number;
    /** Heure de début au format "HH:MM" (ex: "08:00") */
    startTime: string;
    /** Durée du cours en minutes */
    duration: number;
    /** Matière enseignée */
    subject: string;
    /** Fréquence de répétition */
    frequency: 'weekly' | 'biweekly';
    /**
     * Pour biweekly: indique la semaine de démarrage (0 ou 1)
     * Permet d'alterner semaine paire/impaire
     */
    startWeek?: number;
    /** Date de création du créneau */
    createdAt: string;
}

/**
 * Paramètres de l'année scolaire
 */
export interface SchoolSettings {
    /** Zone scolaire (A, B ou C) pour les vacances */
    zone: 'A' | 'B' | 'C';
    /** Date de début de l'année scolaire (ISO format) */
    schoolYearStart: string;
    /** Date de fin de l'année scolaire (ISO format) */
    schoolYearEnd: string;
}

/**
 * Données pour créer un nouveau créneau
 */
export interface CreateScheduleSlotData {
    classId: string;
    dayOfWeek: number;
    startTime: string;
    duration: number;
    subject: string;
    frequency: 'weekly' | 'biweekly';
    startWeek?: number;
}

/**
 * Données pour mettre à jour un créneau existant
 */
export interface UpdateScheduleSlotData {
    dayOfWeek?: number;
    startTime?: string;
    duration?: number;
    subject?: string;
    frequency?: 'weekly' | 'biweekly';
    startWeek?: number;
}
