import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'rn_carnet.db';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (db) return db;

    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Créer les tables
    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      subject TEXT,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY NOT NULL,
      class_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      notes TEXT,
      handicaps TEXT,
      laterality TEXT,
      custom_tags TEXT,
      photo_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      class_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT DEFAULT 'planned',
      timer_preset TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

    CREATE TABLE IF NOT EXISTS attendances (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      present INTEGER NOT NULL DEFAULT 1,
      late INTEGER NOT NULL DEFAULT 0,
      late_minutes INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(session_id, student_id)
    );

    CREATE INDEX IF NOT EXISTS idx_attendances_session_id ON attendances(session_id);
    CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON attendances(student_id);

    CREATE TABLE IF NOT EXISTS competences (
      id TEXT PRIMARY KEY NOT NULL,
      nom TEXT NOT NULL,
      description TEXT,
      domaine TEXT NOT NULL,
      couleur TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_competences_domaine ON competences(domaine);
    CREATE INDEX IF NOT EXISTS idx_competences_is_predefined ON competences(is_predefined);

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY NOT NULL,
      class_id TEXT NOT NULL,
      session_id TEXT,
      titre TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      notation_system TEXT NOT NULL,
      max_points INTEGER,
      competence_ids TEXT NOT NULL,
      is_homework INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_evaluations_class_id ON evaluations(class_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_session_id ON evaluations(session_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(date);

    CREATE TABLE IF NOT EXISTS evaluation_results (
      id TEXT PRIMARY KEY NOT NULL,
      evaluation_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      competence_id TEXT NOT NULL,
      niveau TEXT,
      score REAL,
      commentaire TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (competence_id) REFERENCES competences(id) ON DELETE CASCADE,
      UNIQUE(evaluation_id, student_id, competence_id)
    );

    CREATE INDEX IF NOT EXISTS idx_evaluation_results_evaluation_id ON evaluation_results(evaluation_id);
    CREATE INDEX IF NOT EXISTS idx_evaluation_results_student_id ON evaluation_results(student_id);
    CREATE INDEX IF NOT EXISTS idx_evaluation_results_competence_id ON evaluation_results(competence_id);

    CREATE TABLE IF NOT EXISTS schedule_slots (
      id TEXT PRIMARY KEY NOT NULL,
      class_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      subject TEXT NOT NULL,
      frequency TEXT NOT NULL,
      start_week INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      CHECK (day_of_week >= 1 AND day_of_week <= 7),
      CHECK (frequency IN ('weekly', 'biweekly')),
      CHECK (start_week IS NULL OR start_week IN (0, 1))
    );

    CREATE INDEX IF NOT EXISTS idx_schedule_slots_class_id ON schedule_slots(class_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_slots_day_of_week ON schedule_slots(day_of_week);
  `);

    // Migration: Ajouter les nouvelles colonnes si elles n'existent pas
    try {
        await db.execAsync(`
      ALTER TABLE students ADD COLUMN handicaps TEXT;
      ALTER TABLE students ADD COLUMN laterality TEXT;
      ALTER TABLE students ADD COLUMN custom_tags TEXT;
      ALTER TABLE students ADD COLUMN photo_url TEXT;
    `);
    } catch (error) {
        // Les colonnes existent déjà, ignorer l'erreur
    }

    // Migration: Ajouter is_homework aux évaluations
    try {
        await db.execAsync(`
      ALTER TABLE evaluations ADD COLUMN is_homework INTEGER NOT NULL DEFAULT 0;
    `);
    } catch (error) {
        // La colonne existe déjà, ignorer l'erreur
    }

    return db;
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
};

export const closeDatabase = async (): Promise<void> => {
    if (db) {
        await db.closeAsync();
        db = null;
    }
};

export const resetDatabase = async (): Promise<void> => {
    const database = getDatabase();
    await database.execAsync(`
    DROP TABLE IF EXISTS evaluation_results;
    DROP TABLE IF EXISTS evaluations;
    DROP TABLE IF EXISTS competences;
    DROP TABLE IF EXISTS attendances;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS schedule_slots;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS classes;
  `);
    await closeDatabase();
    await initDatabase();
};
