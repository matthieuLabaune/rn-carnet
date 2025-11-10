/**
 * Séquence pédagogique - Groupe thématique de séances
 */
export interface Sequence {
    id: string;
    classId: string;
    name: string; // Ex: "La Révolution française"
    description?: string;
    color: string; // Couleur pour identification visuelle
    order: number; // Ordre dans le programme (1, 2, 3...)
    sessionCount: number; // Nombre de séances prévues (ex: 3, 5...)
    theme?: string; // Ex: "Histoire moderne"
    objectives?: string[]; // Objectifs pédagogiques
    resources?: string[]; // Ressources/documents
    status: 'planned' | 'in-progress' | 'completed';
    createdAt: string;
    updatedAt?: string;
}

/**
 * Données pour créer/modifier une séquence
 */
export interface SequenceFormData {
    classId: string;
    name: string;
    description?: string;
    color: string;
    sessionCount: number;
    theme?: string;
    objectives?: string[];
    resources?: string[];
}

/**
 * Lien entre séquence et séance
 */
export interface SessionSequence {
    sessionId: string;
    sequenceId: string;
    orderInSequence: number; // Position dans la séquence (1ère, 2ème, 3ème séance)
}

/**
 * Programme pédagogique (optionnel - pour import ministère)
 */
export interface CurriculumProgram {
    id: string;
    level: string; // Ex: "2nde", "6ème"
    subject: string; // Ex: "Histoire-Géographie"
    year: string; // Ex: "2024-2025"
    themes: CurriculumTheme[];
    source?: 'ministry' | 'custom' | 'imported';
}

export interface CurriculumTheme {
    id: string;
    name: string; // Ex: "Thème 1 : Le monde méditerranéen"
    description?: string;
    suggestedSessionCount?: number;
    subthemes?: string[];
}
