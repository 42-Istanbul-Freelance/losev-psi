/**
 * Admin: Family groups management
 * GET  /api/admin/families
 * POST /api/admin/families
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireRole(req, 'admin');
    if (isAuthError(auth)) return auth;

    const db = getDb();

    const families = db.prepare(`
    SELECT
      fg.*,
      u.name AS psychologist_name,
      u.email AS psychologist_email,
      COUNT(DISTINCT m.id) AS member_count
    FROM family_groups fg
    LEFT JOIN users u ON fg.psychologist_id = u.id
    LEFT JOIN users m ON m.family_group_id = fg.id
    GROUP BY fg.id
    ORDER BY fg.created_at DESC
  `).all();

    // Get members for each family
    const familiesWithMembers = (families as { id: number; name: string; psychologist_id: number | null; psychologist_name: string | null; psychologist_email: string | null; member_count: number; created_at: string }[]).map(fg => {
        const members = db.prepare(`
      SELECT id, name, email, role, sub_role, age FROM users
      WHERE family_group_id = ? ORDER BY role, name
    `).all(fg.id);
        return { ...fg, members };
    });

    return NextResponse.json({ families: familiesWithMembers });
}

export async function POST(req: NextRequest) {
    const auth = requireRole(req, 'admin');
    if (isAuthError(auth)) return auth;

    try {
        const body = await req.json();
        const { name, psychologistId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Aile grubu adı gerekli' }, { status: 400 });
        }

        const db = getDb();
        const result = db.prepare(`
      INSERT INTO family_groups (name, psychologist_id) VALUES (?, ?)
    `).run(name, psychologistId ?? null);

        const newFg = db.prepare(`SELECT * FROM family_groups WHERE id = ?`).get(result.lastInsertRowid);
        return NextResponse.json({ family: newFg }, { status: 201 });
    } catch (err) {
        console.error('[Admin Families POST]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
