/**
 * Evaluation type definition
 * Represents an assessment that evaluates students on multiple competences
 */

export interface Evaluation {
  id: string;
  classId: string;
  sessionId?: string; // Optional: if linked to a specific session
  titre: string;
  date: string; // ISO date string
  type: EvaluationType;
  notationSystem: NotationSystem;
  maxPoints?: number; // Required if notationSystem is 'points'
  competenceIds: string[];
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export type EvaluationType = 'formative' | 'sommative' | 'diagnostique';

export type NotationSystem = 'niveaux' | 'points';

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  formative: 'Formative',
  sommative: 'Sommative',
  diagnostique: 'Diagnostique',
};

export const NOTATION_SYSTEM_LABELS: Record<NotationSystem, string> = {
  niveaux: 'Par niveaux',
  points: 'Par points',
};
