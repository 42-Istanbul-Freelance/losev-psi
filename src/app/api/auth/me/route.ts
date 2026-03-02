/**
 * GET /api/auth/me
 * Returns current authenticated user info
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const user = db.prepare(`
    SELECT id, name, email, role, sub_role, family_group_id, age, created_at
    FROM users WHERE id = ?
  `).get(auth.userId) as { id: number; name: string; email: string; role: string; sub_role: string | null; family_group_id: number | null; age: number | null; created_at: string } | undefined;

    if (!user) {
        return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ user });
}
