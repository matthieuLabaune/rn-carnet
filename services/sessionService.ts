import { Session, SessionFormData, SessionStatus } from '../types';
import { getDatabase } from './database';

const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const sessionService = {
  async getByClass(classId: string): Promise<Session[]> {
    const db = getDatabase();
    
    const sessions = await db.getAllAsync<any>(
      'SELECT * FROM sessions WHERE class_id = ? ORDER BY date DESC, created_at DESC',
      [classId]
    );

    return sessions.map(s => ({
      id: s.id,
      classId: s.class_id,
      subject: s.subject,
      description: s.description,
      date: s.date,
      duration: s.duration,
      status: s.status,
      timerPreset: s.timer_preset ? JSON.parse(s.timer_preset) : undefined,
      createdAt: s.created_at || new Date().toISOString(),
      completedAt: s.completed_at || undefined,
    }));
  },

  async getAll(): Promise<Session[]> {
    const db = getDatabase();
    
    const sessions = await db.getAllAsync<any>(
      'SELECT * FROM sessions ORDER BY date DESC, created_at DESC'
    );

    return sessions.map(s => ({
      id: s.id,
      classId: s.class_id,
      subject: s.subject,
      description: s.description,
      date: s.date,
      duration: s.duration,
      status: s.status,
      timerPreset: s.timer_preset ? JSON.parse(s.timer_preset) : undefined,
      createdAt: s.created_at || new Date().toISOString(),
      completedAt: s.completed_at || undefined,
    }));
  },

  async getById(id: string): Promise<Session | null> {
    const db = getDatabase();
    
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM sessions WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return {
      id: result.id,
      classId: result.class_id,
      subject: result.subject,
      description: result.description,
      date: result.date,
      duration: result.duration,
      status: result.status,
      timerPreset: result.timer_preset ? JSON.parse(result.timer_preset) : undefined,
      createdAt: result.created_at || new Date().toISOString(),
      completedAt: result.completed_at || undefined,
    };
  },

  async create(data: SessionFormData): Promise<Session> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO sessions (id, class_id, subject, description, date, duration, status, timer_preset, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.classId,
        data.subject,
        data.description || null,
        data.date,
        data.duration,
        data.status,
        data.timerPreset ? JSON.stringify(data.timerPreset) : null,
        now,
      ]
    );

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create session');
    
    return created;
  },

  async update(id: string, data: Partial<SessionFormData>): Promise<Session> {
    const db = getDatabase();

    const existing = await this.getById(id);
    if (!existing) throw new Error('Session not found');

    const updates: string[] = [];
    const values: any[] = [];

    if (data.subject !== undefined) {
      updates.push('subject = ?');
      values.push(data.subject);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.date !== undefined) {
      updates.push('date = ?');
      values.push(data.date);
    }
    if (data.duration !== undefined) {
      updates.push('duration = ?');
      values.push(data.duration);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.timerPreset !== undefined) {
      updates.push('timer_preset = ?');
      values.push(JSON.stringify(data.timerPreset));
    }

    if (updates.length > 0) {
      values.push(id);

      await db.runAsync(
        `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to update session');
    
    return updated;
  },

  async complete(id: string): Promise<Session> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE sessions SET status = ?, completed_at = ? WHERE id = ?',
      ['completed', now, id]
    );

    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to complete session');
    
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
  },

  async deleteByClass(classId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM sessions WHERE class_id = ?', [classId]);
  },

  async getStats(classId?: string): Promise<{
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
  }> {
    const db = getDatabase();
    
    const query = classId
      ? `SELECT 
          COUNT(*) as totalSessions,
          SUM(duration) as totalDuration,
          AVG(duration) as averageDuration
         FROM sessions 
         WHERE class_id = ? AND status = 'completed'`
      : `SELECT 
          COUNT(*) as totalSessions,
          SUM(duration) as totalDuration,
          AVG(duration) as averageDuration
         FROM sessions 
         WHERE status = 'completed'`;
    
    const params = classId ? [classId] : [];
    const result = await db.getFirstAsync<any>(query, params);

    return {
      totalSessions: result?.totalSessions || 0,
      totalDuration: result?.totalDuration || 0,
      averageDuration: result?.averageDuration || 0,
    };
  },
};
