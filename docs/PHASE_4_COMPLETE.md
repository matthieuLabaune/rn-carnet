# Phase 4 - UI Wizard Emploi du temps ✅

## Vue d'ensemble

Interface utilisateur complète pour la configuration de l'emploi du temps et la génération automatique de séances.

## Composants créés

### 1. ScheduleSlotFormDialog.tsx

**Dialog de création/édition de créneau**

- ✅ Sélecteur de jour de la semaine (Lundi-Dimanche)
- ✅ Time picker pour l'heure de début
- ✅ Champ durée en minutes
- ✅ Champ matière/sujet
- ✅ Sélecteur fréquence (Hebdomadaire/Bimensuelle)
- ✅ Si bimensuel : choix semaine paire/impaire
- ✅ Mode création et édition
- ✅ Validation des données

### 2. ScheduleManagementScreen.tsx

**Écran de gestion de l'emploi du temps**

- ✅ Liste des créneaux groupés par jour
- ✅ Affichage heure, durée, matière
- ✅ Badge pour créneaux bimensuels
- ✅ Bouton FAB pour ajouter un créneau
- ✅ Édition au tap sur un créneau
- ✅ Suppression avec confirmation
- ✅ Carte de prévisualisation du nombre de séances
- ✅ Bouton vers SessionGenerationScreen
- ✅ Empty state avec instructions

### 3. SessionGenerationScreen.tsx

**Écran de génération de séances**

- ✅ Résumé des paramètres de l'année scolaire (zone, dates)
- ✅ Résumé de l'emploi du temps configuré
- ✅ Prévisualisation du nombre de séances à créer
- ✅ Statistiques (jours exclus)
- ✅ Bouton "Générer les séances"
- ✅ Bouton "Régénérer" (suppression + création)
- ✅ Confirmations avec Alert
- ✅ Gestion des erreurs
- ✅ Redirection vers la liste des séances après génération
- ✅ Écran d'erreur si configuration manquante

### 4. Navigation

**Mise à jour de la navigation**

- ✅ Ajout des types dans `navigation/types.ts`
  - `ScheduleManagement: { classId, className }`
  - `SessionGeneration: { classId, className }`
- ✅ Ajout des écrans dans `App.tsx`
- ✅ Bouton "Emploi du temps" dans ClassDetailScreen
- ✅ Navigation fluide entre tous les écrans

## Flux utilisateur

```
ClassDetailScreen
    ↓
[Bouton "Emploi du temps"]
    ↓
ScheduleManagementScreen
    ├─ [+ FAB] → ScheduleSlotFormDialog → Ajouter créneau
    ├─ [Tap créneau] → ScheduleSlotFormDialog → Éditer créneau
    ├─ [Icône poubelle] → Confirmation → Supprimer créneau
    └─ [Carte "Générer les séances"]
        ↓
SessionGenerationScreen
    ├─ Affiche résumé configuration
    ├─ Affiche prévisualisation (X séances)
    ├─ [Générer] → Confirmation → Création → SessionList
    └─ [Régénérer] → Confirmation → Suppression + Création → SessionList
```

## Fonctionnalités

### ScheduleSlotFormDialog

**Props:**
```typescript
{
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
    dayOfWeek: number;
    startTime: string;
    duration: number;
    subject: string;
    frequency: 'weekly' | 'biweekly';
    startWeek?: number;
  }) => void;
  initialData?: ScheduleSlot;
}
```

**Validation:**
- Sujet obligatoire
- Durée > 0
- startWeek requis uniquement si fréquence = biweekly

### ScheduleManagementScreen

**Fonctionnalités:**
- Chargement des créneaux existants
- Preview automatique du nombre de séances
- Création/édition/suppression de créneaux
- Groupement par jour de la semaine
- Tri par heure de début
- Bordure gauche colorée (style Material)

### SessionGenerationScreen

**Modes:**
1. **Génération** : Ajoute les séances sans supprimer l'existant
2. **Régénération** : Supprime toutes les séances puis génère

**Sécurités:**
- Confirmation avant génération
- Vérification de la configuration
- Gestion des erreurs avec messages clairs
- Redirection automatique après succès

## Design

**Style cohérent avec l'application:**
- Couleur primaire : `#007AFF`
- Cards blanches avec shadow
- Bordure gauche colorée pour les créneaux
- Icons Material Community
- Empty states explicites
- Messages d'erreur clairs

**Responsive:**
- ScrollView pour contenu long
- KeyboardAvoidingView dans les dialogs
- Boutons accessibles (taille minimum 44px)

## Intégration

**Services utilisés:**
- `scheduleService` : CRUD créneaux
- `sessionGeneratorService` : Génération et preview
- `settingsService` : Paramètres année scolaire
- `sessionService` : Suppression séances existantes

**Navigation:**
- Accessible depuis `ClassDetailScreen`
- Bouton "Emploi du temps" avec icône `calendar-clock`
- Navigation vers `SessionList` après génération

## Tests

✅ Compilation TypeScript sans erreur
✅ Tous les tests existants passent (252 tests)
✅ Pas de régression

## Prochaines améliorations possibles

- [ ] Export/import d'emplois du temps
- [ ] Duplication d'emploi du temps entre classes
- [ ] Visualisation calendrier (vue mois)
- [ ] Édition en masse de créneaux
- [ ] Templates d'emplois du temps
- [ ] Statistiques d'utilisation
- [ ] Notifications avant génération massive
