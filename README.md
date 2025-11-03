# 📱 RN-Carnet

> Assistant pédagogique personnel pour enseignants

Une application mobile React Native qui aide les professeurs à gérer leurs classes, élèves, séances et à structurer leurs cours avec des timers pédagogiques.

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Lancement en développement
npm start

# Lancement sur iOS
npm run ios

# Lancement sur Android
npm run android
```

## 🎯 Fonctionnalités MVP

✅ **Gestion des classes**
- Créer, modifier, supprimer des classes
- Attribution de couleurs personnalisées
- Vue d'ensemble de toutes les classes

✅ **Gestion des élèves**
- Ajouter des élèves par classe
- Liste alphabétique
- Notes et remarques

✅ **Séances pédagogiques**
- Créer et planifier des séances
- Timer prédéfini (50 min en 4 étapes)
- Suivi de progression visuel
- Historique complet

✅ **Accessibilité**
- Mode clair/sombre
- Support des lecteurs d'écran
- Navigation au clavier
- Contraste WCAG AA

## 📚 Documentation

- [Spécifications techniques](./docs/SPECIFICATIONS.md)
- [User Stories](./docs/USER_STORIES.md)
- [Scénarios d'utilisation](./docs/SCENARIOS.md)

## 🛠 Stack technique

- **Framework**: React Native + Expo
- **Langage**: TypeScript
- **Navigation**: expo-router
- **UI**: React Native Paper (Material Design)
- **Storage**: expo-sqlite + AsyncStorage
- **Plateformes**: iOS 13+ / Android 6.0+

## 📁 Structure du projet

```
rn-carnet/
├── app/                # Routes (expo-router)
│   ├── (tabs)/        # Navigation par onglets
│   ├── class/         # Pages des classes
│   └── session/       # Pages des séances
├── components/        # Composants réutilisables
├── services/          # Logique métier & database
├── types/            # Définitions TypeScript
├── utils/            # Utilitaires & thème
└── docs/             # Documentation
```

## 🎨 Design

L'application utilise Material Design via React Native Paper avec:
- Thème personnalisable (couleurs par classe)
- Mode clair/sombre automatique
- Palette de couleurs accessible (WCAG AA)
- Animations fluides et feedback visuel

## 📊 Modèle de données

### Classes
```typescript
{
  id: string
  name: string
  level: string
  subject?: string
  color: string
  studentCount: number
}
```

### Élèves
```typescript
{
  id: string
  classId: string
  firstName: string
  lastName: string
  notes?: string
}
```

### Séances
```typescript
{
  id: string
  classId: string
  subject: string
  description?: string
  date: string
  duration: number
  status: 'planned' | 'in_progress' | 'completed'
  timerPreset?: TimerPreset
}
```

## ⏱️ Timer pédagogique

Preset par défaut (50 minutes):
1. **Exercice** - 10 min (bleu)
2. **Explications** - 15 min (vert)
3. **Recherche** - 10 min (orange)
4. **Synthèse** - 15 min (violet)

Fonctionnalités:
- Transitions automatiques avec vibration
- Barre de progression colorée
- Pause/reprise possible
- Sauvegarde de l'état

## 🔮 Roadmap

### Phase 1 - MVP ✅ (2h)
- [x] Structure du projet
- [x] Documentation complète
- [ ] Configuration de la base de données
- [ ] Écrans principaux
- [ ] Timer fonctionnel

### Phase 2 (1 semaine)
- [ ] Templates de séances personnalisables
- [ ] Export PDF des historiques
- [ ] Statistiques avancées
- [ ] QR codes pour présence

### Phase 3 (1 mois)
- [ ] Vue calendrier / emploi du temps
- [ ] Synchronisation cloud (Supabase)
- [ ] Import CSV depuis Pronote
- [ ] Devoirs et activités

### Phase 4 (long terme)
- [ ] Fiches de révision auto-générées
- [ ] Partage de templates entre profs
- [ ] Mini-messagerie pédagogique
- [ ] Graphiques de progression élèves

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:coverage

# Linter
npm run lint
```

## 📦 Build

```bash
# Build de développement
eas build --platform all --profile development

# Build de production
eas build --platform all --profile production
```

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues!

## 📄 Licence

MIT © Matthieu Labaune

## 🙏 Remerciements

- React Native Paper pour le design system
- Expo pour la toolchain moderne
- La communauté des enseignants pour les retours

---

**Made with ❤️ for teachers**
