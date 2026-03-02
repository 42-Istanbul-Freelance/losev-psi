'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { Users, Plus, ChevronDown, ChevronRight, Shield, AlertCircle, X, Check } from 'lucide-react';

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
    sub_role: string | null;
    age: number | null;
}

interface Family {
    id: number;
    name: string;
    psychologist_name: string | null;
    psychologist_email: string | null;
    member_count: number;
    members: Member[];
    created_at: string;
}

interface Psychologist {
    id: number;
    name: string;
    email: string;
}

const subRoleLabels: Record<string, string> = {
    mother: 'Anne', father: 'Baba', sibling: 'Kardeş', other: 'Diğer'
};

export default function AdminFamiliesPage() {
    const { apiFetch } = useApi();
    const [families, setFamilies] = useState<Family[]>([]);
    const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [error, setError] = useState('');

    // Create family form
    const [newFamilyName, setNewFamilyName] = useState('');
    const [newFamilyPsy, setNewFamilyPsy] = useState('');

    // Add member form
    const [memberName, setMemberName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberPassword, setMemberPassword] = useState('');
    const [memberRole, setMemberRole] = useState('patient');
    const [memberSubRole, setMemberSubRole] = useState('');
    const [memberAge, setMemberAge] = useState('');

    const fetchData = async () => {
        const [fRes, pRes] = await Promise.all([
            apiFetch('/api/admin/families'),
            apiFetch('/api/admin/users?role=psychologist'),
        ]);
        const [fData, pData] = await Promise.all([fRes.json(), pRes.json()]);
        setFamilies(fData.families || []);
        setPsychologists(pData.users || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const createFamily = async () => {
        if (!newFamilyName.trim()) { setError('Ad gerekli'); return; }
        const res = await apiFetch('/api/admin/families', {
            method: 'POST',
            body: JSON.stringify({ name: newFamilyName, psychologistId: newFamilyPsy || null }),
        });
        if (res.ok) {
            setShowCreateModal(false);
            setNewFamilyName('');
            setNewFamilyPsy('');
            fetchData();
        }
    };

    const addMember = async () => {
        if (!memberName || !memberEmail || !memberPassword || !selectedFamily) return;
        const res = await apiFetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                name: memberName, email: memberEmail, password: memberPassword,
                role: memberRole, subRole: memberSubRole || undefined,
                familyGroupId: selectedFamily.id,
                age: memberAge ? parseInt(memberAge) : undefined,
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setShowAddMemberModal(false);
            setMemberName(''); setMemberEmail(''); setMemberPassword('');
            setMemberRole('patient'); setMemberSubRole(''); setMemberAge('');
            fetchData();
        } else {
            setError(data.error);
        }
    };

    const toggleExpand = (id: number) => {
        setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <DashboardShell requiredRole="admin">
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Aile Grupları</h1>
                        <p className="text-zinc-400 text-sm">{families.length} aile grubu kayıtlı</p>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        <Plus size={16} />
                        Aile Grubu Oluştur
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="card h-16 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {families.map(family => (
                            <div key={family.id} className="card overflow-hidden">
                                {/* Family header */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-indigo-950/10 transition-colors"
                                    onClick={() => toggleExpand(family.id)}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                                        {family.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-semibold">{family.name}</h3>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-zinc-400">
                                                {family.member_count} üye
                                            </span>
                                            {family.psychologist_name && (
                                                <span className="text-xs text-violet-400 flex items-center gap-1">
                                                    <Shield size={10} />
                                                    {family.psychologist_name}
                                                </span>
                                            )}
                                            {!family.psychologist_name && (
                                                <span className="text-xs text-rose-400">⚠ Psikolog atanmamış</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            setSelectedFamily(family);
                                            setShowAddMemberModal(true);
                                        }}
                                        className="btn-secondary text-xs py-1 px-3"
                                    >
                                        <Plus size={12} />
                                        Üye Ekle
                                    </button>
                                    {expanded.includes(family.id) ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
                                </div>

                                {/* Members */}
                                {expanded.includes(family.id) && (
                                    <div className="border-t border-zinc-800/50 px-4 py-3">
                                        {family.members.length === 0 ? (
                                            <p className="text-zinc-500 text-sm py-2">Henüz üye eklenmemiş</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {family.members.map(member => (
                                                    <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                                            style={{
                                                                background: member.role === 'patient' ? 'rgba(16,185,129,0.15)' : 'rgba(244,114,182,0.15)',
                                                                color: member.role === 'patient' ? '#10b981' : '#f472b6'
                                                            }}>
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-zinc-200 truncate">{member.name}</p>
                                                            <p className="text-xs text-zinc-500">
                                                                {member.role === 'patient' ? '🟢 Hasta' :
                                                                    `💗 ${subRoleLabels[member.sub_role || ''] || 'Aile Üyesi'}`}
                                                                {member.age ? ` · ${member.age} yaş` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Family Modal */}
                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal-box" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">Yeni Aile Grubu</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-zinc-300">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Aile Adı</label>
                                    <input
                                        className="input"
                                        value={newFamilyName}
                                        onChange={e => setNewFamilyName(e.target.value)}
                                        placeholder="örn: Yılmaz Ailesi"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Psikolog (Opsiyonel)</label>
                                    <select
                                        className="input"
                                        value={newFamilyPsy}
                                        onChange={e => setNewFamilyPsy(e.target.value)}
                                    >
                                        <option value="">Şimdi seçme</option>
                                        {psychologists.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
                                        <AlertCircle size={14} />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-2">
                                    <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">İptal</button>
                                    <button onClick={createFamily} className="btn-primary flex-1">
                                        <Check size={16} />
                                        Oluştur
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Member Modal */}
                {showAddMemberModal && selectedFamily && (
                    <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
                        <div className="modal-box" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Üye Ekle</h2>
                                    <p className="text-zinc-400 text-sm">{selectedFamily.name}</p>
                                </div>
                                <button onClick={() => setShowAddMemberModal(false)} className="text-zinc-500 hover:text-zinc-300">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Ad Soyad</label>
                                    <input className="input" value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Ad Soyad" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">E-posta</label>
                                    <input className="input" type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="email@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Şifre</label>
                                    <input className="input" type="password" value={memberPassword} onChange={e => setMemberPassword(e.target.value)} placeholder="••••••••" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-zinc-300 mb-1.5">Rol</label>
                                        <select className="input" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                                            <option value="patient">Hasta</option>
                                            <option value="family_member">Aile Üyesi</option>
                                        </select>
                                    </div>
                                    {memberRole === 'family_member' && (
                                        <div>
                                            <label className="block text-sm text-zinc-300 mb-1.5">Aile Rolü</label>
                                            <select className="input" value={memberSubRole} onChange={e => setMemberSubRole(e.target.value)}>
                                                <option value="">Seç</option>
                                                <option value="mother">Anne</option>
                                                <option value="father">Baba</option>
                                                <option value="sibling">Kardeş</option>
                                                <option value="other">Diğer</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Yaş (Opsiyonel)</label>
                                    <input className="input" type="number" value={memberAge} onChange={e => setMemberAge(e.target.value)} placeholder="Yaş" />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
                                        <AlertCircle size={14} />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-2">
                                    <button onClick={() => setShowAddMemberModal(false)} className="btn-secondary flex-1">İptal</button>
                                    <button onClick={addMember} className="btn-primary flex-1">
                                        <Plus size={16} />
                                        Ekle
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
