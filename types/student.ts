export type Laterality = 'left' | 'right' | 'ambidextrous';

export type Handicap =
    | 'dyslexia'
    | 'dysorthography'
    | 'dyscalculia'
    | 'dyspraxia'
    | 'dysphasia'
    | 'adhd'
    | 'asd'
    | 'visual_impairment'
    | 'hearing_impairment'
    | 'motor_disability'
    | 'other';

export interface Student {
    id: string;
    classId: string;
    firstName: string;
    lastName: string;
    notes?: string;
    handicaps?: Handicap[];
    laterality?: Laterality;
    customTags?: string[];
    photoUrl?: string;
    createdAt: string;
}

export type StudentFormData = Omit<Student, 'id' | 'createdAt'>;

export const HANDICAP_LABELS: Record<Handicap, string> = {
    dyslexia: 'Dyslexie',
    dysorthography: 'Dysorthographie',
    dyscalculia: 'Dyscalculie',
    dyspraxia: 'Dyspraxie',
    dysphasia: 'Dysphasie',
    adhd: 'TDAH',
    asd: 'TSA',
    visual_impairment: 'Déficience visuelle',
    hearing_impairment: 'Déficience auditive',
    motor_disability: 'Handicap moteur',
    other: 'Autre',
};

export const LATERALITY_LABELS: Record<Laterality, string> = {
    left: 'Gaucher',
    right: 'Droitier',
    ambidextrous: 'Ambidextre',
};
