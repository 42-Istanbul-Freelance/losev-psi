/**
 * Route/request auth middleware helpers for Next.js API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './utils';

export function getTokenFromRequest(req: NextRequest): string | null {
    // Check Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    // Check cookie
    const cookieToken = req.cookies.get('losev_token')?.value;
    if (cookieToken) return cookieToken;
    return null;
}

export function requireAuth(req: NextRequest): JWTPayload | NextResponse {
    const token = getTokenFromRequest(req);
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return payload;
}

export function requireRole(req: NextRequest, ...roles: string[]): JWTPayload | NextResponse {
    const result = requireAuth(req);
    if (result instanceof NextResponse) return result;
    if (!roles.includes(result.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return result;
}

export function isAuthError(v: JWTPayload | NextResponse): v is NextResponse {
    return v instanceof NextResponse;
}
