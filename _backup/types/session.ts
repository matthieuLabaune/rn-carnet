export type SessionStatus = 'planned' | 'in_progress' | 'completed';

export interface TimerStep {
  name: string;
  duration: number; // en minutes
  color: string;
}

export interface TimerPreset {
  name: string;
  totalDuration: number;
  steps: TimerStep[];
}

export interface Session {
  id: string;
  classId: string;
  subject: string;
  description?: string;
  date: string;
  duration: number; // en minutes
  status: SessionStatus;
  timerPreset?: TimerPreset;
  createdAt: string;
  completedAt?: string;
}

export type SessionFormData = Omit<Session, 'id' | 'createdAt' | 'completedAt'>;

export const DEFAULT_TIMER_PRESET: TimerPreset = {
  name: '50 minutes - Standard',
  totalDuration: 50,
  steps: [
    { name: 'Exercice', duration: 10, color: '#2196F3' },
    { name: 'Explications', duration: 15, color: '#4CAF50' },
    { name: 'Recherche', duration: 10, color: '#FF9800' },
    { name: 'Synthèse', duration: 15, color: '#9C27B0' },
  ],
};
