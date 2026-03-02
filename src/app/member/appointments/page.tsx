'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { Calendar, Play, Video, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Appointment {
    id: number;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    type: string;
    status: string;
    notes: string | null;
    psychologist_name: string;
}

const statusStyles: Record<string, { label: string; cls: string }> = {
    scheduled: { label: 'Planlandı', cls: 'badge-cyan' },
    completed: { label: 'Tamamlandı', cls: 'badge-green' },
    cancelled: { label: 'İptal', cls: 'badge-red' },
};

export default function MemberAppointmentsPage() {
    const { apiFetch } = useApi();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        apiFetch('/api/appointments').then(r => r.json()).then(data => {
            setAppointments(data.appointments || []);
            setLoading(false);
        });
    }, []);

    const now = new Date();
    const filtered = appointments.filter(a => {
        const d = new Date(a.scheduled_at);
        if (tab === 'upcoming') return a.status === 'scheduled' && d > now;
        return a.status === 'completed' || a.status === 'cancelled' || (a.status === 'scheduled' && d <= now);
    });

    return (
        <DashboardShell requiredRole={['patient', 'family_member']}>
            <div className="animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">Randevularım</h1>
                    <p className="text-zinc-400 text-sm">{appointments.filter(a => a.status === 'scheduled').length} yaklaşan randevu</p>
                </div>

                <div className="flex gap-2 mb-5">
                    {(['upcoming', 'past'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${tab === t
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
                        >
                            {t === 'upcoming' ? 'Yaklaşan' : 'Geçmiş'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>
                ) : filtered.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Calendar size={40} className="text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500">{tab === 'upcoming' ? 'Yaklaşan randevu yok' : 'Geçmiş randevu yok'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(apt => {
                            const s = statusStyles[apt.status];
                            const isNowSession = apt.status === 'scheduled' && apt.type === 'video';
                            return (
                                <div key={apt.id} className="card p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${apt.type === 'video' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-violet-500/15 text-violet-400'}`}>
                                            {apt.type === 'video' ? <Video size={20} /> : <MessageSquare size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap gap-y-1 mb-1">
                                                <h3 className="font-semibold text-white">{apt.title}</h3>
                                                <span className={`badge ${s.cls}`}>{s.label}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mb-0.5">
                                                {apt.psychologist_name}
                                            </p>
                                            <p className="text-sm text-zinc-300">
                                                {new Date(apt.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                {' '}saat {new Date(apt.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-xs text-zinc-500">{apt.duration_minutes} dakika</p>
                                        </div>
                                        {isNowSession && (
                                            <Link href={`/member/session/${apt.id}`} className="btn-primary py-2 px-3 text-xs shrink-0">
                                                <Play size={14} />
                                                Katıl
                                            </Link>
                                        )}
                                    </div>
                                    {apt.notes && (
                                        <div className="mt-3 pt-3 border-t border-zinc-800/50">
                                            <p className="text-xs text-zinc-500 italic">{apt.notes}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
