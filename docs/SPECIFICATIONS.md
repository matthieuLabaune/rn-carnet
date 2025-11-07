# 📱 RN-Carnet - Spécifications Techniques

## 🎯 Vision du Projet

**RN-Carnet** est un assistant pédagogique personnel pour enseignants qui transforme la gestion quotidienne des cours en une expérience simple, fluide et accessible.

### Positionnement
- 👨‍🏫 Outil du prof, simple et personnel
- 🧩 App de planification et de suivi pédagogique
- 🕒 Outil de gestion du temps et des séances
- 📱 Outil de communication prof ↔ élèves

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Framework & Runtime
- **React Native** avec **Expo** (SDK 51+)
- **TypeScript** pour la sécurité du typage
- **Expo Router** pour la navigation file-based

#### UI/UX
- **React Native Paper** - Material Design 3
- **react-native-safe-area-context** - Gestion des zones sécurisées
- Support du thème clair/sombre
- Personnalisation des couleurs
- **100% accessible (a11y friendly)**

#### Stockage de Données
- **expo-sqlite** - Base de données locale SQLite
- **AsyncStorage** - Préférences utilisateur
- Architecture prête pour **Supabase** (future sync cloud)

#### Fonctionnalités Natives
- `expo-barcode-scanner` - Scan QR codes (présences)
- `expo-notifications` - Rappels de séances
- `expo-calendar` - Intégration calendrier (optionnel)

---

## 📊 Modèle de Données

### Entités Principales

#### **Classe**
```typescript
interface Classe {
  id: string;
  nom: string;
  niveau: string;
  annee_scolaire: string;
  couleur: string;
  nb_eleves: number;
  created_at: Date;
  updated_at: Date;
}
```

#### **Élève**
```typescript
interface Eleve {
  id: string;
  classe_id: string;
  prenom: string;
  nom: string;
  qr_code?: string;
  notes_personnelles?: string;
  created_at: Date;
}
```

#### **Séance**
```typescript
interface Seance {
  id: string;
  classe_id: string;
  date: Date;
  sujet: string;
  description?: string;
  duree_totale: number; // en minutes
  timer_preset_id?: string;
  statut: 'planifiee' | 'en_cours' | 'terminee';
  ressources?: string[]; // URLs ou chemins fichiers
  created_at: Date;
  updated_at: Date;
}
```

#### **ActiviteSeance**
```typescript
interface ActiviteSeance {
  id: string;
  seance_id: string;
  type: 'introduction' | 'exercice' | 'explication' | 'recherche' | 'synthese' | 'evaluation';
  duree: number; // en minutes
  ordre: number;
  couleur: string;
  termine: boolean;
}
```

#### **Presence**
```typescript
interface Presence {
  id: string;
  seance_id: string;
  eleve_id: string;
  present: boolean;
  late: boolean;
  retard_minutes?: number;
  notes?: string;
  created_at: Date;
}
```

**Relations :**
- Une présence appartient à **une** séance
- Une présence appartient à **un** élève
- Contrainte d'unicité : (seance_id, eleve_id)

**Statistiques calculées :**
```typescript
interface AttendanceStats {
  totalSessions: number;       // Nombre total de séances
  presentCount: number;         // Nombre de présences
  absentCount: number;          // Nombre d'absences
  lateCount: number;            // Nombre de retards
  attendanceRate: number;       // Taux de présence (%)
}
```

#### **TimerPreset**
```typescript
interface TimerPreset {
  id: string;
  nom: string;
  description?: string;
  duree_totale: number;
  activites: {
    type: string;
    duree: number;
    couleur: string;
  }[];
  is_default: boolean;
  created_at: Date;
}
```

#### **EmploiDuTemps**
```typescript
interface CreneauEDT {
  id: string;
  classe_id: string;
  jour_semaine: 1 | 2 | 3 | 4 | 5 | 6 | 7; // Lundi = 1
  heure_debut: string; // "08:00"
  heure_fin: string; // "09:00"
  salle?: string;
  recurrent: boolean;
  created_at: Date;
}
```

#### **Devoir**
```typescript
interface Devoir {
  id: string;
  classe_id: string;
  titre: string;
  description: string;
  date_donnee: Date;
  date_rendu: Date;
  qr_code?: string;
  type: 'dm' | 'autoevaluation' | 'fiche_revision';
  created_at: Date;
}
```

#### **AutoEvaluation**
```typescript
interface AutoEvaluation {
  id: string;
  eleve_id: string;
  seance_id: string;
  comprehension: 1 | 2 | 3 | 4 | 5;
  participation: 1 | 2 | 3 | 4 | 5;
  motivation: 1 | 2 | 3 | 4 | 5;
  commentaire?: string;
  created_at: Date;
}
```

---

## 🎨 Design System

### Palette de Couleurs (Personnalisable)

#### Thème par Défaut
```typescript
const defaultTheme = {
  primary: '#6750A4',      // Violet Material You
  secondary: '#625B71',
  tertiary: '#7D5260',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#B3261E',
  background: '#FFFBFE',
  surface: '#FFFBFE',
  onPrimary: '#FFFFFF',
  onBackground: '#1C1B1F',
};
```

#### Couleurs par Type d'Activité
```typescript
const activiteColors = {
  introduction: '#2196F3',   // Bleu
  exercice: '#FF9800',       // Orange
  explication: '#9C27B0',    // Violet
  recherche: '#4CAF50',      // Vert
  synthese: '#F44336',       // Rouge
  evaluation: '#FF5722',     // Rouge-orange
};
```

### Composants Accessibles

Tous les composants respectent :
- Contraste WCAG AA minimum (4.5:1)
- Support du Screen Reader
- Navigation au clavier
- Labels accessibles
- Tailles de touch targets ≥ 44x44 pts

---

## 🚀 Fonctionnalités MVP (2h)

### Phase 1 : Core Features

#### ✅ 1. Gestion des Classes
- Créer une classe (nom, niveau, couleur)
- Lister les classes avec nb d'élèves
- Éditer/Supprimer une classe

#### ✅ 2. Gestion des Élèves
- Ajouter des élèves à une classe
- Liste des élèves par classe
- Éditer/Supprimer un élève

#### ✅ 3. Création de Séances
- Nouvelle séance avec sujet
- Sélection de la classe
- Date et heure

#### ✅ 4. Timer Pédagogique (50 min)
- Preset par défaut :
  - ⏱️ 10 min → Exercice
  - ⏱️ 15 min → Explications
  - ⏱️ 10 min → Recherche
  - ⏱️ 15 min → Synthèse
- Barre de progression colorée
- Notification entre étapes
- Pause/Reprise

#### ✅ 5. Historique des Séances
- Liste chronologique
- Filtrage par classe
- Détail d'une séance passée

---

## 🎯 Roadmap Post-MVP

### Phase 2 : Enrichissement (Semaine 1)

#### 📅 Emploi du Temps
- Vue hebdomadaire
- Glisser-déposer de séances
- Synchronisation iCal/Google Calendar

#### 🎨 Timers Personnalisables
- Créer ses propres presets
- Partage de presets (QR code)
- Bibliothèque de templates

#### 📱 Scan QR Code Présences
- Génération QR par élève
- Scan rapide en début de cours
- Historique de présence

### Phase 3 : Pédagogie Avancée (Semaine 2)

#### 📚 Fiches de Révision Auto
- Génération à partir des séances
- Export PDF
- QR code vers mini-quiz

#### 📊 Autoévaluation Élèves
- Interface simple (1-5 étoiles)
- Graphiques d'évolution
- Export bilan trimestre

#### 📝 Gestion des Devoirs
- Créer DM/Fiches
- QR code de rendu
- Suivi par élève

### Phase 4 : Intelligence & Sync (Semaine 3+)

#### 🤖 Assistant IA (Optionnel)
- Génération de fiches de révision
- Suggestions d'activités
- Analyse des progressions

#### ☁️ Synchronisation Cloud
- Backup Supabase
- Multi-devices
- Import CSV Pronote

#### 📈 Statistiques Avancées
- Temps par type d'activité
- Participation élèves
- Évolution des classes

---

## 🔒 Sécurité & Confidentialité

### Données Locales
- Stockage 100% local par défaut
- Chiffrement SQLite (optionnel)
- Aucune donnée envoyée sans consentement

### RGPD
- Données minimales (pas d'emails élèves requis)
- Export de toutes les données
- Suppression complète possible
- Consentement explicite pour QR codes

---

## ♿ Accessibilité (a11y)

### Standards Respectés
- **WCAG 2.1 Level AA**
- Support VoiceOver (iOS) et TalkBack (Android)
- Navigation au clavier complète
- Textes redimensionnables

### Implémentations Clés
```typescript
// Exemple de composant accessible
<Button
  accessibilityLabel="Créer une nouvelle classe"
  accessibilityHint="Ouvre un formulaire pour ajouter une classe"
  accessibilityRole="button"
>
  Nouvelle Classe
</Button>
```

### Tests d'Accessibilité
- Linter `eslint-plugin-jsx-a11y`
- Tests manuels avec Screen Reader
- Audit de contraste automatique

---

## 📱 Plateformes Supportées

### Priorité 1 (MVP)
- ✅ iOS (iPhone et iPad)
- ✅ Android (phones et tablettes)

### Priorité 2 (Post-MVP)
- 🔲 Web (Expo Web)

---

## 🧪 Tests & Qualité

### Stratégie de Tests
- **Unit Tests** : Jest + React Native Testing Library
- **E2E Tests** : Detox (iOS/Android)
- **Accessibility Tests** : Audit automatique

### Outils de Qualité
- **TypeScript** strict mode
- **ESLint** + Prettier
- **Husky** pre-commit hooks

---

## 📦 Déploiement

### Distribution
- **iOS** : TestFlight puis App Store
- **Android** : Google Play Store (Internal Testing)
- **OTA Updates** : Expo Updates

---

## 🎓 Documentation Utilisateur

### Formats
- README.md (Getting Started)
- Tutoriel in-app (première utilisation)
- FAQ intégrée
- Vidéos courtes (< 1 min)

---

## 📈 Métriques de Succès

### Indicateurs Clés
- Temps de création d'une séance < 30s
- Taux d'utilisation du timer > 70%
- NPS (Net Promoter Score) > 8/10
- Accessibilité 100% Score Lighthouse

---

## 🛠️ Configuration Développement

### Variables d'Environnement
```env
# .env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Scripts NPM
```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest",
  "lint": "eslint .",
  "type-check": "tsc --noEmit"
}
```

---

## 📅 Planning de Développement

### Sprint 1 - MVP (2h)
- [x] Setup projet
- [ ] DB Schema + SQLite
- [ ] Écran Accueil (liste classes)
- [ ] Gestion Classes/Élèves
- [ ] Création Séances
- [ ] Timer 50 min
- [ ] Historique

### Sprint 2 - Polish (1 semaine)
- [x] Emploi du temps
- [x] QR Code présences
- [x] Timers personnalisables
- [x] Thème dark mode
- [ ] Tests unitaires

### Sprint 3 - Advanced (2 semaines)
- [x] Système d'évaluations
- [x] Compétences prédéfinies et personnalisées
- [x] Grille de notation (points et niveaux)
- [x] Édition inline des notes
- [ ] **Notation par exercice** (alternative à la notation par compétence)
- [ ] Autoévaluation
- [ ] Fiches révision
- [ ] Stats & graphiques
- [ ] Sync Supabase
- [ ] App Store Release

---

## 🎯 Fonctionnalités Évaluations (Phase F - Complétée)

### Système de Notation

#### Notation par Compétence (Actuel)
- Évaluer chaque élève sur plusieurs compétences
- 2 systèmes : niveaux (NA, PA, A, D) ou points (sur X)
- Grille élèves × compétences
- Colonne Total avec somme automatique
- Édition inline pour système par points
- Dialog pour système par niveaux

#### Notation par Exercice (À implémenter)
**Besoin** : Permettre de noter par exercice plutôt que par compétence

**Cas d'usage** :
- Contrôle avec 5 exercices notés sur 4, 6, 5, 10, 15 points
- Chaque exercice peut évaluer une ou plusieurs compétences
- Total = somme des exercices
- Conversion automatique compétences depuis les notes d'exercices

**Structure proposée** :
```typescript
interface Exercise {
  id: string;
  numero: number; // Ex: 1, 2, 3...
  titre?: string; // Ex: "Théorème de Pythagore"
  maxPoints: number; // Ex: 4
  competenceIds: string[]; // Compétences évaluées
}

interface EvaluationExercise extends Evaluation {
  evaluationType: 'competences' | 'exercices';
  exercises?: Exercise[]; // Si evaluationType = 'exercices'
}

interface ExerciseResult {
  id: string;
  evaluationId: string;
  studentId: string;
  exerciseId: string;
  score: number;
  commentaire?: string;
}
```

**Affichage** :
- Grille élèves × exercices (au lieu de × compétences)
- Colonne Total = somme des exercices
- Max Total = somme des maxPoints de tous les exercices
- Vue synthèse par compétence (calculée depuis les exercices)

**Avantages** :
- Plus proche du mode de notation traditionnel
- Permet des exercices de poids différents
- Calcul automatique des compétences
- Flexibilité pour corrections partielles

---

**Version:** 1.0.0-MVP
**Dernière mise à jour:** 2025-11-07
**Auteur:** Matt
