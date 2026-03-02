/**
 * Admin: Create user (any role)
 * POST /api/admin/users
 * GET  /api/admin/users
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireRole, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireRole(req, 'admin');
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const query = role
        ? `SELECT id, name, email, role, sub_role, family_group_id, age, created_at FROM users WHERE role = ? ORDER BY name`
        : `SELECT id, name, email, role, sub_role, family_group_id, age, created_at FROM users ORDER BY role, name`;

    const users = role ? db.prepare(query).all(role) : db.prepare(query).all();
    return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
    const auth = requireRole(req, 'admin');
    if (isAuthError(auth)) return auth;

    try {
        const body = await req.json();
        const { name, email, password, role, subRole, familyGroupId, age } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Ad, email, şifre ve rol gerekli' }, { status: 400 });
        }

        const validRoles = ['admin', 'psychologist', 'patient', 'family_member'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 });
        }

        const db = getDb();
        const passwordHash = await bcrypt.hash(password, 10);

        const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, sub_role, family_group_id, age)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email.toLowerCase().trim(), passwordHash, role, subRole ?? null, familyGroupId ?? null, age ?? null);

        // Initialize hero progress for patients and family members
        if (role === 'patient' || role === 'family_member') {
            db.prepare(`
        INSERT OR IGNORE INTO hero_progress (user_id, total_points, current_level)
        VALUES (?, 0, 'Tomurcuk')
      `).run(result.lastInsertRowid);
        }

        const newUser = db.prepare(`SELECT id, name, email, role, sub_role, family_group_id, age FROM users WHERE id = ?`).get(result.lastInsertRowid);
        return NextResponse.json({ user: newUser }, { status: 201 });
    } catch (err: unknown) {
        if (err instanceof Error && err.message?.includes('UNIQUE')) {
            return NextResponse.json({ error: 'Bu email zaten kayıtlı' }, { status: 409 });
        }
        console.error('[Admin Users POST]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
