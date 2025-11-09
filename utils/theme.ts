export const COLORS = {
    primary: '#007AFF',
    accent: '#5856D6',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
};

export const lightTheme = {
    // Background colors
    background: '#e5e5e5',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',

    // Text colors
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textPlaceholder: '#cccccc',

    // Border colors
    border: '#f0f0f0',
    borderStrong: '#e0e0e0',

    // Card colors
    cardBackground: '#ffffff',
    cardShadow: 'rgba(0, 0, 0, 0.05)',

    // Input colors
    inputBackground: '#f5f5f5',
    inputBorder: '#e0e0e0',

    // Tag colors
    tagHandicap: '#FEE2E2',
    tagHandicapText: '#DC2626',
    tagLaterality: '#E0F2FE',
    tagLateralityText: '#1565C0',
    tagCustom: '#F3E5F5',
    tagCustomText: '#6A1B9A',

    // Status bar
    statusBarStyle: 'dark-content' as 'dark-content' | 'light-content',

    // Common colors
    ...COLORS,
};

export const darkTheme = {
    // Background colors
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceVariant: '#2a2a2a',

    // Text colors
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    textTertiary: '#707070',
    textPlaceholder: '#505050',

    // Border colors
    border: '#2a2a2a',
    borderStrong: '#3a3a3a',

    // Card colors
    cardBackground: '#1a1a1a',
    cardShadow: 'rgba(0, 0, 0, 0.3)',

    // Input colors
    inputBackground: '#2a2a2a',
    inputBorder: '#3a3a3a',

    // Tag colors
    tagHandicap: '#3a1a1a',
    tagHandicapText: '#ff6b6b',
    tagLaterality: '#1a2a3a',
    tagLateralityText: '#6bb6ff',
    tagCustom: '#2a1a3a',
    tagCustomText: '#b56bff',

    // Status bar
    statusBarStyle: 'light-content' as 'dark-content' | 'light-content',

    // Common colors
    ...COLORS,
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';
