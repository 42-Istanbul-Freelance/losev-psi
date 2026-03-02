/**
 * Hero Journey API
 * GET  /api/hero — get progress for current user or a specific member
 * POST /api/hero/award — psychologist manually awards bonus points
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getHeroProgress } from '@/lib/hero';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    const targetId = memberId && ['psychologist', 'admin'].includes(auth.role)
        ? Number(memberId)
        : auth.userId;

    const data = getHeroProgress(targetId);
    return NextResponse.json(data);
}
