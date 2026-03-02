/**
 * Admin: Assign psychologist to family group
 * PATCH /api/admin/families/[id]/assign
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
        const { psychologistId } = await req.json();

        const db = getDb();

        // Verify psychologist exists
        if (psychologistId) {
            const psy = db.prepare(`SELECT id, role FROM users WHERE id = ? AND role = 'psychologist'`).get(psychologistId);
            if (!psy) {
                return NextResponse.json({ error: 'Psikolog bulunamadı' }, { status: 404 });
            }
        }

        db.prepare(`UPDATE family_groups SET psychologist_id = ? WHERE id = ?`).run(psychologistId ?? null, id);

        const updated = db.prepare(`
      SELECT fg.*, u.name AS psychologist_name
      FROM family_groups fg
      LEFT JOIN users u ON fg.psychologist_id = u.id
      WHERE fg.id = ?
    `).get(id);

        return NextResponse.json({ family: updated });
    } catch (err) {
        console.error('[Admin Assign]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
