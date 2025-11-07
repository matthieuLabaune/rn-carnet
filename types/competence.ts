/**
 * Competence type definition
 * Represents a skill or competence that can be evaluated
 */

export interface Competence {
  id: string;
  nom: string;
  description?: string;
  domaine: string; // "Mathématiques", "Français", "Histoire-Géographie", etc.
  couleur: string; // Hex color for visual identification
  isPredefined: boolean; // true = from library, false = custom
  createdAt: string; // ISO date string
  updatedAt?: string;
}

export type CompetenceDomaine =
  | 'Mathématiques'
  | 'Français'
  | 'Histoire-Géographie'
  | 'Sciences'
  | 'Langues'
  | 'Arts'
  | 'EPS'
  | 'Transversales'
  | 'Autre';
