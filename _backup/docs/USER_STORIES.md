# 📖 User Stories - RN-Carnet

## 🎭 Personas

### Persona 1 : Marie, Professeure de Mathématiques
- **Âge** : 35 ans
- **Contexte** : 4 classes (6ème à 3ème), 120 élèves
- **Besoins** : Suivi simple, gain de temps, mémoire pédagogique
- **Tech** : Utilise smartphone quotidiennement, pas très "tech"

### Persona 2 : Jean, Professeur d'Histoire-Géo
- **Âge** : 45 ans  
- **Contexte** : 5 classes, projets pédagogiques complexes
- **Besoins** : Organisation, planning, ressources partagées
- **Tech** : Confortable avec les outils numériques

### Persona 3 : Sophie, Professeure des Écoles
- **Âge** : 28 ans
- **Contexte** : 1 classe de CM2, 25 élèves
- **Besoins** : Suivi individualisé, communication parents
- **Tech** : Early adopter, aime les nouvelles apps

---

## 🎯 User Stories MVP (Phase 1)

### Epic 1 : Gestion des Classes

#### US-001 : Créer une classe
**En tant que** professeur  
**Je veux** créer une nouvelle classe  
**Afin de** organiser mes groupes d'élèves

**Critères d'acceptation :**
- ✅ Formulaire avec : nom, niveau, couleur
- ✅ Validation : nom obligatoire
- ✅ Couleur sélectionnable (palette de 8 couleurs)
- ✅ Message de confirmation
- ✅ Accessible au clavier et screen reader

**Priorité :** 🔴 Critique (MVP)

---

#### US-002 : Voir mes classes
**En tant que** professeur  
**Je veux** voir la liste de toutes mes classes  
**Afin de** avoir une vue d'ensemble

**Critères d'acceptation :**
- ✅ Liste avec nom, niveau, nb élèves, couleur
- ✅ Tri par nom ou date de création
- ✅ Carte cliquable vers détail classe
- ✅ Bouton "Nouvelle classe" visible
- ✅ État vide avec illustration sympathique

**Priorité :** 🔴 Critique (MVP)

---

#### US-003 : Modifier une classe
**En tant que** professeur  
**Je veux** modifier les infos d'une classe  
**Afin de** corriger des erreurs ou adapter

**Critères d'acceptation :**
- ✅ Formulaire pré-rempli
- ✅ Bouton "Enregistrer" et "Annuler"
- ✅ Confirmation avant enregistrement
- ✅ Retour automatique à la liste

**Priorité :** 🟡 Important (MVP)

---

#### US-004 : Supprimer une classe
**En tant que** professeur  
**Je veux** supprimer une classe obsolète  
**Afin de** garder une liste propre

**Critères d'acceptation :**
- ✅ Dialogue de confirmation explicite
- ✅ Message d'avertissement si élèves/séances liés
- ✅ Suppression en cascade (ou option de conservation)
- ✅ Toast de confirmation

**Priorité :** 🟡 Important (MVP)

---

### Epic 2 : Gestion des Élèves

#### US-005 : Ajouter un élève
**En tant que** professeur  
**Je veux** ajouter un élève à une classe  
**Afin de** constituer ma liste de classe

**Critères d'acceptation :**
- ✅ Formulaire : prénom, nom
- ✅ Champ notes personnelles (optionnel)
- ✅ Génération automatique d'un ID unique
- ✅ Ajout à la classe en cours
- ✅ Feedback visuel immédiat

**Priorité :** 🔴 Critique (MVP)

---

#### US-006 : Voir la liste des élèves
**En tant que** professeur  
**Je veux** voir tous les élèves d'une classe  
**Afin de** avoir une vue d'ensemble

**Critères d'acceptation :**
- ✅ Liste alphabétique par nom
- ✅ Avatar avec initiales
- ✅ Compteur total d'élèves
- ✅ Bouton "Ajouter élève"
- ✅ État vide avec CTA claire

**Priorité :** 🔴 Critique (MVP)

---

#### US-007 : Modifier un élève
**En tant que** professeur  
**Je veux** modifier les infos d'un élève  
**Afin de** corriger ou compléter

**Critères d'acceptation :**
- ✅ Formulaire pré-rempli
- ✅ Modification des notes personnelles
- ✅ Enregistrement immédiat

**Priorité :** 🟢 Nice to have (MVP)

---

#### US-008 : Supprimer un élève
**En tant que** professeur  
**Je veux** retirer un élève de la liste  
**Afin de** refléter les changements (déménagement, etc.)

**Critères d'acceptation :**
- ✅ Confirmation avant suppression
- ✅ Conservation de l'historique (option)
- ✅ Toast de confirmation

**Priorité :** 🟢 Nice to have (MVP)

---

### Epic 3 : Séances de Cours

#### US-009 : Créer une séance
**En tant que** professeur  
**Je veux** créer une nouvelle séance  
**Afin de** documenter mon cours

**Critères d'acceptation :**
- ✅ Formulaire : sujet, date, classe
- ✅ Description optionnelle
- ✅ Sélection classe depuis une liste
- ✅ Date par défaut = aujourd'hui
- ✅ Bouton "Créer et lancer le timer"

**Priorité :** 🔴 Critique (MVP)

---

#### US-010 : Lancer le timer pédagogique
**En tant que** professeur  
**Je veux** lancer un timer de 50 min avec étapes  
**Afin de** rythmer ma séance

**Critères d'acceptation :**
- ✅ Timer par défaut : 10-15-10-15 min
- ✅ Affichage temps restant total
- ✅ Affichage temps restant étape courante
- ✅ Barre de progression colorée
- ✅ Notification sonore/vibration entre étapes
- ✅ Labels des étapes visibles (Exercice, Explication, etc.)
- ✅ Bouton Pause/Reprendre
- ✅ Bouton Stop (avec confirmation)

**Priorité :** 🔴 Critique (MVP)

---

#### US-011 : Voir l'historique des séances
**En tant que** professeur  
**Je veux** consulter mes séances passées  
**Afin de** retrouver ce que j'ai fait

**Critères d'acceptation :**
- ✅ Liste chronologique (plus récent en haut)
- ✅ Affichage : date, classe, sujet
- ✅ Filtrage par classe
- ✅ Clic pour voir le détail
- ✅ Badge "Terminée" ou "Interrompue"

**Priorité :** 🔴 Critique (MVP)

---

#### US-012 : Détail d'une séance
**En tant que** professeur  
**Je veux** voir le détail complet d'une séance  
**Afin de** me rappeler ce qui a été fait

**Critères d'acceptation :**
- ✅ Date, heure, classe, sujet
- ✅ Durée totale réelle
- ✅ Liste des étapes du timer
- ✅ Durée de chaque étape
- ✅ Notes/description
- ✅ Bouton "Modifier" et "Supprimer"

**Priorité :** 🟡 Important (MVP)

---

### Epic 4 : Interface & UX

#### US-013 : Navigation intuitive
**En tant qu'** utilisateur  
**Je veux** naviguer facilement dans l'app  
**Afin de** trouver rapidement ce que je cherche

**Critères d'acceptation :**
- ✅ Tabs en bas : Accueil, Classes, Séances, Historique
- ✅ Boutons FAB pour actions principales
- ✅ Retour arrière logique
- ✅ Breadcrumb si navigation profonde

**Priorité :** 🔴 Critique (MVP)

---

#### US-014 : Thème clair/sombre
**En tant qu'** utilisateur  
**Je veux** choisir entre thème clair et sombre  
**Afin de** protéger mes yeux et économiser batterie

**Critères d'acceptation :**
- ✅ Détection automatique du système
- ✅ Option de forçage manuel dans Paramètres
- ✅ Transition fluide entre thèmes
- ✅ Persistence du choix

**Priorité :** 🟡 Important (MVP)

---

#### US-015 : Accessibilité complète
**En tant qu'** utilisateur malvoyant  
**Je veux** utiliser l'app avec VoiceOver/TalkBack  
**Afin de** gérer mes cours de manière autonome

**Critères d'acceptation :**
- ✅ Tous les boutons ont des labels accessibles
- ✅ Navigation au clavier fonctionnelle
- ✅ Contraste WCAG AA minimum
- ✅ Tailles de touch targets ≥ 44pt
- ✅ Annonces contextuelles pour actions

**Priorité :** 🔴 Critique (MVP)

---

## 🚀 User Stories Post-MVP (Phase 2+)

### Epic 5 : Emploi du Temps

#### US-016 : Créer mon emploi du temps
**En tant que** professeur  
**Je veux** saisir mon EDT hebdomadaire  
**Afin de** planifier mes séances à l'avance

**Critères d'acceptation :**
- ✅ Grille hebdomadaire (Lundi-Vendredi)
- ✅ Ajout créneau : heure début/fin, classe, salle
- ✅ Couleur selon la classe
- ✅ Récurrence automatique chaque semaine
- ✅ Glisser-déposer pour déplacer

**Priorité :** 🟡 Important (Phase 2)

---

#### US-017 : Vue calendrier mensuelle
**En tant que** professeur  
**Je veux** voir un calendrier du mois  
**Afin de** anticiper mes cours à venir

**Critères d'acceptation :**
- ✅ Vue mois avec pastilles colorées (nb séances/jour)
- ✅ Clic sur jour → liste séances
- ✅ Navigation mois précédent/suivant
- ✅ Highlight jour actuel

**Priorité :** 🟢 Nice to have (Phase 2)

---

### Epic 6 : QR Codes & Présences

#### US-018 : Générer QR codes élèves
**En tant que** professeur  
**Je veux** générer un QR code par élève  
**Afin de** faciliter les présences

**Critères d'acceptation :**
- ✅ QR généré automatiquement à la création élève
- ✅ QR contient ID unique élève
- ✅ Affichage dans fiche élève
- ✅ Export PDF de tous les QR de la classe

**Priorité :** 🟡 Important (Phase 2)

---

#### US-019 : Scanner les présences
**En tant que** professeur  
**Je veux** scanner les QR des élèves en début de cours  
**Afin d'** enregistrer rapidement les présences

**Critères d'acceptation :**
- ✅ Caméra s'ouvre en mode scan
- ✅ Scan multiple rapide (bip à chaque scan)
- ✅ Liste visuelle des présents/absents
- ✅ Fermeture automatique après X scans
- ✅ Option ajout manuel si QR oublié

**Priorité :** 🟡 Important (Phase 2)

---

#### US-020 : Historique de présence
**En tant que** professeur  
**Je veux** consulter l'historique de présence d'un élève  
**Afin de** détecter l'absentéisme

**Critères d'acceptation :**
- ✅ Graphique présences/absences
- ✅ Taux de présence en %
- ✅ Liste des dates d'absence
- ✅ Export CSV

**Priorité :** 🟢 Nice to have (Phase 2)

---

### Epic 7 : Timers Personnalisables

#### US-021 : Créer mon propre timer
**En tant que** professeur  
**Je veux** créer un preset de timer personnalisé  
**Afin de** l'adapter à mes besoins pédagogiques

**Critères d'acceptation :**
- ✅ Interface de création : nom, description
- ✅ Ajout d'étapes : type, durée, couleur
- ✅ Réorganisation par glisser-déposer
- ✅ Prévisualisation
- ✅ Enregistrement

**Priorité :** 🟡 Important (Phase 2)

---

#### US-022 : Bibliothèque de presets
**En tant que** professeur  
**Je veux** choisir parmi plusieurs presets  
**Afin de** varier mes séances

**Critères d'acceptation :**
- ✅ Liste de presets (défaut + persos)
- ✅ Prévisualisation du découpage
- ✅ Sélection au moment de créer séance
- ✅ Édition/Suppression des persos

**Priorité :** 🟢 Nice to have (Phase 2)

---

#### US-023 : Partager un preset
**En tant que** professeur  
**Je veux** partager un preset avec un collègue  
**Afin de** mutualiser nos bonnes pratiques

**Critères d'acceptation :**
- ✅ Génération QR code du preset
- ✅ Scan QR pour importer
- ✅ Confirmation avant import
- ✅ Ajout à la bibliothèque perso

**Priorité :** 🟢 Nice to have (Phase 2)

---

### Epic 8 : Autoévaluation Élèves

#### US-024 : Interface autoévaluation élève
**En tant qu'** élève  
**Je veux** évaluer ma compréhension du cours  
**Afin de** réfléchir sur mon apprentissage

**Critères d'acceptation :**
- ✅ Interface ultra simple (QR code vers web)
- ✅ Saisie prénom
- ✅ 3 curseurs : Compréhension, Participation, Motivation
- ✅ Échelle 1-5 étoiles
- ✅ Champ commentaire optionnel
- ✅ Enregistrement anonymisé (prénom seul)

**Priorité :** 🟡 Important (Phase 3)

---

#### US-025 : Consulter les autoévaluations
**En tant que** professeur  
**Je veux** voir les autoévaluations de mes élèves  
**Afin de** adapter mon enseignement

**Critères d'acceptation :**
- ✅ Moyenne par critère pour la classe
- ✅ Graphique radar par élève
- ✅ Évolution dans le temps
- ✅ Alertes si note < 2/5

**Priorité :** 🟡 Important (Phase 3)

---

### Epic 9 : Fiches de Révision

#### US-026 : Générer une fiche automatique
**En tant que** professeur  
**Je veux** générer une fiche de révision depuis mes séances  
**Afin de** gagner du temps

**Critères d'acceptation :**
- ✅ Sélection de plusieurs séances
- ✅ Extraction des sujets/objectifs
- ✅ Génération PDF structuré
- ✅ Édition avant export
- ✅ QR code vers quiz en ligne

**Priorité :** 🟢 Nice to have (Phase 3)

---

#### US-027 : Bibliothèque de fiches
**En tant que** professeur  
**Je veux** consulter toutes mes fiches créées  
**Afin de** les réutiliser

**Critères d'acceptation :**
- ✅ Liste des fiches par classe
- ✅ Recherche par titre/date
- ✅ Partage par email/QR
- ✅ Duplication pour modification

**Priorité :** 🟢 Nice to have (Phase 3)

---

### Epic 10 : Statistiques & Insights

#### US-028 : Dashboard statistiques
**En tant que** professeur  
**Je veux** voir des stats sur mon activité  
**Afin de** analyser ma pratique

**Critères d'acceptation :**
- ✅ Nombre total de séances
- ✅ Temps total d'enseignement
- ✅ Temps par type d'activité (graphique camembert)
- ✅ Classes les plus actives
- ✅ Évolution sur 3 mois

**Priorité :** 🟢 Nice to have (Phase 3)

---

#### US-029 : Export de données
**En tant que** professeur  
**Je veux** exporter toutes mes données  
**Afin de** les conserver ou analyser ailleurs

**Critères d'acceptation :**
- ✅ Export CSV (classes, élèves, séances)
- ✅ Export JSON complet
- ✅ Export PDF rapport annuel
- ✅ Sélection période

**Priorité :** 🟢 Nice to have (Phase 3)

---

### Epic 11 : Synchronisation Cloud (Supabase)

#### US-030 : Créer un compte
**En tant que** professeur  
**Je veux** créer un compte sécurisé  
**Afin de** sauvegarder mes données en ligne

**Critères d'acceptation :**
- ✅ Inscription email/password
- ✅ Vérification email
- ✅ Politique de confidentialité acceptée
- ✅ Données locales conservées

**Priorité :** 🟡 Important (Phase 4)

---

#### US-031 : Synchronisation automatique
**En tant que** professeur  
**Je veux** que mes données se synchronisent automatiquement  
**Afin de** les retrouver sur tous mes appareils

**Critères d'acceptation :**
- ✅ Sync au démarrage de l'app
- ✅ Sync toutes les 5 min (si modifs)
- ✅ Indicateur visuel de sync
- ✅ Gestion des conflits intelligente
- ✅ Mode hors-ligne fonctionnel

**Priorité :** 🟡 Important (Phase 4)

---

#### US-032 : Gérer plusieurs appareils
**En tant que** professeur  
**Je veux** utiliser l'app sur mon téléphone et ma tablette  
**Afin de** m'adapter au contexte

**Critères d'acceptation :**
- ✅ Liste des appareils connectés
- ✅ Dernière sync affichée
- ✅ Déconnexion à distance possible
- ✅ Fusion intelligente des données

**Priorité :** 🟢 Nice to have (Phase 4)

---

## 📊 Récapitulatif Priorités

### 🔴 Critique (MVP - 2h) : 10 stories
- US-001 à US-006 (Classes & Élèves)
- US-009 à US-012 (Séances & Timer)
- US-013, US-015 (Navigation & a11y)

### 🟡 Important (Phase 2-3 - 2 semaines) : 12 stories
- US-003, US-004, US-012, US-014 (Polish MVP)
- US-016, US-018, US-019, US-021, US-024, US-025 (Features avancées)
- US-030, US-031 (Sync cloud)

### 🟢 Nice to have (Phase 3+ - 1 mois) : 10 stories
- US-007, US-008, US-017, US-020, US-022, US-023, US-026, US-027, US-028, US-029, US-032

---

**Total User Stories :** 32  
**Version :** 1.0.0  
**Dernière mise à jour :** 2025-11-03
