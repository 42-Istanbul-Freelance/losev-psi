'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { Zap, Check, AlertCircle, Shield, Users } from 'lucide-react';

interface Family { id: number; name: string; psychologist_id: number | null; psychologist_name: string | null; }
interface Psychologist { id: number; name: string; email: string; }

export default function AdminAssignPage() {
    const { apiFetch } = useApi();
    const [families, setFamilies] = useState<Family[]>([]);
    const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<number | null>(null);
    const [selections, setSelections] = useState<Record<number, string>>({});
    const [success, setSuccess] = useState<number | null>(null);
    const [error, setError] = useState('');

    const fetchData = async () => {
        const [fRes, pRes] = await Promise.all([
            apiFetch('/api/admin/families'),
            apiFetch('/api/admin/users?role=psychologist'),
        ]);
        const [fData, pData] = await Promise.all([fRes.json(), pRes.json()]);
        setFamilies(fData.families || []);
        setPsychologists(pData.users || []);

        // Initialize selections with current assignments
        const sel: Record<number, string> = {};
        (fData.families || []).forEach((f: Family) => {
            sel[f.id] = f.psychologist_id?.toString() || '';
        });
        setSelections(sel);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const assign = async (familyId: number) => {
        setAssigning(familyId);
        setError('');
        const res = await apiFetch(`/api/admin/families/${familyId}/assign`, {
            method: 'PATCH',
            body: JSON.stringify({ psychologistId: selections[familyId] ? parseInt(selections[familyId]) : null }),
        });
        setAssigning(null);
        if (res.ok) {
            setSuccess(familyId);
            setTimeout(() => setSuccess(null), 2000);
            fetchData();
        } else {
            setError('Atama başarısız');
        }
    };

    return (
        <DashboardShell requiredRole="admin">
            <div className="animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">Psikolog Ata</h1>
                    <p className="text-zinc-400 text-sm">Aile gruplarına psikolog atayın veya değiştirin</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3 mb-4">
                        <AlertCircle size={14} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
                ) : (
                    <div className="space-y-3">
                        {families.map(family => (
                            <div key={family.id} className="card p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                        <Users size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white">{family.name}</h3>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {family.psychologist_name
                                                ? <span className="text-violet-400"><Shield size={10} className="inline mr-1" />{family.psychologist_name}</span>
                                                : <span className="text-rose-400">⚠ Psikolog atanmamış</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            className="input w-52"
                                            value={selections[family.id] || ''}
                                            onChange={e => setSelections(prev => ({ ...prev, [family.id]: e.target.value }))}
                                        >
                                            <option value="">Psikolog seç</option>
                                            {psychologists.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => assign(family.id)}
                                            disabled={assigning === family.id}
                                            className={success === family.id ? 'btn-secondary' : 'btn-primary'}
                                        >
                                            {assigning === family.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : success === family.id ? (
                                                <><Check size={16} className="text-green-400" /> Atandı</>
                                            ) : (
                                                <><Zap size={16} /> Ata</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
