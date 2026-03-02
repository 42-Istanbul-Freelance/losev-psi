/**
 * Appointments API
 * GET  /api/appointments — list (filtered by role)
 * POST /api/appointments — create (psychologist or admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const familyGroupId = searchParams.get('familyGroupId');

    let appointments;

    if (auth.role === 'admin') {
        appointments = db.prepare(`
      SELECT a.*, u.name AS member_name, u.role AS member_role, u.sub_role,
             p.name AS psychologist_name, fg.name AS family_name
      FROM appointments a
      JOIN users u ON a.member_user_id = u.id
      JOIN users p ON a.psychologist_id = p.id
      JOIN family_groups fg ON a.family_group_id = fg.id
      ORDER BY a.scheduled_at DESC
    `).all();
    } else if (auth.role === 'psychologist') {
        appointments = db.prepare(`
      SELECT a.*, u.name AS member_name, u.role AS member_role, u.sub_role,
             fg.name AS family_name
      FROM appointments a
      JOIN users u ON a.member_user_id = u.id
      JOIN family_groups fg ON a.family_group_id = fg.id
      WHERE a.psychologist_id = ?
      ${memberId ? 'AND a.member_user_id = ?' : ''}
      ${familyGroupId ? 'AND a.family_group_id = ?' : ''}
      ORDER BY a.scheduled_at DESC
    `).all(
            auth.userId,
            ...(memberId ? [memberId] : []),
            ...(familyGroupId ? [familyGroupId] : [])
        );
    } else {
        // patient / family_member — see only their own appointments
        appointments = db.prepare(`
      SELECT a.*, p.name AS psychologist_name, fg.name AS family_name
      FROM appointments a
      JOIN users p ON a.psychologist_id = p.id
      JOIN family_groups fg ON a.family_group_id = fg.id
      WHERE a.member_user_id = ?
      ORDER BY a.scheduled_at DESC
    `).all(auth.userId);
    }

    return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    if (!['admin', 'psychologist'].includes(auth.role)) {
        return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { familyGroupId, memberUserId, title, scheduledAt, durationMinutes, type, notes } = body;

        if (!familyGroupId || !memberUserId || !title || !scheduledAt || !type) {
            return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 });
        }

        const db = getDb();

        // Determine psychologist_id
        let psychologistId = auth.userId;
        if (auth.role === 'admin') {
            const fg = db.prepare(`SELECT psychologist_id FROM family_groups WHERE id = ?`).get(familyGroupId) as { psychologist_id: number | null } | undefined;
            psychologistId = fg?.psychologist_id ?? auth.userId;
        }

        const result = db.prepare(`
      INSERT INTO appointments (family_group_id, member_user_id, psychologist_id, title, scheduled_at, duration_minutes, type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `).run(familyGroupId, memberUserId, psychologistId, title, scheduledAt, durationMinutes ?? 50, type, notes ?? null);

        const newAppointment = db.prepare(`
      SELECT a.*, u.name AS member_name, fg.name AS family_name
      FROM appointments a
      JOIN users u ON a.member_user_id = u.id
      JOIN family_groups fg ON a.family_group_id = fg.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

        return NextResponse.json({ appointment: newAppointment }, { status: 201 });
    } catch (err) {
        console.error('[Appointments POST]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
