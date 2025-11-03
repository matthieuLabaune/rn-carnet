export interface Class {
  id: string;
  name: string;
  level: string;
  subject?: string;
  color: string;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ClassFormData = Omit<Class, 'id' | 'createdAt' | 'updatedAt' | 'studentCount'>;
