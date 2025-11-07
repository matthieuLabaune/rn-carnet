/**
 * Predefined competences library
 * Organized by domain with descriptions
 */

import { CompetenceDomaine } from '../types/competence';

interface PredefinedCompetenceTemplate {
  nom: string;
  description: string;
  couleur: string;
}

export const PREDEFINED_COMPETENCES: Record<
  CompetenceDomaine,
  PredefinedCompetenceTemplate[]
> = {
  Mathématiques: [
    {
      nom: 'Calcul mental',
      description: 'Maîtrise du calcul sans support écrit',
      couleur: '#2196F3',
    },
    {
      nom: 'Résolution de problèmes',
      description: 'Analyse et résolution de problèmes complexes',
      couleur: '#1976D2',
    },
    {
      nom: 'Géométrie',
      description: 'Figures géométriques et mesures',
      couleur: '#1565C0',
    },
    {
      nom: 'Fractions et décimaux',
      description: 'Manipulation des nombres à virgule',
      couleur: '#0D47A1',
    },
    {
      nom: 'Algèbre',
      description: 'Équations et expressions algébriques',
      couleur: '#42A5F5',
    },
    {
      nom: 'Proportionnalité',
      description: 'Situations de proportionnalité',
      couleur: '#64B5F6',
    },
  ],

  Français: [
    {
      nom: 'Orthographe',
      description: 'Respect des règles orthographiques',
      couleur: '#E91E63',
    },
    {
      nom: 'Grammaire',
      description: 'Analyse grammaticale et syntaxe',
      couleur: '#C2185B',
    },
    {
      nom: 'Conjugaison',
      description: 'Maîtrise des temps et modes',
      couleur: '#AD1457',
    },
    {
      nom: 'Compréhension écrite',
      description: 'Comprendre et analyser un texte',
      couleur: '#880E4F',
    },
    {
      nom: 'Expression écrite',
      description: 'Rédaction et argumentation',
      couleur: '#F06292',
    },
    {
      nom: 'Vocabulaire',
      description: 'Richesse et précision du lexique',
      couleur: '#F48FB1',
    },
    {
      nom: 'Lecture à voix haute',
      description: 'Fluidité et expressivité',
      couleur: '#F8BBD0',
    },
  ],

  'Histoire-Géographie': [
    {
      nom: 'Connaissances historiques',
      description: 'Savoirs et repères chronologiques',
      couleur: '#FF9800',
    },
    {
      nom: 'Connaissances géographiques',
      description: 'Savoirs et repères spatiaux',
      couleur: '#F57C00',
    },
    {
      nom: 'Analyse de documents',
      description: 'Étude critique de sources',
      couleur: '#EF6C00',
    },
    {
      nom: 'Raisonnement',
      description: 'Argumentation et esprit critique',
      couleur: '#E65100',
    },
    {
      nom: 'Cartographie',
      description: 'Lecture et création de cartes',
      couleur: '#FFB74D',
    },
    {
      nom: 'Chronologie',
      description: 'Repérage dans le temps',
      couleur: '#FFCC80',
    },
  ],

  Sciences: [
    {
      nom: 'Démarche scientifique',
      description: 'Expérimentation et observation',
      couleur: '#4CAF50',
    },
    {
      nom: 'Connaissances scientifiques',
      description: 'Savoirs du domaine',
      couleur: '#388E3C',
    },
    {
      nom: 'Raisonnement scientifique',
      description: 'Analyse et conclusion',
      couleur: '#2E7D32',
    },
    {
      nom: 'Modélisation',
      description: 'Représentation de phénomènes',
      couleur: '#1B5E20',
    },
    {
      nom: 'Communication scientifique',
      description: 'Présentation des résultats',
      couleur: '#66BB6A',
    },
  ],

  Langues: [
    {
      nom: 'Compréhension orale',
      description: 'Écouter et comprendre',
      couleur: '#9C27B0',
    },
    {
      nom: 'Expression orale en continu',
      description: 'Parler sans interruption',
      couleur: '#7B1FA2',
    },
    {
      nom: 'Expression orale en interaction',
      description: 'Dialoguer et échanger',
      couleur: '#6A1B9A',
    },
    {
      nom: 'Compréhension écrite',
      description: 'Lire et comprendre',
      couleur: '#4A148C',
    },
    {
      nom: 'Expression écrite',
      description: 'Écrire et rédiger',
      couleur: '#BA68C8',
    },
    {
      nom: 'Prononciation',
      description: 'Qualité phonétique',
      couleur: '#CE93D8',
    },
  ],

  Arts: [
    {
      nom: 'Créativité',
      description: 'Innovation et imagination',
      couleur: '#00BCD4',
    },
    {
      nom: 'Techniques artistiques',
      description: 'Maîtrise des outils et méthodes',
      couleur: '#0097A7',
    },
    {
      nom: 'Culture artistique',
      description: 'Connaissances historiques et culturelles',
      couleur: '#00838F',
    },
    {
      nom: 'Expression personnelle',
      description: 'Développement d\'un style propre',
      couleur: '#006064',
    },
  ],

  EPS: [
    {
      nom: 'Performance motrice',
      description: 'Aptitudes physiques et techniques',
      couleur: '#FF5722',
    },
    {
      nom: 'Esprit d\'équipe',
      description: 'Coopération et entraide',
      couleur: '#E64A19',
    },
    {
      nom: 'Fair-play',
      description: 'Respect des règles et adversaires',
      couleur: '#D84315',
    },
    {
      nom: 'Progression',
      description: 'Évolution des compétences',
      couleur: '#BF360C',
    },
  ],

  Transversales: [
    {
      nom: 'Autonomie',
      description: 'Travail en autonomie',
      couleur: '#607D8B',
    },
    {
      nom: 'Coopération',
      description: 'Travail en groupe et entraide',
      couleur: '#546E7A',
    },
    {
      nom: 'Créativité',
      description: 'Innovation et imagination',
      couleur: '#455A64',
    },
    {
      nom: 'Organisation',
      description: 'Gestion du travail et du temps',
      couleur: '#37474F',
    },
    {
      nom: 'Esprit critique',
      description: 'Analyse et remise en question',
      couleur: '#78909C',
    },
    {
      nom: 'Communication',
      description: 'Expression orale et écrite',
      couleur: '#90A4AE',
    },
    {
      nom: 'Mémorisation',
      description: 'Capacité à retenir et restituer',
      couleur: '#B0BEC5',
    },
  ],

  Autre: [
    {
      nom: 'Compétence personnalisée',
      description: 'À adapter selon vos besoins',
      couleur: '#9E9E9E',
    },
  ],
};

/**
 * Get all predefined competences as a flat array
 */
export function getAllPredefinedCompetences(): Array<
  PredefinedCompetenceTemplate & { domaine: CompetenceDomaine }
> {
  const result: Array<
    PredefinedCompetenceTemplate & { domaine: CompetenceDomaine }
  > = [];

  Object.entries(PREDEFINED_COMPETENCES).forEach(([domaine, competences]) => {
    competences.forEach((comp) => {
      result.push({
        ...comp,
        domaine: domaine as CompetenceDomaine,
      });
    });
  });

  return result;
}

/**
 * Get competences for a specific domain
 */
export function getCompetencesByDomain(
  domaine: CompetenceDomaine
): PredefinedCompetenceTemplate[] {
  return PREDEFINED_COMPETENCES[domaine] || [];
}
