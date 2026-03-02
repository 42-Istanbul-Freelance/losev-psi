/**
 * Resource assignments API
 * GET  /api/resource-assignments — member sees own; psychologist sees assigned
 * POST /api/resource-assignments — assign resource to member
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/hero';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (auth.role === 'psychologist' && memberId) {
        const assignments = db.prepare(`
      SELECT ra.*, r.title, r.description, r.type, r.url, r.tags,
             u.name AS member_name
      FROM resource_assignments ra
      JOIN resources r ON ra.resource_id = r.id
      JOIN users u ON ra.assigned_to_user_id = u.id
      WHERE ra.assigned_to_user_id = ? AND ra.assigned_by_psychologist_id = ?
      ORDER BY ra.assigned_at DESC
    `).all(memberId, auth.userId);
        return NextResponse.json({ assignments });
    }

    if (auth.role === 'patient' || auth.role === 'family_member') {
        const assignments = db.prepare(`
      SELECT ra.*, r.title, r.description, r.type, r.url, r.tags
      FROM resource_assignments ra
      JOIN resources r ON ra.resource_id = r.id
      WHERE ra.assigned_to_user_id = ?
      ORDER BY ra.assigned_at DESC
    `).all(auth.userId);
        return NextResponse.json({ assignments });
    }

    if (auth.role === 'admin') {
        const assignments = db.prepare(`
      SELECT ra.*, r.title, r.type, u.name AS member_name, p.name AS psychologist_name
      FROM resource_assignments ra
      JOIN resources r ON ra.resource_id = r.id
      JOIN users u ON ra.assigned_to_user_id = u.id
      JOIN users p ON ra.assigned_by_psychologist_id = p.id
      ORDER BY ra.assigned_at DESC
    `).all();
        return NextResponse.json({ assignments });
    }

    return NextResponse.json({ assignments: [] });
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;
    if (auth.role !== 'psychologist') {
        return NextResponse.json({ error: 'Sadece psikologlar kaynak atayabilir' }, { status: 403 });
    }

    const body = await req.json();
    const { resourceId, assignedToUserId } = body;

    if (!resourceId || !assignedToUserId) {
        return NextResponse.json({ error: 'Kaynak ve üye gerekli' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
    INSERT INTO resource_assignments (resource_id, assigned_to_user_id, assigned_by_psychologist_id)
    VALUES (?, ?, ?)
  `).run(resourceId, assignedToUserId, auth.userId);

    const newAssignment = db.prepare(`
    SELECT ra.*, r.title, r.type FROM resource_assignments ra
    JOIN resources r ON ra.resource_id = r.id
    WHERE ra.id = ?
  `).get(result.lastInsertRowid);

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
}
