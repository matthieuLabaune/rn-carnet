import { Attendance, AttendanceFormData, AttendanceStats } from '../types/attendance';
import { getDatabase } from './database';

const generateId = () => `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const attendanceService = {
  /**
   * Récupérer toutes les présences d'une séance
   */
  async getBySession(sessionId: string): Promise<Attendance[]> {
    const db = getDatabase();
    
    const attendances = await db.getAllAsync<any>(
      'SELECT * FROM attendances WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

    return attendances.map(a => ({
      id: a.id,
      sessionId: a.session_id,
      studentId: a.student_id,
      present: Boolean(a.present),
      late: Boolean(a.late),
      lateMinutes: a.late_minutes || undefined,
      notes: a.notes || undefined,
      createdAt: a.created_at,
    }));
  },

  /**
   * Récupérer toutes les présences d'un élève
   */
  async getByStudent(studentId: string): Promise<Attendance[]> {
    const db = getDatabase();
    
    const attendances = await db.getAllAsync<any>(
      'SELECT * FROM attendances WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );

    return attendances.map(a => ({
      id: a.id,
      sessionId: a.session_id,
      studentId: a.student_id,
      present: Boolean(a.present),
      late: Boolean(a.late),
      lateMinutes: a.late_minutes || undefined,
      notes: a.notes || undefined,
      createdAt: a.created_at,
    }));
  },

  /**
   * Récupérer une présence spécifique
   */
  async getById(id: string): Promise<Attendance | null> {
    const db = getDatabase();
    
    const attendance = await db.getFirstAsync<any>(
      'SELECT * FROM attendances WHERE id = ?',
      [id]
    );

    if (!attendance) return null;

    return {
      id: attendance.id,
      sessionId: attendance.session_id,
      studentId: attendance.student_id,
      present: Boolean(attendance.present),
      late: Boolean(attendance.late),
      lateMinutes: attendance.late_minutes || undefined,
      notes: attendance.notes || undefined,
      createdAt: attendance.created_at,
    };
  },

  /**
   * Récupérer une présence par session et élève
   */
  async getBySessionAndStudent(sessionId: string, studentId: string): Promise<Attendance | null> {
    const db = getDatabase();
    
    const attendance = await db.getFirstAsync<any>(
      'SELECT * FROM attendances WHERE session_id = ? AND student_id = ?',
      [sessionId, studentId]
    );

    if (!attendance) return null;

    return {
      id: attendance.id,
      sessionId: attendance.session_id,
      studentId: attendance.student_id,
      present: Boolean(attendance.present),
      late: Boolean(attendance.late),
      lateMinutes: attendance.late_minutes || undefined,
      notes: attendance.notes || undefined,
      createdAt: attendance.created_at,
    };
  },

  /**
   * Créer ou mettre à jour une présence
   */
  async upsert(data: AttendanceFormData): Promise<Attendance> {
    const db = getDatabase();
    const existing = await this.getBySessionAndStudent(data.sessionId, data.studentId);

    if (existing) {
      // Mise à jour
      await db.runAsync(
        `UPDATE attendances 
         SET present = ?, late = ?, late_minutes = ?, notes = ?
         WHERE session_id = ? AND student_id = ?`,
        [
          data.present ? 1 : 0,
          data.late ? 1 : 0,
          data.lateMinutes || null,
          data.notes || null,
          data.sessionId,
          data.studentId,
        ]
      );

      const updated = await this.getBySessionAndStudent(data.sessionId, data.studentId);
      if (!updated) throw new Error('Failed to update attendance');
      
      return updated;
    } else {
      // Création
      const id = generateId();
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO attendances (id, session_id, student_id, present, late, late_minutes, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.sessionId,
          data.studentId,
          data.present ? 1 : 0,
          data.late ? 1 : 0,
          data.lateMinutes || null,
          data.notes || null,
          now,
        ]
      );

      const created = await this.getById(id);
      if (!created) throw new Error('Failed to create attendance');
      
      return created;
    }
  },

  /**
   * Enregistrer plusieurs présences en une fois
   */
  async upsertBulk(attendances: AttendanceFormData[]): Promise<Attendance[]> {
    const results: Attendance[] = [];
    
    for (const attendance of attendances) {
      const result = await this.upsert(attendance);
      results.push(result);
    }

    return results;
  },

  /**
   * Supprimer une présence
   */
  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM attendances WHERE id = ?', [id]);
  },

  /**
   * Supprimer toutes les présences d'une séance
   */
  async deleteBySession(sessionId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM attendances WHERE session_id = ?', [sessionId]);
  },

  /**
   * Obtenir les statistiques de présence d'un élève
   */
  async getStudentStats(studentId: string): Promise<AttendanceStats> {
    const db = getDatabase();
    
    const stats = await db.getFirstAsync<any>(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN present = 0 THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN late = 1 THEN 1 ELSE 0 END) as late_count
       FROM attendances
       WHERE student_id = ?`,
      [studentId]
    );

    if (!stats || stats.total_sessions === 0) {
      return {
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
      };
    }

    return {
      totalSessions: stats.total_sessions,
      presentCount: stats.present_count,
      absentCount: stats.absent_count,
      lateCount: stats.late_count,
      attendanceRate: (stats.present_count / stats.total_sessions) * 100,
    };
  },

  /**
   * Obtenir les statistiques de présence d'une séance
   */
  async getSessionStats(sessionId: string): Promise<{
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    notTakenCount: number;
  }> {
    const db = getDatabase();
    
    // Compter le nombre total d'élèves dans la classe
    const classId = await db.getFirstAsync<any>(
      'SELECT class_id FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (!classId) {
      return {
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        notTakenCount: 0,
      };
    }

    const totalStudents = await db.getFirstAsync<any>(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [classId.class_id]
    );

    const stats = await db.getFirstAsync<any>(
      `SELECT 
        COUNT(*) as recorded,
        SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN present = 0 THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN late = 1 THEN 1 ELSE 0 END) as late_count
       FROM attendances
       WHERE session_id = ?`,
      [sessionId]
    );

    const recorded = stats?.recorded || 0;
    const total = totalStudents?.count || 0;

    return {
      totalStudents: total,
      presentCount: stats?.present_count || 0,
      absentCount: stats?.absent_count || 0,
      lateCount: stats?.late_count || 0,
      notTakenCount: total - recorded,
    };
  },
};
