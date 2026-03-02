/**
 * Database initialization & schema migration script
 * Runs CREATE TABLE IF NOT EXISTS for all tables
 * Auto-seeds demo users if the database is empty (e.g. fresh Docker container)
 */
import { getDb } from './db';
import bcrypt from 'bcryptjs';

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

  // Auto-seed if database is empty (fresh Docker container)
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    console.log('[DB] Empty database detected — seeding demo data...');
    seedDemoData(db);
  }
}

/**
 * Insert demo/test users and sample data for development
 */
function seedDemoData(db: ReturnType<typeof getDb>) {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const insertUser = (
    name: string, email: string, password: string, role: string,
    subRole?: string | null, familyGroupId?: number | null, age?: number | null
  ) => {
    db.prepare(
      `INSERT OR IGNORE INTO users (name, email, password_hash, role, sub_role, family_group_id, age) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(name, email, hash(password), role, subRole ?? null, familyGroupId ?? null, age ?? null);
    return (db.prepare(`SELECT id FROM users WHERE email = ?`).get(email) as { id: number }).id;
  };

  // 1. Admin
  const adminId = insertUser('LÖSEV Admin', 'admin@losev.org', 'admin123', 'admin');

  // 2. Psychologists
  const psy1Id = insertUser('Dr. Ayşe Kaya', 'ayse@losev.org', 'psikolog123', 'psychologist');
  const psy2Id = insertUser('Dr. Mehmet Demir', 'mehmet@losev.org', 'psikolog123', 'psychologist');

  // 3. Family Groups
  const fg1 = db.prepare(`INSERT INTO family_groups (name, psychologist_id) VALUES (?, ?)`).run('Yılmaz Ailesi', psy1Id);
  const fg1Id = Number(fg1.lastInsertRowid);
  const fg2 = db.prepare(`INSERT INTO family_groups (name, psychologist_id) VALUES (?, ?)`).run('Çelik Ailesi', psy2Id);
  const fg2Id = Number(fg2.lastInsertRowid);

  // 4. Patients and family members
  const p1Id = insertUser('Ahmet Yılmaz', 'ahmet@yilmaz.com', 'hasta123', 'patient', null, fg1Id, 12);
  const m1Id = insertUser('Fatma Yılmaz', 'fatma@yilmaz.com', 'aile123', 'family_member', 'mother', fg1Id, 38);
  const f1Id = insertUser('Kemal Yılmaz', 'kemal@yilmaz.com', 'aile123', 'family_member', 'father', fg1Id, 42);
  const p2Id = insertUser('Zeynep Çelik', 'zeynep@celik.com', 'hasta123', 'patient', null, fg2Id, 16);
  const m2Id = insertUser('Selin Çelik', 'selin@celik.com', 'aile123', 'family_member', 'mother', fg2Id, 41);
  const s2Id = insertUser('Can Çelik', 'can@celik.com', 'aile123', 'family_member', 'sibling', fg2Id, 19);

  // 5. Hero progress
  [p1Id, m1Id, f1Id, p2Id, m2Id, s2Id].forEach(uid => {
    db.prepare(`INSERT OR IGNORE INTO hero_progress (user_id, total_points, current_level) VALUES (?, 0, 'Tomurcuk')`).run(uid);
  });
  db.prepare(`UPDATE hero_progress SET total_points = 185, current_level = 'Filiz' WHERE user_id = ?`).run(p1Id);
  db.prepare(`UPDATE hero_progress SET total_points = 120, current_level = 'Filiz' WHERE user_id = ?`).run(m1Id);

  // 6. Sample appointments
  const now = new Date();
  const future1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const future2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const past1 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO appointments (family_group_id, member_user_id, psychologist_id, title, scheduled_at, duration_minutes, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(fg1Id, p1Id, psy1Id, 'Ahmet ile Bireysel Seans', future1, 50, 'video', 'scheduled', 'Okul adaptasyonu ele alınacak');
  db.prepare(`INSERT INTO appointments (family_group_id, member_user_id, psychologist_id, title, scheduled_at, duration_minutes, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(fg1Id, m1Id, psy1Id, 'Fatma ile Aile Danışmanlığı', future2, 50, 'chat', 'scheduled', 'Ebeveyn destek seansı');
  db.prepare(`INSERT INTO appointments (family_group_id, member_user_id, psychologist_id, title, scheduled_at, duration_minutes, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(fg1Id, p1Id, psy1Id, 'Geçmiş Seans', past1, 50, 'video', 'completed', 'Güzel bir seans oldu, umutlu görünüyor');
  db.prepare(`INSERT INTO appointments (family_group_id, member_user_id, psychologist_id, title, scheduled_at, duration_minutes, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(fg2Id, p2Id, psy2Id, 'Zeynep ile Bireysel Seans', future1, 50, 'video', 'scheduled', 'Anksiyete yönetimi');

  // 7. Resources
  const r1 = db.prepare(`INSERT INTO resources (title, description, type, url, target_age_min, target_age_max, tags, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('Nefes Egzersizleri', 'Kaygı ile başa çıkmak için temel nefes teknikleri', 'video', 'https://www.youtube.com/embed/uxayUBd6T7M', 8, 99, JSON.stringify(['anksiyete', 'nefes', 'rahatlama']), adminId);
  const r2 = db.prepare(`INSERT INTO resources (title, description, type, url, target_age_min, target_age_max, tags, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('Kanserde Psikolojik Destek', 'Ebeveynler için kapsamlı rehber', 'article', 'https://www.losev.org.tr/', 18, 99, JSON.stringify(['ebeveyn', 'destek', 'rehber']), adminId);
  const r3 = db.prepare(`INSERT INTO resources (title, description, type, url, target_age_min, target_age_max, tags, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('Duygu Haritası Aktivitesi', 'Çocuklar için duyguları keşfetme aktivitesi', 'activity', null, 6, 14, JSON.stringify(['çocuk', 'duygular', 'aktivite']), adminId);

  const r1Id = Number(r1.lastInsertRowid);
  const r2Id = Number(r2.lastInsertRowid);
  const r3Id = Number(r3.lastInsertRowid);

  db.prepare(`INSERT INTO resource_assignments (resource_id, assigned_to_user_id, assigned_by_psychologist_id) VALUES (?, ?, ?)`).run(r1Id, p1Id, psy1Id);
  db.prepare(`INSERT INTO resource_assignments (resource_id, assigned_to_user_id, assigned_by_psychologist_id) VALUES (?, ?, ?)`).run(r2Id, m1Id, psy1Id);
  db.prepare(`INSERT INTO resource_assignments (resource_id, assigned_to_user_id, assigned_by_psychologist_id, completed_at) VALUES (?, ?, ?, datetime('now'))`).run(r3Id, p1Id, psy1Id);
  db.prepare(`INSERT INTO resource_assignments (resource_id, assigned_to_user_id, assigned_by_psychologist_id) VALUES (?, ?, ?)`).run(r1Id, p2Id, psy2Id);

  // 8. Sample chat messages
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO chat_messages (sender_id, receiver_id, family_group_id, member_user_id, content, message_type, created_at, read_at) VALUES (?, ?, ?, ?, ?, 'text', ?, ?)`)
    .run(psy1Id, p1Id, fg1Id, p1Id, 'Merhaba Ahmet, nasılsın? Haftaya görüşmemiz var.', fiveDaysAgo, fiveDaysAgo);
  db.prepare(`INSERT INTO chat_messages (sender_id, receiver_id, family_group_id, member_user_id, content, message_type, created_at, read_at) VALUES (?, ?, ?, ?, ?, 'text', ?, ?)`)
    .run(p1Id, psy1Id, fg1Id, p1Id, 'İyiyim, teşekkürler Dr. Kaya. Biraz yorgunum ama.', twoDaysAgo, twoDaysAgo);
  db.prepare(`INSERT INTO chat_messages (sender_id, receiver_id, family_group_id, member_user_id, content, message_type, mood_label, created_at) VALUES (?, ?, ?, ?, ?, 'mood', ?, ?)`)
    .run(p1Id, psy1Id, fg1Id, p1Id, 'Bugün biraz üzgün hissediyorum.', 'sad', new Date().toISOString());

  // 9. Session notes
  db.prepare(`INSERT INTO session_notes (psychologist_id, member_user_id, content, tags) VALUES (?, ?, ?, ?)`)
    .run(psy1Id, p1Id, 'Ahmet tedaviye iyi uyum sağlıyor. Okul arkadaşlarıyla ilişkileri hakkında konuştuk.', JSON.stringify(['ilerleme', 'okul', 'anksiyete']));
  db.prepare(`INSERT INTO session_notes (psychologist_id, member_user_id, content, tags) VALUES (?, ?, ?, ?)`)
    .run(psy1Id, m1Id, 'Fatma ebeveyn olarak kendini suçlama eğiliminde. Destek gruplarını önerdim.', JSON.stringify(['ebeveyn', 'suçluluk', 'destek']));

  // 10. Hard Day event
  db.prepare(`INSERT INTO hard_day_events (user_id, note, triggered_at) VALUES (?, ?, ?)`)
    .run(p1Id, 'Bugün hastaneye gitmek zorunda kaldım, çok korktum.', twoDaysAgo);

  // 11. Notifications
  db.prepare(`INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`).run(psy1Id, '🚨 Zor Gün Bildirimi', 'Ahmet Yılmaz zor bir gün yaşadığını bildirdi.', 'alert');
  db.prepare(`INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`).run(psy1Id, '📅 Yaklaşan Randevu', "Ahmet ile yarın saat 14:00'de seans var.", 'appointment');

  console.log('[DB] ✅ Demo data seeded successfully!');
  console.log('[DB] Test accounts: admin@losev.org/admin123, ayse@losev.org/psikolog123, ahmet@yilmaz.com/hasta123, fatma@yilmaz.com/aile123');
}
