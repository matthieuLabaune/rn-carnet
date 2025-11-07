module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-paper)'
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
        '!**/__tests__/**',
        '!**/coverage/**',
        '!utils/predefinedCompetences.ts',
        '!utils/seedData.ts'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    globals: {
        'ts-jest': {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
            }
        }
    }
};
