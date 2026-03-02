'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { Plus, BookOpen, Video, FileText, Activity, Trash2, X, Check, AlertCircle, Tag } from 'lucide-react';

interface Resource {
    id: number;
    title: string;
    description: string | null;
    type: string;
    url: string | null;
    target_age_min: number | null;
    target_age_max: number | null;
    tags: string;
    uploaded_by_name: string | null;
    created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
    video: <Video size={16} />,
    article: <FileText size={16} />,
    activity: <Activity size={16} />,
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

export default function AdminResourcesPage() {
    const { apiFetch } = useApi();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('video');
    const [url, setUrl] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const fetchData = async () => {
        const res = await apiFetch('/api/resources');
        const data = await res.json();
        setResources(data.resources || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t)) {
            setTags(prev => [...prev, t]);
        }
        setTagInput('');
    };

    const createResource = async () => {
        setError('');
        if (!title || !type) { setError('Başlık ve tür gerekli'); return; }
        const res = await apiFetch('/api/resources', {
            method: 'POST',
            body: JSON.stringify({
                title, description, type, url,
                targetAgeMin: minAge ? parseInt(minAge) : undefined,
                targetAgeMax: maxAge ? parseInt(maxAge) : undefined,
                tags,
            }),
        });
        if (res.ok) {
            setShowModal(false);
            setTitle(''); setDescription(''); setType('video');
            setUrl(''); setMinAge(''); setMaxAge(''); setTags([]);
            fetchData();
        } else {
            const data = await res.json();
            setError(data.error);
        }
    };

    const deleteResource = async (id: number) => {
        if (!confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) return;
        await apiFetch(`/api/resources/${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <DashboardShell requiredRole="admin">
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Kaynak Kütüphanesi</h1>
                        <p className="text-zinc-400 text-sm">{resources.length} kaynak mevcut</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={16} />
                        Kaynak Ekle
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="card h-36 animate-pulse" />)}
                    </div>
                ) : resources.length === 0 ? (
                    <div className="card p-12 text-center">
                        <BookOpen size={40} className="text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500">Henüz kaynak eklenmemiş</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map(r => {
                            const parsedTags = (() => { try { return JSON.parse(r.tags); } catch { return []; } })();
                            return (
                                <div key={r.id} className="card p-5 flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{ background: `${typeColors[r.type]}20`, color: typeColors[r.type] }}
                                        >
                                            {typeIcons[r.type]}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="badge" style={{ background: `${typeColors[r.type]}15`, color: typeColors[r.type], border: `1px solid ${typeColors[r.type]}30` }}>
                                                {typeLabels[r.type]}
                                            </span>
                                            <button onClick={() => deleteResource(r.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-white mb-1 leading-tight">{r.title}</h3>
                                    {r.description && <p className="text-zinc-400 text-xs mb-3 line-clamp-2">{r.description}</p>}
                                    <div className="mt-auto pt-3 border-t border-zinc-800/50 space-y-1.5">
                                        {(r.target_age_min || r.target_age_max) && (
                                            <p className="text-xs text-zinc-500">
                                                Yaş: {r.target_age_min ?? '?'} - {r.target_age_max ?? '?'}
                                            </p>
                                        )}
                                        {parsedTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {parsedTags.slice(0, 3).map((tag: string) => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 flex items-center gap-1">
                                                        <Tag size={8} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-box" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">Yeni Kaynak Ekle</h2>
                                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Başlık</label>
                                    <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Kaynak Başlığı" />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Tür</label>
                                    <select className="input" value={type} onChange={e => setType(e.target.value)}>
                                        <option value="video">Video</option>
                                        <option value="article">Makale</option>
                                        <option value="activity">Aktivite</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Açıklama</label>
                                    <textarea className="input h-20 resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Kaynak hakkında kısa açıklama..." />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">URL / Bağlantı</label>
                                    <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-zinc-300 mb-1.5">Min Yaş</label>
                                        <input className="input" type="number" value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-300 mb-1.5">Max Yaş</label>
                                        <input className="input" type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="99" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Etiketler</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            className="input flex-1"
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addTag()}
                                            placeholder="Etiket yazın, Enter'a basın"
                                        />
                                        <button onClick={addTag} className="btn-secondary px-3"><Plus size={16} /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {tags.map(tag => (
                                            <span key={tag} className="badge badge-indigo cursor-pointer" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                                                {tag} ×
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
                                        <AlertCircle size={14} />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">İptal</button>
                                    <button onClick={createResource} className="btn-primary flex-1">
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
