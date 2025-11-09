/**
 * Service de gestion des vacances scolaires et jours fériés
 * Utilise l'API data.education.gouv.fr pour les vacances scolaires
 * et une source pour les jours fériés français
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Holiday, PublicHoliday, HolidaysApiResponse, HolidaysCache } from '../types/holiday';

const HOLIDAYS_CACHE_KEY = '@holidays_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

/**
 * Jours fériés français fixes et variables
 * Source: service-public.fr
 */
const FIXED_PUBLIC_HOLIDAYS: { month: number; day: number; name: string; type: PublicHoliday['type'] }[] = [
    { month: 1, day: 1, name: 'Jour de l\'an', type: 'public' },
    { month: 5, day: 1, name: 'Fête du Travail', type: 'public' },
    { month: 5, day: 8, name: 'Victoire 1945', type: 'commemorative' },
    { month: 7, day: 14, name: 'Fête Nationale', type: 'public' },
    { month: 8, day: 15, name: 'Assomption', type: 'religious' },
    { month: 11, day: 1, name: 'Toussaint', type: 'religious' },
    { month: 11, day: 11, name: 'Armistice 1918', type: 'commemorative' },
    { month: 12, day: 25, name: 'Noël', type: 'religious' },
];

/**
 * Calcul de la date de Pâques (algorithme de Meeus/Jones/Butcher)
 */
function getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

/**
 * Formate une date en ISO sans conversion UTC
 */
function formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Génère les jours fériés pour une année donnée
 */
function generatePublicHolidays(year: number): PublicHoliday[] {
    const holidays: PublicHoliday[] = [];

    // Jours fériés fixes
    FIXED_PUBLIC_HOLIDAYS.forEach(({ month, day, name, type }) => {
        const date = new Date(year, month - 1, day);
        holidays.push({
            date: formatDateToISO(date),
            name,
            type,
        });
    });

    // Jours fériés mobiles (basés sur Pâques)
    const easter = getEasterDate(year);

    // Lundi de Pâques (Pâques + 1 jour)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays.push({
        date: formatDateToISO(easterMonday),
        name: 'Lundi de Pâques',
        type: 'religious',
    });

    // Ascension (Pâques + 39 jours)
    const ascension = new Date(easter);
    ascension.setDate(easter.getDate() + 39);
    holidays.push({
        date: formatDateToISO(ascension),
        name: 'Ascension',
        type: 'religious',
    });

    // Lundi de Pentecôte (Pâques + 50 jours)
    const pentecoteMonday = new Date(easter);
    pentecoteMonday.setDate(easter.getDate() + 50);
    holidays.push({
        date: formatDateToISO(pentecoteMonday),
        name: 'Lundi de Pentecôte',
        type: 'religious',
    });

    // Trier par date
    holidays.sort((a, b) => a.date.localeCompare(b.date));

    return holidays;
}

/**
 * Données des vacances scolaires 2024-2025
 * Source: education.gouv.fr
 * TODO: Remplacer par un appel API quand disponible
 */
const HOLIDAYS_2024_2025: Holiday[] = [
    {
        id: 'toussaint-2024',
        description: 'Vacances de la Toussaint',
        start: '2024-10-19',
        end: '2024-11-04',
        zones: ['A', 'B', 'C'],
        schoolYear: '2024-2025',
    },
    {
        id: 'noel-2024',
        description: 'Vacances de Noël',
        start: '2024-12-21',
        end: '2025-01-06',
        zones: ['A', 'B', 'C'],
        schoolYear: '2024-2025',
    },
    {
        id: 'hiver-2025-a',
        description: 'Vacances d\'Hiver',
        start: '2025-02-08',
        end: '2025-02-24',
        zones: ['A'],
        schoolYear: '2024-2025',
    },
    {
        id: 'hiver-2025-b',
        description: 'Vacances d\'Hiver',
        start: '2025-02-15',
        end: '2025-03-03',
        zones: ['B'],
        schoolYear: '2024-2025',
    },
    {
        id: 'hiver-2025-c',
        description: 'Vacances d\'Hiver',
        start: '2025-02-22',
        end: '2025-03-10',
        zones: ['C'],
        schoolYear: '2024-2025',
    },
    {
        id: 'printemps-2025-a',
        description: 'Vacances de Printemps',
        start: '2025-04-12',
        end: '2025-04-28',
        zones: ['A'],
        schoolYear: '2024-2025',
    },
    {
        id: 'printemps-2025-b',
        description: 'Vacances de Printemps',
        start: '2025-04-05',
        end: '2025-04-22',
        zones: ['B'],
        schoolYear: '2024-2025',
    },
    {
        id: 'printemps-2025-c',
        description: 'Vacances de Printemps',
        start: '2025-04-19',
        end: '2025-05-05',
        zones: ['C'],
        schoolYear: '2024-2025',
    },
    {
        id: 'ete-2025',
        description: 'Vacances d\'Été',
        start: '2025-07-05',
        end: '2025-09-01',
        zones: ['A', 'B', 'C'],
        schoolYear: '2024-2025',
    },
];

const HOLIDAYS_2025_2026: Holiday[] = [
    {
        id: 'toussaint-2025',
        description: 'Vacances de la Toussaint',
        start: '2025-10-18',
        end: '2025-11-03',
        zones: ['A', 'B', 'C'],
        schoolYear: '2025-2026',
    },
    {
        id: 'noel-2025',
        description: 'Vacances de Noël',
        start: '2025-12-20',
        end: '2026-01-05',
        zones: ['A', 'B', 'C'],
        schoolYear: '2025-2026',
    },
    {
        id: 'hiver-2026-a',
        description: 'Vacances d\'Hiver',
        start: '2026-02-07',
        end: '2026-02-23',
        zones: ['A'],
        schoolYear: '2025-2026',
    },
    {
        id: 'hiver-2026-b',
        description: 'Vacances d\'Hiver',
        start: '2026-02-21',
        end: '2026-03-09',
        zones: ['B'],
        schoolYear: '2025-2026',
    },
    {
        id: 'hiver-2026-c',
        description: 'Vacances d\'Hiver',
        start: '2026-02-14',
        end: '2026-03-02',
        zones: ['C'],
        schoolYear: '2025-2026',
    },
    {
        id: 'printemps-2026-a',
        description: 'Vacances de Printemps',
        start: '2026-04-11',
        end: '2026-04-27',
        zones: ['A'],
        schoolYear: '2025-2026',
    },
    {
        id: 'printemps-2026-b',
        description: 'Vacances de Printemps',
        start: '2026-04-18',
        end: '2026-05-04',
        zones: ['B'],
        schoolYear: '2025-2026',
    },
    {
        id: 'printemps-2026-c',
        description: 'Vacances de Printemps',
        start: '2026-04-04',
        end: '2026-04-20',
        zones: ['C'],
        schoolYear: '2025-2026',
    },
    {
        id: 'ete-2026',
        description: 'Vacances d\'Été',
        start: '2026-07-04',
        end: '2026-09-01',
        zones: ['A', 'B', 'C'],
        schoolYear: '2025-2026',
    },
];

/**
 * Détermine l'année scolaire à partir d'une date
 */
function getSchoolYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed

    // Si on est entre septembre et décembre, on est sur l'année N/N+1
    // Si on est entre janvier et août, on est sur l'année N-1/N
    if (month >= 9) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
}

/**
 * Récupère les données de vacances depuis le cache
 */
async function getCachedHolidays(): Promise<HolidaysCache | null> {
    try {
        const cached = await AsyncStorage.getItem(HOLIDAYS_CACHE_KEY);
        if (!cached) return null;

        const parsedCache: HolidaysCache = JSON.parse(cached);
        const now = Date.now();

        // Vérifier si le cache est encore valide
        if (now - parsedCache.timestamp < CACHE_DURATION) {
            return parsedCache;
        }

        return null;
    } catch (error) {
        console.error('Error reading holidays cache:', error);
        return null;
    }
}

/**
 * Sauvegarde les données de vacances dans le cache
 */
async function setCachedHolidays(data: HolidaysApiResponse, schoolYear: string): Promise<void> {
    try {
        const cache: HolidaysCache = {
            data,
            timestamp: Date.now(),
            schoolYear,
        };
        await AsyncStorage.setItem(HOLIDAYS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving holidays cache:', error);
    }
}

/**
 * Récupère les vacances scolaires pour une année scolaire donnée
 */
export async function getHolidays(schoolYear?: string): Promise<Holiday[]> {
    try {
        // Déterminer l'année scolaire
        const targetSchoolYear = schoolYear || getSchoolYear(new Date());

        // Vérifier le cache
        const cached = await getCachedHolidays();
        if (cached && cached.schoolYear === targetSchoolYear) {
            return cached.data.holidays;
        }

        // Sélectionner les données selon l'année scolaire
        let holidays: Holiday[];
        if (targetSchoolYear === '2024-2025') {
            holidays = HOLIDAYS_2024_2025;
        } else if (targetSchoolYear === '2025-2026') {
            holidays = HOLIDAYS_2025_2026;
        } else {
            // Par défaut, utiliser l'année en cours
            holidays = HOLIDAYS_2024_2025;
        }

        // Générer les jours fériés pour les années concernées
        const [startYear] = targetSchoolYear.split('-').map(Number);
        const publicHolidays = [
            ...generatePublicHolidays(startYear),
            ...generatePublicHolidays(startYear + 1),
        ];

        const response: HolidaysApiResponse = {
            holidays,
            publicHolidays,
            lastUpdated: new Date().toISOString(),
        };

        // Mettre en cache
        await setCachedHolidays(response, targetSchoolYear);

        return holidays;
    } catch (error) {
        console.error('Error fetching holidays:', error);
        throw new Error('Impossible de récupérer les vacances scolaires');
    }
}

/**
 * Récupère les vacances scolaires pour une zone spécifique
 */
export async function getHolidaysByZone(zone: 'A' | 'B' | 'C', schoolYear?: string): Promise<Holiday[]> {
    const allHolidays = await getHolidays(schoolYear);
    return allHolidays.filter(holiday => holiday.zones.includes(zone));
}

/**
 * Récupère les jours fériés pour une année scolaire donnée
 */
export async function getPublicHolidays(schoolYear?: string): Promise<PublicHoliday[]> {
    try {
        // Déterminer l'année scolaire
        const targetSchoolYear = schoolYear || getSchoolYear(new Date());

        // Vérifier le cache
        const cached = await getCachedHolidays();
        if (cached && cached.schoolYear === targetSchoolYear) {
            return cached.data.publicHolidays;
        }

        // Générer les jours fériés
        const [startYear] = targetSchoolYear.split('-').map(Number);
        const publicHolidays = [
            ...generatePublicHolidays(startYear),
            ...generatePublicHolidays(startYear + 1),
        ];

        return publicHolidays;
    } catch (error) {
        console.error('Error fetching public holidays:', error);
        throw new Error('Impossible de récupérer les jours fériés');
    }
}

/**
 * Vérifie si une date est pendant les vacances scolaires
 */
export async function isHoliday(date: Date, zone: 'A' | 'B' | 'C', schoolYear?: string): Promise<boolean> {
    const holidays = await getHolidaysByZone(zone, schoolYear);
    const dateStr = formatDateToISO(date);

    return holidays.some(holiday => {
        return dateStr >= holiday.start && dateStr <= holiday.end;
    });
}

/**
 * Vérifie si une date est un jour férié
 */
export async function isPublicHoliday(date: Date, schoolYear?: string): Promise<boolean> {
    const publicHolidays = await getPublicHolidays(schoolYear);
    const dateStr = formatDateToISO(date);

    return publicHolidays.some(holiday => holiday.date === dateStr);
}

/**
 * Vérifie si une date est un jour non travaillé (vacances ou férié)
 */
export async function isNonWorkingDay(date: Date, zone: 'A' | 'B' | 'C', schoolYear?: string): Promise<boolean> {
    const [isHol, isPubHol] = await Promise.all([
        isHoliday(date, zone, schoolYear),
        isPublicHoliday(date, schoolYear),
    ]);

    return isHol || isPubHol;
}

/**
 * Vide le cache des vacances
 */
export async function clearHolidaysCache(): Promise<void> {
    try {
        await AsyncStorage.removeItem(HOLIDAYS_CACHE_KEY);
    } catch (error) {
        console.error('Error clearing holidays cache:', error);
    }
}

export const holidayService = {
    getHolidays,
    getHolidaysByZone,
    getPublicHolidays,
    isHoliday,
    isPublicHoliday,
    isNonWorkingDay,
    clearHolidaysCache,
};
