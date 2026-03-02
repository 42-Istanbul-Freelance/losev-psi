/**
 * Hero progress service — awards points and updates level
 */
import { getDb } from './db';
import { getLevelForPoints, HERO_POINT_RULES } from './utils';

export type HeroEventType = keyof typeof HERO_POINT_RULES;

export function awardPoints(
    userId: number,
    eventType: string,
    points: number,
    note?: string
) {
    const db = getDb();

    // Ensure hero_progress row exists
    db.prepare(`
    INSERT OR IGNORE INTO hero_progress (user_id, total_points, current_level)
    VALUES (?, 0, 'Tomurcuk')
  `).run(userId);

    // Log event
    db.prepare(`
    INSERT INTO hero_events (user_id, event_type, points_awarded, note)
    VALUES (?, ?, ?, ?)
  `).run(userId, eventType, points, note ?? null);

    // Update total points
    const updated = db.prepare(`
    UPDATE hero_progress
    SET total_points = total_points + ?,
        last_updated = datetime('now')
    WHERE user_id = ?
    RETURNING total_points
  `).get(userId, points) as { total_points: number } | undefined;

    // Wait – SQLite doesn't always support RETURNING in older builds; fallback:
    const row = db.prepare(`SELECT total_points FROM hero_progress WHERE user_id = ?`).get(userId) as { total_points: number };
    const newLevel = getLevelForPoints(row.total_points);

    db.prepare(`
    UPDATE hero_progress SET current_level = ? WHERE user_id = ?
  `).run(newLevel.name, userId);

    return { totalPoints: row.total_points, level: newLevel };
}

export function getHeroProgress(userId: number) {
    const db = getDb();
    // Ensure row exists
    db.prepare(`
    INSERT OR IGNORE INTO hero_progress (user_id, total_points, current_level)
    VALUES (?, 0, 'Tomurcuk')
  `).run(userId);

    const progress = db.prepare(`SELECT * FROM hero_progress WHERE user_id = ?`).get(userId) as {
        id: number; user_id: number; total_points: number; current_level: string; last_updated: string;
    };
    const events = db.prepare(`SELECT * FROM hero_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`).all(userId);
    const level = getLevelForPoints(progress.total_points);
    return { progress, events, level };
}
