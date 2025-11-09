/**
 * Simple integration tests - Service interactions
 */

jest.mock('../../services/database', () => ({
  initDatabase: jest.fn(),
  getDatabase: jest.fn(() => global.mockDb),
  closeDatabase: jest.fn(),
  resetDatabase: jest.fn(),
}));

import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';

declare global {
  var mockDb: any;
}

describe('Integration: Class and Students', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a class and add students to it', async () => {
    // Create class
    global.mockDb.runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    
    // Mock getById call after creation
    global.mockDb.getFirstAsync = jest.fn().mockResolvedValueOnce({
      id: 'class-1',
      name: 'CE1',
      level: 'CE1',
      subject: 'Maths',
      color: '#FF0000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    global.mockDb.getAllAsync = jest.fn().mockResolvedValue([]); // No students yet

    const classData = {
      name: 'CE1',
      level: 'CE1',
      subject: 'Maths',
      color: '#FF0000',
    };

    const createdClass = await classService.create(classData);
    expect(createdClass.id).toBe('class-1');

    // Add student to class
    global.mockDb.getFirstAsync = jest.fn().mockResolvedValue({
      id: 'student-1',
      first_name: 'Alice',
      last_name: 'Martin',
      class_id: 'class-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const studentData = {
      firstName: 'Alice',
      lastName: 'Martin',
      classId: createdClass.id,
    };

    const createdStudent = await studentService.create(studentData);
    
    expect(createdStudent.classId).toBe(createdClass.id);
    expect(createdStudent.firstName).toBe('Alice');
  });

  it('should count students in a class', async () => {
    global.mockDb.getFirstAsync = jest.fn().mockResolvedValue({
      count: 5,
    });

    const count = await classService.getStudentCount('class-1');
    
    expect(count).toBe(5);
  });

  it('should retrieve all students from a class', async () => {
    global.mockDb.getAllAsync = jest.fn().mockResolvedValue([
      {
        id: 'student-1',
        first_name: 'Alice',
        last_name: 'Martin',
        class_id: 'class-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'student-2',
        first_name: 'Bob',
        last_name: 'Dupont',
        class_id: 'class-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const students = await studentService.getByClass('class-1');
    
    expect(students).toHaveLength(2);
    expect(students[0].firstName).toBe('Alice');
    expect(students[1].firstName).toBe('Bob');
  });
});
