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
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS classes;
  `);
    await closeDatabase();
    await initDatabase();
};
