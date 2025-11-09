import { getSchoolYearSettings } from './settingsService';
import { getByClass as getScheduleSlots } from './scheduleService';
import { sessionService } from './sessionService';
import { isNonWorkingDay } from './holidayService';
import type { ScheduleSlot } from '../types/schedule';
import type { SessionFormData } from '../types/session';

/**
 * Résultat de la génération de séances
 */
export interface GenerationResult {
    totalGenerated: number;
    sessionsCreated: string[]; // IDs des séances créées
    startDate: string;
    endDate: string;
    skippedDays: number; // Nombre de jours sautés (weekends, vacances, fériés)
}

/**
 * Options pour la génération de séances
 */
export interface GenerationOptions {
    classId: string;
    preview?: boolean; // Si true, ne crée pas les séances, retourne juste le count
    deleteExisting?: boolean; // Si true, supprime les séances existantes avant de générer
}

/**
 * Calcule le numéro de semaine depuis une date de référence
 * Utilisé pour l'alternance des créneaux biweekly
 */
function getWeekNumber(date: Date, referenceDate: Date): number {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffMs = date.getTime() - referenceDate.getTime();
    return Math.floor(diffMs / msPerWeek);
}

/**
 * Convertit une date au format ISO (YYYY-MM-DD)
 */
function toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse une date au format ISO (YYYY-MM-DD)
 */
function parseISODate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Obtient le jour de la semaine (1 = lundi, 7 = dimanche)
 * Convertit depuis le système JavaScript (0 = dimanche, 6 = samedi)
 */
function getDayOfWeek(date: Date): number {
    const jsDay = date.getDay();
    // Convertir: dimanche(0) -> 7, lundi(1) -> 1, ..., samedi(6) -> 6
    return jsDay === 0 ? 7 : jsDay;
}

/**
 * Génère automatiquement les séances pour une classe sur l'année scolaire
 * en fonction de l'emploi du temps et des vacances scolaires
 */
export async function generateSessions(
    options: GenerationOptions
): Promise<GenerationResult> {
    const { classId, preview = false, deleteExisting = false } = options;

    // 1. Récupérer les paramètres de l'année scolaire
    const settings = await getSchoolYearSettings();
    if (!settings) {
        throw new Error('Les paramètres de l\'année scolaire ne sont pas configurés');
    }

    const { zone, schoolYearStart, schoolYearEnd } = settings;
    if (!zone || !schoolYearStart || !schoolYearEnd) {
        throw new Error('Zone et dates de l\'année scolaire doivent être configurées');
    }

    // 2. Récupérer l'emploi du temps de la classe
    const scheduleSlots = await getScheduleSlots(classId);
    if (scheduleSlots.length === 0) {
        throw new Error('Aucun créneau d\'emploi du temps configuré pour cette classe');
    }

    // 3. Supprimer les séances existantes si demandé
    if (deleteExisting && !preview) {
        await sessionService.deleteByClass(classId);
    }

    // 4. Parcourir toutes les dates de l'année scolaire
    const startDate = parseISODate(schoolYearStart);
    const endDate = parseISODate(schoolYearEnd);

    const sessionsToCreate: SessionFormData[] = [];
    let skippedDays = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = toISODate(currentDate);
        const dayOfWeek = getDayOfWeek(currentDate);

        // Vérifier si c'est un jour non travaillé (weekend, vacances, férié)
        if (await isNonWorkingDay(currentDate, zone)) {
            skippedDays++;
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        // Trouver les créneaux correspondant à ce jour de la semaine
        const slotsForDay = scheduleSlots.filter(slot => slot.dayOfWeek === dayOfWeek);

        for (const slot of slotsForDay) {
            // Vérifier la fréquence
            if (slot.frequency === 'weekly') {
                // Créneaux hebdomadaires : toujours générer
                sessionsToCreate.push({
                    classId,
                    subject: slot.subject,
                    date: dateStr,
                    duration: slot.duration,
                    status: 'planned',
                });
            } else if (slot.frequency === 'biweekly') {
                // Créneaux bimensuels : vérifier la parité de la semaine
                const weekNumber = getWeekNumber(currentDate, startDate);
                const weekParity = weekNumber % 2;

                // startWeek définit quelle semaine (paire ou impaire) doit avoir le créneau
                // startWeek = 0 : semaines paires (0, 2, 4, ...)
                // startWeek = 1 : semaines impaires (1, 3, 5, ...)
                if (weekParity === slot.startWeek) {
                    sessionsToCreate.push({
                        classId,
                        subject: slot.subject,
                        date: dateStr,
                        duration: slot.duration,
                        status: 'planned',
                    });
                }
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 5. Créer les séances si pas en mode preview
    const sessionIds: string[] = [];
    if (!preview) {
        for (const sessionData of sessionsToCreate) {
            const session = await sessionService.create(sessionData);
            sessionIds.push(session.id);
        }
    }

    return {
        totalGenerated: sessionsToCreate.length,
        sessionsCreated: sessionIds,
        startDate: schoolYearStart,
        endDate: schoolYearEnd,
        skippedDays,
    };
}

/**
 * Prévisualise le nombre de séances qui seraient générées
 * sans les créer effectivement
 */
export async function previewGeneration(
    classId: string
): Promise<GenerationResult> {
    return generateSessions({ classId, preview: true });
}

/**
 * Régénère complètement les séances d'une classe
 * (supprime les existantes puis génère les nouvelles)
 */
export async function regenerateSessions(
    classId: string
): Promise<GenerationResult> {
    return generateSessions({ classId, deleteExisting: true });
}

/**
 * Obtient les statistiques de génération pour une classe
 */
export async function getGenerationStats(classId: string): Promise<{
    scheduleSlots: number;
    estimatedSessions: number;
    schoolYearDays: number;
    workingDays: number;
}> {
    const settings = await getSchoolYearSettings();
    if (!settings?.schoolYearStart || !settings?.schoolYearEnd) {
        return {
            scheduleSlots: 0,
            estimatedSessions: 0,
            schoolYearDays: 0,
            workingDays: 0,
        };
    }

    const scheduleSlots = await getScheduleSlots(classId);
    const startDate = parseISODate(settings.schoolYearStart);
    const endDate = parseISODate(settings.schoolYearEnd);

    // Calculer le nombre de jours dans l'année scolaire
    const msPerDay = 24 * 60 * 60 * 1000;
    const schoolYearDays = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

    // Compter les jours travaillés (estimation rapide)
    let workingDays = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (!await isNonWorkingDay(currentDate, settings.zone!)) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Estimer le nombre de séances
    // Pour une estimation rapide, on peut faire un preview
    const preview = await previewGeneration(classId);

    return {
        scheduleSlots: scheduleSlots.length,
        estimatedSessions: preview.totalGenerated,
        schoolYearDays,
        workingDays,
    };
}
