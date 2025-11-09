/**
 * Tests for theme utility
 */

import { COLORS, lightTheme, darkTheme } from '../../../utils/theme';

describe('theme', () => {
    describe('COLORS', () => {
        it('should have primary colors defined', () => {
            expect(COLORS.primary).toBeDefined();
            expect(COLORS.accent).toBeDefined();
            expect(COLORS.error).toBeDefined();
            expect(COLORS.success).toBeDefined();
            expect(COLORS.warning).toBeDefined();
        });

        it('should have valid hex color format', () => {
            const hexColorRegex = /^#[0-9A-F]{6}$/i;
            expect(COLORS.primary).toMatch(hexColorRegex);
            expect(COLORS.accent).toMatch(hexColorRegex);
            expect(COLORS.error).toMatch(hexColorRegex);
            expect(COLORS.success).toMatch(hexColorRegex);
            expect(COLORS.warning).toMatch(hexColorRegex);
        });
    });

    describe('lightTheme', () => {
        it('should have background colors defined', () => {
            expect(lightTheme.background).toBeDefined();
            expect(lightTheme.surface).toBeDefined();
            expect(lightTheme.surfaceVariant).toBeDefined();
        });

        it('should have text colors defined', () => {
            expect(lightTheme.text).toBeDefined();
            expect(lightTheme.textSecondary).toBeDefined();
            expect(lightTheme.textTertiary).toBeDefined();
            expect(lightTheme.textPlaceholder).toBeDefined();
        });

        it('should have border colors defined', () => {
            expect(lightTheme.border).toBeDefined();
            expect(lightTheme.borderStrong).toBeDefined();
        });

        it('should have card colors defined', () => {
            expect(lightTheme.cardBackground).toBeDefined();
            expect(lightTheme.cardShadow).toBeDefined();
        });

        it('should have input colors defined', () => {
            expect(lightTheme.inputBackground).toBeDefined();
            expect(lightTheme.inputBorder).toBeDefined();
        });

        it('should have tag colors defined', () => {
            expect(lightTheme.tagHandicap).toBeDefined();
            expect(lightTheme.tagHandicapText).toBeDefined();
            expect(lightTheme.tagLaterality).toBeDefined();
            expect(lightTheme.tagLateralityText).toBeDefined();
            expect(lightTheme.tagCustom).toBeDefined();
            expect(lightTheme.tagCustomText).toBeDefined();
        });

        it('should have statusBarStyle defined', () => {
            expect(lightTheme.statusBarStyle).toBeDefined();
            expect(['dark-content', 'light-content']).toContain(lightTheme.statusBarStyle);
        });

        it('should include COLORS', () => {
            expect(lightTheme.primary).toBe(COLORS.primary);
            expect(lightTheme.accent).toBe(COLORS.accent);
            expect(lightTheme.error).toBe(COLORS.error);
            expect(lightTheme.success).toBe(COLORS.success);
            expect(lightTheme.warning).toBe(COLORS.warning);
        });

        it('should have light background color', () => {
            expect(lightTheme.background).toMatch(/^#[fF]/);
        });
    });

    describe('darkTheme', () => {
        it('should have background colors defined', () => {
            expect(darkTheme.background).toBeDefined();
            expect(darkTheme.surface).toBeDefined();
            expect(darkTheme.surfaceVariant).toBeDefined();
        });

        it('should have text colors defined', () => {
            expect(darkTheme.text).toBeDefined();
            expect(darkTheme.textSecondary).toBeDefined();
            expect(darkTheme.textTertiary).toBeDefined();
            expect(darkTheme.textPlaceholder).toBeDefined();
        });

        it('should have border colors defined', () => {
            expect(darkTheme.border).toBeDefined();
            expect(darkTheme.borderStrong).toBeDefined();
        });

        it('should have card colors defined', () => {
            expect(darkTheme.cardBackground).toBeDefined();
            expect(darkTheme.cardShadow).toBeDefined();
        });

        it('should have input colors defined', () => {
            expect(darkTheme.inputBackground).toBeDefined();
            expect(darkTheme.inputBorder).toBeDefined();
        });

        it('should have tag colors defined', () => {
            expect(darkTheme.tagHandicap).toBeDefined();
            expect(darkTheme.tagHandicapText).toBeDefined();
            expect(darkTheme.tagLaterality).toBeDefined();
            expect(darkTheme.tagLateralityText).toBeDefined();
            expect(darkTheme.tagCustom).toBeDefined();
            expect(darkTheme.tagCustomText).toBeDefined();
        });

        it('should have statusBarStyle defined', () => {
            expect(darkTheme.statusBarStyle).toBeDefined();
            expect(['dark-content', 'light-content']).toContain(darkTheme.statusBarStyle);
        });

        it('should include COLORS', () => {
            expect(darkTheme.primary).toBe(COLORS.primary);
            expect(darkTheme.accent).toBe(COLORS.accent);
            expect(darkTheme.error).toBe(COLORS.error);
            expect(darkTheme.success).toBe(COLORS.success);
            expect(darkTheme.warning).toBe(COLORS.warning);
        });

        it('should have dark background color', () => {
            expect(darkTheme.background).toMatch(/^#0/);
        });

        it('should have different colors than lightTheme', () => {
            expect(darkTheme.background).not.toBe(lightTheme.background);
            expect(darkTheme.text).not.toBe(lightTheme.text);
        });
    });

    describe('theme consistency', () => {
        it('should have same structure for both themes', () => {
            const lightKeys = Object.keys(lightTheme).sort();
            const darkKeys = Object.keys(darkTheme).sort();

            expect(lightKeys).toEqual(darkKeys);
        });
    });
});
