import { Student, StudentFormData, Handicap, Laterality } from '../types';
import { getDatabase } from './database';

const generateId = () => `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const studentService = {
  async getByClass(classId: string): Promise<Student[]> {
    const db = getDatabase();
    
    const students = await db.getAllAsync<any>(
      `SELECT * FROM students 
       WHERE class_id = ? 
       ORDER BY last_name, first_name`,
      [classId]
    );

    return students.map(s => ({
      id: s.id,
      classId: s.class_id,
      firstName: s.first_name,
      lastName: s.last_name,
      notes: s.notes,
      handicaps: s.handicaps ? JSON.parse(s.handicaps) : undefined,
      laterality: s.laterality as Laterality | undefined,
      customTags: s.custom_tags ? JSON.parse(s.custom_tags) : undefined,
      photoUrl: s.photo_url,
      createdAt: s.created_at || new Date().toISOString(),
    }));
  },

  async getById(id: string): Promise<Student | null> {
    const db = getDatabase();
    
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM students WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return {
      id: result.id,
      classId: result.class_id,
      firstName: result.first_name,
      lastName: result.last_name,
      notes: result.notes,
      handicaps: result.handicaps ? JSON.parse(result.handicaps) : undefined,
      laterality: result.laterality as Laterality | undefined,
      customTags: result.custom_tags ? JSON.parse(result.custom_tags) : undefined,
      photoUrl: result.photo_url,
      createdAt: result.created_at || new Date().toISOString(),
    };
  },

  async create(data: StudentFormData): Promise<Student> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO students (id, class_id, first_name, last_name, notes, handicaps, laterality, custom_tags, photo_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.classId,
        data.firstName,
        data.lastName,
        data.notes || null,
        data.handicaps ? JSON.stringify(data.handicaps) : null,
        data.laterality || null,
        data.customTags ? JSON.stringify(data.customTags) : null,
        data.photoUrl || null,
        now
      ]
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
    if (data.handicaps !== undefined) {
      updates.push('handicaps = ?');
      values.push(data.handicaps.length > 0 ? JSON.stringify(data.handicaps) : null);
    }
    if (data.laterality !== undefined) {
      updates.push('laterality = ?');
      values.push(data.laterality);
    }
    if (data.customTags !== undefined) {
      updates.push('custom_tags = ?');
      values.push(data.customTags.length > 0 ? JSON.stringify(data.customTags) : null);
    }
    if (data.photoUrl !== undefined) {
      updates.push('photo_url = ?');
      values.push(data.photoUrl);
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
