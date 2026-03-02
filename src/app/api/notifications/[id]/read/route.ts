/**
 * Mark notification as read
 * PATCH /api/notifications/[id]/read
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const db = getDb();
    db.prepare(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`).run(id, auth.userId);
    return NextResponse.json({ ok: true });
}
