/**
 * Psychologist's assigned families overview
 * GET /api/psychologist/families
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireRole(req, 'psychologist');
    if (isAuthError(auth)) return auth;

    const db = getDb();

    const families = db.prepare(`
    SELECT fg.*, COUNT(DISTINCT u.id) AS member_count
    FROM family_groups fg
    LEFT JOIN users u ON u.family_group_id = fg.id
    WHERE fg.psychologist_id = ?
    GROUP BY fg.id
    ORDER BY fg.created_at DESC
  `).all(auth.userId) as { id: number; name: string; member_count: number; created_at: string }[];

    const familiesWithMembers = families.map(fg => {
        const members = db.prepare(`
      SELECT id, name, email, role, sub_role, age
      FROM users
      WHERE family_group_id = ?
      ORDER BY role ASC, name ASC
    `).all(fg.id);

        return { ...fg, members };
    });

    return NextResponse.json({ families: familiesWithMembers });
}
