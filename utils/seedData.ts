import { classService, studentService, sessionService, attendanceService } from '../services';
import { Handicap, Laterality } from '../types/student';
import { SessionFormData, SessionStatus } from '../types/session';

// Données réalistes pour les seeds
const FIRST_NAMES = [
    'Emma', 'Lucas', 'Léa', 'Louis', 'Chloé', 'Gabriel', 'Manon', 'Arthur',
    'Inès', 'Jules', 'Camille', 'Hugo', 'Sarah', 'Nathan', 'Zoé', 'Tom',
    'Alice', 'Raphaël', 'Lisa', 'Adam', 'Juliette', 'Maxime', 'Clara', 'Théo',
];

const LAST_NAMES = [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy',
    'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand',
    'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Dupont',
];

// Configurations pour professeur des écoles (Primaire)
const PRIMARY_CLASS_CONFIGS = [
    { name: 'PS - Petite Section', level: 'PS', subject: 'Maternelle', color: '#FFB6C1' },
    { name: 'MS - Moyenne Section', level: 'MS', subject: 'Maternelle', color: '#FFD700' },
    { name: 'GS - Grande Section', level: 'GS', subject: 'Maternelle', color: '#98FB98' },
    { name: 'CP - Classe A', level: 'CP', subject: 'Polyvalent', color: '#FF6B6B' },
    { name: 'CE1 - Les explorateurs', level: 'CE1', subject: 'Français', color: '#4ECDC4' },
    { name: 'CE2 - Mathématiques', level: 'CE2', subject: 'Mathématiques', color: '#45B7D1' },
    { name: 'CM1 - Sciences', level: 'CM1', subject: 'Sciences', color: '#96CEB4' },
    { name: 'CM2 - Histoire-Géo', level: 'CM2', subject: 'Histoire', color: '#FFEAA7' },
];

// Configurations pour professeur certifié (Secondaire)
const SECONDARY_CLASS_CONFIGS = [
    { name: '6ème A - Mathématiques', level: '6ème', subject: 'Mathématiques', color: '#667EEA' },
    { name: '5ème B - Français', level: '5ème', subject: 'Français', color: '#F093FB' },
    { name: '4ème C - Histoire-Géo', level: '4ème', subject: 'Histoire-Géographie', color: '#4FACFE' },
    { name: '3ème A - Sciences', level: '3ème', subject: 'SVT', color: '#43E97B' },
    { name: '2nde 1 - Physique-Chimie', level: '2nde', subject: 'Physique-Chimie', color: '#FA709A' },
    { name: '1ère S - Mathématiques', level: '1ère', subject: 'Mathématiques', color: '#FEE140' },
    { name: 'Terminale - Philosophie', level: 'Terminale', subject: 'Philosophie', color: '#30CEFF' },
];

// Matières pour primaire
const PRIMARY_SUBJECTS = [
    'Lecture', 'Écriture', 'Calcul mental', 'Géométrie', 'Conjugaison',
    'Vocabulaire', 'Problèmes', 'Orthographe', 'Grammaire', 'Numération',
    'Histoire', 'Géographie', 'Sciences', 'Arts plastiques', 'EPS',
];

// Matières pour secondaire
const SECONDARY_SUBJECTS = [
    'Mathématiques', 'Français', 'Histoire-Géographie', 'SVT', 'Physique-Chimie',
    'Anglais', 'Espagnol', 'Allemand', 'Technologie', 'Arts plastiques',
    'Musique', 'EPS', 'Latin', 'Philosophie', 'Économie',
];

const SESSION_DESCRIPTIONS = [
    'Travail sur les syllabes et phonèmes',
    'Exercices de production d\'écrits',
    'Tables de multiplication',
    'Construction de figures géométriques',
    'Révision des temps du passé',
    'Enrichissement du vocabulaire thématique',
    'Résolution de problèmes à étapes',
    'Dictée préparée et auto-correction',
    'Analyse de phrases complexes',
    'Manipulation de grands nombres',
];

const CUSTOM_TAGS = [
    'Autonome', 'Timide', 'Leader', 'Créatif', 'Bavard',
    'Méthodique', 'Sportif', 'Artistique', 'Curieux', 'Concentré',
];

const STUDENT_NOTES = [
    'Élève sérieux et appliqué',
    'Participe activement en classe',
    'Besoin d\'encouragements réguliers',
    'Très bon niveau général',
    'Difficultés en lecture, suivi individualisé',
    'Excellentes capacités en mathématiques',
    'Progrès constants depuis le début de l\'année',
    'Besoin de renforcer la confiance en soi',
];

// Utilitaires
const randomItem = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (probability = 0.5) => Math.random() < probability;

const generateDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
};

// Générateurs
const generateStudent = (classId: string) => {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);

    // 30% de chance d'avoir un handicap
    const handicaps: Handicap[] = [];
    if (randomBool(0.3)) {
        const possibleHandicaps: Handicap[] = ['dyslexia', 'dysorthography', 'dyscalculia', 'adhd', 'asd'];
        handicaps.push(randomItem(possibleHandicaps));
    }

    // 70% de chance d'être droitier
    const laterality: Laterality = randomBool(0.7) ? 'right' : randomBool(0.5) ? 'left' : 'ambidextrous';

    // 50% de chance d'avoir des tags custom
    const customTags: string[] = [];
    if (randomBool(0.5)) {
        const numTags = randomInt(1, 3);
        for (let i = 0; i < numTags; i++) {
            const tag = randomItem(CUSTOM_TAGS);
            if (!customTags.includes(tag)) {
                customTags.push(tag);
            }
        }
    }

    // 60% de chance d'avoir des notes
    const notes = randomBool(0.6) ? randomItem(STUDENT_NOTES) : undefined;

    return {
        firstName,
        lastName,
        classId,
        handicaps: handicaps.length > 0 ? handicaps : undefined,
        laterality,
        customTags: customTags.length > 0 ? customTags : undefined,
        notes,
    };
};

const generateSession = (classId: string, daysAgo: number, subjects: string[]): SessionFormData => {
    const subject = randomItem(subjects);
    const description = randomBool(0.7) ? randomItem(SESSION_DESCRIPTIONS) : undefined;
    const status: SessionStatus = daysAgo < 0 ? 'planned' : daysAgo === 0 ? 'in_progress' : 'completed';

    return {
        classId,
        subject,
        description,
        date: generateDate(daysAgo),
        duration: randomInt(45, 120),
        status,
    };
};

// Type d'enseignant
export type TeacherType = 'primary' | 'secondary';

// Générer les présences pour une séance
const generateAttendancesForSession = async (sessionId: string, studentIds: string[], sessionDate: string) => {
    const attendances = studentIds.map(studentId => {
        // 85% de chance d'être présent
        const present = randomBool(0.85);
        
        // Si présent, 15% de chance d'être en retard
        const late = present && randomBool(0.15);
        
        // Si en retard, entre 5 et 30 minutes
        const lateMinutes = late ? randomInt(5, 30) : undefined;
        
        // 10% de chance d'avoir une note (justificatif, etc.)
        const notes = randomBool(0.1) ? randomItem([
            'Justificatif médical',
            'Rendez-vous médical',
            'Problème de transport',
            'Absence excusée par les parents',
            'RAS',
        ]) : undefined;

        return {
            sessionId,
            studentId,
            present,
            late,
            lateMinutes,
            notes,
        };
    });

    return attendances;
};

// Fonction principale de seed
export const seedDatabase = async (teacherType: TeacherType = 'primary') => {
    try {
        console.log('🌱 Starting database seed...');
        
        // Choisir les configurations selon le type d'enseignant
        const CLASS_CONFIGS = teacherType === 'primary' ? PRIMARY_CLASS_CONFIGS : SECONDARY_CLASS_CONFIGS;
        const SUBJECTS = teacherType === 'primary' ? PRIMARY_SUBJECTS : SECONDARY_SUBJECTS;

        // 1. Créer les classes
        console.log('📚 Creating classes...');
        const classIds: string[] = [];
        for (const config of CLASS_CONFIGS) {
            const newClass = await classService.create(config);
            classIds.push(newClass.id);
            console.log(`  ✓ Created: ${config.name}`);
        }

        // 2. Créer les élèves (15-25 par classe)
        console.log('👨‍🎓 Creating students...');
        let totalStudents = 0;
        const classStudentsMap = new Map<string, string[]>();
        
        for (const classId of classIds) {
            const numStudents = randomInt(15, 25);
            const studentIds: string[] = [];
            
            for (let i = 0; i < numStudents; i++) {
                const studentData = generateStudent(classId);
                const newStudent = await studentService.create(studentData);
                studentIds.push(newStudent.id);
                totalStudents++;
            }
            
            classStudentsMap.set(classId, studentIds);
            console.log(`  ✓ Created ${numStudents} students for class ${classId}`);
        }

        // 3. Créer les séances (passées et futures)
        console.log('📅 Creating sessions...');
        let totalSessions = 0;
        const completedSessions: Array<{ id: string; classId: string; date: string }> = [];
        
        for (const classId of classIds) {
            // Séances passées (derniers 30 jours)
            for (let day = 30; day > 0; day -= randomInt(2, 4)) {
                const sessionData = generateSession(classId, day, SUBJECTS);
                const newSession = await sessionService.create(sessionData);
                completedSessions.push({
                    id: newSession.id,
                    classId,
                    date: sessionData.date,
                });
                totalSessions++;
            }

            // Séances à venir (prochains 14 jours)
            for (let day = -1; day > -15; day -= randomInt(2, 3)) {
                const sessionData = generateSession(classId, day, SUBJECTS);
                await sessionService.create(sessionData);
                totalSessions++;
            }
        }
        console.log(`  ✓ Created ${totalSessions} sessions`);

        // 4. Générer les présences pour les séances passées
        console.log('✅ Generating attendances...');
        let totalAttendances = 0;
        
        for (const session of completedSessions) {
            const studentIds = classStudentsMap.get(session.classId) || [];
            const attendances = await generateAttendancesForSession(
                session.id,
                studentIds,
                session.date
            );
            
            await attendanceService.upsertBulk(attendances);
            totalAttendances += attendances.length;
        }
        console.log(`  ✓ Generated ${totalAttendances} attendance records`);

        console.log('✅ Database seeded successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - ${classIds.length} classes`);
        console.log(`   - ${totalStudents} students`);
        console.log(`   - ${totalSessions} sessions`);
        console.log(`   - ${totalAttendances} attendances`);

        return {
            classIds,
            totalStudents,
            totalSessions,
            totalAttendances,
        };
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Fonction pour nettoyer la base de données
export const clearDatabase = async () => {
    try {
        console.log('🧹 Clearing database...');

        // Cette fonction devra être implémentée dans les services
        // Pour l'instant, on peut juste logger
        console.log('⚠️ Clear function not implemented yet');
        console.log('💡 You can manually delete the app data to clear the database');

        return true;
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        throw error;
    }
};
