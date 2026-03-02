'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { use } from 'react';
import Link from 'next/link';
import { MessageSquare, BookOpen, Star, Send, Plus, Tag, X, Check, Smile, Gift } from 'lucide-react';
import { HERO_LEVELS } from '@/lib/utils';

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
    sub_role: string | null;
    age: number | null;
}

interface ChatMessage {
    id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    message_type: string;
    mood_label: string | null;
    created_at: string;
}

interface ResourceAssignment {
    id: number;
    title: string;
    type: string;
    url: string | null;
    completed_at: string | null;
    assigned_at: string;
}

interface Resource {
    id: number;
    title: string;
    type: string;
    url: string | null;
    description: string | null;
}

interface HeroProgress {
    progress: { total_points: number; current_level: string };
    events: { id: number; event_type: string; points_awarded: number; note: string | null; created_at: string }[];
    level: { name: string; badge: string; minPoints: number; message: string };
}

const MOOD_OPTIONS = [
    { label: 'sad', emoji: '😔', text: 'Üzgün' },
    { label: 'anxious', emoji: '😰', text: 'Endişeli' },
    { label: 'angry', emoji: '😠', text: 'Kızgın' },
    { label: 'okay', emoji: '🙂', text: 'İyi' },
    { label: 'strong', emoji: '💪', text: 'Güçlü' },
];

type Tab = 'chat' | 'resources' | 'hero' | 'notes';

export default function MemberDetailPage({ params }: { params: Promise<{ id: string; memberId: string }> }) {
    const { id: familyId, memberId } = use(params);
    const { apiFetch } = useApi();

    const [member, setMember] = useState<Member | null>(null);
    const [tab, setTab] = useState<Tab>('chat');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [hero, setHero] = useState<HeroProgress | null>(null);
    const [loading, setLoading] = useState(true);

    // Chat
    const [msgInput, setMsgInput] = useState('');
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Resource assignment
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [selectedResource, setSelectedResource] = useState('');

    // Hero bonus
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [bonusPoints, setBonusPoints] = useState('');
    const [bonusNote, setBonusNote] = useState('');

    const fetchAll = async () => {
        const [memberRes, msgRes, assignRes, heroRes, resRes] = await Promise.all([
            apiFetch('/api/admin/families'),
            apiFetch(`/api/chat?memberId=${memberId}`),
            apiFetch(`/api/resource-assignments?memberId=${memberId}`),
            apiFetch(`/api/hero?memberId=${memberId}`),
            apiFetch('/api/resources'),
        ]);

        const [fData, msgData, assignData, heroData, resData] = await Promise.all([
            memberRes.json(), msgRes.json(), assignRes.json(), heroRes.json(), resRes.json()
        ]);

        // Find member
        for (const family of (fData.families || [])) {
            const m = family.members?.find((m: Member) => m.id === parseInt(memberId));
            if (m) { setMember(m); break; }
        }

        setMessages(msgData.messages || []);
        setAssignments(assignData.assignments || []);
        setHero(heroData);
        setAllResources(resData.resources || []);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, [memberId]);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMessage = async (moodLabel?: string) => {
        if (!msgInput.trim() && !moodLabel) return;
        await apiFetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                memberId: parseInt(memberId),
                content: msgInput || (moodLabel ? `Ruh hali: ${MOOD_OPTIONS.find(m => m.label === moodLabel)?.text}` : ''),
                messageType: moodLabel ? 'mood' : 'text',
                moodLabel: moodLabel || undefined,
            }),
        });
        setMsgInput('');
        setShowMoodPicker(false);
        const res = await apiFetch(`/api/chat?memberId=${memberId}`);
        const data = await res.json();
        setMessages(data.messages || []);
    };

    const assignResource = async () => {
        if (!selectedResource) return;
        await apiFetch('/api/resource-assignments', {
            method: 'POST',
            body: JSON.stringify({ resourceId: parseInt(selectedResource), assignedToUserId: parseInt(memberId) }),
        });
        setShowResourceModal(false);
        setSelectedResource('');
        fetchAll();
    };

    const awardBonus = async () => {
        if (!bonusPoints || parseInt(bonusPoints) <= 0) return;
        await apiFetch('/api/hero/award', {
            method: 'POST',
            body: JSON.stringify({ userId: parseInt(memberId), points: parseInt(bonusPoints), note: bonusNote }),
        });
        setShowBonusModal(false);
        setBonusPoints(''); setBonusNote('');
        fetchAll();
    };

    const nextLevel = hero ? HERO_LEVELS.find(l => l.minPoints > (hero.progress.total_points)) : null;
    const progress = hero && nextLevel
        ? Math.min(100, ((hero.progress.total_points - (HERO_LEVELS.find(l => l.name === hero.progress.current_level)?.minPoints || 0)) /
            (nextLevel.minPoints - (HERO_LEVELS.find(l => l.name === hero.progress.current_level)?.minPoints || 0))) * 100)
        : 100;

    return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-fade-in">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-4" style={{ color: '#8097B8' }}>
                    <Link href="/psychologist" className="hover:underline" style={{ color: '#3A7FD5' }}>Ana Panel</Link>
                    <span>›</span>
                    <Link href={`/psychologist/family/${familyId}`} className="hover:underline" style={{ color: '#3A7FD5' }}>Aile Grubu</Link>
                    <span>›</span>
                    <span style={{ color: '#1A2B4A' }}>{member?.name || 'Üye'}</span>
                </div>

                {/* Member Header */}
                {member && (
                    <div className="card p-5 mb-6 flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                            style={{
                                background: member.role === 'patient' ? 'rgba(77,170,130,0.12)' : 'rgba(232,112,90,0.12)',
                                border: `1px solid ${member.role === 'patient' ? 'rgba(77,170,130,0.3)' : 'rgba(232,112,90,0.3)'}`,
                                color: member.role === 'patient' ? '#28785A' : '#B84830'
                            }}
                        >
                            {member.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>{member.name}</h1>
                            <p className="text-sm" style={{ color: '#3D5475' }}>{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`badge ${member.role === 'patient' ? 'badge-green' : 'badge-pink'}`}>
                                    {member.role === 'patient' ? 'Hasta' : member.sub_role || 'Aile Üyesi'}
                                </span>
                                {member.age && <span className="text-xs" style={{ color: '#8097B8' }}>{member.age} yaş</span>}
                                {hero && (
                                    <span className="badge badge-yellow">{hero.level.badge} {hero.progress.current_level}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl border w-fit" style={{ background: 'rgba(58,127,213,0.04)', borderColor: 'rgba(58,127,213,0.10)' }}>
                    {([
                        { key: 'chat', label: 'Sohbet', icon: <MessageSquare size={14} /> },
                        { key: 'resources', label: 'Kaynaklar', icon: <BookOpen size={14} /> },
                        { key: 'hero', label: 'Kahraman', icon: <Star size={14} /> },
                    ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all border"
                            style={tab === t.key
                                ? { background: 'rgba(58,127,213,0.1)', color: '#3A7FD5', borderColor: 'rgba(58,127,213,0.3)' }
                                : { color: '#3D5475', borderColor: 'transparent' }}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Chat */}
                {tab === 'chat' && (
                    <div className="card flex flex-col" style={{ height: '65vh' }}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="text-center py-8 text-sm" style={{ color: '#8097B8' }}>Henüz mesaj yok</div>
                            )}
                            {messages.map(msg => {
                                const isSentByPsy = msg.sender_id !== parseInt(memberId);
                                const moodOption = MOOD_OPTIONS.find(m => m.label === msg.mood_label);
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isSentByPsy ? 'items-end' : 'items-start'}`}>
                                        <p className="text-[10px] mb-1 px-1" style={{ color: '#8097B8' }}>{msg.sender_name}</p>
                                        {msg.message_type === 'mood' ? (
                                            <div className="chat-bubble-mood">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl">{moodOption?.emoji || '💬'}</span>
                                                    <span className="font-semibold text-sm" style={{ color: '#E8705A' }}>{moodOption?.text || msg.mood_label}</span>
                                                </div>
                                                <p className="text-sm" style={{ color: '#1A2B4A' }}>{msg.content}</p>
                                            </div>
                                        ) : (
                                            <div className={isSentByPsy ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                                                {msg.content}
                                            </div>
                                        )}
                                        <p className="text-[10px] mt-1 px-1" style={{ color: '#8097B8' }}>
                                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3" style={{ borderTop: '1px solid rgba(58,127,213,0.08)' }}>
                            <div className="flex gap-2">
                                <input
                                    className="input flex-1"
                                    value={msgInput}
                                    onChange={e => setMsgInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    placeholder="Mesajınızı yazın..."
                                />
                                <button onClick={() => sendMessage()} className="btn-primary px-3">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Resources */}
                {tab === 'resources' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-header mb-0">Atanan Kaynaklar</h2>
                            <button onClick={() => setShowResourceModal(true)} className="btn-primary py-2 px-3 text-sm">
                                <Plus size={14} />
                                Kaynak Ata
                            </button>
                        </div>
                        <div className="space-y-3">
                            {assignments.map(a => (
                                <div key={a.id} className="card p-4 flex items-center gap-4">
                                    <div className="p-2 rounded-lg" style={{ background: 'rgba(58,127,213,0.1)', color: '#3A7FD5' }}>
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium" style={{ color: '#1A2B4A' }}>{a.title}</h4>
                                        <p className="text-xs" style={{ color: '#8097B8' }}>{new Date(a.assigned_at).toLocaleDateString('tr-TR')} · {a.type}</p>
                                    </div>
                                    {a.completed_at ? (
                                        <span className="badge badge-green"><Check size={10} /> Tamamlandı</span>
                                    ) : (
                                        <span className="badge badge-yellow">Devam Ediyor</span>
                                    )}
                                </div>
                            ))}
                            {assignments.length === 0 && <p className="text-sm" style={{ color: '#3D5475' }}>Henüz kaynak atanmamış</p>}
                        </div>

                        {showResourceModal && (
                            <div className="modal-overlay" onClick={() => setShowResourceModal(false)}>
                                <div className="modal-box" onClick={e => e.stopPropagation()}>
                                    <h2 className="text-lg font-bold mb-4" style={{ color: '#1A2B4A' }}>Kaynak Ata</h2>
                                    <select className="input mb-4" value={selectedResource} onChange={e => setSelectedResource(e.target.value)}>
                                        <option value="">Kaynak seç...</option>
                                        {allResources.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                    </select>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowResourceModal(false)} className="btn-secondary flex-1">İptal</button>
                                        <button onClick={assignResource} className="btn-primary flex-1">Ata</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Hero */}
                {tab === 'hero' && hero && (
                    <div>
                        <div className="card p-6 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-4xl mb-2">{hero.level.badge}</div>
                                    <h2 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>{hero.progress.current_level}</h2>
                                    <p className="text-sm mt-0.5" style={{ color: '#3D5475' }}>{hero.level.message}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>{hero.progress.total_points}</p>
                                    <p className="text-xs" style={{ color: '#8097B8' }}>toplam puan</p>
                                </div>
                            </div>
                            <div className="hero-progress-bar">
                                <div className="hero-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            {nextLevel && (
                                <p className="text-xs mt-2 text-right" style={{ color: '#8097B8' }}>
                                    Sonraki seviye: {nextLevel.name} ({nextLevel.minPoints - hero.progress.total_points} puan)
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between mb-3">
                            <h3 className="section-header mb-0">Puan Geçmişi</h3>
                            <button onClick={() => setShowBonusModal(true)} className="btn-gold py-1.5 px-3 text-xs">
                                <Gift size={14} />
                                Bonus Puan Ver
                            </button>
                        </div>

                        <div className="space-y-2">
                            {hero.events.map(ev => (
                                <div key={ev.id} className="flex items-center gap-3 p-3 card">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(240,185,74,0.12)', color: '#8A6210' }}>
                                        +{ev.points_awarded}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm" style={{ color: '#1A2B4A' }}>{ev.note || ev.event_type}</p>
                                        <p className="text-xs" style={{ color: '#8097B8' }}>{new Date(ev.created_at).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {showBonusModal && (
                            <div className="modal-overlay" onClick={() => setShowBonusModal(false)}>
                                <div className="modal-box" onClick={e => e.stopPropagation()}>
                                    <h2 className="text-lg font-bold mb-4" style={{ color: '#1A2B4A' }}>Bonus Puan Ver</h2>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Puan</label>
                                            <input className="input" type="number" value={bonusPoints} onChange={e => setBonusPoints(e.target.value)} placeholder="örn: 25" />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Not</label>
                                            <input className="input" value={bonusNote} onChange={e => setBonusNote(e.target.value)} placeholder="Neden bu puan veriliyor?" />
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowBonusModal(false)} className="btn-secondary flex-1">İptal</button>
                                            <button onClick={awardBonus} className="btn-gold flex-1"><Gift size={16} /> Ver</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
