# 🚀 TODO URGENT - Prochaines Fonctionnalités

**Date** : 10 novembre 2025

---

## 🎯 Fonctionnalités Prioritaires

### 1. ⏱️ Timer Pédagogique (PRIORITÉ #1)
**Temps estimé** : 2-3h  
**Valeur** : ⭐⭐⭐⭐⭐ (Fonctionnalité signature de l'app)

#### Ce qui existe déjà :
- ✅ Types `TimerPreset` et `TimerStep` définis
- ✅ Champ `timerPreset` dans les sessions
- ✅ Structure de données prête

#### À créer :

**1.1 SessionTimerScreen**
- Grand affichage du temps restant (format MM:SS)
- Barre de progression colorée par étape
- Affichage de l'étape courante (label + couleur)
- Indicateur visuel : quelle étape / combien total
- Boutons de contrôle :
  - ▶️ Play/Pause (même bouton toggle)
  - ⏹️ Stop (avec confirmation)
  - ⏭️ Passer à l'étape suivante (optionnel)
- Vibration/son aux transitions d'étapes
- Mode plein écran (pas de header)
- Keep screen awake pendant l'utilisation

**1.2 TimerPresetsDialog**
- Liste des presets disponibles
- Preset par défaut : "50 min" (10-15-10-15)
  - Exercice : 10 min (bleu)
  - Correction : 15 min (vert)
  - Exercice 2 : 10 min (bleu)
  - Correction 2 : 15 min (vert)
- Bouton "Créer un nouveau preset"
- Édition des presets existants
- Suppression avec confirmation

**1.3 TimerPresetFormDialog**
- Nom du preset
- Liste des étapes configurables :
  - Label de l'étape
  - Durée (en minutes)
  - Couleur (palette de 8 couleurs)
- Boutons + / - pour ajouter/supprimer étapes
- Validation : au moins 1 étape, durée > 0

**1.4 Intégration SessionDetailScreen**
- Affichage du preset configuré
- Bouton "Lancer le timer" (grand, coloré)
- Navigation vers SessionTimerScreen
- Passage du preset via navigation params

**Fichiers à créer :**
```
screens/SessionTimerScreen.tsx
components/TimerPresetsDialog.tsx
components/TimerPresetFormDialog.tsx
services/timerPresetService.ts (optionnel, peut stocker en AsyncStorage)
```

---

### 2. 📋 Système de Présences (PRIORITÉ #2)
**Temps estimé** : 1-2h  
**Valeur** : ⭐⭐⭐⭐ (Presque terminé, service déjà fait !)

#### Ce qui existe déjà :
- ✅ `attendanceService` complet avec CRUD
- ✅ Statistiques par élève et par séance
- ✅ Table `attendances` en base de données
- ✅ Types `Attendance` définis

#### À créer :

**2.1 SessionDetailScreen**
- Header avec infos classe (nom, couleur)
- Card avec infos séance :
  - Sujet
  - Date formatée
  - Durée
  - Description
  - Statut (badge coloré)
- Section "Présences" :
  - Titre avec icône
  - Statistiques : "X présents / Y élèves total"
  - Taux de présence en %
  - Bouton "Prendre les présences" (grand)
- Section "Timer" (pour plus tard) :
  - Preset configuré
  - Bouton "Lancer le timer"
- Boutons d'action :
  - Éditer la séance
  - Supprimer la séance

**2.2 AttendanceDialog**
- Modal plein écran ou Dialog large
- Header avec classe et date
- Liste des élèves de la classe :
  - Photo ou initiales
  - Nom complet
  - Toggle présent/absent (switch ou checkbox)
  - Si absent : option "En retard"
  - Si en retard : input durée en minutes
- Boutons :
  - "Tout cocher" / "Tout décocher"
  - "Annuler"
  - "Enregistrer" (upsertBulk via attendanceService)
- État de chargement pendant sauvegarde

**2.3 Intégration StudentDetailScreen**
- Nouvelle section "Présences" :
  - Statistiques :
    - Taux de présence global (%)
    - Nombre d'absences
    - Nombre de retards
    - Total de minutes de retard
  - Liste des dernières séances :
    - Date + sujet
    - Statut (présent/absent/retard)
    - Badge coloré
  - Filtrage par période (optionnel)

**Fichiers à créer :**
```
screens/SessionDetailScreen.tsx
components/AttendanceDialog.tsx
```

**Navigation à ajouter :**
```typescript
// navigation/types.ts
SessionDetail: { sessionId: string };
```

---

### 3. 📝 Évaluations Basiques (PRIORITÉ #3)
**Temps estimé** : 2-3h  
**Valeur** : ⭐⭐⭐ (Optionnel pour v1)

#### À créer :

**3.1 Types et Base de données**
```typescript
// types/evaluation.ts
interface Evaluation {
  id: string;
  classId: string;
  name: string;
  date: string;
  type: 'formative' | 'summative';
  maxScore: number;
  description?: string;
  createdAt: string;
}

interface EvaluationResult {
  id: string;
  evaluationId: string;
  studentId: string;
  score: number;
  comment?: string;
  createdAt: string;
}
```

**3.2 evaluationService**
- CRUD Evaluations
- CRUD EvaluationResults
- Statistiques par classe
- Statistiques par élève

**3.3 EvaluationsListScreen**
- Liste des évaluations d'une classe
- Tri par date
- Filtrage par type
- FAB pour créer nouvelle évaluation

**3.4 EvaluationFormDialog**
- Nom de l'évaluation
- Date
- Type (formative/summative)
- Note max
- Description

**3.5 EvaluationDetailScreen**
- Infos évaluation
- Liste des résultats élèves
- Saisie rapide des notes
- Statistiques (moyenne, médiane, etc.)

---

## 📊 Ordre de Développement Recommandé

### Sprint 1 : Timer (2-3h)
1. SessionTimerScreen avec timer fonctionnel
2. TimerPresetsDialog basique (juste preset par défaut)
3. Intégration dans SessionDetailScreen
4. Tests manuels

### Sprint 2 : Présences (1-2h)
1. SessionDetailScreen avec infos
2. AttendanceDialog avec liste élèves
3. Sauvegarde via attendanceService
4. Intégration StudentDetailScreen

### Sprint 3 : Polish (optionnel)
1. TimerPresetFormDialog pour presets custom
2. Évaluations basiques
3. Améliorations UX diverses

---

## 🎨 Composants Réutilisables à Créer

### CircularProgress.tsx
Pour le timer (affichage visuel circulaire du temps restant)
- Cercle de progression
- Temps au centre
- Couleur dynamique par étape

### StatCard.tsx
Pour afficher les statistiques (présences, évaluations)
- Icône
- Label
- Valeur
- Couleur d'accent

### StudentListItem.tsx
Pour les listes d'élèves (présences, évaluations)
- Photo/Initiales
- Nom complet
- Action à droite (toggle, input, etc.)
- Badge optionnel

---

## 🐛 Bugs/Améliorations Identifiés

- [ ] Vérifier z-index dans tous les modals
- [ ] Tester wizard sur vraies données
- [ ] Ajouter loading states partout
- [ ] Gérer erreurs réseau/base de données
- [ ] Ajouter confirmations avant suppressions importantes
- [ ] Optimiser performances FlatList (React.memo, useCallback)

---

## 📱 Tests à Faire

### Timer
- [ ] Démarrage/pause/reprise
- [ ] Transitions d'étapes
- [ ] Vibration/son fonctionne
- [ ] Screen reste allumé
- [ ] Navigation back ne tue pas le timer

### Présences
- [ ] Sauvegarde bulk fonctionne
- [ ] Mise à jour existantes
- [ ] Statistiques correctes
- [ ] Performances avec 30+ élèves

### Global
- [ ] Mode sombre partout
- [ ] Navigation cohérente
- [ ] Pas de crashes
- [ ] Performance acceptable
