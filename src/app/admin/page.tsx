'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import {
    Users, Shield, Calendar, BookOpen, AlertTriangle,
    Heart, TrendingUp, ArrowUpRight, Clock, Activity
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
    totalUsers: number; totalPsychologists: number; totalPatients: number;
    totalFamilies: number; totalAppointments: number; totalResources: number;
}
interface HardDayEvent { id: number; user_name: string; note: string | null; triggered_at: string; }

export default function AdminDashboard() {
    const { apiFetch } = useApi();
    const [stats, setStats] = useState<Stats | null>(null);
    const [hardDays, setHardDays] = useState<HardDayEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/admin/stats').then(r => r.json()).then(d => {
            setStats(d.stats);
            setHardDays(d.recentHardDays || []);
            setLoading(false);
        });
    }, []);

    const statCards = stats ? [
        { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: <Users size={18} />, color: '#2a9d8f', bg: 'rgba(42,157,143,0.08)', border: 'rgba(42,157,143,0.15)', trend: '+3 bu ay' },
        { label: 'Psikolog', value: stats.totalPsychologists, icon: <Shield size={18} />, color: '#457b9d', bg: 'rgba(69,123,157,0.08)', border: 'rgba(69,123,157,0.15)', trend: 'Aktif' },
        { label: 'Hasta', value: stats.totalPatients, icon: <Heart size={18} />, color: '#52b788', bg: 'rgba(82,183,136,0.08)', border: 'rgba(82,183,136,0.15)', trend: 'Takipte' },
        { label: 'Aile Grubu', value: stats.totalFamilies, icon: <Users size={18} />, color: '#d08080', bg: 'rgba(208,128,128,0.08)', border: 'rgba(208,128,128,0.15)', trend: 'Kayıtlı' },
        { label: 'Toplam Randevu', value: stats.totalAppointments, icon: <Calendar size={18} />, color: '#c49a3c', bg: 'rgba(196,154,60,0.08)', border: 'rgba(196,154,60,0.15)', trend: 'Tümü' },
        { label: 'Kaynak', value: stats.totalResources, icon: <BookOpen size={18} />, color: '#e76f51', bg: 'rgba(231,111,81,0.08)', border: 'rgba(231,111,81,0.15)', trend: 'Kütüphane' },
    ] : [];

    const quickActions = [
        { href: '/admin/families', label: 'Yeni Aile Grubu Oluştur', emoji: '👨‍👩‍👧‍👦', color: '#2a9d8f' },
        { href: '/admin/psychologists', label: 'Psikolog Ekle', emoji: '🧠', color: '#457b9d' },
        { href: '/admin/resources', label: 'Kaynak Ekle', emoji: '📚', color: '#c49a3c' },
        { href: '/admin/assign', label: 'Psikolog Ata', emoji: '🔗', color: '#d08080' },
    ];

    return (
        <DashboardShell requiredRole="admin">
            <div className="animate-fade-in space-y-7">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg,#2a9d8f,#52b788)' }} />
                            <h1 className="text-2xl font-black tracking-tight" style={{ color: '#1e3a35' }}>Admin Paneli</h1>
                        </div>
                        <p className="text-sm pl-3" style={{ color: '#6b9994' }}>LÖSEV PSİ Yönetim Merkezi</p>
                    </div>
                    <div
                        className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border"
                        style={{ background: 'rgba(82,183,136,0.06)', borderColor: 'rgba(82,183,136,0.2)', color: '#3a9a6a' }}
                    >
                        <Activity size={12} className="animate-glow-pulse" />
                        Sistem aktif
                    </div>
                </div>

                {/* Stats */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="stat-card h-28 animate-pulse opacity-40" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {statCards.map((card, i) => (
                            <div key={card.label} className={`stat-card animate-fade-in stagger-${i + 1}`} style={{ borderColor: card.border }}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="icon-badge" style={{ background: card.bg, border: `1px solid ${card.border}`, color: card.color }}>
                                        {card.icon}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: card.color }}>
                                        <TrendingUp size={10} />{card.trend}
                                    </div>
                                </div>
                                <div className="metric-value mb-1">{card.value}</div>
                                <p className="text-xs font-semibold" style={{ color: '#6b9994' }}>{card.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Quick actions */}
                    <div className="card p-6">
                        <h2 className="section-header">
                            <ArrowUpRight size={16} style={{ color: '#2a9d8f' }} />
                            Hızlı İşlemler
                        </h2>
                        <div className="space-y-2">
                            {quickActions.map(action => (
                                <Link key={action.href} href={action.href}
                                    className="flex items-center gap-3 p-3.5 rounded-xl border transition-all group relative overflow-hidden"
                                    style={{ background: 'rgba(247,252,251,0.8)', borderColor: 'rgba(42,157,143,0.1)' }}
                                >
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ background: `${action.color}08` }} />
                                    <span className="text-2xl leading-none relative z-10">{action.emoji}</span>
                                    <span className="text-sm font-semibold relative z-10 flex-1" style={{ color: '#2d5a54' }}>
                                        {action.label}
                                    </span>
                                    <ArrowUpRight size={14} className="relative z-10 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                                        style={{ color: action.color }} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Hard day alerts */}
                    <div className="card p-6">
                        <h2 className="section-header">
                            <AlertTriangle size={16} style={{ color: '#c4645a' }} />
                            Zor Gün Bildirimleri
                            {hardDays.length > 0 && (
                                <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ background: 'rgba(196,100,90,0.1)', color: '#b85555', border: '1px solid rgba(196,100,90,0.2)' }}>
                                    {hardDays.length} bekliyor
                                </span>
                            )}
                        </h2>
                        {hardDays.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="text-3xl mb-2">🎉</div>
                                <p className="text-sm font-medium" style={{ color: '#6b9994' }}>Bekleyen bildirim yok</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {hardDays.map(ev => (
                                    <div key={ev.id} className="p-3.5 rounded-xl border"
                                        style={{ background: 'rgba(196,100,90,0.05)', borderColor: 'rgba(196,100,90,0.15)' }}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-bold" style={{ color: '#b85555' }}>{ev.user_name}</span>
                                            <div className="flex items-center gap-1 text-xs" style={{ color: '#8aada8' }}>
                                                <Clock size={10} />{new Date(ev.triggered_at).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                        {ev.note && <p className="text-xs italic" style={{ color: '#6b9994' }}>"{ev.note}"</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
