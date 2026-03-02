'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { HERO_LEVELS } from '@/lib/utils';
import { Star, Zap, TrendingUp } from 'lucide-react';

interface HeroProgress {
    progress: { id: number; user_id: number; total_points: number; current_level: string; last_updated: string };
    events: { id: number; event_type: string; points_awarded: number; note: string | null; created_at: string }[];
    level: { name: string; badge: string; minPoints: number; message: string };
}

const EVENT_LABELS: Record<string, string> = {
    SESSION_COMPLETE: '📹 Seans Tamamlandı',
    RESOURCE_COMPLETE: '📚 Kaynak Tamamlandı',
    MOOD_MESSAGE: '💬 Ruh Hali Paylaşıldı',
    HARD_DAY_FOLLOWUP: '💔 Zor Gün Notu',
    LOGIN_STREAK: '📅 Giriş Serisi',
    BONUS: '⭐ Bonus Puan',
};

export default function MemberHeroPage() {
    const { apiFetch } = useApi();
    const [hero, setHero] = useState<HeroProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/hero').then(r => r.json()).then(data => {
            setHero(data);
            setLoading(false);
        });
    }, []);

    const currentLevelIdx = hero ? HERO_LEVELS.findIndex(l => l.name === hero.progress.current_level) : 0;
    const nextLevel = hero ? HERO_LEVELS[currentLevelIdx + 1] : null;
    const currentLevelData = hero ? HERO_LEVELS[currentLevelIdx] : null;

    const progress = hero && nextLevel && currentLevelData
        ? Math.min(100, ((hero.progress.total_points - currentLevelData.minPoints) /
            (nextLevel.minPoints - currentLevelData.minPoints)) * 100)
        : 100;

    return (
        <DashboardShell requiredRole={['patient', 'family_member']}>
            <div className="animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">
                        <span className="grad-text">Kahraman Yolculuğum</span>
                    </h1>
                    <p className="text-zinc-400 text-sm">Her adım bir ilerleme, her gün bir kazanım</p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="card h-48 animate-pulse" />
                        <div className="card h-32 animate-pulse" />
                    </div>
                ) : hero ? (
                    <div className="space-y-6">
                        {/* Current level card */}
                        <div className="card p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-violet-900/10 to-transparent" />
                            <div className="relative z-10">
                                <div className="text-7xl mb-4">{hero.level.badge}</div>
                                <h2 className="text-3xl font-bold text-white mb-2">{hero.progress.current_level}</h2>
                                <p className="text-zinc-300 text-lg italic mb-6">"{hero.level.message}"</p>

                                <div className="max-w-sm mx-auto">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-zinc-400">{currentLevelData?.name}</span>
                                        {nextLevel ? (
                                            <span className="text-sm text-zinc-400">{nextLevel.name}</span>
                                        ) : (
                                            <span className="text-sm text-yellow-400">🏆 MAX LEVEL</span>
                                        )}
                                    </div>
                                    <div className="hero-progress-bar mb-2">
                                        <div className="hero-progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        {hero.progress.total_points}
                                        <span className="text-base font-normal text-zinc-400"> / {nextLevel?.minPoints || '∞'} puan</span>
                                    </p>
                                    {nextLevel && (
                                        <p className="text-sm text-zinc-500 mt-1">
                                            {nextLevel.name} için {nextLevel.minPoints - hero.progress.total_points} puan kaldı
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* All Levels */}
                        <div className="card p-6">
                            <h2 className="section-header">
                                <TrendingUp size={18} className="text-indigo-400" />
                                Tüm Seviyeler
                            </h2>
                            <div className="space-y-3">
                                {HERO_LEVELS.map((level, idx) => {
                                    const isUnlocked = hero.progress.total_points >= level.minPoints;
                                    const isCurrent = level.name === hero.progress.current_level;
                                    return (
                                        <div
                                            key={level.name}
                                            className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isCurrent
                                                    ? 'bg-indigo-500/10 border border-indigo-500/30'
                                                    : isUnlocked
                                                        ? 'bg-zinc-900/40 border border-zinc-800/30'
                                                        : 'opacity-40 bg-zinc-950/30 border border-zinc-900/30'
                                                }`}
                                        >
                                            <span className="text-3xl">{level.badge}</span>
                                            <div className="flex-1">
                                                <p className={`font-semibold ${isCurrent ? 'text-white' : isUnlocked ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                                    {level.name}
                                                    {isCurrent && <span className="ml-2 badge badge-indigo text-[10px]">Şu Anki</span>}
                                                </p>
                                                <p className="text-xs text-zinc-500">{level.minPoints}+ puan</p>
                                            </div>
                                            {isUnlocked ? (
                                                <span className="text-green-400 text-lg">✓</span>
                                            ) : (
                                                <span className="text-zinc-700 text-sm">{level.minPoints - hero.progress.total_points} puan</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Event history */}
                        {hero.events.length > 0 && (
                            <div className="card p-6">
                                <h2 className="section-header">
                                    <Zap size={18} className="text-yellow-400" />
                                    Puan Geçmişim
                                </h2>
                                <div className="space-y-2">
                                    {hero.events.map(ev => (
                                        <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/30">
                                            <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0">
                                                +{ev.points_awarded}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-zinc-200">{EVENT_LABELS[ev.event_type] || ev.event_type}</p>
                                                {ev.note && <p className="text-xs text-zinc-500">{ev.note}</p>}
                                            </div>
                                            <p className="text-xs text-zinc-600 shrink-0">
                                                {new Date(ev.created_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </DashboardShell>
    );
}
