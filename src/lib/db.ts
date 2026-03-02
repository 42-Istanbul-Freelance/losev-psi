/**
 * Database module — SQLite via better-sqlite3
 * Database file: dev.db (project root)
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'dev.db');

// Singleton connection
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export default getDb;
