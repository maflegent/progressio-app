import * as SQLite from "expo-sqlite";

const DB_NAME = "progressio.db";
let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
  }
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      eisenhower TEXT,
      folder TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurring_pattern TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      estimated_duration INTEGER,
      actual_duration INTEGER,
      location TEXT,
      reminder_date TEXT,
      attachments TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diary_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT NOT NULL,
      linked_tasks TEXT DEFAULT '[]',
      photo_uri TEXT,
      location TEXT,
      created_at TEXT NOT NULL,
      weather TEXT,
      sleep_hours REAL,
      energy_level INTEGER,
      tags TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      linked_tasks TEXT DEFAULT '[]',
      files TEXT DEFAULT '[]',
      folder TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS custom_folders (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      theme TEXT NOT NULL DEFAULT 'system',
      language TEXT NOT NULL DEFAULT 'ru',
      task_reminders INTEGER NOT NULL DEFAULT 1,
      daily_digest INTEGER NOT NULL DEFAULT 0,
      weekly_review INTEGER NOT NULL DEFAULT 0,
      default_task_priority TEXT NOT NULL DEFAULT 'medium',
      working_hours_start TEXT NOT NULL DEFAULT '09:00',
      working_hours_end TEXT NOT NULL DEFAULT '18:00',
      app_state TEXT DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_folder ON tasks(folder);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(date);
    CREATE INDEX IF NOT EXISTS idx_diary_mood ON diary_entries(mood);
    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
