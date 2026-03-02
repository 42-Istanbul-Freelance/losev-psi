'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { BookOpen, Video, FileText, Activity, ExternalLink } from 'lucide-react';

interface ResourceAssignment {
    id: number;
    title: string;
    description: string | null;
    type: string;
    url: string | null;
    tags: string;
    assigned_at: string;
    completed_at: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
    video: <Video size={20} />,
    article: <FileText size={20} />,
    activity: <Activity size={20} />,
};

const typeColors: Record<string, string> = {
    video: '#06b6d4',
    article: '#6366f1',
    activity: '#10b981',
};

const typeLabels: Record<string, string> = {
    video: 'Video',
    article: 'Makale',
    activity: 'Aktivite',
};

export default function MemberResourcesPage() {
    const { apiFetch } = useApi();
    const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const res = await apiFetch('/api/resource-assignments');
        const data = await res.json();
        setAssignments(data.assignments || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const markComplete = async (id: number) => {
        await apiFetch(`/api/resource-assignments/${id}/complete`, { method: 'PATCH' });
        fetchData();
    };

    const pending = assignments.filter(a => !a.completed_at);
    const completed = assignments.filter(a => a.completed_at);

    return (
        <DashboardShell requiredRole={['patient', 'family_member']}>
            <div className="animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">Kaynaklarım</h1>
                    <p className="text-zinc-400 text-sm">{pending.length} bekleyen · {completed.length} tamamlanan</p>
                </div>

                {/* Pending */}
                {pending.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-sm font-medium text-zinc-400 mb-3">📋 Sıradaki Kaynaklar</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pending.map(r => {
                                const tags: string[] = (() => { try { return JSON.parse(r.tags); } catch { return []; } })();
                                return (
                                    <div key={r.id} className="card p-5">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${typeColors[r.type]}20`, color: typeColors[r.type] }}>
                                                {typeIcons[r.type]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white leading-tight">{r.title}</h3>
                                                <span className="text-xs" style={{ color: typeColors[r.type] }}>{typeLabels[r.type]}</span>
                                            </div>
                                        </div>
                                        {r.description && <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{r.description}</p>}

                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{tag}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-auto">
                                            {r.url && (
                                                <a href={r.url} target="_blank" rel="noreferrer" className="btn-secondary flex-1 text-xs py-1.5">
                                                    <ExternalLink size={12} />
                                                    Aç
                                                </a>
                                            )}
                                            <button onClick={() => markComplete(r.id)} className="btn-primary flex-1 text-xs py-1.5">
                                                ✓ Tamamlandı
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Completed */}
                {completed.length > 0 && (
                    <div>
                        <h2 className="text-sm font-medium text-zinc-500 mb-3">✅ Tamamlananlar</h2>
                        <div className="space-y-2 opacity-60">
                            {completed.map(r => (
                                <div key={r.id} className="card p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg" style={{ background: `${typeColors[r.type]}15`, color: typeColors[r.type] }}>
                                        {typeIcons[r.type]}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-zinc-300">{r.title}</h4>
                                        <p className="text-xs text-zinc-600">
                                            {new Date(r.completed_at!).toLocaleDateString('tr-TR')} tarihinde tamamlandı
                                        </p>
                                    </div>
                                    <span className="badge badge-green">✓ Tamam</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="card h-36 animate-pulse" />)}
                    </div>
                )}

                {!loading && assignments.length === 0 && (
                    <div className="card p-12 text-center">
                        <BookOpen size={40} className="text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500">Henüz kaynak atanmamış</p>
                        <p className="text-zinc-600 text-sm mt-1">Psikologunuz size kaynaklar atadığında burada görünecekler</p>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
