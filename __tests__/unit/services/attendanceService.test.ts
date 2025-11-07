jest.mock('../../../services/database', () => ({
  initDatabase: jest.fn(),
  getDatabase: jest.fn(() => global.mockDb),
  closeDatabase: jest.fn(),
  resetDatabase: jest.fn(),
}));

import { attendanceService } from '../../../services/attendanceService';

declare global {
  var mockDb: any;
}

describe('attendanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBySession', () => {
    it('should return all attendances for a session', async () => {
      global.mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'att-1',
          session_id: 'session-1',
          student_id: 'student-1',
          present: 1,
          late: 0,
          late_minutes: null,
          notes: null,
          created_at: '2024-01-01',
        },
        {
          id: 'att-2',
          session_id: 'session-1',
          student_id: 'student-2',
          present: 0,
          late: 0,
          late_minutes: null,
          notes: 'Absent justifié',
          created_at: '2024-01-01',
        },
      ]);

      const result = await attendanceService.getBySession('session-1');

      expect(result).toHaveLength(2);
      expect(result[0].present).toBe(true);
      expect(result[0].late).toBe(false);
      expect(result[1].present).toBe(false);
      expect(result[1].notes).toBe('Absent justifié');
      expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE session_id = ?'),
        ['session-1']
      );
    });

    it('should return empty array when no attendances exist', async () => {
      global.mockDb.getAllAsync.mockResolvedValue([]);

      const result = await attendanceService.getBySession('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getByStudent', () => {
    it('should return all attendances for a student', async () => {
      global.mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'att-1',
          session_id: 'session-1',
          student_id: 'student-1',
          present: 1,
          late: 1,
          late_minutes: 10,
          notes: null,
          created_at: '2024-01-01',
        },
      ]);

      const result = await attendanceService.getByStudent('student-1');

      expect(result).toHaveLength(1);
      expect(result[0].present).toBe(true);
      expect(result[0].late).toBe(true);
      expect(result[0].lateMinutes).toBe(10);
    });
  });

  describe('getById', () => {
    it('should return a specific attendance', async () => {
      global.mockDb.getFirstAsync = jest.fn().mockResolvedValue({
        id: 'att-1',
        session_id: 'session-1',
        student_id: 'student-1',
        present: 1,
        late: 0,
        late_minutes: null,
        notes: null,
        created_at: '2024-01-01',
      });

      const result = await attendanceService.getById('att-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('att-1');
      expect(result?.present).toBe(true);
    });

    it('should return null when attendance not found', async () => {
      global.mockDb.getFirstAsync = jest.fn().mockResolvedValue(null);

      const result = await attendanceService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getBySessionAndStudent', () => {
    it('should return attendance for a student in a session', async () => {
      global.mockDb.getFirstAsync = jest.fn().mockResolvedValue({
        id: 'att-1',
        session_id: 'session-1',
        student_id: 'student-1',
        present: 1,
        late: 0,
        late_minutes: null,
        notes: null,
        created_at: '2024-01-01',
      });

      const result = await attendanceService.getBySessionAndStudent('session-1', 'student-1');

      expect(result).toBeDefined();
      expect(result?.sessionId).toBe('session-1');
      expect(result?.studentId).toBe('student-1');
    });

    it('should return null when no attendance exists', async () => {
      global.mockDb.getFirstAsync = jest.fn().mockResolvedValue(null);

      const result = await attendanceService.getBySessionAndStudent('session-1', 'student-1');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create a new attendance', async () => {
      const newAttendance = {
        sessionId: 'session-1',
        studentId: 'student-1',
        present: true,
        late: false,
      };

      global.mockDb.getFirstAsync = jest.fn()
        .mockResolvedValueOnce(null) // getBySessionAndStudent returns null
        .mockResolvedValueOnce({ // getById returns created attendance
          id: 'att-1',
          session_id: 'session-1',
          student_id: 'student-1',
          present: 1,
          late: 0,
          late_minutes: null,
          notes: null,
          created_at: new Date().toISOString(),
        });

      global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await attendanceService.upsert(newAttendance);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session-1');
      expect(result.present).toBe(true);
      expect(global.mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      );
    });

    it('should update an existing attendance', async () => {
      const updateData = {
        sessionId: 'session-1',
        studentId: 'student-1',
        present: false,
        late: false,
        notes: 'Absent justifié',
      };

      global.mockDb.getFirstAsync = jest.fn()
        .mockResolvedValueOnce({ // getBySessionAndStudent returns existing
          id: 'att-1',
          session_id: 'session-1',
          student_id: 'student-1',
          present: 1,
          late: 0,
          late_minutes: null,
          notes: null,
          created_at: '2024-01-01',
        })
        .mockResolvedValueOnce({ // getBySessionAndStudent returns updated
          id: 'att-1',
          session_id: 'session-1',
          student_id: 'student-1',
          present: 0,
          late: 0,
          late_minutes: null,
          notes: 'Absent justifié',
          created_at: '2024-01-01',
        });

      global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await attendanceService.upsert(updateData);

      expect(result).toBeDefined();
      expect(result.present).toBe(false);
      expect(result.notes).toBe('Absent justifié');
      expect(global.mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.any(Array)
      );
    });
  });

  describe('upsertBulk', () => {
    it('should create multiple attendances', async () => {
      const attendances = [
        {
          sessionId: 'session-1',
          studentId: 'student-1',
          present: true,
          late: false,
        },
        {
          sessionId: 'session-1',
          studentId: 'student-2',
          present: false,
          late: false,
        },
      ];

      global.mockDb.getFirstAsync = jest.fn()
        .mockResolvedValueOnce(null) // getBySessionAndStudent for student-1
        .mockResolvedValueOnce({ // getById for student-1
          id: 'att-1',
          session_id: 'session-1',
          student_id: 'student-1',
          present: 1,
          late: 0,
          late_minutes: null,
          notes: null,
          created_at: '2024-01-01',
        })
        .mockResolvedValueOnce(null) // getBySessionAndStudent for student-2
        .mockResolvedValueOnce({ // getById for student-2
          id: 'att-2',
          session_id: 'session-1',
          student_id: 'student-2',
          present: 0,
          late: 0,
          late_minutes: null,
          notes: null,
          created_at: '2024-01-01',
        });

      global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await attendanceService.upsertBulk(attendances);

      expect(result).toHaveLength(2);
      expect(result[0].present).toBe(true);
      expect(result[1].present).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an attendance', async () => {
      global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await attendanceService.delete('att-1');

      expect(global.mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['att-1']
      );
    });
  });

  describe('deleteBySession', () => {
    it('should delete all attendances of a session', async () => {
      global.mockDb.runAsync.mockResolvedValue({ changes: 3 });

      await attendanceService.deleteBySession('session-1');

      expect(global.mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['session-1']
      );
    });
  });

  describe('getStudentStats', () => {
    it('should return statistics for a student', async () => {
      global.mockDb.getFirstAsync = jest.fn().mockResolvedValue({
        total_sessions: 10,
        present_count: 8,
        absent_count: 2,
        late_count: 3,
      });

      const result = await attendanceService.getStudentStats('student-1');

      expect(result.totalSessions).toBe(10);
      expect(result.presentCount).toBe(8);
      expect(result.absentCount).toBe(2);
      expect(result.lateCount).toBe(3);
      expect(result.attendanceRate).toBe(80);
    });

    it('should return zero stats when no attendances exist', async () => {
      global.mockDb.getFirstAsync = jest.fn().mockResolvedValue({
        total_sessions: 0,
        present_count: 0,
        absent_count: 0,
        late_count: 0,
      });

      const result = await attendanceService.getStudentStats('student-1');

      expect(result.totalSessions).toBe(0);
      expect(result.attendanceRate).toBe(0);
    });
  });

  describe('getSessionStats', () => {
    it('should return statistics for a session', async () => {
      global.mockDb.getFirstAsync = jest.fn()
        .mockResolvedValueOnce({ class_id: 'class-1' }) // Get class_id
        .mockResolvedValueOnce({ count: 5 }) // Total students
        .mockResolvedValueOnce({ // Attendance stats
          recorded: 4,
          present_count: 3,
          absent_count: 1,
          late_count: 1,
        });

      const result = await attendanceService.getSessionStats('session-1');

      expect(result.totalStudents).toBe(5);
      expect(result.presentCount).toBe(3);
      expect(result.absentCount).toBe(1);
      expect(result.lateCount).toBe(1);
      expect(result.notTakenCount).toBe(1); // 5 - 4 = 1
    });

    it('should return zero stats when session not found', async () => {
      global.mockDb.getFirstAsync = jest.fn().mockResolvedValue(null);

      const result = await attendanceService.getSessionStats('nonexistent');

      expect(result.totalStudents).toBe(0);
      expect(result.presentCount).toBe(0);
      expect(result.notTakenCount).toBe(0);
    });
  });
});
