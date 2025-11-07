# 🧪 Guide de Tests - RN-Carnet

## Stack de Tests

### Tests Unitaires & Fonctionnels
- **Jest** - Framework de test (standard React Native)
- **@testing-library/react-native** - Tests de composants
- **@testing-library/jest-native** - Matchers additionnels

### Tests E2E (Optionnel)
- **Detox** - Tests end-to-end sur simulateur

---

## 🚀 Installation

```bash
# Tests unitaires et fonctionnels
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo

# Matchers supplémentaires
npm install --save-dev @types/jest

# Configuration TypeScript pour tests
npm install --save-dev ts-jest @types/testing-library__react-native
```

---

## ⚙️ Configuration

### jest.config.js
```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'screens/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
```

### jest.setup.js
```javascript
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    closeAsync: jest.fn(),
  })),
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const RealModule = jest.requireActual('react-native-paper');
  return {
    ...RealModule,
    Portal: ({ children }) => children,
  };
});

// Global test timeout
jest.setTimeout(10000);
```

---

## 📝 Structure des Tests

```
__tests__/
├── unit/
│   ├── services/
│   │   ├── classService.test.ts
│   │   ├── studentService.test.ts
│   │   ├── sessionService.test.ts
│   │   ├── evaluationService.test.ts
│   │   └── competenceService.test.ts
│   ├── utils/
│   │   ├── formatters.test.ts
│   │   └── constants.test.ts
│   └── types/
│       └── validation.test.ts
├── functional/
│   ├── screens/
│   │   ├── HomeScreen.test.tsx
│   │   ├── ClassDetailScreen.test.tsx
│   │   ├── SessionDetailScreen.test.tsx
│   │   └── EvaluationDetailScreen.test.tsx
│   └── components/
│       ├── ClassFormDialog.test.tsx
│       ├── SessionFormDialog.test.tsx
│       └── EvaluationFormDialog.test.tsx
└── integration/
    ├── evaluation-workflow.test.ts
    ├── session-workflow.test.ts
    └── class-management.test.ts
```

---

## 🎯 Exemples de Tests

### Test Unitaire - Service

```typescript
// __tests__/unit/services/classService.test.ts
import { classService } from '@/services/classService';
import { openDatabaseAsync } from 'expo-sqlite';

describe('ClassService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };
    (openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('getAll', () => {
    it('should return all classes', async () => {
      const mockClasses = [
        { id: '1', name: 'CE1', level: 'CE1', color: '#FF0000' },
        { id: '2', name: 'CE2', level: 'CE2', color: '#00FF00' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockClasses);

      const result = await classService.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('CE1');
    });

    it('should handle empty results', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await classService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new class', async () => {
      const newClass = {
        id: 'new-id',
        name: 'CM1',
        level: 'CM1',
        subject: 'Mathématiques',
        color: '#0000FF',
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await classService.create(newClass);

      expect(result.name).toBe('CM1');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO classes'),
        expect.arrayContaining(['new-id', 'CM1', 'CM1'])
      );
    });
  });
});
```

### Test Fonctionnel - Composant

```typescript
// __tests__/functional/components/ClassFormDialog.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ClassFormDialog from '@/components/ClassFormDialog';
import { ThemeProvider } from '@/contexts/ThemeContext';

const mockOnSave = jest.fn();
const mockOnDismiss = jest.fn();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ClassFormDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create dialog', () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(
      <ClassFormDialog
        visible={true}
        onSave={mockOnSave}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Créer une classe')).toBeTruthy();
    expect(getByPlaceholderText('Ex: CM1 - Les explorateurs')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    const { getByText } = renderWithTheme(
      <ClassFormDialog
        visible={true}
        onSave={mockOnSave}
        onDismiss={mockOnDismiss}
      />
    );

    const saveButton = getByText('Créer');
    fireEvent.press(saveButton);

    // Should show error and not call onSave
    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  it('should create a class with valid data', async () => {
    const { getByPlaceholderText, getByText } = renderWithTheme(
      <ClassFormDialog
        visible={true}
        onSave={mockOnSave}
        onDismiss={mockOnDismiss}
      />
    );

    const nameInput = getByPlaceholderText('Ex: CM1 - Les explorateurs');
    fireEvent.changeText(nameInput, 'CM1 - Mathématiques');

    const levelButton = getByText('CM1');
    fireEvent.press(levelButton);

    const saveButton = getByText('Créer');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CM1 - Mathématiques',
          level: 'CM1',
        })
      );
    });
  });
});
```

### Test d'Intégration - Workflow

```typescript
// __tests__/integration/evaluation-workflow.test.ts
import { evaluationService } from '@/services/evaluationService';
import { competenceService } from '@/services/competenceService';
import { evaluationResultService } from '@/services/evaluationResultService';

describe('Evaluation Workflow', () => {
  it('should complete full evaluation cycle', async () => {
    // 1. Create competences
    const mathComp = await competenceService.create({
      id: 'comp-1',
      nom: 'Calcul mental',
      domaine: 'Mathématiques',
      couleur: '#FF0000',
      isPredefined: false,
    });

    // 2. Create evaluation
    const evaluation = await evaluationService.create({
      id: 'eval-1',
      classId: 'class-1',
      titre: 'Contrôle Maths',
      date: new Date().toISOString(),
      type: 'sommative',
      notationSystem: 'points',
      maxPoints: 20,
      competenceIds: [mathComp.id],
      isHomework: false,
    });

    // 3. Grade students
    await evaluationResultService.upsert({
      id: 'result-1',
      evaluationId: evaluation.id,
      studentId: 'student-1',
      competenceId: mathComp.id,
      score: 15,
    });

    // 4. Retrieve results
    const results = await evaluationResultService.getByEvaluationId(evaluation.id);

    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(15);
  });

  it('should calculate student total correctly', async () => {
    // Test de calcul du total avec plusieurs compétences
    const comp1 = await competenceService.create({
      id: 'comp-1',
      nom: 'Algèbre',
      domaine: 'Mathématiques',
      couleur: '#FF0000',
      isPredefined: false,
    });

    const comp2 = await competenceService.create({
      id: 'comp-2',
      nom: 'Géométrie',
      domaine: 'Mathématiques',
      couleur: '#00FF00',
      isPredefined: false,
    });

    const evaluation = await evaluationService.create({
      id: 'eval-1',
      classId: 'class-1',
      titre: 'Contrôle Maths',
      date: new Date().toISOString(),
      type: 'sommative',
      notationSystem: 'points',
      maxPoints: 20,
      competenceIds: [comp1.id, comp2.id],
      isHomework: false,
    });

    // Grade on both competences
    await evaluationResultService.upsert({
      id: 'result-1',
      evaluationId: evaluation.id,
      studentId: 'student-1',
      competenceId: comp1.id,
      score: 15,
    });

    await evaluationResultService.upsert({
      id: 'result-2',
      evaluationId: evaluation.id,
      studentId: 'student-1',
      competenceId: comp2.id,
      score: 18,
    });

    const results = await evaluationResultService.getByEvaluationId(evaluation.id);
    const total = results
      .filter(r => r.studentId === 'student-1')
      .reduce((sum, r) => sum + (r.score || 0), 0);

    expect(total).toBe(33);
  });
});
```

---

## 🏃 Exécution des Tests

### Scripts package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest __tests__/unit",
    "test:functional": "jest __tests__/functional",
    "test:integration": "jest __tests__/integration",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### Commandes

```bash
# Tous les tests
npm test

# Mode watch (comme PEST --watch)
npm run test:watch

# Coverage
npm run test:coverage

# Tests spécifiques
npm run test:unit
npm test -- classService
npm test -- --testPathPattern=evaluation
```

---

## 📊 Coverage Goals

- **Services**: > 80%
- **Utils**: > 90%
- **Components**: > 70%
- **Screens**: > 60%

---

## ✅ Checklist Tests Prioritaires

### Services (Unitaires)
- [ ] classService.test.ts
- [ ] studentService.test.ts
- [ ] sessionService.test.ts
- [ ] evaluationService.test.ts
- [ ] competenceService.test.ts
- [ ] evaluationResultService.test.ts

### Utils (Unitaires)
- [ ] formatters.test.ts (dates, notes)
- [ ] constants.test.ts
- [ ] seedData.test.ts

### Components (Fonctionnels)
- [ ] ClassFormDialog.test.tsx
- [ ] StudentFormDialog.test.tsx
- [ ] SessionFormDialog.test.tsx
- [ ] EvaluationFormDialog.test.tsx

### Screens (Fonctionnels)
- [ ] HomeScreen.test.tsx
- [ ] ClassDetailScreen.test.tsx
- [ ] EvaluationDetailScreen.test.tsx (grille éditable)

### Workflows (Intégration)
- [ ] evaluation-workflow.test.ts
- [ ] session-workflow.test.ts
- [ ] class-management-workflow.test.ts

---

**Prochaine étape** : Voulez-vous que je configure Jest et crée les premiers tests ?
