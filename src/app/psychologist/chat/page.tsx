'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Send, MessageSquare, Users, Lock, Search } from 'lucide-react';

interface Family {
    id: number;
    name: string;
    members: { id: number; name: string; role: string; sub_role: string | null }[];
}

interface ChatMessage {
    id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    message_type: string;
    mood_label: string | null;
    created_at: string;
    read_at: string | null;
}

const MOOD_OPTIONS = [
    { label: 'sad', emoji: '😔', text: 'Üzgün' },
    { label: 'anxious', emoji: '😰', text: 'Endişeli' },
    { label: 'angry', emoji: '😠', text: 'Kızgın' },
    { label: 'okay', emoji: '🙂', text: 'İyi' },
    { label: 'strong', emoji: '💪', text: 'Güçlü' },
];

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Bugün';
    if (d.toDateString() === yesterday.toDateString()) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

const subRoleLabels: Record<string, string> = {
    mother: 'Anne', father: 'Baba', sibling: 'Kardeş', other: 'Diğer'
};

export default function PsychologistChatPage() {
    const { user } = useAuth();
    const { apiFetch } = useApi();

    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedMember, setSelectedMember] = useState<{ id: number; name: string; role: string; sub_role: string | null; familyName: string } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        apiFetch('/api/psychologist/families').then(r => r.json()).then(data => {
            setFamilies(data.families || []);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [messages]);

    const selectMember = async (member: { id: number; name: string; role: string; sub_role: string | null }, familyName: string) => {
        setSelectedMember({ ...member, familyName });
        setChatLoading(true);
        const res = await apiFetch(`/api/chat?memberId=${member.id}`);
        const data = await res.json();
        setMessages(data.messages || []);
        setChatLoading(false);
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    const sendMessage = async () => {
        const content = inputText.trim();
        if (!content || !selectedMember) return;
        setSending(true);
        await apiFetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                memberId: selectedMember.id,
                content,
                messageType: 'text',
            }),
        });
        setInputText('');
        setSending(false);
        const res = await apiFetch(`/api/chat?memberId=${selectedMember.id}`);
        const data = await res.json();
        setMessages(data.messages || []);
        inputRef.current?.focus();
    };

    // Build flat member list with family name
    const allMembers = families.flatMap(f =>
        f.members.map(m => ({ ...m, familyName: f.name }))
    );

    const filteredMembers = search
        ? allMembers.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.familyName.toLowerCase().includes(search.toLowerCase()))
        : allMembers;

    // Group messages by date
    const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
    messages.forEach(msg => {
        const date = formatDate(msg.created_at);
        const last = groupedMessages[groupedMessages.length - 1];
        if (last && last.date === date) last.msgs.push(msg);
        else groupedMessages.push({ date, msgs: [msg] });
    });

    return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-fade-in flex gap-5" style={{ height: 'calc(100vh - 6rem)' }}>

                {/* Member List */}
                <div className="w-80 flex-shrink-0 flex flex-col card overflow-hidden">
                    <div className="p-4" style={{ borderBottom: '1px solid rgba(58,127,213,0.10)' }}>
                        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#1A2B4A' }}>
                            <Users size={16} style={{ color: '#3A7FD5' }} />
                            Sohbetler
                        </h2>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8097B8' }} />
                            <input
                                className="input pl-8 h-9 text-sm"
                                placeholder="Üye veya aile ara..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="space-y-2 p-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(58,127,213,0.05)' }} />)}
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquare size={28} className="mx-auto mb-2" style={{ color: '#8097B8' }} />
                                <p className="text-sm" style={{ color: '#3D5475' }}>Üye bulunamadı</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredMembers.map(member => {
                                    const isSelected = selectedMember?.id === member.id;
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => selectMember(member, member.familyName)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                                            style={{
                                                background: isSelected ? 'rgba(58,127,213,0.08)' : 'transparent',
                                                border: isSelected ? '1px solid rgba(58,127,213,0.18)' : '1px solid transparent',
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                                style={{
                                                    background: member.role === 'patient' ? 'rgba(77,170,130,0.12)' : 'rgba(232,112,90,0.12)',
                                                    color: member.role === 'patient' ? '#28785A' : '#B84830',
                                                    border: `1px solid ${member.role === 'patient' ? 'rgba(77,170,130,0.25)' : 'rgba(232,112,90,0.25)'}`,
                                                }}
                                            >
                                                {member.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: '#1A2B4A' }}>{member.name}</p>
                                                <p className="text-xs truncate" style={{ color: '#8097B8' }}>
                                                    {member.role === 'patient' ? 'Hasta' : subRoleLabels[member.sub_role || ''] || 'Aile Üyesi'} · {member.familyName}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 card flex flex-col overflow-hidden">
                    {!selectedMember ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div
                                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4 animate-float"
                                style={{ background: 'rgba(58,127,213,0.07)', border: '1px solid rgba(58,127,213,0.14)' }}
                            >
                                💬
                            </div>
                            <p className="font-bold mb-1" style={{ color: '#1A2B4A' }}>Sohbet Başlatın</p>
                            <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#3D5475' }}>
                                Sol panelden bir üye seçerek sohbete başlayabilirsiniz.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div
                                className="flex items-center gap-3 p-4 flex-shrink-0"
                                style={{ borderBottom: '1px solid rgba(26,43,74,0.10)', background: 'rgba(255,255,255,0.5)' }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{
                                        background: selectedMember.role === 'patient' ? 'rgba(77,170,130,0.12)' : 'rgba(232,112,90,0.12)',
                                        color: selectedMember.role === 'patient' ? '#28785A' : '#B84830',
                                        border: `1px solid ${selectedMember.role === 'patient' ? 'rgba(77,170,130,0.25)' : 'rgba(232,112,90,0.25)'}`,
                                    }}
                                >
                                    {selectedMember.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold" style={{ color: '#1A2B4A' }}>{selectedMember.name}</h3>
                                    <p className="text-xs" style={{ color: '#3D5475' }}>
                                        {selectedMember.role === 'patient' ? 'Hasta' : subRoleLabels[selectedMember.sub_role || ''] || 'Aile Üyesi'} · {selectedMember.familyName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8097B8' }}>
                                    <Lock size={11} style={{ color: '#4DAA82' }} />
                                    <span className="font-mono">şifreli</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-1">
                                {chatLoading ? (
                                    <div className="space-y-4 pt-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                                                <div className="h-10 rounded-2xl animate-pulse" style={{ width: `${180 + i * 40}px`, background: 'rgba(58,127,213,0.06)' }} />
                                            </div>
                                        ))}
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                                            style={{ background: 'rgba(58,127,213,0.06)', border: '1px solid rgba(58,127,213,0.12)' }}
                                        >
                                            💬
                                        </div>
                                        <p className="font-semibold mb-1" style={{ color: '#1A2B4A' }}>Henüz mesaj yok</p>
                                        <p className="text-sm" style={{ color: '#3D5475' }}>
                                            {selectedMember.name} ile sohbeti başlatın
                                        </p>
                                    </div>
                                ) : (
                                    groupedMessages.map(group => (
                                        <div key={group.date}>
                                            <div className="flex items-center justify-center my-5">
                                                <div
                                                    className="px-3 py-1 rounded-full text-[10px] font-semibold border"
                                                    style={{
                                                        background: 'rgba(58,127,213,0.06)',
                                                        borderColor: 'rgba(58,127,213,0.14)',
                                                        color: '#3A7FD5',
                                                    }}
                                                >
                                                    {group.date}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {group.msgs.map(msg => {
                                                    const isMine = msg.sender_id === user?.id;
                                                    const mood = MOOD_OPTIONS.find(m => m.label === msg.mood_label);
                                                    return (
                                                        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                            {msg.message_type === 'mood' ? (
                                                                <div
                                                                    className="rounded-2xl p-4 max-w-sm"
                                                                    style={{
                                                                        background: 'rgba(232,112,90,0.06)',
                                                                        border: '1.5px solid rgba(232,112,90,0.18)',
                                                                        marginLeft: isMine ? 'auto' : undefined,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="text-2xl">{mood?.emoji || '💬'}</span>
                                                                        <span className="font-bold text-sm" style={{ color: '#E8705A' }}>
                                                                            {mood?.text || msg.mood_label}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm" style={{ color: '#1A2B4A' }}>{msg.content}</p>
                                                                </div>
                                                            ) : (
                                                                <div className={isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                                                                    {msg.content}
                                                                </div>
                                                            )}
                                                            <p className="text-[10px] mt-1 px-2" style={{ color: '#8097B8' }}>
                                                                {formatTime(msg.created_at)}
                                                                {!isMine && msg.read_at && <span className="ml-1" style={{ color: '#4DAA82' }}>✓✓</span>}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 flex-shrink-0" style={{ borderTop: '1.5px solid rgba(26,43,74,0.12)' }}>
                                <div className="flex gap-2 items-center">
                                    <input
                                        ref={inputRef}
                                        className="input flex-1 h-10"
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                        placeholder="Mesajınızı yazın..."
                                        style={{ borderColor: 'rgba(26,43,74,0.18)', color: '#1A2B4A' }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputText.trim() || sending}
                                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                        style={{
                                            background: inputText.trim() ? 'linear-gradient(135deg,#3A7FD5,#5295E8)' : 'rgba(235,240,250,0.9)',
                                            border: inputText.trim() ? 'none' : '1px solid rgba(58,127,213,0.15)',
                                            color: inputText.trim() ? 'white' : '#8097B8',
                                            boxShadow: inputText.trim() ? '0 3px 12px rgba(58,127,213,0.3)' : 'none',
                                        }}
                                    >
                                        {sending ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : <Send size={16} />}
                                    </button>
                                </div>
                                <p className="text-[9px] text-center mt-2" style={{ color: '#8097B8' }}>
                                    Mesajlar şifrelenerek saklanır · Yalnızca siz ve üye görebilir
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
