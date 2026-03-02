/**
 * Individual appointment operations
 * PATCH /api/appointments/[id] — update status/notes
 * DELETE /api/appointments/[id]
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
    const body = await req.json();
    const { status, notes, title, scheduledAt, durationMinutes, type } = body;

    const db = getDb();
    const appointment = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(id) as {
        id: number; status: string; member_user_id: number; psychologist_id: number;
    } | undefined;

    if (!appointment) {
        return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 });
    }

    // Permission check
    if (auth.role === 'patient' || auth.role === 'family_member') {
        return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
    }

    // Build update
    const updates: string[] = [];
    const values: unknown[] = [];
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (scheduledAt !== undefined) { updates.push('scheduled_at = ?'); values.push(scheduledAt); }
    if (durationMinutes !== undefined) { updates.push('duration_minutes = ?'); values.push(durationMinutes); }
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }

    if (updates.length === 0) {
        return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
    }

    values.push(id);
    db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Award hero points when session is completed by member
    if (status === 'completed' && appointment.status !== 'completed') {
        awardPoints(appointment.member_user_id, 'SESSION_COMPLETE', 50, 'Seans tamamlandı');
    }

    const updated = db.prepare(`
    SELECT a.*, u.name AS member_name, fg.name AS family_name
    FROM appointments a
    JOIN users u ON a.member_user_id = u.id
    JOIN family_groups fg ON a.family_group_id = fg.id
    WHERE a.id = ?
  `).get(id);

    return NextResponse.json({ appointment: updated });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    if (!['admin', 'psychologist'].includes(auth.role)) {
        return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    db.prepare(`DELETE FROM appointments WHERE id = ?`).run(id);
    return NextResponse.json({ ok: true });
}
