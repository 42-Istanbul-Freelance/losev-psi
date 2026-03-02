/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/utils';
import { initializeDatabase } from '@/lib/schema';

// Ensure DB is initialized on first request
let initialized = false;
function ensureInit() {
    if (!initialized) {
        initializeDatabase();
        initialized = true;
    }
}

export async function POST(req: NextRequest) {
    ensureInit();
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email ve şifre gerekli' }, { status: 400 });
        }

        const db = getDb();
        const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase().trim()) as {
            id: number; name: string; email: string; password_hash: string;
            role: string; sub_role: string | null; family_group_id: number | null; age: number | null;
        } | undefined;

        if (!user) {
            return NextResponse.json({ error: 'Geçersiz email veya şifre' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Geçersiz email veya şifre' }, { status: 401 });
        }

        const token = signToken({
            userId: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            familyGroupId: user.family_group_id,
        });

        const res = NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subRole: user.sub_role,
                familyGroupId: user.family_group_id,
                age: user.age,
            }
        });

        // Set cookie
        res.cookies.set('losev_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        return res;
    } catch (err) {
        console.error('[Login Error]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
