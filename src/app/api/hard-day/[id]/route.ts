/**
 * Hard day acknowledge (psychologist marks as seen)
 * PATCH /api/hard-day/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(req, 'psychologist', 'admin');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const db = getDb();
    db.prepare(`UPDATE hard_day_events SET acknowledged_by_psychologist = 1 WHERE id = ?`).run(id);
    return NextResponse.json({ ok: true });
}
