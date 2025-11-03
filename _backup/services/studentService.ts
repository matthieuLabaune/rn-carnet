import { Student, StudentFormData } from '../types';
import { getDatabase } from './database';

const generateId = () => `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const studentService = {
  async getAll(classId: string): Promise<Student[]> {
    const db = getDatabase();
    
    const students = await db.getAllAsync<Student>(
      `SELECT * FROM students 
       WHERE class_id = ? 
       ORDER BY last_name, first_name`,
      [classId]
    );

    return students.map(s => ({
      ...s,
      createdAt: s.createdAt || new Date().toISOString(),
    }));
  },

  async getById(id: string): Promise<Student | null> {
    const db = getDatabase();
    
    const result = await db.getFirstAsync<Student>(
      'SELECT * FROM students WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return {
      ...result,
      createdAt: result.createdAt || new Date().toISOString(),
    };
  },

  async create(data: StudentFormData): Promise<Student> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO students (id, class_id, first_name, last_name, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.classId, data.firstName, data.lastName, data.notes || null, now]
    );

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create student');
    
    return created;
  },

  async update(id: string, data: Partial<StudentFormData>): Promise<Student> {
    const db = getDatabase();

    const existing = await this.getById(id);
    if (!existing) throw new Error('Student not found');

    const updates: string[] = [];
    const values: any[] = [];

    if (data.firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(data.lastName);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }

    if (updates.length > 0) {
      values.push(id);

      await db.runAsync(
        `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error('Failed to update student');
    
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM students WHERE id = ?', [id]);
  },
};
