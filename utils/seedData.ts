import { classService, studentService, sessionService, attendanceService, competenceService, evaluationService, evaluationResultService, sequenceService } from '../services';
import { Handicap, Laterality } from '../types/student';
import { SessionFormData, SessionStatus } from '../types/session';
import { Niveau } from '../types/evaluationResult';
import { getAllPredefinedCompetences } from './predefinedCompetences';

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

// Configurations pour professeur des écoles (Primaire) - RÉDUIT À 4 CLASSES
const PRIMARY_CLASS_CONFIGS = [
    { name: 'CE1 - Les explorateurs', level: 'CE1', subject: 'Français', color: '#4ECDC4' },
    { name: 'CE2 - Mathématiques', level: 'CE2', subject: 'Mathématiques', color: '#45B7D1' },
    { name: 'CM1 - Sciences', level: 'CM1', subject: 'Sciences', color: '#96CEB4' },
    { name: 'CM2 - Histoire-Géo', level: 'CM2', subject: 'Histoire', color: '#FFEAA7' },
];

// Configurations pour professeur certifié (Secondaire) - RÉDUIT À 4 CLASSES
const SECONDARY_CLASS_CONFIGS = [
    { name: '4ème A - Mathématiques', level: '4ème', subject: 'Mathématiques', color: '#667EEA' },
    { name: '3ème B - Français', level: '3ème', subject: 'Français', color: '#F093FB' },
    { name: '2nde 1 - Histoire-Géo', level: '2nde', subject: 'Histoire-Géographie', color: '#4FACFE' },
    { name: '1ère S - Physique-Chimie', level: '1ère', subject: 'Physique-Chimie', color: '#FA709A' },
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

// Séquences par matière avec thèmes cohérents
const SEQUENCES_BY_SUBJECT: Record<string, Array<{
    name: string;
    theme: string;
    description: string;
    objectives: string[];
    sessionCount: number;
    color: string;
}>> = {
    'Français': [
        {
            name: 'Le conte merveilleux',
            theme: 'Littérature et imagination',
            description: 'Étude des caractéristiques du conte merveilleux à travers différents textes',
            objectives: [
                'Identifier les caractéristiques du conte',
                'Reconnaître la structure narrative',
                'Produire un court conte'
            ],
            sessionCount: 8,
            color: '#FF6B9D'
        },
        {
            name: 'La conjugaison au passé',
            theme: 'Grammaire - Les temps du passé',
            description: 'Maîtrise de l\'imparfait et du passé composé',
            objectives: [
                'Conjuguer à l\'imparfait',
                'Conjuguer au passé composé',
                'Différencier les deux temps'
            ],
            sessionCount: 6,
            color: '#C44569'
        },
        {
            name: 'La poésie',
            theme: 'Découverte de la poésie française',
            description: 'Lecture et création de poèmes',
            objectives: [
                'Comprendre les rimes et le rythme',
                'Réciter un poème',
                'Créer ses propres vers'
            ],
            sessionCount: 5,
            color: '#F8B500'
        }
    ],
    'Mathématiques': [
        {
            name: 'Les fractions',
            theme: 'Nombres et calculs',
            description: 'Comprendre et manipuler les fractions',
            objectives: [
                'Représenter une fraction',
                'Comparer des fractions',
                'Additionner des fractions simples'
            ],
            sessionCount: 10,
            color: '#4834DF'
        },
        {
            name: 'La géométrie plane',
            theme: 'Figures géométriques',
            description: 'Étude des polygones et de leurs propriétés',
            objectives: [
                'Tracer des figures',
                'Calculer des périmètres',
                'Identifier les propriétés'
            ],
            sessionCount: 7,
            color: '#30336B'
        },
        {
            name: 'Problèmes et logique',
            theme: 'Résolution de problèmes',
            description: 'Développer le raisonnement mathématique',
            objectives: [
                'Comprendre un énoncé',
                'Choisir la bonne opération',
                'Vérifier sa réponse'
            ],
            sessionCount: 6,
            color: '#686DE0'
        }
    ],
    'Histoire': [
        {
            name: 'La Révolution française',
            theme: 'De la monarchie à la République',
            description: 'Les grands événements de 1789 à 1799',
            objectives: [
                'Connaître les dates clés',
                'Comprendre les causes',
                'Identifier les acteurs majeurs'
            ],
            sessionCount: 9,
            color: '#E74C3C'
        },
        {
            name: 'Le Moyen Âge',
            theme: 'Société féodale et châteaux forts',
            description: 'La vie au Moyen Âge en France',
            objectives: [
                'Décrire la société féodale',
                'Comprendre le rôle des châteaux',
                'Connaître la vie quotidienne'
            ],
            sessionCount: 8,
            color: '#8E44AD'
        },
        {
            name: 'Les grandes découvertes',
            theme: 'Explorations du XVe et XVIe siècles',
            description: 'Christophe Colomb et les explorateurs',
            objectives: [
                'Situer les voyages sur une carte',
                'Comprendre les motivations',
                'Mesurer les conséquences'
            ],
            sessionCount: 6,
            color: '#F39C12'
        }
    ],
    'Histoire-Géographie': [
        {
            name: 'La Première Guerre mondiale',
            theme: 'Le conflit de 1914-1918',
            description: 'Causes, déroulement et conséquences de la Grande Guerre',
            objectives: [
                'Connaître les causes du conflit',
                'Décrire la vie dans les tranchées',
                'Comprendre les traités de paix'
            ],
            sessionCount: 10,
            color: '#E74C3C'
        },
        {
            name: 'Les espaces productifs français',
            theme: 'Géographie économique',
            description: 'Agriculture, industrie et services en France',
            objectives: [
                'Localiser les zones agricoles',
                'Identifier les pôles industriels',
                'Comprendre les dynamiques territoriales'
            ],
            sessionCount: 7,
            color: '#27AE60'
        }
    ],
    'Sciences': [
        {
            name: 'Le cycle de l\'eau',
            theme: 'Sciences de la Terre',
            description: 'Comprendre le cycle naturel de l\'eau',
            objectives: [
                'Décrire les états de l\'eau',
                'Expliquer l\'évaporation',
                'Schématiser le cycle'
            ],
            sessionCount: 6,
            color: '#3498DB'
        },
        {
            name: 'Les êtres vivants',
            theme: 'Biologie et classification',
            description: 'Découverte du monde vivant et de sa diversité',
            objectives: [
                'Classer les êtres vivants',
                'Comprendre la chaîne alimentaire',
                'Observer et décrire'
            ],
            sessionCount: 8,
            color: '#2ECC71'
        },
        {
            name: 'L\'électricité',
            theme: 'Physique - Les circuits',
            description: 'Circuits simples et électricité',
            objectives: [
                'Réaliser un circuit simple',
                'Identifier conducteurs et isolants',
                'Comprendre le rôle des composants'
            ],
            sessionCount: 7,
            color: '#F1C40F'
        }
    ],
    'Physique-Chimie': [
        {
            name: 'Les atomes et molécules',
            theme: 'Structure de la matière',
            description: 'Introduction à la chimie atomique',
            objectives: [
                'Comprendre la structure atomique',
                'Représenter des molécules',
                'Identifier des éléments chimiques'
            ],
            sessionCount: 9,
            color: '#9B59B6'
        },
        {
            name: 'La mécanique',
            theme: 'Forces et mouvements',
            description: 'Étude des forces et du mouvement',
            objectives: [
                'Calculer une force',
                'Comprendre le principe d\'inertie',
                'Appliquer les lois de Newton'
            ],
            sessionCount: 8,
            color: '#34495E'
        }
    ]
};

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

        // 4. Créer les séquences par classe avec des thèmes cohérents
        console.log('📚 Creating sequences...');
        let totalSequences = 0;

        for (const [index, classId] of classIds.entries()) {
            const config = CLASS_CONFIGS[index];
            const subject = config.subject;
            
            // Récupérer les séquences pour cette matière
            const sequencesForSubject = SEQUENCES_BY_SUBJECT[subject] || [];
            
            if (sequencesForSubject.length > 0) {
                // Créer 2-3 séquences par classe
                const numSequences = Math.min(sequencesForSubject.length, randomInt(2, 3));
                
                for (let i = 0; i < numSequences; i++) {
                    const seqData = sequencesForSubject[i];
                    await sequenceService.create({
                        classId,
                        name: seqData.name,
                        theme: seqData.theme,
                        description: seqData.description,
                        objectives: seqData.objectives,
                        sessionCount: seqData.sessionCount,
                        color: seqData.color,
                    });
                    totalSequences++;
                }
                console.log(`  ✓ Created ${numSequences} sequences for ${config.name}`);
            } else {
                console.log(`  ⚠️ No sequences defined for subject: ${subject}`);
            }
        }
        console.log(`  ✓ Created ${totalSequences} sequences total`);

        // 5. Générer les présences pour les séances passées
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

        // 5️⃣ Seed Competences
        console.log('\n5️⃣ Seeding competences...');

        // Check if competences already exist
        const existingCompetences = await competenceService.getAll();

        if (existingCompetences.length === 0) {
            // Only insert if no competences exist
            const predefinedCompetences = getAllPredefinedCompetences();
            const competencesToInsert = predefinedCompetences.map((c, index) => ({
                id: `competence_${Date.now()}_${index}`,
                nom: c.nom,
                description: c.description,
                domaine: c.domaine,
                couleur: c.couleur,
                isPredefined: true,
            }));
            await competenceService.bulkInsert(competencesToInsert);
            console.log(`  ✓ Inserted ${competencesToInsert.length} predefined competences`);
        } else {
            console.log(`  ℹ️ Competences already exist (${existingCompetences.length} found), skipping insertion`);
        }

        // Get some competence IDs for evaluations
        const allCompetences = await competenceService.getAll();
        console.log(`📊 Total competences in DB: ${allCompetences.length}`);

        const mathCompetences = allCompetences.filter(c => c.domaine === 'Mathématiques').slice(0, 3);
        const frenchCompetences = allCompetences.filter(c => c.domaine === 'Français').slice(0, 3);
        const scienceCompetences = allCompetences.filter(c => c.domaine === 'Sciences').slice(0, 2);

        console.log(`📐 Math competences: ${mathCompetences.length} - IDs: ${mathCompetences.map(c => c.id).join(', ')}`);
        console.log(`📝 French competences: ${frenchCompetences.length} - IDs: ${frenchCompetences.map(c => c.id).join(', ')}`);
        console.log(`🔬 Science competences: ${scienceCompetences.length} - IDs: ${scienceCompetences.map(c => c.id).join(', ')}`);

        if (mathCompetences.length === 0 || frenchCompetences.length === 0 || scienceCompetences.length === 0) {
            console.warn('⚠️ Warning: Not enough competences found for evaluations!');
        }

        // 6️⃣ Seed Evaluations
        console.log('\n6️⃣ Seeding evaluations...');
        let totalEvaluations = 0;
        let totalResults = 0;

        for (const classId of classIds) {
            const classStudents = await studentService.getByClass(classId);
            const classSessions = await sessionService.getByClass(classId);

            // Create 3 evaluations per class

            // 1. Math evaluation (points) - linked to a session if available
            const mathEvalId = `eval_${Date.now()}_math_${classId}`;
            const mathEval = await evaluationService.create({
                id: mathEvalId,
                classId,
                sessionId: classSessions.length > 0 ? classSessions[0].id : undefined,
                titre: 'Évaluation Mathématiques - Géométrie',
                date: new Date('2024-12-05').toISOString(),
                type: 'sommative',
                notationSystem: 'points',
                maxPoints: 20,
                competenceIds: mathCompetences.map(c => c.id!),
                isHomework: false, // En classe
            });
            totalEvaluations++;

            // Grade some students for this evaluation
            for (let i = 0; i < Math.min(5, classStudents.length); i++) {
                const student = classStudents[i];
                for (const competence of mathCompetences) {
                    await evaluationResultService.upsert({
                        id: `result_${Date.now()}_${i}_${mathEval.id}_${student.id}_${competence.id}`,
                        evaluationId: mathEval.id!,
                        studentId: student.id!,
                        competenceId: competence.id!,
                        score: Math.floor(Math.random() * 15) + 6, // Random score between 6-20
                        commentaire: i === 0 ? 'Très bon travail' : undefined,
                    });
                    totalResults++;
                }
            }

            // Wait a bit to ensure unique IDs
            await new Promise(resolve => setTimeout(resolve, 10));

            // 2. French evaluation (niveaux) - standalone
            const frenchEvalId = `eval_${Date.now()}_french_${classId}`;
            const frenchEval = await evaluationService.create({
                id: frenchEvalId,
                classId,
                titre: 'Évaluation Français - Compréhension',
                date: new Date('2024-12-10').toISOString(),
                type: 'formative',
                notationSystem: 'niveaux',
                competenceIds: frenchCompetences.map(c => c.id!),
                isHomework: true, // Devoir maison
            });
            totalEvaluations++;

            // Grade some students with niveaux
            const niveaux: Niveau[] = ['non-atteint', 'partiellement-atteint', 'atteint', 'depasse'];
            for (let i = 0; i < Math.min(4, classStudents.length); i++) {
                const student = classStudents[i];
                for (const competence of frenchCompetences) {
                    await evaluationResultService.upsert({
                        id: `result_${Date.now()}_${i}_${frenchEval.id}_${student.id}_${competence.id}`,
                        evaluationId: frenchEval.id!,
                        studentId: student.id!,
                        competenceId: competence.id!,
                        niveau: niveaux[Math.floor(Math.random() * niveaux.length)],
                    });
                    totalResults++;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 10));

            // 3. Sciences evaluation (points) - linked to another session
            if (classSessions.length > 1) {
                const scienceEvalId = `eval_${Date.now()}_science_${classId}`;
                const scienceEval = await evaluationService.create({
                    id: scienceEvalId,
                    classId,
                    sessionId: classSessions[1].id,
                    titre: 'Évaluation Sciences - Expérimentation',
                    date: new Date('2024-12-15').toISOString(),
                    type: 'diagnostique',
                    notationSystem: 'points',
                    maxPoints: 10,
                    competenceIds: scienceCompetences.map(c => c.id!),
                    isHomework: false, // En classe
                });
                totalEvaluations++;

                // Grade a few students
                for (let i = 0; i < Math.min(3, classStudents.length); i++) {
                    const student = classStudents[i];
                    for (const competence of scienceCompetences) {
                        await evaluationResultService.upsert({
                            id: `result_${Date.now()}_${i}_${scienceEval.id}_${student.id}_${competence.id}`,
                            evaluationId: scienceEval.id!,
                            studentId: student.id!,
                            competenceId: competence.id!,
                            score: Math.floor(Math.random() * 8) + 3, // Random score between 3-10
                        });
                        totalResults++;
                    }
                }
            }
        }

        console.log(`  ✓ Created ${totalEvaluations} evaluations`);
        console.log(`  ✓ Generated ${totalResults} evaluation results`);

        console.log('✅ Database seeded successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - ${classIds.length} classes`);
        console.log(`   - ${totalStudents} students`);
        console.log(`   - ${totalSequences} sequences`);
        console.log(`   - ${totalSessions} sessions`);
        console.log(`   - ${totalAttendances} attendances`);
        console.log(`   - ${allCompetences.length} competences`);
        console.log(`   - ${totalEvaluations} evaluations`);
        console.log(`   - ${totalResults} evaluation results`);

        return {
            classIds,
            totalStudents,
            totalSequences,
            totalSessions,
            totalAttendances,
            totalCompetences: allCompetences.length,
            totalEvaluations,
            totalResults,
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
