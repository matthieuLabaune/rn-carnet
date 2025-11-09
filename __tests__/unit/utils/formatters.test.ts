/**
 * Tests for formatters utility functions
 */

import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  getRelativeTime,
} from '../../../utils/formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-12-10T14:30:00');
      const formatted = formatDate(date);

      expect(formatted).toBe('10/12/2024');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toBe('15/01/2024');
    });

    it('should handle ISO format', () => {
      const formatted = formatDate('2024-03-20T10:30:00.000Z');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('03');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-12-10T14:30:00');
      const formatted = formatTime(date);

      expect(formatted).toBe('14:30');
    });

    it('should handle string dates', () => {
      const formatted = formatTime('2024-01-15T09:05:00');
      expect(formatted).toBe('09:05');
    });

    it('should format midnight correctly', () => {
      const formatted = formatTime('2024-01-15T00:00:00');
      expect(formatted).toBe('00:00');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const date = new Date('2024-12-10T14:30:00');
      const formatted = formatDateTime(date);

      expect(formatted).toContain('10/12/2024');
      expect(formatted).toContain('14:30');
    });

    it('should handle string dates', () => {
      const formatted = formatDateTime('2024-01-15T09:05:00');
      expect(formatted).toContain('15/01/2024');
      expect(formatted).toContain('09:05');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(45)).toBe('45 min');
      expect(formatDuration(5)).toBe('5 min');
      expect(formatDuration(1)).toBe('1 min');
    });

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1 h');
      expect(formatDuration(120)).toBe('2 h');
      expect(formatDuration(180)).toBe('3 h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1 h 30 min');
      expect(formatDuration(135)).toBe('2 h 15 min');
      expect(formatDuration(65)).toBe('1 h 5 min');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0 min');
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-12-10T14:30:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "À l\'instant" for recent times', () => {
      const date = new Date('2024-12-10T14:29:50');
      expect(getRelativeTime(date)).toBe('À l\'instant');
    });

    it('should return minutes for times less than an hour', () => {
      const date = new Date('2024-12-10T14:00:00');
      expect(getRelativeTime(date)).toBe('Il y a 30 min');
    });

    it('should return hours for times less than a day', () => {
      const date = new Date('2024-12-10T12:30:00');
      expect(getRelativeTime(date)).toBe('Il y a 2 h');
    });

    it('should return "Hier" for yesterday', () => {
      const date = new Date('2024-12-09T14:30:00');
      expect(getRelativeTime(date)).toBe('Hier');
    });

    it('should return days for times less than a week', () => {
      const date = new Date('2024-12-08T14:30:00');
      expect(getRelativeTime(date)).toBe('Il y a 2 jours');
    });

    it('should return formatted date for older times', () => {
      const date = new Date('2024-12-01T14:30:00');
      expect(getRelativeTime(date)).toBe('01/12/2024');
    });
  });
});
