/**
 * Chat messages API
 * GET  /api/chat — fetch thread between psychologist and a member
 * POST /api/chat — send a message
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/hero';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    let messages;

    if (auth.role === 'psychologist') {
        if (!memberId) {
            return NextResponse.json({ error: 'memberId gerekli' }, { status: 400 });
        }
        // Verify this member belongs to this psychologist's family
        const member = db.prepare(`
      SELECT u.*, fg.psychologist_id
      FROM users u
      JOIN family_groups fg ON u.family_group_id = fg.id
      WHERE u.id = ?
    `).get(memberId) as { psychologist_id: number } | undefined;

        if (!member || member.psychologist_id !== auth.userId) {
            return NextResponse.json({ error: 'Bu üyeye erişim yetkiniz yok' }, { status: 403 });
        }

        messages = db.prepare(`
      SELECT cm.*, s.name AS sender_name, r.name AS receiver_name
      FROM chat_messages cm
      JOIN users s ON cm.sender_id = s.id
      JOIN users r ON cm.receiver_id = r.id
      WHERE cm.member_user_id = ?
      ORDER BY cm.created_at ASC
    `).all(memberId);

        // Mark as read
        db.prepare(`UPDATE chat_messages SET read_at = datetime('now') WHERE member_user_id = ? AND receiver_id = ? AND read_at IS NULL`).run(memberId, auth.userId);
    } else {
        // patient / family_member — see their own thread
        messages = db.prepare(`
      SELECT cm.*, s.name AS sender_name, r.name AS receiver_name
      FROM chat_messages cm
      JOIN users s ON cm.sender_id = s.id
      JOIN users r ON cm.receiver_id = r.id
      WHERE cm.member_user_id = ?
      ORDER BY cm.created_at ASC
    `).all(auth.userId);

        // Mark as read
        db.prepare(`UPDATE chat_messages SET read_at = datetime('now') WHERE member_user_id = ? AND receiver_id = ? AND read_at IS NULL`).run(auth.userId, auth.userId);
    }

    return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (isAuthError(auth)) return auth;

    if (auth.role === 'admin') {
        return NextResponse.json({ error: 'Adminler mesaj gönderemez' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { content, messageType, moodLabel, memberId } = body;

        if (!content) {
            return NextResponse.json({ error: 'Mesaj içeriği gerekli' }, { status: 400 });
        }

        const db = getDb();
        let senderId: number, receiverId: number, memberUserId: number, familyGroupId: number;

        if (auth.role === 'psychologist') {
            if (!memberId) return NextResponse.json({ error: 'memberId gerekli' }, { status: 400 });
            const member = db.prepare(`
        SELECT u.*, fg.psychologist_id, fg.id AS fg_id
        FROM users u
        JOIN family_groups fg ON u.family_group_id = fg.id
        WHERE u.id = ?
      `).get(memberId) as { psychologist_id: number; fg_id: number; family_group_id: number } | undefined;

            if (!member || member.psychologist_id !== auth.userId) {
                return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
            }
            senderId = auth.userId;
            receiverId = Number(memberId);
            memberUserId = Number(memberId);
            familyGroupId = member.fg_id;
        } else {
            // patient or family_member
            const me = db.prepare(`
        SELECT u.*, fg.psychologist_id, fg.id AS fg_id
        FROM users u
        JOIN family_groups fg ON u.family_group_id = fg.id
        WHERE u.id = ?
      `).get(auth.userId) as { psychologist_id: number; fg_id: number; family_group_id: number } | undefined;

            if (!me) return NextResponse.json({ error: 'Aile grubu bulunamadı' }, { status: 400 });
            senderId = auth.userId;
            receiverId = me.psychologist_id;
            memberUserId = auth.userId;
            familyGroupId = me.fg_id;
        }

        const result = db.prepare(`
      INSERT INTO chat_messages (sender_id, receiver_id, family_group_id, member_user_id, content, message_type, mood_label)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(senderId, receiverId, familyGroupId, memberUserId, content, messageType ?? 'text', moodLabel ?? null);

        const newMsg = db.prepare(`
      SELECT cm.*, s.name AS sender_name, r.name AS receiver_name
      FROM chat_messages cm
      JOIN users s ON cm.sender_id = s.id
      JOIN users r ON cm.receiver_id = r.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid);

        // Award hero points for mood message
        if (messageType === 'mood' && (auth.role === 'patient' || auth.role === 'family_member')) {
            awardPoints(auth.userId, 'MOOD_MESSAGE', 5, `Ruh hali paylaşıldı: ${moodLabel}`);
        }

        return NextResponse.json({ message: newMsg }, { status: 201 });
    } catch (err) {
        console.error('[Chat POST]', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
