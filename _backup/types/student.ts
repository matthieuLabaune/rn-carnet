export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  notes?: string;
  createdAt: string;
}

export type StudentFormData = Omit<Student, 'id' | 'createdAt'>;
