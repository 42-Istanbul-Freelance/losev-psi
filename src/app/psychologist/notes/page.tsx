'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { FileText, Plus, Search, Tag, X, Check, AlertCircle } from 'lucide-react';

interface Note {
    id: number;
    member_name: string;
    member_role: string;
    sub_role: string | null;
    content: string;
    tags: string;
    created_at: string;
    appointment_id: number | null;
}

interface Member {
    id: number;
    name: string;
    role: string;
    sub_role: string | null;
    family_group_id: number | null;
}

export default function PsychologistNotesPage() {
    const { apiFetch } = useApi();
    const [notes, setNotes] = useState<Note[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filters
    const [searchMember, setSearchMember] = useState('');
    const [searchTag, setSearchTag] = useState('');

    // Create form
    const [noteMember, setNoteMember] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteTagInput, setNoteTagInput] = useState('');
    const [noteTags, setNoteTags] = useState<string[]>([]);
    const [error, setError] = useState('');

    const fetchNotes = async () => {
        let url = '/api/notes';
        const params = new URLSearchParams();
        if (searchMember) params.set('memberId', searchMember);
        if (searchTag) params.set('tag', searchTag);
        if (params.toString()) url += `?${params}`;
        const res = await apiFetch(url);
        const data = await res.json();
        setNotes(data.notes || []);
    };

    const fetchMembers = async () => {
        const res = await apiFetch('/api/psychologist/families');
        const data = await res.json();
        const all: Member[] = [];
        (data.families || []).forEach((f: { members: Member[] }) => all.push(...f.members));
        setMembers(all);
        setLoading(false);
    };

    useEffect(() => { fetchMembers(); fetchNotes(); }, []);
    useEffect(() => { fetchNotes(); }, [searchMember, searchTag]);

    const addNoteTag = () => {
        const t = noteTagInput.trim().toLowerCase();
        if (t && !noteTags.includes(t)) setNoteTags(prev => [...prev, t]);
        setNoteTagInput('');
    };

    const createNote = async () => {
        setError('');
        if (!noteMember || !noteContent) { setError('Üye ve içerik gerekli'); return; }
        const res = await apiFetch('/api/notes', {
            method: 'POST',
            body: JSON.stringify({ memberUserId: parseInt(noteMember), content: noteContent, tags: noteTags }),
        });
        if (res.ok) {
            setShowModal(false);
            setNoteMember(''); setNoteContent(''); setNoteTags([]);
            fetchNotes();
        } else {
            const data = await res.json();
            setError(data.error);
        }
    };

    return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Seans Notları</h1>
                        <p className="text-zinc-400 text-sm">{notes.length} not • Yalnızca siz görebilirsiniz</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={16} />
                        Not Ekle
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-5">
                    <div className="relative flex-1 max-w-[240px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <select className="input pl-8" value={searchMember} onChange={e => setSearchMember(e.target.value)}>
                            <option value="">Tüm üyeler</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="relative flex-1 max-w-[240px]">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input className="input pl-8" placeholder="Etikete göre ara..." value={searchTag} onChange={e => setSearchTag(e.target.value)} />
                    </div>
                </div>

                {/* Notes */}
                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-28 animate-pulse" />)}</div>
                ) : notes.length === 0 ? (
                    <div className="card p-12 text-center">
                        <FileText size={40} className="text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500">Not bulunamadı</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notes.map(note => {
                            const parsedTags: string[] = (() => { try { return JSON.parse(note.tags); } catch { return []; } })();
                            return (
                                <div key={note.id} className="card p-5">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <span className="text-sm font-semibold text-white">{note.member_name}</span>
                                            <span className="text-xs text-zinc-500 ml-2">
                                                {note.member_role === 'patient' ? '🟢 Hasta' : '💗 Aile Üyesi'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-zinc-500 shrink-0">
                                            {new Date(note.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed mb-3">{note.content}</p>
                                    {parsedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {parsedTags.map(tag => (
                                                <span key={tag} className="badge badge-indigo text-[10px]">
                                                    <Tag size={8} />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
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
                                <h2 className="text-lg font-bold text-white">Yeni Seans Notu</h2>
                                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Üye</label>
                                    <select className="input" value={noteMember} onChange={e => setNoteMember(e.target.value)}>
                                        <option value="">Seç...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Not İçeriği</label>
                                    <textarea
                                        className="input h-32 resize-none"
                                        value={noteContent}
                                        onChange={e => setNoteContent(e.target.value)}
                                        placeholder="Bu seans veya üye hakkında notlarınızı yazın..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-1.5">Etiketler</label>
                                    <div className="flex gap-2 mb-2">
                                        <input className="input flex-1" value={noteTagInput} onChange={e => setNoteTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNoteTag()} placeholder="Etiket ekle..." />
                                        <button onClick={addNoteTag} className="btn-secondary px-3"><Plus size={16} /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {noteTags.map(t => (
                                            <span key={t} onClick={() => setNoteTags(p => p.filter(x => x !== t))} className="badge badge-indigo cursor-pointer">{t} ×</span>
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
                                    <button onClick={createNote} className="btn-primary flex-1"><Check size={16} /> Kaydet</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
