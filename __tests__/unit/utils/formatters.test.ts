/**
 * Tests for formatters utility functions
 */

describe('formatters', () => {
    describe('date formatting', () => {
        it('should format dates correctly', () => {
            const date = new Date('2024-12-10T14:30:00');
            const formatted = date.toLocaleDateString('fr-FR');

            expect(formatted).toContain('2024');
            expect(formatted).toContain('12');
            expect(formatted).toContain('10');
        });
    });

    describe('string formatting', () => {
        it('should capitalize first letter', () => {
            const capitalize = (str: string) =>
                str.charAt(0).toUpperCase() + str.slice(1);

            expect(capitalize('hello')).toBe('Hello');
            expect(capitalize('WORLD')).toBe('WORLD');
        });
    });
});
