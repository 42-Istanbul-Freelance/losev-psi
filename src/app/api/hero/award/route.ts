/**
 * Psychologist manually awards bonus hero points to a member
 * POST /api/hero/award
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth';
import { awardPoints } from '@/lib/hero';

export async function POST(req: NextRequest) {
    const auth = requireRole(req, 'psychologist', 'admin');
    if (isAuthError(auth)) return auth;

    try {
        const body = await req.json();
        const { userId, points, note } = body;

        if (!userId || !points || points <= 0) {
            return NextResponse.json({ error: 'Kullanıcı ve puan gerekli' }, { status: 400 });
        }

        const result = awardPoints(Number(userId), 'BONUS', points, note ?? 'Manuel bonus puan');
        return NextResponse.json({ ok: true, result });
    } catch (err) {
        console.error('[Hero Award]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
