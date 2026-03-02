'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { AlertTriangle, Check, Clock } from 'lucide-react';

interface HardDayEvent {
    id: number;
    user_name: string;
    user_role: string;
    sub_role: string | null;
    family_name: string;
    note: string | null;
    triggered_at: string;
    acknowledged_by_psychologist: number;
}

export default function PsychologistAlertsPage() {
    const { apiFetch } = useApi();
    const [events, setEvents] = useState<HardDayEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const res = await apiFetch('/api/hard-day');
        const data = await res.json();
        setEvents(data.events || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const acknowledge = async (id: number) => {
        await apiFetch(`/api/hard-day/${id}`, { method: 'PATCH' });
        fetchData();
    };

    const unacked = events.filter(e => !e.acknowledged_by_psychologist);
    const acked = events.filter(e => e.acknowledged_by_psychologist);

    return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A2B4A' }}>Zor Gün Alertleri</h1>
                    <p className="text-sm" style={{ color: '#3D5475' }}>
                        {unacked.length} bekleyen alert
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>
                ) : (
                    <>
                        {/* Unacknowledged */}
                        {unacked.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#E06060' }}>
                                    <AlertTriangle size={14} />
                                    Bekleyen ({unacked.length})
                                </h2>
                                <div className="space-y-3">
                                    {unacked.map(ev => (
                                        <div key={ev.id} className="card p-5" style={{ borderColor: 'rgba(224,96,96,0.22)', background: 'rgba(224,96,96,0.04)' }}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold" style={{ color: '#1A2B4A' }}>{ev.user_name}</span>
                                                        <span className="text-xs" style={{ color: '#3D5475' }}>— {ev.family_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: '#8097B8' }}>
                                                        <Clock size={12} />
                                                        {new Date(ev.triggered_at).toLocaleString('tr-TR')}
                                                    </div>
                                                    {ev.note && (
                                                        <div className="rounded-lg p-3" style={{ background: 'rgba(58,127,213,0.04)', border: '1px solid rgba(58,127,213,0.10)' }}>
                                                            <p className="text-sm italic" style={{ color: '#3D5475' }}>"{ev.note}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => acknowledge(ev.id)}
                                                    className="btn-secondary shrink-0 py-1.5 px-3 text-xs"
                                                    style={{ color: '#4DAA82', borderColor: 'rgba(77,170,130,0.3)' }}
                                                >
                                                    <Check size={14} />
                                                    Görüldü
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Acknowledged */}
                        {acked.length > 0 && (
                            <div>
                                <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#8097B8' }}>
                                    <Check size={14} />
                                    Görülmüş ({acked.length})
                                </h2>
                                <div className="space-y-2 opacity-60">
                                    {acked.slice(0, 10).map(ev => (
                                        <div key={ev.id} className="card p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <span className="font-medium" style={{ color: '#3D5475' }}>{ev.user_name}</span>
                                                    <span className="text-xs ml-2" style={{ color: '#8097B8' }}>— {ev.family_name}</span>
                                                    <p className="text-xs mt-0.5" style={{ color: '#8097B8' }}>{new Date(ev.triggered_at).toLocaleString('tr-TR')}</p>
                                                </div>
                                                {ev.note && <p className="text-xs italic max-w-[200px] truncate" style={{ color: '#8097B8' }}>"{ev.note}"</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {events.length === 0 && (
                            <div className="card p-12 text-center">
                                <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: '#8097B8' }} />
                                <p style={{ color: '#3D5475' }}>Henüz zor gün bildirimi yok</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardShell>
    );
}
