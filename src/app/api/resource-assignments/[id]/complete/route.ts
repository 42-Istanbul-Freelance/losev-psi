/**
 * Mark resource assignment as completed
 * PATCH /api/resource-assignments/[id]/complete
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/hero';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const db = getDb();

    const assignment = db.prepare(`SELECT * FROM resource_assignments WHERE id = ?`).get(id) as {
        id: number; assigned_to_user_id: number; completed_at: string | null;
    } | undefined;

    if (!assignment) {
        return NextResponse.json({ error: 'Atama bulunamadı' }, { status: 404 });
    }

    if (auth.role !== 'admin' && assignment.assigned_to_user_id !== auth.userId) {
        return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
    }

    if (assignment.completed_at) {
        return NextResponse.json({ error: 'Zaten tamamlandı' }, { status: 409 });
    }

    db.prepare(`UPDATE resource_assignments SET completed_at = datetime('now') WHERE id = ?`).run(id);

    // Award hero points
    if (auth.role === 'patient' || auth.role === 'family_member') {
        awardPoints(auth.userId, 'RESOURCE_COMPLETE', 20, 'Kaynak tamamlandı');
    }

    return NextResponse.json({ ok: true });
}
