/**
 * Database initialization & schema migration script
 * Runs CREATE TABLE IF NOT EXISTS for all tables
 */
import { getDb } from './db';

export function initializeDatabase() {
    const db = getDb();

    db.exec(`
    -- Users table (all roles)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','psychologist','patient','family_member')),
      sub_role TEXT, -- mother, father, sibling, other (for family_member role)
      family_group_id INTEGER REFERENCES family_groups(id) ON DELETE SET NULL,
      age INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Family groups
    CREATE TABLE IF NOT EXISTS family_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      psychologist_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Appointments
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_group_id INTEGER NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
      member_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      psychologist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 50,
      type TEXT NOT NULL CHECK(type IN ('video','chat')),
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Chat messages (per-member threads)
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      family_group_id INTEGER NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
      member_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text' CHECK(message_type IN ('text','mood')),
      mood_label TEXT, -- e.g. 'sad', 'anxious', 'angry', 'okay', 'strong'
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      read_at TEXT
    );

    -- Session notes (psychologist-only, private)
    CREATE TABLE IF NOT EXISTS session_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      psychologist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      member_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]', -- JSON array of tag strings
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Hard day events
    CREATE TABLE IF NOT EXISTS hard_day_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note TEXT,
      triggered_at TEXT NOT NULL DEFAULT (datetime('now')),
      acknowledged_by_psychologist INTEGER DEFAULT 0
    );

    -- Resources (library managed by admin)
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('video','article','activity')),
      url TEXT,
      target_age_min INTEGER,
      target_age_max INTEGER,
      tags TEXT DEFAULT '[]', -- JSON array
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Resource assignments (psychologist assigns to a member)
    CREATE TABLE IF NOT EXISTS resource_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      assigned_to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_by_psychologist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    -- Hero progress (per user)
    CREATE TABLE IF NOT EXISTS hero_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      total_points INTEGER NOT NULL DEFAULT 0,
      current_level TEXT NOT NULL DEFAULT 'Tomurcuk',
      last_updated TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Hero events (point log)
    CREATE TABLE IF NOT EXISTS hero_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Notifications (in-app)
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Login streak tracking
    CREATE TABLE IF NOT EXISTS login_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_login_date TEXT,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0
    );
  `);

    console.log('[DB] Schema initialized');
}
