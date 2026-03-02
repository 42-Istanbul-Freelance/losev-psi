/**
 * Hard Day Button API
 * GET  /api/hard-day — psychologist sees alerts; member checks today's status
 * POST /api/hard-day — member triggers hard day
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/hero';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const db = getDb();

  if (auth.role === 'psychologist') {
    // Get all hard day alerts from assigned families
    const events = db.prepare(`
      SELECT hde.*, u.name AS user_name, u.role AS user_role, u.sub_role,
             fg.name AS family_name
      FROM hard_day_events hde
      JOIN users u ON hde.user_id = u.id
      JOIN family_groups fg ON u.family_group_id = fg.id
      WHERE fg.psychologist_id = ?
      ORDER BY hde.triggered_at DESC
    `).all(auth.userId);
    return NextResponse.json({ events });
  }

  if (auth.role === 'admin') {
    const events = db.prepare(`
      SELECT hde.*, u.name AS user_name, fg.name AS family_name
      FROM hard_day_events hde
      JOIN users u ON hde.user_id = u.id
      LEFT JOIN family_groups fg ON u.family_group_id = fg.id
      ORDER BY hde.triggered_at DESC
    `).all();
    return NextResponse.json({ events });
  }

  // For members: check if they already pressed today
  const today = new Date().toISOString().substring(0, 10);
  const todayEvent = db.prepare(`
    SELECT * FROM hard_day_events
    WHERE user_id = ? AND date(triggered_at) = ?
  `).get(auth.userId, today);

  const history = db.prepare(`
    SELECT * FROM hard_day_events WHERE user_id = ? ORDER BY triggered_at DESC LIMIT 10
  `).all(auth.userId);

  return NextResponse.json({ pressedToday: !!todayEvent, history });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  if (auth.role === 'admin') {
    return NextResponse.json({ error: 'Bu işlem adminler için değil' }, { status: 403 });
  }

  const db = getDb();

  // No daily limit — users can send hard-day signals whenever needed

  const body = await req.json().catch(() => ({}));
  const { note } = body;

  const result = db.prepare(`
    INSERT INTO hard_day_events (user_id, note) VALUES (?, ?)
  `).run(auth.userId, note ?? null);

  // Notify assigned psychologist
  const userInfo = db.prepare(`
    SELECT u.name, fg.psychologist_id
    FROM users u
    LEFT JOIN family_groups fg ON u.family_group_id = fg.id
    WHERE u.id = ?
  `).get(auth.userId) as { name: string; psychologist_id: number | null } | undefined;

  if (userInfo?.psychologist_id) {
    db.prepare(`
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (?, ?, ?, 'alert')
    `).run(
      userInfo.psychologist_id,
      '🚨 Zor Gün Bildirimi',
      `${userInfo.name} zor bir gün yaşadığını bildirdi.${note ? ` Not: "${note}"` : ''}`
    );
  }

  // Award points if note is provided
  if (note && note.trim().length > 0) {
    awardPoints(auth.userId, 'HARD_DAY_FOLLOWUP', 10, 'Zor gün bildirimi ile not eklendi');
  }

  return NextResponse.json({ ok: true, id: result.lastInsertRowid }, { status: 201 });
}
