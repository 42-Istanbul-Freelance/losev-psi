/**
 * Resources library API
 * GET  /api/resources — all users can browse
 * POST /api/resources — admin only
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');

    let query = `SELECT r.*, u.name AS uploaded_by_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id WHERE 1=1`;
    const args: unknown[] = [];

    if (type) { query += ` AND r.type = ?`; args.push(type); }
    if (tag) { query += ` AND r.tags LIKE ?`; args.push(`%${tag}%`); }

    query += ` ORDER BY r.created_at DESC`;

    const resources = db.prepare(query).all(...args);
    return NextResponse.json({ resources });
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    if (!['admin', 'psychologist'].includes(auth.role)) {
        return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, description, type, url, targetAgeMin, targetAgeMax, tags } = body;

        if (!title || !type) {
            return NextResponse.json({ error: 'Başlık ve tür gerekli' }, { status: 400 });
        }

        const db = getDb();
        const result = db.prepare(`
      INSERT INTO resources (title, description, type, url, target_age_min, target_age_max, tags, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description ?? null, type, url ?? null, targetAgeMin ?? null, targetAgeMax ?? null, JSON.stringify(tags ?? []), auth.userId);

        const newResource = db.prepare(`SELECT * FROM resources WHERE id = ?`).get(result.lastInsertRowid);
        return NextResponse.json({ resource: newResource }, { status: 201 });
    } catch (err) {
        console.error('[Resources POST]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
