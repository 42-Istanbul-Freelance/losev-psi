'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { Calendar, Plus, Video, MessageSquare, X, Check, AlertCircle, Play } from 'lucide-react';
import Link from 'next/link';

interface Appointment {
    id: number;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    type: string;
    status: string;
    notes: string | null;
    member_name: string;
    family_name: string;
    family_group_id: number;
    member_user_id: number;
}

interface Family {
    id: number;
    name: string;
    members: { id: number; name: string; role: string; sub_role: string | null }[];
}

const statusColors: Record<string, string> = {
    scheduled: 'badge-cyan',
    completed: 'badge-green',
    cancelled: 'badge-red',
};

const statusLabels: Record<string, string> = {
    scheduled: 'Planlandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
};

export default function PsychologistAppointmentsPage() {
    const { apiFetch } = useApi();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [families, setFamilies] = useState<Family[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');

    // Create appointment form
    const [apTitle, setApTitle] = useState('');
    const [apFamily, setApFamily] = useState('');
    const [apMember, setApMember] = useState('');
    const [apDate, setApDate] = useState('');
    const [apTime, setApTime] = useState('');
    const [apDuration, setApDuration] = useState('50');
    const [apType, setApType] = useState('video');
    const [apNotes, setApNotes] = useState('');

    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

    const fetchData = async () => {
        const [aRes, fRes] = await Promise.all([
            apiFetch('/api/appointments'),
            apiFetch('/api/psychologist/families'),
        ]);
        const [aData, fData] = await Promise.all([aRes.json(), fRes.json()]);
        setAppointments(aData.appointments || []);
        setFamilies(fData.families || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const getFamilyMembers = () => {
        const f = families.find(f => f.id === parseInt(apFamily));
        return f?.members || [];
    };

    const createAppointment = async () => {
        setError('');
        if (!apTitle || !apFamily || !apMember || !apDate || !apTime) {
            setError('Zorunlu alanlar eksik');
            return;
        }
        const scheduledAt = new Date(`${apDate}T${apTime}`).toISOString();
        const res = await apiFetch('/api/appointments', {
            method: 'POST',
            body: JSON.stringify({
                familyGroupId: parseInt(apFamily),
                memberUserId: parseInt(apMember),
                title: apTitle,
                scheduledAt,
                durationMinutes: parseInt(apDuration),
                type: apType,
                notes: apNotes,
            }),
        });
        if (res.ok) {
            setShowModal(false);
            setApTitle(''); setApFamily(''); setApMember('');
            setApDate(''); setApTime(''); setApNotes('');
            fetchData();
        } else {
            const data = await res.json();
            setError(data.error);
        }
    };

    const cancelAppointment = async (id: number) => {
        await apiFetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
        });
        fetchData();
    };

    const filteredAppointments = appointments.filter(a => {
        if (filter === 'upcoming') return a.status === 'scheduled';
        if (filter === 'completed') return a.status === 'completed';
        return true;
    });

    return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A2B4A' }}>Randevular</h1>
                        <p className="text-sm" style={{ color: '#3D5475' }}>{appointments.filter(a => a.status === 'scheduled').length} yaklaşan randevu</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={16} />
                        Randevu Oluştur
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-5">
                    {(['all', 'upcoming', 'completed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="px-4 py-1.5 rounded-lg text-sm transition-all border"
                            style={filter === f
                                ? { background: 'rgba(58,127,213,0.1)', color: '#3A7FD5', borderColor: 'rgba(58,127,213,0.3)' }
                                : { color: '#3D5475', borderColor: 'transparent' }}
                        >
                            {f === 'all' ? 'Tümü' : f === 'upcoming' ? 'Yaklaşan' : 'Tamamlanan'}
                            {' '}
                            <span className="text-xs opacity-60">
                                ({f === 'all' ? appointments.length :
                                    f === 'upcoming' ? appointments.filter(a => a.status === 'scheduled').length :
                                        appointments.filter(a => a.status === 'completed').length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Appointments list */}
                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Calendar size={40} className="mx-auto mb-3" style={{ color: '#8097B8' }} />
                        <p style={{ color: '#3D5475' }}>Randevu bulunamadı</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredAppointments.map(apt => {
                            const isUpcoming = apt.status === 'scheduled' && new Date(apt.scheduled_at) > new Date();
                            return (
                                <div key={apt.id} className="card p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl"
                                            style={{
                                                background: apt.type === 'video' ? 'rgba(77,170,130,0.1)' : 'rgba(58,127,213,0.1)',
                                                color: apt.type === 'video' ? '#4DAA82' : '#3A7FD5',
                                            }}>
                                            {apt.type === 'video' ? <Video size={18} /> : <MessageSquare size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-medium truncate" style={{ color: '#1A2B4A' }}>{apt.title}</h3>
                                                <span className={`badge ${statusColors[apt.status]}`}>{statusLabels[apt.status]}</span>
                                            </div>
                                            <p className="text-xs" style={{ color: '#3D5475' }}>
                                                {apt.member_name} — {apt.family_name}
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: '#8097B8' }}>
                                                {new Date(apt.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                {' '}
                                                {new Date(apt.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                {' '} · {apt.duration_minutes} dakika
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {apt.status === 'scheduled' && apt.type === 'video' && isUpcoming && (
                                                <Link
                                                    href={`/member/session/${apt.id}`}
                                                    className="btn-primary py-1.5 px-3 text-xs"
                                                >
                                                    <Play size={14} />
                                                    Başlat
                                                </Link>
                                            )}
                                            {apt.status === 'scheduled' && (
                                                <button
                                                    onClick={() => cancelAppointment(apt.id)}
                                                    className="btn-danger py-1.5 px-3 text-xs"
                                                >
                                                    <X size={14} />
                                                    İptal
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {apt.notes && (
                                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(58,127,213,0.08)' }}>
                                            <p className="text-xs italic" style={{ color: '#3D5475' }}>{apt.notes}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create Appointment Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-box" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>Yeni Randevu</h2>
                                <button onClick={() => setShowModal(false)} style={{ color: '#8097B8' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Başlık</label>
                                    <input className="input" value={apTitle} onChange={e => setApTitle(e.target.value)} placeholder="örn: Bireysel Seans" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Aile Grubu</label>
                                        <select className="input" value={apFamily} onChange={e => { setApFamily(e.target.value); setApMember(''); }}>
                                            <option value="">Seç...</option>
                                            {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Üye</label>
                                        <select className="input" value={apMember} onChange={e => setApMember(e.target.value)} disabled={!apFamily}>
                                            <option value="">Seç...</option>
                                            {getFamilyMembers().map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.role === 'patient' ? 'Hasta' : m.sub_role || 'Üye'})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Tarih</label>
                                        <input className="input" type="date" value={apDate} onChange={e => setApDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Saat</label>
                                        <input className="input" type="time" value={apTime} onChange={e => setApTime(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Süre (dk)</label>
                                        <input className="input" type="number" value={apDuration} onChange={e => setApDuration(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Tür</label>
                                        <select className="input" value={apType} onChange={e => setApType(e.target.value)}>
                                            <option value="video">📹 Video Seans</option>
                                            <option value="chat">💬 Chat Seans</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1.5" style={{ color: '#3D5475' }}>Notlar (Opsiyonel)</label>
                                    <textarea className="input h-20 resize-none" value={apNotes} onChange={e => setApNotes(e.target.value)} placeholder="Seans hakkında not..." />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'rgba(224,96,96,0.08)', border: '1px solid rgba(224,96,96,0.22)', color: '#B54040' }}>
                                        <AlertCircle size={14} />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">İptal</button>
                                    <button onClick={createAppointment} className="btn-primary flex-1">
                                        <Check size={16} />
                                        Oluştur
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
