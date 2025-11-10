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
    ScheduleManagement: { classId: string; className: string; classColor: string };
    SessionGeneration: { classId: string; className: string; classColor: string };
    ScheduleWizard: { classId: string; className: string; classColor: string };
    SequencesIndex: undefined;
    SequencePlanning: { classId: string; className: string; classColor: string };
    SequenceAssignment: {
        sequenceId: string;
        sequenceName: string;
        sessionCount: number;
        classId: string;
        className: string;
        classColor: string;
    };
    SequenceTimeline: { classId: string; className: string; classColor: string };
};

export type MainTabsParamList = {
    Home: undefined;
    Students: undefined;
    Classes: undefined;
    Sequences: undefined;
    Sessions: undefined;
    Settings: undefined;
};
