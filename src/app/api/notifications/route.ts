/**
 * Notifications API
 * GET  /api/notifications — user's notifications
 * PATCH /api/notifications/[id]/read — mark as read
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(auth.userId);

    const unreadCount = (db.prepare(`SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0`).get(auth.userId) as { c: number }).c;

    return NextResponse.json({ notifications, unreadCount });
}
