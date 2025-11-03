# 🗺️ Roadmap RN-Carnet - Enrichissement App

## ✅ Phase 0 : Base (TERMINÉ)
- [x] Navigation bottom tabs
- [x] Écrans AllStudents, AllSessions, Settings
- [x] Icônes Material Design
- [x] UI moderne style shadcn

---

## 🔥 Phase A : Enrichissement des Élèves (✅ TERMINÉ)

### A1. Étendre le modèle Student
- [x] Modifier types/student.ts - ajouter handicaps, laterality, customTags
- [x] Mettre à jour database.ts - migration schéma SQLite
- [x] Adapter studentService.ts - CRUD avec nouveaux champs
- [x] Tester création/lecture données enrichies

### A2. Améliorer StudentFormDialog
- [x] Ajouter sélection multi-handicaps (chips)
- [x] Ajouter sélecteur latéralité (radio buttons)
- [x] Ajouter input tags personnalisés (chips dynamiques)
- [x] Mode simple/avancé (accordéon)
- [x] Validation et UX

### A3. Affichage tags dans les listes
- [ ] StudentListScreen - afficher tags sous le nom
- [ ] AllStudentsScreen - afficher tags
- [ ] ClassDetailScreen - afficher tags
- [ ] Composant réutilisable StudentTags

---

## 🎯 Phase B : Fiche Élève Détaillée

### B1. Créer StudentDetailScreen
- [ ] Layout avec header personnalisé
- [ ] Section infos principales (nom, classe, photo)
- [ ] Section tags (handicaps, latéralité, custom)
- [ ] Section notes détaillées (expandable)
- [ ] Section statistiques (à venir)
- [ ] Boutons Modifier/Supprimer/Partager

### B2. Navigation vers StudentDetail
- [ ] Depuis StudentListScreen (tap sur card)
- [ ] Depuis AllStudentsScreen (tap sur card)
- [ ] Depuis ClassDetailScreen (tap sur élève)
- [ ] Ajouter route StudentDetail dans navigation/types.ts

### B3. Actions sur StudentDetail
- [ ] Édition inline des notes
- [ ] Suppression avec confirmation
- [ ] Partage fiche (export PDF futur)
- [ ] Animation de transition

---

## 🎨 Phase C : Mode Sombre

### C1. Theme Provider
- [ ] Créer utils/theme.ts - définir light/dark colors
- [ ] Créer ThemeContext avec React Context
- [ ] Wrapper App avec ThemeProvider
- [ ] Hook useTheme personnalisé

### C2. Appliquer thème à tous les écrans
- [ ] HomeScreen - colors dynamiques
- [ ] AllStudentsScreen - colors dynamiques
- [ ] AllSessionsScreen - colors dynamiques
- [ ] StudentListScreen - colors dynamiques
- [ ] StudentDetailScreen - colors dynamiques
- [ ] SettingsScreen - colors dynamiques
- [ ] Dialogs - colors dynamiques

### C3. Toggle et persistance
- [ ] Switch dans SettingsScreen fonctionnel
- [ ] Sauvegarder préférence dans AsyncStorage
- [ ] Charger thème au démarrage
- [ ] Suivre préférence système (optionnel)

---

## 🎓 Phase D : Évaluations

### D1. Modèle de données Évaluations
- [ ] Créer types/evaluation.ts
- [ ] Créer table evaluations dans database.ts
- [ ] Créer evaluationService.ts
- [ ] Modèle Compétence/Skill

### D2. Écran Évaluations
- [ ] Créer EvaluationsScreen
- [ ] Liste des évaluations par classe
- [ ] Filtres (classe, date, type)
- [ ] Création nouvelle évaluation

### D3. Grille d'évaluation
- [ ] Écran EvaluationDetailScreen
- [ ] Grille élèves x compétences
- [ ] Système de notation (A/B/C/D ou acquis/en cours/non acquis)
- [ ] Sauvegarde progressive
- [ ] Export bulletins (PDF futur)

### D4. Intégration élèves
- [ ] StudentDetailScreen - historique évaluations
- [ ] Graphiques de progression
- [ ] Statistiques par compétence

---

## 🚀 Phase E : Features Bonus (TODO)
- [ ] Emploi du temps hebdomadaire
- [ ] Notifications et rappels
- [ ] Export/Import JSON/CSV
- [ ] Synchronisation cloud (Supabase)
- [ ] Photos élèves
- [ ] Pièces jointes
- [ ] Mode hors ligne optimisé
- [ ] Recherche globale avancée

---

**Dernière mise à jour** : 3 novembre 2025
**Statut** : Phase B en cours �
**Phase A terminée** : ✅ Enrichissement élèves (handicaps, latéralité, tags)
