/**
 * Hero Journey levels and point thresholds
 */
export const HERO_LEVELS = [
    { name: 'Tomurcuk', minPoints: 0, badge: '🌱', message: 'Yolculuğunuz başlıyor. Her adım önemli.' },
    { name: 'Filiz', minPoints: 100, badge: '🌿', message: 'Büyümeye başladınız. Devam edin!' },
    { name: 'Genç Kahraman', minPoints: 250, badge: '⚡', message: 'Gücünüz artıyor. Harikasınız!' },
    { name: 'Kahraman', minPoints: 500, badge: '🌟', message: 'Gerçek bir kahraman oldunuz!' },
    { name: 'Efsane', minPoints: 1000, badge: '🏆', message: 'Efsanevi bir yolculuk! Gurur duyuyoruz.' },
];

export const HERO_POINT_RULES = {
    SESSION_COMPLETE: 50,
    RESOURCE_COMPLETE: 20,
    MOOD_MESSAGE: 5,
    HARD_DAY_FOLLOWUP: 10,
    LOGIN_STREAK: 5,
    BONUS: 0, // Dynamic
};

export function getLevelForPoints(points: number) {
    let level = HERO_LEVELS[0];
    for (const l of HERO_LEVELS) {
        if (points >= l.minPoints) level = l;
    }
    return level;
}

/**
 * JWT and auth utilities
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'losev-psi-secret-dev-key-change-in-production';

export interface JWTPayload {
    userId: number;
    role: string;
    email: string;
    name: string;
    familyGroupId: number | null;
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}
