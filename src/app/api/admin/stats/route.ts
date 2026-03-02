/**
 * Admin: Stats overview
 * GET /api/admin/stats
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = requireRole(req, 'admin');
    if (isAuthError(auth)) return auth;

    const db = getDb();

    const totalUsers = (db.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number }).c;
    const totalPsychologists = (db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'psychologist'`).get() as { c: number }).c;
    const totalPatients = (db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'patient'`).get() as { c: number }).c;
    const totalFamilies = (db.prepare(`SELECT COUNT(*) AS c FROM family_groups`).get() as { c: number }).c;
    const totalAppointments = (db.prepare(`SELECT COUNT(*) AS c FROM appointments`).get() as { c: number }).c;
    const totalResources = (db.prepare(`SELECT COUNT(*) AS c FROM resources`).get() as { c: number }).c;
    const hardDayTotal = (db.prepare(`SELECT COUNT(*) AS c FROM hard_day_events`).get() as { c: number }).c;
    const recentHardDays = db.prepare(`
    SELECT hde.*, u.name AS user_name, u.family_group_id
    FROM hard_day_events hde
    JOIN users u ON hde.user_id = u.id
    WHERE hde.acknowledged_by_psychologist = 0
    ORDER BY hde.triggered_at DESC LIMIT 5
  `).all();

    return NextResponse.json({
        stats: {
            totalUsers, totalPsychologists, totalPatients,
            totalFamilies, totalAppointments, totalResources, hardDayTotal
        },
        recentHardDays
    });
}
