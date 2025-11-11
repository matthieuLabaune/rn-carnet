# Gestion Multi-Années et Multi-Établissements

## 📋 Contexte

Actuellement, l'application ne gère qu'une seule année scolaire et un seul établissement. Il est nécessaire d'implémenter :
1. La gestion de plusieurs années scolaires avec historique
2. La possibilité de dupliquer/faire passer les classes d'une année à l'autre
3. La gestion de plusieurs établissements

## 🎯 Objectifs

### Gestion des Années Scolaires

**Problématique** : Comment gérer le passage d'année tout en conservant l'historique ?
- Exemple : 4ème Musique → 3ème Musique l'année suivante

**Solution proposée** :
- Ajouter un champ `schoolYear` (ex: "2024-2025") à toutes les entités principales
- Permettre la duplication/migration des classes vers la nouvelle année
- Conserver l'historique complet de toutes les années

### Gestion des Établissements

**Problématique** : Un enseignant peut travailler dans plusieurs établissements
**Solution proposée** : Ajouter une gestion multi-établissements dans les paramètres

## 🗄️ Modifications de la Base de Données

### Nouvelle Table : `establishments`
```sql
CREATE TABLE establishments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postalCode TEXT,
    phone TEXT,
    email TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
```

### Nouvelle Table : `school_years`
```sql
CREATE TABLE school_years (
    id TEXT PRIMARY KEY,
    year TEXT NOT NULL UNIQUE, -- Ex: "2024-2025"
    startDate TEXT NOT NULL,   -- Ex: "2024-09-01"
    endDate TEXT NOT NULL,     -- Ex: "2025-07-05"
    isCurrent INTEGER DEFAULT 0, -- 0 ou 1 (boolean)
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
```

### Modifications des Tables Existantes

#### `classes`
```sql
ALTER TABLE classes ADD COLUMN schoolYear TEXT NOT NULL DEFAULT '2024-2025';
ALTER TABLE classes ADD COLUMN establishmentId TEXT;
ALTER TABLE classes ADD COLUMN previousYearClassId TEXT; -- Lien vers la classe de l'année précédente
```

#### `students`
```sql
ALTER TABLE students ADD COLUMN currentClassId TEXT; -- La classe actuelle
-- Garder classId pour l'historique
```

#### Nouvelles tables de liaison pour l'historique
```sql
-- Historique des élèves par année scolaire
CREATE TABLE student_class_history (
    id TEXT PRIMARY KEY,
    studentId TEXT NOT NULL,
    classId TEXT NOT NULL,
    schoolYear TEXT NOT NULL,
    enrollmentDate TEXT,
    FOREIGN KEY (studentId) REFERENCES students(id),
    FOREIGN KEY (classId) REFERENCES classes(id)
);

-- Séquences, sessions, etc. déjà liées à une classe qui a un schoolYear
-- Donc pas besoin de modifier
```

## 🔄 Fonctionnalités à Implémenter

### 1. Sélecteur d'Année Scolaire (Priorité Haute)

**Emplacement** : Header de l'application ou dans les Paramètres

**Fonctionnalités** :
- Voir toutes les années scolaires créées
- Basculer entre les années (change le contexte global)
- Créer une nouvelle année scolaire
- Définir l'année courante

**UI Proposée** :
```
┌─────────────────────────────────┐
│ 📅 Année Scolaire : 2024-2025  ▼│
├─────────────────────────────────┤
│ • 2024-2025 (Actuelle)          │
│   2023-2024                     │
│   2022-2023                     │
│ + Créer nouvelle année          │
└─────────────────────────────────┘
```

### 2. Migration/Duplication de Classes (Priorité Haute)

**Scénario** : Fin d'année scolaire, passage en année supérieure

**Workflow Proposé** :
1. Dans Paramètres → "Préparer nouvelle année scolaire"
2. Assistant de migration :
   ```
   Étape 1 : Créer année 2025-2026
   Étape 2 : Sélectionner classes à faire passer
   Étape 3 : Définir nouveaux niveaux
   Étape 4 : Choisir élèves à faire passer
   Étape 5 : Confirmer migration
   ```

**Options de migration** :
- [ ] Dupliquer les séquences pédagogiques (sans les séances)
- [ ] Dupliquer les compétences
- [ ] Faire passer les élèves automatiquement
- [ ] Conserver l'emploi du temps (structure)

**Exemple de migration** :
```
4ème Musique (2024-2025)
    ↓ migration
3ème Musique (2025-2026)
    - Même professeur
    - Même matière
    - Élèves passés (option)
    - Séquences dupliquées (option)
```

### 3. Gestion des Établissements (Priorité Moyenne)

**Emplacement** : Paramètres → Établissements

**Fonctionnalités** :
- Ajouter/Modifier/Supprimer établissements
- Assigner des classes à un établissement
- Filtrer par établissement dans la vue Classes
- Statistiques par établissement

**UI Proposée** :
```
┌─────────────────────────────────┐
│ 🏫 Mes Établissements           │
├─────────────────────────────────┤
│ • Collège Victor Hugo           │
│   4 classes                     │
│                                 │
│ • Lycée Pasteur                 │
│   2 classes                     │
│                                 │
│ + Ajouter établissement         │
└─────────────────────────────────┘
```

### 4. Archivage (Priorité Basse)

**Objectif** : Archiver les années scolaires anciennes

**Fonctionnalités** :
- Marquer une année comme "archivée"
- Les années archivées n'apparaissent que dans "Historique"
- Possibilité de consulter mais pas de modifier
- Export des données archivées (PDF, CSV)

## 📊 Contexte Global de l'Application

### Nouveau Context : `SchoolYearContext`
```typescript
interface SchoolYearContextType {
    currentYear: string; // "2024-2025"
    currentEstablishment: string | null;
    setCurrentYear: (year: string) => void;
    setCurrentEstablishment: (id: string | null) => void;
    schoolYears: SchoolYear[];
    establishments: Establishment[];
}
```

### Utilisation dans les Services
```typescript
// Tous les services filtrent automatiquement par année scolaire courante
classService.getAll() // → classes de l'année courante uniquement
classService.getAllForYear(year) // → classes d'une année spécifique
```

## 🚀 Plan de Mise en Œuvre

### Phase 1 : Infrastructure (1-2 jours)
- [ ] Créer les nouvelles tables (establishments, school_years)
- [ ] Modifier les tables existantes (schoolYear, establishmentId)
- [ ] Créer les types TypeScript
- [ ] Créer SchoolYearContext et EstablishmentContext

### Phase 2 : Année Scolaire (2-3 jours)
- [ ] Service de gestion des années scolaires
- [ ] Sélecteur d'année dans l'interface
- [ ] Filtrage automatique par année dans tous les écrans
- [ ] Migration de base (calculer année courante pour données existantes)

### Phase 3 : Migration de Classes (3-4 jours)
- [ ] Assistant de création nouvelle année
- [ ] Interface de sélection classes à migrer
- [ ] Logique de duplication avec options
- [ ] Gestion du lien previousYearClassId
- [ ] Tests complets du processus

### Phase 4 : Établissements (2-3 jours)
- [ ] CRUD établissements dans Paramètres
- [ ] Association classes ↔ établissements
- [ ] Filtres par établissement
- [ ] Statistiques par établissement

### Phase 5 : Historique & Archive (2-3 jours)
- [ ] Vue historique des années passées
- [ ] Système d'archivage
- [ ] Export de données
- [ ] Rapports annuels

## 💡 Questions & Décisions à Prendre

1. **Que faire des élèves qui redoublent ?**
   - Option A : Rester dans la même classe (nouveau schoolYear)
   - Option B : Créer une nouvelle instance de la classe
   - **Recommandation** : Option A avec gestion manuelle

2. **Élèves quittant l'établissement ?**
   - Marquer comme "parti" avec date de départ
   - Conserver dans l'historique
   - Ne pas inclure dans migration

3. **Import de données d'autres outils ?**
   - Format CSV pour import massif
   - Template Excel pour faciliter

4. **Stockage cloud pour sauvegarde multi-appareils ?**
   - SQLite local pour performance
   - Export/Import manuel ou sync cloud (phase future)

## 🎯 Fonctionnalités Complémentaires

### Statut de Complétion des Séances et Séquences

**Problématique** : Besoin de marquer les séances et séquences comme terminées pour suivre la progression

**Modifications Base de Données** :
```sql
-- Ajout de statuts pour les séances
ALTER TABLE sessions ADD COLUMN status TEXT DEFAULT 'planned'; 
-- Valeurs: 'planned', 'in-progress', 'completed', 'cancelled'
ALTER TABLE sessions ADD COLUMN completedAt TEXT;

-- Ajout de statuts pour les séquences
ALTER TABLE sequences ADD COLUMN status TEXT DEFAULT 'planned';
-- Valeurs: 'planned', 'in-progress', 'completed'
ALTER TABLE sequences ADD COLUMN completedAt TEXT;
ALTER TABLE sequences ADD COLUMN progressPercentage INTEGER DEFAULT 0;
```

**Fonctionnalités** :
- Marquer une séance comme terminée (avec date)
- Calcul automatique de la progression de séquence (% séances terminées)
- Marquer manuellement une séquence comme terminée
- Filtres par statut dans les listes
- Visualisation de la progression

**UI Proposée** :
```
Séance détail :
┌─────────────────────────────────┐
│ ✓ Marquer comme terminée        │
│ ⏸ Marquer comme annulée         │
└─────────────────────────────────┘

Séquence détail :
┌─────────────────────────────────┐
│ Progression : ███████░░░ 70%    │
│ 7/10 séances terminées          │
│ ✓ Marquer séquence comme        │
│   terminée                      │
└─────────────────────────────────┘
```

### Association Évaluations ↔ Séquences

**Problématique** : Les évaluations doivent pouvoir être liées à :
- Une séance spécifique (existant)
- Une séquence entière
- Une séance + une séquence (ex: "Séance 7, Séquence 2, Partie 1")

**Modifications Base de Données** :
```sql
-- Ajouter le lien vers séquence dans evaluations
ALTER TABLE evaluations ADD COLUMN sequenceId TEXT;
ALTER TABLE evaluations ADD COLUMN sequencePart TEXT; -- "Partie 1", "Partie 2", etc.

-- Créer index pour performance
CREATE INDEX idx_evaluations_sequence ON evaluations(sequenceId);

-- Contrainte : au moins sessionId OU sequenceId doit être renseigné
-- (à gérer au niveau application)
```

**Modèle de données** :
```typescript
interface Evaluation {
    id: string;
    name: string;
    classId: string;
    sessionId?: string;      // Optionnel
    sequenceId?: string;     // Optionnel  
    sequencePart?: string;   // "Partie 1", "Partie 2", etc.
    date: string;
    type: 'formative' | 'summative' | 'diagnostic';
    // ... autres champs
}
```

**Cas d'usage** :
1. **Évaluation de séance** : `sessionId` uniquement
   - Exemple : Contrôle en classe sur la leçon du jour
   
2. **Évaluation de séquence** : `sequenceId` uniquement
   - Exemple : Examen final sur toute la séquence "Le conte merveilleux"
   
3. **Évaluation mixte** : `sessionId` + `sequenceId` + `sequencePart`
   - Exemple : "Séance 7, Séquence 2 - Les atomes et molécules, Partie 1"

**UI Proposée - Formulaire d'évaluation** :
```
┌─────────────────────────────────┐
│ 📝 Nouvelle Évaluation          │
├─────────────────────────────────┤
│ Nom : [________________]        │
│                                 │
│ ○ Évaluation de séance          │
│   Séance : [Sélectionner ▼]    │
│                                 │
│ ● Évaluation de séquence        │
│   Séquence : [Les atomes... ▼] │
│   Partie : [Partie 1 ▼]        │
│                                 │
│ ○ Évaluation mixte              │
│   Séquence : [Sélectionner ▼]  │
│   Séance : [Séance 7 ▼]        │
│   Partie : [Partie 1 ▼]        │
└─────────────────────────────────┘
```

**Affichage dans SequenceDetailScreen** :
```
┌─────────────────────────────────┐
│ 📊 Évaluations (3)              │
├─────────────────────────────────┤
│ • Examen final                  │
│   Toute la séquence             │
│   12/11/2025                    │
│                                 │
│ • Contrôle Partie 1             │
│   Séance 7 - Partie 1           │
│   05/11/2025                    │
└─────────────────────────────────┘
```

**Services à modifier** :
```typescript
// evaluationService.ts
async getBySequence(sequenceId: string): Promise<Evaluation[]>
async getBySessionAndSequence(sessionId: string, sequenceId: string): Promise<Evaluation[]>
async create(data: {
    sessionId?: string;
    sequenceId?: string;
    sequencePart?: string;
    // ...
}): Promise<Evaluation>
```

**Validation** :
- Au moins `sessionId` OU `sequenceId` doit être fourni
- Si `sequencePart` est fourni, `sequenceId` est obligatoire
- Si les deux sont fournis, vérifier que la session appartient bien à la séquence


## 📝 Notes Techniques

### Migration des Données Existantes
```sql
-- Script de migration pour ajouter l'année scolaire actuelle
UPDATE classes SET schoolYear = '2024-2025' WHERE schoolYear IS NULL;
UPDATE sessions SET schoolYear = (SELECT schoolYear FROM classes WHERE classes.id = sessions.classId);
```

### Performance
- Indexer schoolYear pour requêtes rapides
- Pagination pour années avec beaucoup de données
- Cache des années/établissements en mémoire

### Sécurité
- Validation stricte lors des migrations
- Confirmation avant suppression/archivage
- Backup automatique avant opérations critiques

---

**Auteur** : Assistant IA  
**Date** : 11 novembre 2025  
**Statut** : 📋 Spécifications - À valider
