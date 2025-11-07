/**
 * EvaluationResult type definition
 * Represents a student's result for a specific competence in an evaluation
 */

export interface EvaluationResult {
    id: string;
    evaluationId: string;
    studentId: string;
    competenceId: string;

    // For 'niveaux' notation system
    niveau?: Niveau;

    // For 'points' notation system
    score?: number;

    commentaire?: string;
    createdAt: string;
    updatedAt?: string;
}

export type Niveau = 'non-atteint' | 'partiellement-atteint' | 'atteint' | 'depasse';

export const NIVEAU_LABELS: Record<Niveau, string> = {
    'non-atteint': 'Non atteint',
    'partiellement-atteint': 'Partiellement atteint',
    'atteint': 'Atteint',
    'depasse': 'Dépassé',
};

export const NIVEAU_COLORS: Record<Niveau, string> = {
    'non-atteint': '#F44336', // Red
    'partiellement-atteint': '#FF9800', // Orange
    'atteint': '#4CAF50', // Green
    'depasse': '#2196F3', // Blue
};

export const NIVEAU_ICONS: Record<Niveau, string> = {
    'non-atteint': 'close-circle',
    'partiellement-atteint': 'alert-circle',
    'atteint': 'check-circle',
    'depasse': 'star-circle',
};
