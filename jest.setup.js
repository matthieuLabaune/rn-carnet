// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo', () => ({
    ...jest.requireActual('expo'),
}));

// Mock expo-sqlite
const mockDb = {
    execAsync: jest.fn(() => Promise.resolve()),
    runAsync: jest.fn(() => Promise.resolve({ changes: 1, lastInsertRowId: 1 })),
    getFirstAsync: jest.fn(() => Promise.resolve(null)),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    closeAsync: jest.fn(() => Promise.resolve()),
    prepareAsync: jest.fn(() => Promise.resolve({
        executeAsync: jest.fn(() => Promise.resolve({ changes: 1 })),
        finalizeAsync: jest.fn(() => Promise.resolve()),
    })),
};

jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
}));

// Make mockDb available globally for tests
global.mockDb = mockDb;

// Mock react-native-paper Portal
jest.mock('react-native-paper', () => {
    const RealModule = jest.requireActual('react-native-paper');
    return {
        ...RealModule,
        Portal: ({ children }) => children,
    };
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: 'MaterialCommunityIcons',
    Ionicons: 'Ionicons',
}));

// Global test timeout
jest.setTimeout(10000);
