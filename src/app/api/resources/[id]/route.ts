/**
 * Resource CRUD for a single resource
 * DELETE /api/resources/[id]
 * PATCH  /api/resources/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;
    if (!['admin', 'psychologist'].includes(auth.role)) {
        return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, description, type, url, targetAgeMin, targetAgeMax, tags } = body;

    const db = getDb();
    db.prepare(`
    UPDATE resources SET title=?, description=?, type=?, url=?, target_age_min=?, target_age_max=?, tags=?
    WHERE id=?
  `).run(title, description, type, url, targetAgeMin, targetAgeMax, JSON.stringify(tags ?? []), id);

    const updated = db.prepare(`SELECT * FROM resources WHERE id = ?`).get(id);
    return NextResponse.json({ resource: updated });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;
    if (auth.role !== 'admin') return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });

    const { id } = await params;
    const db = getDb();
    db.prepare(`DELETE FROM resources WHERE id = ?`).run(id);
    return NextResponse.json({ ok: true });
}
