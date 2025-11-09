# Corrections - Calendrier et Navigation

## Problèmes résolus

### 1. Erreur "GO_BACK" dans la navigation

**Symptôme** : Messages d'erreur `The action 'GO_BACK' was not handled by any navigator`

**Cause** : Les nouveaux écrans (ScheduleManagement et SessionGeneration) n'avaient pas de bouton retour explicite dans leur header.

**Solution** :
- Ajout d'un header personnalisé avec bouton retour dans `ScheduleManagementScreen`
- Ajout d'un header personnalisé avec bouton retour dans `SessionGenerationScreen`
- Navigation explicite vers l'écran précédent au lieu de `goBack()`

### 2. Erreur console "Aucun créneau d'emploi du temps"

**Symptôme** : Message d'erreur dans la console lors du chargement de l'écran de gestion d'emploi du temps

**Cause** : Le `previewGeneration` essayait de générer un aperçu même sans créneaux configurés

**Solution** :
- Vérification du nombre de créneaux avant d'appeler `previewGeneration`
- Filtrage des erreurs attendues (pas de créneaux = état normal au démarrage)

### 3. Calendrier de l'année précédente/suivante

**Statut** : ✅ Les vacances 2025-2026 sont déjà intégrées dans le code

**Explication** :
Le service `holidayService.ts` contient les vacances pour :
- 2024-2025 (septembre 2024 → juillet 2025)
- 2025-2026 (septembre 2025 → juillet 2026)

Le système détecte automatiquement l'année scolaire en cours :
- Si on est entre septembre et décembre : année N → N+1
- Si on est entre janvier et août : année N-1 → N

En novembre 2025, le système utilise automatiquement les vacances 2025-2026.

## Vérification des paramètres

### Si le calendrier semble incorrect :

1. **Vérifier les paramètres de l'année scolaire** :
   - Ouvrir l'app → onglet "Paramètres"
   - Section "Année scolaire"
   - Vérifier que :
     - Zone : A, B ou C (selon votre académie)
     - Début de l'année : `2025-09-01` (ou date correcte)
     - Fin de l'année : `2026-07-04` (ou date correcte)

2. **Vider le cache si besoin** :
   - Les vacances sont mises en cache pendant 7 jours
   - En cas de problème, vous pouvez utiliser la fonction `clearHolidaysCache()` depuis le code

3. **Vérifier les vacances utilisées** :
   ```typescript
   // Dans holidayService.ts, ligne ~340
   // Le code sélectionne automatiquement les bonnes vacances
   if (targetSchoolYear === '2024-2025') {
       holidays = HOLIDAYS_2024_2025;
   } else if (targetSchoolYear === '2025-2026') {
       holidays = HOLIDAYS_2025_2026;
   }
   ```

## Navigation améliorée

### Nouveau flux de navigation

```
ClassDetailScreen
  ↓ [Bouton "Emploi du temps"]
ScheduleManagementScreen ← Header avec bouton retour
  ↓ [Carte "Générer les séances"]
SessionGenerationScreen ← Header avec bouton retour
  ↓ [Bouton "Générer"]
SessionListScreen
```

### Boutons retour

Les deux nouveaux écrans ont maintenant un header bleu avec :
- Bouton flèche retour à gauche
- Titre de l'écran
- Nom de la classe en sous-titre

Le retour navigue vers l'écran logique précédent :
- `ScheduleManagement` → retour vers `ClassDetail`
- `SessionGeneration` → retour vers `ScheduleManagement`

## Tests

✅ **252 tests passent** (15 suites)
- Pas de régression introduite
- Tous les services fonctionnent correctement
- Couverture de code maintenue

## Utilisation

1. **Accéder à l'emploi du temps** :
   - Onglet "Classes" → Sélectionner une classe
   - Taper sur la carte "Emploi du temps"

2. **Ajouter des créneaux** :
   - Bouton "+" en bas à droite
   - Configurer : jour, heure, durée, matière, fréquence

3. **Générer les séances** :
   - Une fois les créneaux configurés, une carte "Générer les séances" apparaît
   - Taper dessus pour voir l'aperçu
   - Confirmer la génération

4. **Revenir en arrière** :
   - Utiliser le bouton flèche en haut à gauche
   - Ou le geste de swipe sur iOS
