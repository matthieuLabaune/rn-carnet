# 🎓 Système de Séquences Pédagogiques

## 🎯 Vision

Permettre aux enseignants de **planifier leur programme annuel** en créant des séquences thématiques et en les assignant aux séances générées automatiquement.

---

## 📊 Architecture

### Modèle de Données

```typescript
// Séquence = groupe thématique de X séances
Sequence {
  id, classId, name, description, color,
  order, sessionCount, theme, objectives,
  status, createdAt
}

// Lien séance ↔ séquence
SessionSequence {
  sessionId, sequenceId, orderInSequence
}

// Programme officiel (optionnel)
CurriculumProgram {
  level, subject, year, themes[]
}
```

---

## 🎨 Interfaces Utilisateur

### 1. **Écran Principal : SequencePlanningScreen**

**Accès :**
- Depuis ClassDetailScreen : Nouvelle carte "📚 Séquences"
- Ou depuis SessionList : Bouton "Planifier les séquences"

**Layout :**

```
┌─────────────────────────────────────────┐
│ 📚 Planification des Séquences          │
│ Classe: 2nde A - Histoire-Géo           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📊 Vue d'ensemble                       │
│                                         │
│ ▓▓▓▓▓░░░░░░░░░░░░░░ 25% complété       │
│                                         │
│ 📅 120 séances générées                │
│ 📝 8 séquences créées                  │
│ ✅ 30 séances assignées                │
│ ⏳ 90 séances non assignées            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📚 Séquences du Programme               │
│                                         │
│ [+ Créer une séquence]                 │
│                                         │
│ ┌─────────────────────────────┐        │
│ │ 🟦 Séquence 1                │ ⋮      │
│ │ La Révolution française      │        │
│ │ 5 séances • 3/5 assignées    │        │
│ │ ▓▓▓░░ 60%                    │        │
│ └─────────────────────────────┘        │
│                                         │
│ ┌─────────────────────────────┐        │
│ │ 🟩 Séquence 2                │ ⋮      │
│ │ L'Empire napoléonien         │        │
│ │ 4 séances • 0/4 assignées    │        │
│ │ ░░░░ 0%                      │        │
│ └─────────────────────────────┘        │
│                                         │
│ ┌─────────────────────────────┐        │
│ │ 🟨 Séquence 3                │ ⋮      │
│ │ La Restauration              │        │
│ │ 3 séances • Non démarrée     │        │
│ └─────────────────────────────┘        │
└─────────────────────────────────────────┘

[📅 Assigner aux séances]  [📊 Timeline]
```

---

### 2. **Dialog : SequenceFormDialog**

**Création rapide d'une séquence :**

```
┌─────────────────────────────────────────┐
│ ✏️ Nouvelle Séquence                    │
└─────────────────────────────────────────┘

Nom de la séquence *
┌─────────────────────────────────────────┐
│ La Révolution française                 │
└─────────────────────────────────────────┘

Description (optionnel)
┌─────────────────────────────────────────┐
│ De 1789 à 1799, étude des causes,      │
│ événements et conséquences...           │
└─────────────────────────────────────────┘

Thème
┌─────────────────────────────────────────┐
│ Histoire moderne                        │
└─────────────────────────────────────────┘

Nombre de séances prévues *
┌─────────────────────────────────────────┐
│ 5                    [- 5 +]            │
└─────────────────────────────────────────┘

Couleur
┌──────────────────────────────┐
│ 🟦 🟩 🟨 🟧 🟥 🟪 🟫 ⚫       │
└──────────────────────────────┘

Objectifs (optionnel)
[+ Ajouter un objectif]
• Comprendre les causes de la Révolution
• Analyser les phases de la Révolution

[ Annuler ]  [ Créer la séquence ]
```

---

### 3. **Écran : SequenceAssignmentScreen**

**Assigner les séquences aux séances générées :**

**Mode 1 : Vue Liste (Simple)**

```
┌─────────────────────────────────────────┐
│ 🎯 Assigner: La Révolution française   │
│ 5 séances à assigner                    │
└─────────────────────────────────────────┘

Sélectionnez 5 séances consécutives :

📅 Septembre 2025
┌─────────────────────────────────────────┐
│ ☐ Lun 01/09 • 14h00 • Histoire-Géo     │
│ ☐ Mer 03/09 • 14h00 • Histoire-Géo     │
│ ✓ Ven 05/09 • 14h00 • Histoire-Géo  ← 1│
│ ✓ Lun 08/09 • 14h00 • Histoire-Géo  ← 2│
│ ✓ Mer 10/09 • 14h00 • Histoire-Géo  ← 3│
│ ✓ Ven 12/09 • 14h00 • Histoire-Géo  ← 4│
│ ✓ Lun 15/09 • 14h00 • Histoire-Géo  ← 5│
│ ☐ Mer 17/09 • 14h00 • Histoire-Géo     │
└─────────────────────────────────────────┘

3/5 séances sélectionnées

[ Annuler ]  [ Valider l'assignation ]
```

**Mode 2 : Timeline Visuelle (Avancé)**

```
┌─────────────────────────────────────────┐
│ 📅 Timeline de l'Année                  │
└─────────────────────────────────────────┘

Sept Oct Nov Déc Jan Fév Mar Avr Mai Juin
│━━━│━━━│━━━│━━━│━━━│━━━│━━━│━━━│━━━│━━━│
│🟦🟦│🟦🟩│🟩🟩│   │   │   │   │   │   │   │
│🟦🟦│🟩🟩│🟨🟨│   │   │   │   │   │   │   │

Légende:
🟦 Séq1: Révolution (5)  🟩 Séq2: Empire (4)
🟨 Séq3: Restauration (3)  ⬜ Non assigné

[Glisser-déposer les séquences sur la timeline]

Séquences disponibles:
┌────────┐ ┌────────┐ ┌────────┐
│🟦 Séq1 │ │🟩 Séq2 │ │🟨 Séq3 │
│5 séan. │ │4 séan. │ │3 séan. │
└────────┘ └────────┘ └────────┘
```

---

### 4. **Écran : SessionListScreen (Amélioré)**

**Ajout de l'affichage des séquences :**

```
📅 Séances - 2nde A

🔍 [Filtrer]  [Vue: Liste ▾]

📚 Séquence 1 - La Révolution française
┌─────────────────────────────────────────┐
│ ✓ Ven 05/09 • 14h00-15h00 • Séance 1/5│
│   Intro: Les causes                    │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ ✓ Lun 08/09 • 14h00-15h00 • Séance 2/5│
│   1789: Les États Généraux             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ ⏳ Mer 10/09 • 14h00-15h00 • Séance 3/5│
│   La Terreur                           │
└─────────────────────────────────────────┘

📚 Séquence 2 - L'Empire napoléonien
┌─────────────────────────────────────────┐
│ ⏳ Ven 19/09 • 14h00-15h00 • Séance 1/4│
│   Non configurée                       │
└─────────────────────────────────────────┘

⬜ Séances non assignées (90)
┌─────────────────────────────────────────┐
│ ⏳ Lun 01/09 • 14h00-15h00             │
└─────────────────────────────────────────┘
```

---

## 🛠️ Fonctionnalités Détaillées

### A. Création de Séquences

**Interface Simple :**
1. Bouton "➕ Créer une séquence"
2. Form avec :
   - Nom (requis)
   - Description
   - Nombre de séances (stepper +/-)
   - Couleur (8 couleurs prédéfinies)
   - Thème (optionnel)
3. Sauvegarde → Ajout à la liste

**Interface Avancée (optionnel):**
- Import depuis un modèle de programme
- Objectifs pédagogiques (liste)
- Ressources/documents liés

---

### B. Assignation aux Séances

**Méthode 1 : Sélection Manuelle (MVP)**
1. Tap sur une séquence
2. Voir la liste de toutes les séances
3. Sélectionner X séances (nombre = sessionCount)
4. Option "Sélection rapide" : prendre les X prochaines séances libres
5. Validation → Lien créé en base

**Méthode 2 : Auto-assignation (Plus tard)**
1. Bouton "Répartir automatiquement"
2. L'algo prend les séquences dans l'ordre
3. Assigne séquentiellement aux séances générées
4. Respecte les vacances (ne coupe pas une séquence)

**Méthode 3 : Timeline Drag & Drop (Futur)**
1. Vue calendrier annuel
2. Drag séquences sur la timeline
3. Visual feedback en temps réel
4. Contraintes : pas de chevauchement

---

### C. Visualisation et Suivi

**Indicateurs :**
- % de progression globale
- Séquences complétées / totales
- Séances assignées / totales
- Timeline colorée par séquence

**Filtres :**
- Par statut (planned/in-progress/completed)
- Par thème
- Par période

**Export (bonus) :**
- PDF avec progression
- Calendrier partageable

---

## 🗂️ Structure Technique

### Base de Données

```sql
-- Table sequences
CREATE TABLE sequences (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  session_count INTEGER NOT NULL,
  theme TEXT,
  objectives TEXT, -- JSON array
  resources TEXT,  -- JSON array
  status TEXT DEFAULT 'planned',
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Table session_sequences (liaison)
CREATE TABLE session_sequences (
  session_id TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  order_in_sequence INTEGER NOT NULL,
  PRIMARY KEY (session_id, sequence_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_sequences_class ON sequences(class_id);
CREATE INDEX idx_session_sequences_sequence ON session_sequences(sequence_id);
```

---

### Services

```typescript
// sequenceService.ts
- create(data: SequenceFormData): Promise<Sequence>
- getByClass(classId: string): Promise<Sequence[]>
- update(id: string, data: Partial<SequenceFormData>)
- delete(id: string)
- reorder(classId: string, newOrder: string[]) // Drag & drop

// sessionSequenceService.ts
- assignSessionsToSequence(sequenceId, sessionIds): Promise<void>
- getSessionsBySequence(sequenceId): Promise<Session[]>
- getSequenceBySession(sessionId): Promise<Sequence | null>
- unassignSession(sessionId)
- autoAssignSequences(classId): Promise<void> // Auto-répartition
```

---

## 🎯 Workflow Utilisateur Complet

### Scénario : Prof de 2nde en Histoire-Géo

**Étape 1 : Génération des séances (déjà fait)**
```
ClassDetail → Wizard → Générer 120 séances
```

**Étape 2 : Création du programme**
```
ClassDetail → Carte "Séquences" → SequencePlanningScreen
  
Créer 8 séquences :
1. Révolution française (5 séances)
2. Empire napoléonien (4 séances)
3. Restauration (3 séances)
4. Monarchie de Juillet (3 séances)
5. Seconde République (4 séances)
6. Second Empire (4 séances)
7. IIIe République (5 séances)
8. Guerres mondiales (6 séances)
```

**Étape 3 : Assignation rapide**
```
Séquence 1 → "Assigner" → Sélection rapide
  → Prend automatiquement les 5 premières séances

Séquence 2 → "Assigner" → Sélection rapide
  → Prend les 4 suivantes

etc.
```

**Étape 4 : Ajustements manuels**
```
Timeline → Voir répartition
Drag & drop pour déplacer si nécessaire
```

**Étape 5 : Utilisation quotidienne**
```
SessionList → Voir séances groupées par séquence
Tap séance → Voir "Séance 3/5 de Révolution française"
Progression visuelle : ▓▓▓░░
```

---

## 🚀 Plan d'Implémentation

### Phase 1 : MVP (2-3h)
- ✅ Types `sequence.ts`
- ✅ Table + migrations
- ✅ `sequenceService.ts` CRUD basique
- ✅ `SequenceFormDialog` création simple
- ✅ `SequencePlanningScreen` liste
- ✅ Assignation manuelle simple

### Phase 2 : Assignation (1-2h)
- ✅ `SequenceAssignmentScreen` sélection
- ✅ Auto-assignation séquentielle
- ✅ Affichage dans `SessionListScreen`

### Phase 3 : Visualisation (1-2h)
- ✅ Timeline colorée
- ✅ Statistiques de progression
- ✅ Filtres et recherche

### Phase 4 : Avancé (optionnel)
- ⏳ Import programmes ministère
- ⏳ Drag & drop timeline
- ⏳ Export PDF

---

## 💡 Proposition UX Finale

**Interface la plus simple et visuelle :**

1. **Écran "Séquences"** : Liste cards colorées avec progression
2. **Création** : Dialog rapide (nom + nb séances + couleur)
3. **Assignation** : Bouton "Auto-assigner" intelligent qui répartit tout
4. **Ajustement** : Liste des séances avec possibilité de déplacer
5. **Visualisation** : Timeline mensuelle colorée

**Pas besoin de drag & drop complexe au début !**
→ Sélection simple + auto-assignation = 90% des besoins

---

## ✅ Avantages

- 📊 **Vision claire** du programme annuel
- 🎨 **Visuel** avec couleurs par séquence
- ⚡ **Rapide** à configurer (auto-assignation)
- 📱 **Mobile-friendly** (pas besoin de drag & drop)
- 🔄 **Flexible** (réassignation facile)
- 📈 **Suivi** de progression en temps réel

---

**Qu'en pensez-vous ? On démarre avec la Phase 1 MVP ?** 🚀
