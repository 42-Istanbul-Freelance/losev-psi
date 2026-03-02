/**
 * Session notes API
 * GET  /api/notes — psychologist only
 * POST /api/notes — psychologist only
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireRole(req, 'psychologist', 'admin');
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const tag = searchParams.get('tag');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = `
    SELECT sn.*, u.name AS member_name, u.role AS member_role, u.sub_role
    FROM session_notes sn
    JOIN users u ON sn.member_user_id = u.id
    WHERE sn.psychologist_id = ?
  `;
    const args: unknown[] = [auth.userId];

    if (memberId) { query += ` AND sn.member_user_id = ?`; args.push(memberId); }
    if (dateFrom) { query += ` AND sn.created_at >= ?`; args.push(dateFrom); }
    if (dateTo) { query += ` AND sn.created_at <= ?`; args.push(dateTo); }
    if (tag) { query += ` AND sn.tags LIKE ?`; args.push(`%${tag}%`); }

    query += ` ORDER BY sn.created_at DESC`;

    const notes = db.prepare(query).all(...args);
    return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
    const auth = requireRole(req, 'psychologist');
    if (isAuthError(auth)) return auth;

    try {
        const body = await req.json();
        const { memberUserId, appointmentId, content, tags } = body;

        if (!memberUserId || !content) {
            return NextResponse.json({ error: 'Üye ve içerik gerekli' }, { status: 400 });
        }

        const db = getDb();
        const result = db.prepare(`
      INSERT INTO session_notes (psychologist_id, member_user_id, appointment_id, content, tags)
      VALUES (?, ?, ?, ?, ?)
    `).run(auth.userId, memberUserId, appointmentId ?? null, content, JSON.stringify(tags ?? []));

        const newNote = db.prepare(`
      SELECT sn.*, u.name AS member_name
      FROM session_notes sn
      JOIN users u ON sn.member_user_id = u.id
      WHERE sn.id = ?
    `).get(result.lastInsertRowid);

        return NextResponse.json({ note: newNote }, { status: 201 });
    } catch (err) {
        console.error('[Notes POST]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
