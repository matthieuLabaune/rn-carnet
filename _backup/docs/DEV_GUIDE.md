# Guide de Développement - RN-Carnet

## 🚀 Démarrage

### Installation
```bash
npm install --legacy-peer-deps
```

### Lancement
```bash
npm start
```

Puis scannez le QR code avec :
- iOS : Expo Go app
- Android : Expo Go app
- Web : Appuyez sur 'w' dans le terminal

## 📱 Structure actuelle

### ✅ Créé et fonctionnel
- **Documentation complète** (SPECIFICATIONS.md, USER_STORIES.md, SCENARIOS.md)
- **Types TypeScript** (Class, Student, Session, Settings)
- **Services** (Database SQLite, CRUD pour toutes les entités)
- **Utilitaires** (Constants, Theme, Formatters)
- **Navigation** (expo-router avec 3 onglets)
- **Écrans de base** (Classes, Historique, Paramètres)

### 🚧 À développer

1. **Formulaire de création de classe**
   - Modal ou écran avec TextInput
   - Sélecteur de couleur
   - Validation et sauvegarde

2. **Détail d'une classe**
   - Liste des élèves
   - Ajout/suppression d'élèves
   - Bouton "Nouvelle séance"

3. **Formulaire de nouvelle séance**
   - Sujet et description
   - Sélection du preset de timer
   - Création et démarrage

4. **Timer pédagogique** (Composant principal MVP)
   - Affichage du temps restant
   - Progression entre les étapes
   - Barre de progression colorée
   - Vibration aux transitions
   - Pause/Reprise/Stop

5. **Historique**
   - Liste des séances passées
   - Filtrage par classe
   - Statistiques basiques

## 🎨 Composants à créer

### ClassCard.tsx
Carte affichant une classe avec :
- Nom, niveau, matière
- Couleur de fond
- Nombre d'élèves
- Action onPress

### StudentCard.tsx
Carte affichant un élève avec :
- Prénom Nom
- Notes optionnelles
- Actions (modifier, supprimer)

### SessionTimer.tsx
Le composant le plus important :
- Timer avec compte à rebours
- 4 étapes prédéfinies
- Barre de progression
- Contrôles (Play, Pause, Stop)

### FormDialog.tsx
Modal réutilisable pour les formulaires

## 📊 Base de données

La base SQLite est initialisée automatiquement au démarrage dans `app/_layout.tsx`.

Tables créées :
- `classes`
- `students`
- `sessions`

Les services sont prêts à l'emploi :
```typescript
import { classService, studentService, sessionService } from '../services';

// Créer une classe
const newClass = await classService.create({
  name: '6ème A',
  level: '6ème',
  subject: 'Mathématiques',
  color: '#2196F3',
});

// Lister les classes
const classes = await classService.getAll();

// Ajouter un élève
const student = await studentService.create({
  classId: 'class_123',
  firstName: 'Sophie',
  lastName: 'Martin',
});
```

## 🎯 Prochaines étapes (ordre de priorité)

1. ✅ Structure de base → **FAIT**
2. 📝 Créer le formulaire de classe
3. 👥 Ajouter la gestion des élèves
4. ⏱️ Implémenter le timer pédagogique
5. 📖 Finaliser l'historique
6. ⚙️ Ajouter les paramètres (thème)

## 🐛 Debug

Pour voir les logs de la base de données :
```typescript
console.log('Classes:', await classService.getAll());
```

Pour réinitialiser la DB :
```typescript
import { resetDatabase } from '../services/database';
await resetDatabase();
```

## 📝 Notes importantes

- Le thème clair/sombre s'adapte automatiquement au système
- Toutes les couleurs respectent WCAG AA pour l'accessibilité
- Les services gèrent automatiquement les timestamps
- Les relations CASCADE sont configurées (supprimer une classe = supprimer ses élèves et séances)

## 🎨 Design tokens disponibles

```typescript
import { COLORS, SPACING, FONT_SIZES } from '../utils';

// Couleurs
COLORS.primary
COLORS.classColors[0..9]

// Espacement
SPACING.xs, sm, md, lg, xl, xxl

// Tailles de police
FONT_SIZES.xs, sm, md, lg, xl, xxl
```

## 🚀 Pour build en production

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

Bon développement ! 🎓📱
