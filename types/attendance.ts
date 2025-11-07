export interface Attendance {
    id: string;
    sessionId: string;
    studentId: string;
    present: boolean;
    late: boolean;
    lateMinutes?: number;
    notes?: string;
    createdAt: string;
}

export type AttendanceFormData = Omit<Attendance, 'id' | 'createdAt'>;

export interface AttendanceStats {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number; // percentage
}
