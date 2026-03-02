/**
 * Database module — SQLite via better-sqlite3
 * DB path: DB_PATH env değişkeni varsa onu kullan, yoksa proje kökündeki dev.db
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'dev.db');

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
