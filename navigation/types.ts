import { Class } from '../types';

export type RootStackParamList = {
    MainTabs: undefined;
    ClassDetail: { classId: string; className: string; classColor: string };
    StudentList: { classId: string; className: string; classColor: string };
    StudentDetail: { studentId: string };
    SessionList: { classId: string };
    SessionDetail: { sessionId: string };
    CompetencesManagement: undefined;
    EvaluationsList: { classId: string };
    EvaluationDetail: { evaluationId: string };
    ScheduleManagement: { classId: string; className: string };
    SessionGeneration: { classId: string; className: string };
};

export type MainTabsParamList = {
    Home: undefined;
    Students: undefined;
    Classes: undefined;
    Sessions: undefined;
    Settings: undefined;
};
