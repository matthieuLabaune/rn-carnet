import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { COLORS } from './constants';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.accent,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.accent,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
  },
};

export type AppTheme = typeof lightTheme;
