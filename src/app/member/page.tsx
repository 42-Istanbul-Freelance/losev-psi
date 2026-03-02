'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MessageSquare, BookOpen, Star, Play, ArrowRight, Leaf } from 'lucide-react';
import Link from 'next/link';
import { HERO_LEVELS } from '@/lib/utils';
import OnboardingModal from '@/components/OnboardingModal';

interface Appointment { id: number; title: string; scheduled_at: string; type: string; status: string; }
interface HeroProgress {
    progress: { total_points: number; current_level: string };
    level: { name: string; badge: string; minPoints: number; message: string };
}
interface ResourceAssignment { id: number; title: string; type: string; completed_at: string | null; }

const MOOD_OPTIONS = [
    { label: 'sad', emoji: '😔', text: 'Üzgün', color: '#457b9d', bg: 'rgba(69,123,157,0.07)' },
    { label: 'anxious', emoji: '😰', text: 'Endişeli', color: '#2a9d8f', bg: 'rgba(42,157,143,0.07)' },
    { label: 'angry', emoji: '😠', text: 'Kızgın', color: '#c4645a', bg: 'rgba(196,100,90,0.07)' },
    { label: 'okay', emoji: '🙂', text: 'İyi', color: '#52b788', bg: 'rgba(82,183,136,0.07)' },
    { label: 'strong', emoji: '💪', text: 'Güçlü', color: '#c49a3c', bg: 'rgba(196,154,60,0.07)' },
];

export default function MemberDashboard() {
    const { user } = useAuth();
    const { apiFetch } = useApi();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [hero, setHero] = useState<HeroProgress | null>(null);
    const [resources, setResources] = useState<ResourceAssignment[]>([]);
    const [showHardDayModal, setShowHardDayModal] = useState(false);
    const [hardDayNote, setHardDayNote] = useState('');
    const [hardDayLoading, setHardDayLoading] = useState(false);
    const [hardDaySent, setHardDaySent] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch('/api/appointments').then(r => r.json()),
            apiFetch('/api/hero').then(r => r.json()),
            apiFetch('/api/resource-assignments').then(r => r.json()),
            apiFetch('/api/hard-day').then(r => r.json()),
        ]).then(([aData, hData, rData, hdData]) => {
            setAppointments(
                (aData.appointments || [])
                    .filter((a: Appointment) => a.status === 'scheduled')
                    .sort((a: Appointment, b: Appointment) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                    .slice(0, 3)
            );
            setHero(hData);
            setResources((rData.assignments || []).slice(0, 3));
            setLoading(false);
            setLoading(false);
        });
    }, []);

    const triggerHardDay = async () => {
        setHardDayLoading(true);
        await apiFetch('/api/hard-day', { method: 'POST', body: JSON.stringify({ note: hardDayNote }) });
        setShowHardDayModal(false);
        setHardDayNote('');
        setHardDayLoading(false);
        setHardDaySent(true);
        setTimeout(() => setHardDaySent(false), 3000);
    };

    const currentLevelIdx = hero ? HERO_LEVELS.findIndex(l => l.name === hero.progress.current_level) : 0;
    const nextLevel = hero ? HERO_LEVELS[currentLevelIdx + 1] : null;
    const currentLevel = hero ? HERO_LEVELS[currentLevelIdx] : null;
    const heroProgress = hero && nextLevel && currentLevel
        ? Math.min(100, ((hero.progress.total_points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
        : 100;

    return (
        <DashboardShell requiredRole={['patient', 'family_member']}>
            <div className="animate-fade-in space-y-5">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-black tracking-tight" style={{ color: '#1e3a35' }}>
                        Merhaba, <span className="grad-text">{user?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p className="text-sm mt-1" style={{ color: '#6b9994' }}>Bugün nasıl hissediyorsun?</p>
                </div>

                {/* Hard Day Button */}
                {!loading && (
                    <button
                        className="hard-day-btn animate-pulse-glow w-full"
                        onClick={() => setShowHardDayModal(true)}
                    >
                        {hardDaySent ? (
                            <div className="flex flex-col items-center">
                                <span className="text-4xl mb-2">💚</span>
                                <p className="text-lg font-bold" style={{ color: '#2a9d8f' }}>Bildiriminiz iletildi</p>
                                <p className="text-sm mt-1" style={{ color: '#6b9994' }}>Psikologunuz en kısa sürede size ulaşacak</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-4xl mb-2 animate-float" style={{ display: 'inline-block', animationDuration: '3s' }}>💔</span>
                                <p className="text-xl font-black" style={{ color: '#c4645a' }}>Zor Bir Gün Yaşıyorum</p>
                                <p className="text-sm mt-1.5" style={{ color: '#8aada8' }}>Bu butona basarak psikologunuzu anlık bilgilendirebilirsiniz</p>
                            </div>
                        )}
                    </button>
                )}

                {/* Mood bar */}
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="section-header mb-0 text-sm">
                            <Leaf size={14} style={{ color: '#52b788' }} />
                            Şu an nasıl hissediyorsun?
                        </h2>
                        <Link href="/member/chat" className="text-xs font-semibold" style={{ color: '#2a9d8f' }}>Sohbete git →</Link>
                    </div>
                    <div className="flex gap-2">
                        {MOOD_OPTIONS.map(mood => (
                            <Link key={mood.label} href="/member/chat"
                                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all hover:scale-105 active:scale-95"
                                style={{ background: mood.bg, borderColor: `${mood.color}22` }} title={mood.text}>
                                <span className="text-xl leading-none">{mood.emoji}</span>
                                <span className="text-[10px] font-bold" style={{ color: mood.color }}>{mood.text}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-5">

                        {/* Hero Journey */}
                        {hero && (
                            <div className="card p-6 relative overflow-hidden">
                                <div className="absolute inset-0 pointer-events-none"
                                    style={{ background: 'radial-gradient(circle at top right, rgba(42,157,143,0.07), transparent 60%)' }} />
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="section-header mb-0">
                                        <Star size={16} style={{ color: '#c49a3c' }} />
                                        Kahraman Yolculuğum
                                    </h2>
                                    <Link href="/member/hero" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#2a9d8f' }}>
                                        Detay <ArrowRight size={12} />
                                    </Link>
                                </div>
                                <div className="flex items-center gap-5 mb-4">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 animate-float border"
                                        style={{ background: 'rgba(42,157,143,0.07)', borderColor: 'rgba(42,157,143,0.15)', animationDuration: '5s' }}
                                    >
                                        {hero.level.badge}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between mb-1.5">
                                            <span className="font-bold text-lg" style={{ color: '#1e3a35' }}>{hero.progress.current_level}</span>
                                            <span className="font-black text-2xl grad-text-gold">{hero.progress.total_points}</span>
                                        </div>
                                        <div className="hero-progress-bar mb-1.5">
                                            <div className="hero-progress-fill" style={{ width: `${heroProgress}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs" style={{ color: '#8aada8' }}>
                                            <span>{currentLevel?.minPoints || 0} puan</span>
                                            {nextLevel
                                                ? <span>{nextLevel.minPoints - hero.progress.total_points} puan kaldı → {nextLevel.name}</span>
                                                : <span style={{ color: '#c49a3c' }}>🏆 Maksimum seviye!</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm italic" style={{ color: '#4a6b65' }}>"{hero.level.message}"</p>
                            </div>
                        )}

                        {/* Appointments */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="section-header mb-0">
                                    <Calendar size={16} style={{ color: '#2a9d8f' }} />
                                    Yaklaşan Randevular
                                </h2>
                                <Link href="/member/appointments" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#2a9d8f' }}>
                                    Tümü <ArrowRight size={12} />
                                </Link>
                            </div>
                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(42,157,143,0.05)' }} />)}
                                </div>
                            ) : appointments.length === 0 ? (
                                <div className="text-center py-6">
                                    <Calendar size={32} className="mx-auto mb-2" style={{ color: '#c1dbd8' }} />
                                    <p className="text-sm" style={{ color: '#8aada8' }}>Yaklaşan randevu yok</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {appointments.map(apt => (
                                        <div key={apt.id} className="flex items-center gap-3 p-3.5 rounded-xl border"
                                            style={{ background: 'rgba(247,252,251,0.8)', borderColor: 'rgba(42,157,143,0.1)' }}>
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                                                style={{
                                                    background: apt.type === 'video' ? 'rgba(82,183,136,0.1)' : 'rgba(42,157,143,0.08)',
                                                    border: apt.type === 'video' ? '1px solid rgba(82,183,136,0.2)' : '1px solid rgba(42,157,143,0.15)',
                                                }}>
                                                {apt.type === 'video' ? '📹' : '💬'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: '#1e3a35' }}>{apt.title}</p>
                                                <p className="text-xs" style={{ color: '#8aada8' }}>
                                                    {new Date(apt.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    {' '}·{' '}
                                                    {new Date(apt.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {apt.type === 'video' && (
                                                <Link href={`/member/session/${apt.id}`} className="btn-primary py-1.5 px-3 text-xs">
                                                    <Play size={11} /> Katıl
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right */}
                    <div className="space-y-5">
                        <Link href="/member/chat" className="card p-5 block group">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                                style={{ background: 'rgba(42,157,143,0.08)', border: '1.5px solid rgba(42,157,143,0.18)' }}>
                                <MessageSquare size={22} style={{ color: '#2a9d8f' }} />
                            </div>
                            <h3 className="font-bold mb-1" style={{ color: '#1e3a35' }}>Psikologumla Sohbet</h3>
                            <p className="text-xs leading-relaxed" style={{ color: '#6b9994' }}>
                                Psikologunuza her zaman özel mesaj gönderebilirsiniz.
                            </p>
                            <div className="mt-4 text-xs font-bold flex items-center gap-1" style={{ color: '#2a9d8f' }}>
                                Sohbete Git <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="section-header mb-0 text-sm">
                                    <BookOpen size={14} style={{ color: '#c49a3c' }} />Kaynaklarım
                                </h2>
                                <Link href="/member/resources" className="text-xs font-semibold" style={{ color: '#2a9d8f' }}>Tümü →</Link>
                            </div>
                            {resources.length === 0 ? (
                                <p className="text-xs py-2" style={{ color: '#8aada8' }}>Henüz kaynak atanmamış</p>
                            ) : (
                                <div className="space-y-2">
                                    {resources.map(r => (
                                        <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                                            style={{ background: 'rgba(247,252,251,0.8)' }}>
                                            <span className="text-base">{r.type === 'video' ? '🎬' : r.type === 'article' ? '📖' : '🎯'}</span>
                                            <p className="text-xs flex-1 truncate font-medium" style={{ color: '#2d5a54' }}>{r.title}</p>
                                            {r.completed_at
                                                ? <span className="text-[10px] font-bold" style={{ color: '#52b788' }}>✓</span>
                                                : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#c49a3c' }} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hard Day Modal */}
            {showHardDayModal && (
                <div className="modal-overlay" onClick={() => setShowHardDayModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-5">
                            <span className="text-5xl block mb-3 animate-float" style={{ animationDuration: '3s' }}>💔</span>
                            <h2 className="text-xl font-black" style={{ color: '#1e3a35' }}>Zor Bir Gün Yaşıyorum</h2>
                            <p className="text-sm mt-1" style={{ color: '#6b9994' }}>Psikologunuza anlık bildirim gönderilecek</p>
                        </div>
                        <div className="mb-5">
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8aada8' }}>
                                Ne hissediyorsunuz? <span className="font-normal normal-case" style={{ color: '#a8c5c1' }}>(İsteğe bağlı)</span>
                            </label>
                            <textarea
                                className="input h-24 resize-none"
                                value={hardDayNote}
                                onChange={e => setHardDayNote(e.target.value)}
                                placeholder="Bugün nasıl hissettiğinizi kısaca yazabilirsiniz..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowHardDayModal(false)} className="btn-secondary flex-1">İptal</button>
                            <button
                                onClick={triggerHardDay}
                                disabled={hardDayLoading}
                                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                style={{
                                    background: 'rgba(208,128,128,0.1)',
                                    border: '1.5px solid rgba(208,128,128,0.28)',
                                    color: '#9a5555',
                                }}
                            >
                                {hardDayLoading
                                    ? <div className="w-4 h-4 border-2 border-rose-300/40 border-t-rose-400 rounded-full animate-spin" />
                                    : '💔 Bildir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <OnboardingModal role={user?.role || 'patient'} />
        </DashboardShell>
    );
}
