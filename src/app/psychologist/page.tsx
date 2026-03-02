'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, Bell, AlertTriangle, MessageSquare, Plus, ArrowRight, Activity, Zap } from 'lucide-react';
import Link from 'next/link';

interface Family {
    id: number;
    name: string;
    member_count: number;
    members: { id: number; name: string; role: string; sub_role: string | null }[];
}

interface Appointment {
    id: number;
    title: string;
    scheduled_at: string;
    type: string;
    status: string;
    member_name: string;
    family_name: string;
}

interface Notification {
    id: number;
    title: string;
    body: string;
    type: string;
    read: number;
    created_at: string;
}

export default function PsychologistDashboard() {
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const [families, setFamilies] = useState<Family[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch('/api/psychologist/families').then(r => r.json()),
            apiFetch('/api/appointments').then(r => r.json()),
            apiFetch('/api/notifications').then(r => r.json()),
        ]).then(([fData, aData, nData]) => {
            setFamilies(fData.families || []);
            const upcoming = (aData.appointments || [])
                .filter((a: Appointment) => a.status === 'scheduled' && new Date(a.scheduled_at) > new Date())
                .slice(0, 5);
            setAppointments(upcoming);
            setNotifications((nData.notifications || []).filter((n: Notification) => !n.read).slice(0, 5));
            setLoading(false);
        });
    }, []);

    const markRead = async (id: number) => {
        await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const totalMembers = families.reduce((acc, f) => acc + f.member_count, 0);

    return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-fade-in space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #7c3aed, #6366f1)' }} />
                            <h1 className="text-2xl font-black text-white tracking-tight">
                                Merhaba, <span className="grad-text">{user?.name?.split(' ')[0]}</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm pl-3">
                            {families.length} aile · {totalMembers} üye takip ediyorsunuz
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-slate-950/60 border border-slate-800/40 px-3 py-1.5 rounded-lg">
                        <Activity size={12} className="text-green-500 animate-glow-pulse" />
                        Çevrimiçi
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Aile Grubu', value: families.length, color: '#a78bfa', icon: '👨‍👩‍👧‍👦' },
                        { label: 'Yaklaşan Randevu', value: appointments.length, color: '#67e8f9', icon: '📅' },
                        { label: 'Bildirim', value: notifications.length, color: '#fda4af', icon: '🔔' },
                    ].map((s, i) => (
                        <div
                            key={s.label}
                            className={`stat-card animate-fade-in stagger-${i + 1}`}
                            style={{ borderColor: `${s.color}22` }}
                        >
                            <div className="text-2xl mb-2">{s.icon}</div>
                            <div
                                className="text-2xl font-black tracking-tight mb-0.5"
                                style={{ color: s.color }}
                            >
                                {s.value}
                            </div>
                            <p className="text-xs text-slate-600 font-medium">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left: Families + Appointments */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Families */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="section-header mb-0">
                                    <Users size={16} className="text-violet-400" />
                                    Aile Gruplarım
                                </h2>
                                <Link href="/psychologist/appointments" className="btn-primary py-1.5 px-3 text-xs">
                                    <Plus size={12} />
                                    Randevu
                                </Link>
                            </div>
                            {loading ? (
                                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(13,15,28,0.8)' }} />)}</div>
                            ) : families.length === 0 ? (
                                <div className="text-center py-8 text-slate-600 text-sm">Henüz aile atanmadı</div>
                            ) : (
                                <div className="space-y-2.5">
                                    {families.map(family => (
                                        <Link
                                            key={family.id}
                                            href={`/psychologist/family/${family.id}`}
                                            className="flex items-center gap-4 p-4 rounded-2xl border transition-all group relative overflow-hidden"
                                            style={{
                                                background: 'rgba(13,15,28,0.7)',
                                                borderColor: 'rgba(124,58,237,0.1)',
                                            }}
                                        >
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.05), transparent)' }}
                                            />
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 relative overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.15))',
                                                    border: '1px solid rgba(124,58,237,0.3)',
                                                }}
                                            >
                                                {family.name.charAt(0)}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <h3 className="font-bold text-white group-hover:text-violet-200 transition-colors">{family.name}</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">{family.member_count} üye</p>
                                            </div>
                                            <div className="flex -space-x-2 relative z-10">
                                                {family.members.slice(0, 4).map(m => (
                                                    <div
                                                        key={m.id}
                                                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                                                        style={{
                                                            background: m.role === 'patient' ? 'rgba(52,211,153,0.2)' : 'rgba(249,168,212,0.2)',
                                                            borderColor: m.role === 'patient' ? '#34d399' : '#f9a8d4',
                                                            color: m.role === 'patient' ? '#34d399' : '#f9a8d4',
                                                        }}
                                                        title={m.name}
                                                    >
                                                        {m.name.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                            <ArrowRight size={14} className="text-slate-700 group-hover:text-violet-400 group-hover:translate-x-1 transition-all relative z-10" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upcoming appointments */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="section-header mb-0">
                                    <Calendar size={16} className="text-cyan-400" />
                                    Yaklaşan Randevular
                                </h2>
                                <Link href="/psychologist/appointments" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                                    Tümü <ArrowRight size={12} />
                                </Link>
                            </div>
                            {appointments.length === 0 ? (
                                <div className="text-center py-6 text-slate-600 text-sm">Yaklaşan randevu yok</div>
                            ) : (
                                <div className="space-y-2">
                                    {appointments.map(apt => (
                                        <div
                                            key={apt.id}
                                            className="flex items-center gap-3 p-3.5 rounded-xl border"
                                            style={{ background: 'rgba(13,15,28,0.6)', borderColor: 'rgba(124,58,237,0.08)' }}
                                        >
                                            <span className="text-xl">{apt.type === 'video' ? '📹' : '💬'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-200 truncate">{apt.title}</p>
                                                <p className="text-xs text-slate-600">{apt.member_name} · {apt.family_name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-medium text-violet-400">
                                                    {new Date(apt.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                    {new Date(apt.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Notifications + Actions */}
                    <div className="space-y-5">
                        <div className="card p-5">
                            <h2 className="section-header">
                                <Bell size={15} className="text-fuchsia-400" />
                                Bildirimler
                                {notifications.length > 0 && (
                                    <span
                                        className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(244,114,182,0.15)', color: '#f9a8d4', border: '1px solid rgba(244,114,182,0.25)' }}
                                    >
                                        {notifications.length}
                                    </span>
                                )}
                            </h2>
                            {notifications.length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="text-2xl mb-1.5">🎉</div>
                                    <p className="text-slate-600 text-xs">Okunmamış bildirim yok</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className="p-3 rounded-xl border group cursor-pointer"
                                            style={{ background: 'rgba(13,15,28,0.7)', borderColor: 'rgba(124,58,237,0.1)' }}
                                            onClick={() => markRead(n.id)}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                                                <button className="text-slate-700 group-hover:text-emerald-400 transition-colors text-sm">✓</button>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed">{n.body}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="card p-5">
                            <h2 className="section-header">
                                <Zap size={15} className="text-yellow-400" />
                                Hızlı İşlem
                            </h2>
                            <div className="space-y-1.5">
                                {[
                                    { href: '/psychologist/appointments', label: 'Yeni Randevu', icon: '📅', color: '#67e8f9' },
                                    { href: '/psychologist/notes', label: 'Seans Notu', icon: '📝', color: '#a78bfa' },
                                    { href: '/psychologist/alerts', label: 'Zor Gün Alertleri', icon: '🆘', color: '#fda4af' },
                                ].map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="nav-item"
                                    >
                                        <span className="text-base leading-none">{item.icon}</span>
                                        <span className="text-sm">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
