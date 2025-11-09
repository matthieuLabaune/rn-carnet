/**
 * Tests for constants utility
 */

import {
    SPACING,
    FONT_SIZES,
    BORDER_RADIUS,
    TIMER_DURATIONS,
    APP_CONFIG,
} from '../../../utils/constants';
import { COLORS } from '../../../utils/constants';

describe('constants', () => {
    describe('COLORS', () => {
        it('should have primary colors defined', () => {
            expect(COLORS.primary).toBeDefined();
            expect(COLORS.accent).toBeDefined();
            expect(COLORS.success).toBeDefined();
            expect(COLORS.warning).toBeDefined();
            expect(COLORS.error).toBeDefined();
            expect(COLORS.info).toBeDefined();
        });

        it('should have valid hex color format', () => {
            const hexColorRegex = /^#[0-9A-F]{6}$/i;
            expect(COLORS.primary).toMatch(hexColorRegex);
            expect(COLORS.accent).toMatch(hexColorRegex);
        });

        it('should have classColors array', () => {
            expect(Array.isArray(COLORS.classColors)).toBe(true);
            expect(COLORS.classColors.length).toBeGreaterThan(0);
        });

        it('should have all classColors in valid hex format', () => {
            const hexColorRegex = /^#[0-9A-F]{6}$/i;
            COLORS.classColors.forEach((color: string) => {
                expect(color).toMatch(hexColorRegex);
            });
        });

        it('should have timerColors defined', () => {
            expect(COLORS.timerColors).toBeDefined();
            expect(COLORS.timerColors.exercise).toBeDefined();
            expect(COLORS.timerColors.explanation).toBeDefined();
            expect(COLORS.timerColors.research).toBeDefined();
            expect(COLORS.timerColors.synthesis).toBeDefined();
        });
    });

    describe('SPACING', () => {
        it('should have all spacing values defined', () => {
            expect(SPACING.xs).toBe(4);
            expect(SPACING.sm).toBe(8);
            expect(SPACING.md).toBe(16);
            expect(SPACING.lg).toBe(24);
            expect(SPACING.xl).toBe(32);
            expect(SPACING.xxl).toBe(48);
        });

        it('should have values in ascending order', () => {
            expect(SPACING.xs).toBeLessThan(SPACING.sm);
            expect(SPACING.sm).toBeLessThan(SPACING.md);
            expect(SPACING.md).toBeLessThan(SPACING.lg);
            expect(SPACING.lg).toBeLessThan(SPACING.xl);
            expect(SPACING.xl).toBeLessThan(SPACING.xxl);
        });
    });

    describe('FONT_SIZES', () => {
        it('should have all font sizes defined', () => {
            expect(FONT_SIZES.xs).toBe(12);
            expect(FONT_SIZES.sm).toBe(14);
            expect(FONT_SIZES.md).toBe(16);
            expect(FONT_SIZES.lg).toBe(18);
            expect(FONT_SIZES.xl).toBe(24);
            expect(FONT_SIZES.xxl).toBe(32);
        });

        it('should have values in ascending order', () => {
            expect(FONT_SIZES.xs).toBeLessThan(FONT_SIZES.sm);
            expect(FONT_SIZES.sm).toBeLessThan(FONT_SIZES.md);
            expect(FONT_SIZES.md).toBeLessThan(FONT_SIZES.lg);
            expect(FONT_SIZES.lg).toBeLessThan(FONT_SIZES.xl);
            expect(FONT_SIZES.xl).toBeLessThan(FONT_SIZES.xxl);
        });
    });

    describe('BORDER_RADIUS', () => {
        it('should have all border radius values defined', () => {
            expect(BORDER_RADIUS.sm).toBe(4);
            expect(BORDER_RADIUS.md).toBe(8);
            expect(BORDER_RADIUS.lg).toBe(16);
            expect(BORDER_RADIUS.xl).toBe(24);
            expect(BORDER_RADIUS.round).toBe(999);
        });

        it('should have values in ascending order (except round)', () => {
            expect(BORDER_RADIUS.sm).toBeLessThan(BORDER_RADIUS.md);
            expect(BORDER_RADIUS.md).toBeLessThan(BORDER_RADIUS.lg);
            expect(BORDER_RADIUS.lg).toBeLessThan(BORDER_RADIUS.xl);
            expect(BORDER_RADIUS.xl).toBeLessThan(BORDER_RADIUS.round);
        });
    });

    describe('TIMER_DURATIONS', () => {
        it('should have all timer durations defined', () => {
            expect(TIMER_DURATIONS.default).toBe(50);
            expect(TIMER_DURATIONS.short).toBe(30);
            expect(TIMER_DURATIONS.long).toBe(90);
        });

        it('should have positive values', () => {
            expect(TIMER_DURATIONS.default).toBeGreaterThan(0);
            expect(TIMER_DURATIONS.short).toBeGreaterThan(0);
            expect(TIMER_DURATIONS.long).toBeGreaterThan(0);
        });

        it('should have logical duration order', () => {
            expect(TIMER_DURATIONS.short).toBeLessThan(TIMER_DURATIONS.default);
            expect(TIMER_DURATIONS.default).toBeLessThan(TIMER_DURATIONS.long);
        });
    });

    describe('APP_CONFIG', () => {
        it('should have name defined', () => {
            expect(APP_CONFIG.name).toBeDefined();
            expect(typeof APP_CONFIG.name).toBe('string');
            expect(APP_CONFIG.name.length).toBeGreaterThan(0);
        });

        it('should have version defined', () => {
            expect(APP_CONFIG.version).toBeDefined();
            expect(typeof APP_CONFIG.version).toBe('string');
            expect(APP_CONFIG.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        it('should have description defined', () => {
            expect(APP_CONFIG.description).toBeDefined();
            expect(typeof APP_CONFIG.description).toBe('string');
            expect(APP_CONFIG.description.length).toBeGreaterThan(0);
        });
    });
});
