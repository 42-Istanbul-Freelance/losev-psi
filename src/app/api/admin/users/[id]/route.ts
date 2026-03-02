/**
 * Admin: Update user's family group membership
 * PATCH /api/admin/users/[id]
 * DELETE /api/admin/users/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(req, 'admin');
    if (isAuthError(auth)) return auth;

    try {
        const { id } = await params;
        const body = await req.json();
        const { familyGroupId } = body;

        const db = getDb();
        db.prepare(`UPDATE users SET family_group_id = ? WHERE id = ?`).run(familyGroupId ?? null, id);

        const updated = db.prepare(`SELECT id, name, email, role, sub_role, family_group_id, age FROM users WHERE id = ?`).get(id);
        return NextResponse.json({ user: updated });
    } catch (err) {
        console.error('[Admin User PATCH]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(req, 'admin');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const db = getDb();
    db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    return NextResponse.json({ ok: true });
}
