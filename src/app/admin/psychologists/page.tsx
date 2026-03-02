'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { Plus, Shield, Trash2, X, Check, AlertCircle, Mail } from 'lucide-react';

interface Psychologist {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

export default function AdminPsychologistsPage() {
    const { apiFetch } = useApi();
    const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const fetchData = async () => {
        const res = await apiFetch('/api/admin/users?role=psychologist');
        const data = await res.json();
        setPsychologists(data.users || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const createPsychologist = async () => {
        setError('');
        if (!name || !email || !password) { setError('Tüm alanlar gerekli'); return; }
        const res = await apiFetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role: 'psychologist' }),
        });
        const data = await res.json();
        if (res.ok) {
            setShowModal(false);
            setName(''); setEmail(''); setPassword('');
            fetchData();
        } else {
            setError(data.error);
        }
    };

    const deletePsychologist = async (id: number) => {
        if (!confirm('Bu psikologu silmek istediğinizden emin misiniz?')) return;
        await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <DashboardShell requiredRole="admin">
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Psikologlar</h1>
                        <p className="text-zinc-400 text-sm">{psychologists.length} psikolog kayıtlı</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={16} />
                        Psikolog Ekle
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map(i => <div key={i} className="card h-24 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {psychologists.map(psy => (
                            <div key={psy.id} className="card p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-violet-400 font-bold text-lg"
                                        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                                        {psy.name.charAt(0)}
                                    </div>
                                    <button
                                        onClick={() => deletePsychologist(psy.id)}
                                        className="text-zinc-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-white mb-1">{psy.name}</h3>
                                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                                    <Mail size={12} />
                                    {psy.email}
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <Shield size={12} className="text-violet-400" />
                                    <span className="text-xs text-violet-400">Psikolog</span>
                                    <span className="ml-auto text-[10px] text-zinc-600">
                                        {new Date(psy.created_at).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-box" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">Psikolog Ekle</h2>
                                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Ad Soyad</label>
                                    <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Ad Soyad" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">E-posta</label>
                                    <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="psikolog@losev.org" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Şifre</label>
                                    <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
                                        <AlertCircle size={14} />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">İptal</button>
                                    <button onClick={createPsychologist} className="btn-primary flex-1">
                                        <Check size={16} />
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
