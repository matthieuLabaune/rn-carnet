# Scénarios d'utilisation - RN-Carnet

## 🎬 Scénario 1: Premier lancement - Setup initial

**Persona:** Prof Marie (première utilisation)  
**Contexte:** Marie vient d'installer l'app, c'est la rentrée scolaire

### Flux nominal

1. **Ouverture de l'app**
   - Marie ouvre RN-Carnet pour la première fois
   - Un écran d'accueil vide s'affiche avec un message de bienvenue
   - Un bouton "Créer ma première classe" est visible

2. **Création de la première classe**
   - Marie tape sur "Créer ma première classe"
   - Un formulaire s'affiche
   - Elle saisit:
     - Nom: "6ème A"
     - Niveau: "6ème"
     - Matière: "Mathématiques"
   - Elle choisit la couleur bleue
   - Elle tape sur "Créer"

3. **Ajout des élèves**
   - Marie est automatiquement redirigée vers le détail de la classe "6ème A"
   - Elle voit un message "Aucun élève pour le moment"
   - Elle tape sur le bouton "+" pour ajouter un élève
   - Elle saisit "Sophie" "Martin"
   - Elle tape sur "Ajouter"
   - Sophie apparaît dans la liste
   - Elle répète l'opération pour 5 autres élèves

4. **Création des autres classes**
   - Marie retourne à l'accueil
   - Elle tape sur "+" pour créer une nouvelle classe
   - Elle crée "5ème B" (couleur verte)
   - Puis "4ème C" (couleur orange)
   - Elle voit maintenant 3 cartes de classes sur son accueil

**Résultat:** Marie a configuré ses 3 classes principales avec quelques élèves

---

## 🎬 Scénario 2: Préparer et donner un cours avec timer

**Persona:** Prof Thomas  
**Contexte:** Lundi matin, Thomas prépare son cours de 8h sur "Les figures de style"

### Flux nominal

1. **Planification du cours**
   - Thomas ouvre l'app à 7h30
   - Il tape sur sa classe "2nde A"
   - Il tape sur "Nouvelle séance"
   - Il saisit:
     - Sujet: "Les figures de style"
     - Description: "Métaphore, comparaison, personnification"
   - Il choisit le preset "50 minutes"
   - Il tape sur "Créer"

2. **Début du cours (8h00)**
   - Thomas est en classe
   - Il ouvre la séance créée
   - Il tape sur "Démarrer le timer"
   - Le timer démarre: "Exercice - 10 min"
   - Il distribue un exercice de lecture

3. **Déroulement avec transitions**
   - Après 10 min, le téléphone vibre légèrement
   - Le timer passe à "Explications - 15 min"
   - Thomas commence son cours magistral
   - La barre de progression est verte
   
   - Après 15 min, nouvelle vibration
   - "Recherche - 10 min"
   - Les élèves travaillent en groupe
   - La barre devient orange
   
   - Dernière étape: "Synthèse - 15 min"
   - Thomas fait le bilan avec la classe
   - La barre devient violette

4. **Fin du cours**
   - Le timer se termine
   - Thomas tape sur "Terminer la séance"
   - Un message de confirmation s'affiche
   - La séance est enregistrée dans l'historique

**Résultat:** Thomas a structuré et suivi son cours de 50 min, la séance est archivée

---

## 🎬 Scénario 3: Consulter l'historique avant un conseil de classe

**Persona:** Prof Marie  
**Contexte:** Fin de trimestre, Marie doit préparer le conseil de classe de 6ème A

### Flux nominal

1. **Accès à l'historique**
   - Marie ouvre l'app
   - Elle tape sur l'onglet "Historique"
   - Elle voit toutes ses séances des 3 derniers mois

2. **Filtrage par classe**
   - Elle tape sur le filtre
   - Elle sélectionne "6ème A"
   - La liste se met à jour: 24 séances affichées

3. **Consultation des séances**
   - Marie fait défiler la liste
   - Elle voit:
     - 15/01 - "Fractions décimales" - 50 min
     - 12/01 - "Géométrie: les angles" - 50 min
     - 08/01 - "Révisions équations" - 50 min
   - Elle tape sur une séance pour voir les détails

4. **Vue d'ensemble**
   - Marie retourne en haut de la page
   - Elle voit les statistiques:
     - 24 séances réalisées
     - 20 heures de cours
     - 100% en format 50 minutes

5. **Prise de notes**
   - Marie note mentalement les chapitres couverts
   - Elle ferme l'app, prête pour le conseil

**Résultat:** Marie a une vue claire de ce qu'elle a fait avec la 6ème A

---

## 🎬 Scénario 4: Gestion d'un changement d'élève

**Persona:** Prof Marie  
**Contexte:** Un nouvel élève arrive en 6ème A, un autre part

### Flux nominal

1. **Ajout du nouvel élève**
   - Marie ouvre l'app
   - Elle tape sur "6ème A"
   - Elle tape sur "+" pour ajouter un élève
   - Elle saisit "Lucas" "Dubois"
   - Elle ajoute une note: "Arrivé le 15/02, bon niveau"
   - Elle tape sur "Ajouter"
   - Lucas apparaît dans la liste alphabétique

2. **Retrait d'un élève**
   - Marie cherche "Emma Petit" dans la liste
   - Elle glisse la carte vers la gauche
   - Un bouton "Supprimer" apparaît
   - Elle tape dessus
   - Un message de confirmation s'affiche: "Supprimer Emma Petit ?"
   - Elle confirme
   - Emma disparaît de la liste

3. **Vérification**
   - Marie retourne à l'accueil
   - La carte "6ème A" affiche toujours "26 élèves"
   - Le compteur s'est mis à jour automatiquement

**Résultat:** La liste de classe est à jour avec le nouvel effectif

---

## 🎬 Scénario 5: Modification d'un cours en cours

**Persona:** Prof Thomas  
**Contexte:** Thomas a lancé un timer mais doit l'interrompre

### Flux nominal

1. **Démarrage normal**
   - Thomas lance sa séance "Poésie du 19ème"
   - Le timer démarre (étape 1: Exercice - 10 min)
   - 5 minutes passent

2. **Interruption imprévue**
   - Alarme incendie (exercice)
   - Thomas met le timer en pause
   - L'app affiche: "Pause - 5 min restantes"

3. **Reprise**
   - Retour en classe après 20 min
   - Thomas rouvre l'app
   - Il voit "Séance en pause"
   - Il tape sur "Reprendre"
   - Le timer reprend où il en était

4. **Fin anticipée**
   - Après l'étape 2, Thomas se rend compte qu'il n'aura pas le temps de tout faire
   - Il tape sur "Arrêter le timer"
   - Un message demande: "Terminer la séance maintenant ?"
   - Il confirme
   - La séance est enregistrée avec la durée réelle: 35 min

**Résultat:** Thomas a pu gérer l'imprévu et la séance est quand même archivée

---

## 🎬 Scénario 6: Utilisation du mode sombre

**Persona:** Prof Marie  
**Contexte:** Fin de journée, Marie consulte l'app dans le noir

### Flux nominal

1. **Détection automatique**
   - Il est 19h, il fait nuit
   - Marie ouvre l'app
   - L'app détecte le mode sombre du système
   - L'interface s'affiche en thème sombre automatiquement

2. **Changement manuel**
   - Marie préfère le mode clair
   - Elle va dans Paramètres
   - Elle tape sur "Apparence"
   - Elle sélectionne "Toujours clair"
   - L'interface bascule immédiatement

3. **Retour au mode auto**
   - Le lendemain matin, Marie change d'avis
   - Elle retourne dans Paramètres > Apparence
   - Elle sélectionne "Automatique"
   - L'app suit maintenant le système

**Résultat:** Marie a personnalisé l'apparence selon ses préférences

---

## 🎬 Scénario 7: Workflow complet d'une semaine type

**Persona:** Prof Thomas  
**Contexte:** Une semaine complète avec 2nde A

### Lundi 8h - Nouveau chapitre

```
1. Créer séance "Le romantisme - Introduction"
2. Lancer timer 50 min
3. Séance se déroule normalement
4. Terminer et sauvegarder
```

### Mardi 8h - Suite du chapitre

```
1. Créer séance "Le romantisme - Les grands auteurs"
2. Lancer timer 50 min
3. Interruption technique après 20 min
4. Pause timer
5. Reprise 10 min plus tard
6. Terminer normalement
```

### Jeudi 8h - Exercices

```
1. Créer séance "Exercices sur le romantisme"
2. Pas de timer (travail libre)
3. Terminer manuellement après 45 min
```

### Vendredi 14h - Bilan

```
1. Ouvrir l'historique
2. Filtrer sur "2nde A"
3. Voir les 3 séances de la semaine
4. Constater: 2h25 sur le chapitre "Romantisme"
5. Planifier la séance de la semaine suivante
```

**Résultat:** Thomas a un suivi complet de sa semaine

---

## 🚨 Scénarios d'erreur et edge cases

### Erreur 1: Tentative de création de classe sans nom

```
1. Ouvrir "Nouvelle classe"
2. Laisser le champ nom vide
3. Taper sur "Créer"
→ Message d'erreur: "Le nom de la classe est obligatoire"
→ Le champ nom est surligné en rouge
→ Le focus retourne sur le champ
```

### Erreur 2: Suppression d'une classe avec séances

```
1. Tenter de supprimer "6ème A" (qui a 24 séances)
2. Message de confirmation détaillé:
   "Supprimer 6ème A ?
   Cette action supprimera également:
   - 26 élèves
   - 24 séances
   Cette action est irréversible."
3. Boutons: "Annuler" / "Supprimer quand même"
```

### Erreur 3: Timer en arrière-plan

```
1. Lancer un timer
2. Quitter l'app (home)
3. L'app continue de compter en arrière-plan
4. Notification à chaque changement d'étape
5. Retour dans l'app: le timer est à jour
```

### Erreur 4: Perte de connexion (pour version cloud)

```
1. L'app fonctionne en mode offline
2. Toutes les données sont stockées localement
3. Message discret: "Mode hors ligne"
4. Synchronisation automatique au retour de connexion
```

---

## ✅ Points de validation

Chaque scénario doit être testé pour:
- ✅ Accessibilité: navigation au clavier possible
- ✅ Feedback: messages de confirmation/erreur clairs
- ✅ Performance: réactivité < 100ms
- ✅ Persistance: données sauvegardées immédiatement
- ✅ UX: pas plus de 3 taps pour l'action principale
- ✅ Cohérence: même comportement sur iOS et Android

---

## 📊 Métriques de succès

Un scénario est réussi si:
- L'utilisateur atteint son objectif en moins de 1 minute
- Aucune erreur bloquante
- L'interface reste fluide (60 FPS)
- Les données sont correctement sauvegardées
- L'utilisateur comprend où il en est (feedback visuel)
