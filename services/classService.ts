import { Class, ClassFormData } from '../types';
import { getDatabase } from './database';

const generateId = () => `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const classService = {
  async getAll(): Promise<Class[]> {
    const db = getDatabase();
    
    const classes = await db.getAllAsync<Class>(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as studentCount
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    return classes.map(c => ({
      ...c,
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    }));
  },

  async getById(id: string): Promise<Class | null> {
    const db = getDatabase();
    
    const result = await db.getFirstAsync<Class>(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as studentCount
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (!result) return null;

    return {
      ...result,
      createdAt: result.createdAt || new Date().toISOString(),
      updatedAt: result.updatedAt || new Date().toISOString(),
    };
  },

  async create(data: ClassFormData): Promise<Class> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO classes (id, name, level, subject, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.level, data.subject || null, data.color, now, now]
    );

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create class');
    
    return created;
  },

  async update(id: string, data: Partial<ClassFormData>): Promise<Class> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await this.getById(id);
    if (!existing) throw new Error('Class not found');

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.level !== undefined) {
      updates.push('level = ?');
      values.push(data.level);
    }
    if (data.subject !== undefined) {
      updates.push('subject = ?');
      values.push(data.subject);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      values.push(id);

      await db.runAsync(
        `UPDATE classes SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to update class');
    
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM classes WHERE id = ?', [id]);
  },

  async getStudentCount(id: string): Promise<number> {
    const db = getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [id]
    );
    return result?.count || 0;
  },
};
