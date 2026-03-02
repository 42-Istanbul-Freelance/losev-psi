'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Smile, X, Lock, Leaf } from 'lucide-react';

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
    { label: 'sad', emoji: '😔', text: 'Üzgün', color: '#457b9d', bg: 'rgba(69,123,157,0.08)' },
    { label: 'anxious', emoji: '😰', text: 'Endişeli', color: '#2a9d8f', bg: 'rgba(42,157,143,0.08)' },
    { label: 'angry', emoji: '😠', text: 'Kızgın', color: '#c4645a', bg: 'rgba(196,100,90,0.08)' },
    { label: 'okay', emoji: '🙂', text: 'İyi', color: '#52b788', bg: 'rgba(82,183,136,0.08)' },
    { label: 'strong', emoji: '💪', text: 'Güçlü', color: '#c49a3c', bg: 'rgba(196,154,60,0.08)' },
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

export default function MemberChatPage() {
    const { user } = useAuth();
    const { apiFetch } = useApi();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchMessages = async () => {
        const res = await apiFetch('/api/chat');
        const data = await res.json();
        setMessages(data.messages || []);
        setLoading(false);
    };
    useEffect(() => { fetchMessages(); }, []);
    useEffect(() => {
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [messages]);

    const sendMessage = async (moodLabel?: string) => {
        const content = inputText.trim();
        if (!content && !moodLabel) return;
        setSending(true);
        await apiFetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                content: content || MOOD_OPTIONS.find(m => m.label === moodLabel)?.text || '',
                messageType: moodLabel ? 'mood' : 'text',
                moodLabel,
            }),
        });
        setInputText('');
        setShowMoodPicker(false);
        setSending(false);
        await fetchMessages();
        inputRef.current?.focus();
    };

    const sendMoodMessage = async (mood: typeof MOOD_OPTIONS[0]) => {
        setSending(true);
        await apiFetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                content: `${mood.emoji} ${mood.text} hissediyorum`,
                messageType: 'mood',
                moodLabel: mood.label,
            }),
        });
        setShowMoodPicker(false);
        setSending(false);
        await fetchMessages();
    };

    // Group by date
    const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
    messages.forEach(msg => {
        const date = formatDate(msg.created_at);
        const last = groupedMessages[groupedMessages.length - 1];
        if (last && last.date === date) last.msgs.push(msg);
        else groupedMessages.push({ date, msgs: [msg] });
    });

    return (
        <DashboardShell requiredRole={['patient', 'family_member']}>
            <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>

                {/* Chat header */}
                <div
                    className="flex items-center gap-3 p-4 rounded-2xl border mb-4"
                    style={{ background: 'rgba(255,255,255,0.92)', borderColor: 'rgba(42,157,143,0.14)', boxShadow: '0 2px 10px rgba(42,157,143,0.07)' }}
                >
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: 'rgba(42,157,143,0.1)', border: '1px solid rgba(42,157,143,0.2)' }}
                    >
                        🧠
                    </div>
                    <div className="flex-1">
                        <h1 className="font-bold" style={{ color: '#1e3a35' }}>Psikologumla Sohbet</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-glow-pulse" />
                            <p className="text-xs" style={{ color: '#6b9994' }}>Aktif · Özel · Gizli</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b9994' }}>
                        <Lock size={11} style={{ color: '#52b788' }} />
                        <span className="font-mono">şifreli</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="card flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 space-y-1">
                        {loading ? (
                            <div className="space-y-4 pt-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                                        <div className="h-10 rounded-2xl animate-pulse" style={{ width: `${180 + i * 40}px`, background: 'rgba(42,157,143,0.06)' }} />
                                    </div>
                                ))}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div
                                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4 animate-float"
                                    style={{ background: 'rgba(42,157,143,0.08)', border: '1px solid rgba(42,157,143,0.15)' }}
                                >
                                    💬
                                </div>
                                <p className="font-bold mb-1" style={{ color: '#1e3a35' }}>Sohbeti Başlatın</p>
                                <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#6b9994' }}>
                                    Psikologunuza her türlü düşünce ve hislerinizi güvenle paylaşabilirsiniz.
                                </p>
                                <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: '#8aada8' }}>
                                    <Leaf size={11} style={{ color: '#52b788' }} />
                                    Mesajlarınız yalnızca psikologunuz tarafından görülebilir
                                </div>
                            </div>
                        ) : (
                            groupedMessages.map(group => (
                                <div key={group.date}>
                                    {/* Date separator — light colored */}
                                    <div className="flex items-center justify-center my-5">
                                        <div
                                            className="px-3 py-1 rounded-full text-[10px] font-semibold border"
                                            style={{
                                                background: 'rgba(42,157,143,0.07)',
                                                borderColor: 'rgba(42,157,143,0.15)',
                                                color: '#2a9d8f',
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
                                                                background: mood?.bg || 'rgba(42,157,143,0.07)',
                                                                border: `1.5px solid ${mood?.color || '#2a9d8f'}25`,
                                                                marginLeft: isMine ? 'auto' : undefined,
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="text-2xl">{mood?.emoji || '💬'}</span>
                                                                <span className="font-bold text-sm" style={{ color: mood?.color || '#2a9d8f' }}>
                                                                    {mood?.text || msg.mood_label}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm" style={{ color: '#2d5a54' }}>{msg.content}</p>
                                                        </div>
                                                    ) : (
                                                        <div className={isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                                                            {msg.content}
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] mt-1 px-2" style={{ color: '#8aada8' }}>
                                                        {formatTime(msg.created_at)}
                                                        {isMine && msg.read_at && <span className="ml-1" style={{ color: '#2a9d8f' }}>✓✓</span>}
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

                    {/* Mood picker */}
                    {showMoodPicker && (
                        <div className="border-t p-4" style={{ borderColor: 'rgba(42,157,143,0.1)', background: 'rgba(247,252,251,0.9)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold" style={{ color: '#6b9994' }}>Ruh halinizi paylaşın</p>
                                <button onClick={() => setShowMoodPicker(false)} style={{ color: '#8aada8' }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {MOOD_OPTIONS.map(mood => (
                                    <button
                                        key={mood.label}
                                        onClick={() => sendMoodMessage(mood)}
                                        disabled={sending}
                                        className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                        style={{ background: mood.bg, borderColor: `${mood.color}25` }}
                                    >
                                        <span className="text-2xl leading-none">{mood.emoji}</span>
                                        <span className="text-[10px] font-bold" style={{ color: mood.color }}>{mood.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t p-4" style={{ borderColor: 'rgba(26,43,74,0.15)' }}>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => setShowMoodPicker(!showMoodPicker)}
                                className="flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
                                style={{
                                    background: showMoodPicker ? 'rgba(42,157,143,0.1)' : 'rgba(247,252,251,0.9)',
                                    borderColor: showMoodPicker ? 'rgba(42,157,143,0.3)' : 'rgba(42,157,143,0.15)',
                                    color: showMoodPicker ? '#2a9d8f' : '#8aada8',
                                }}
                                title="Ruh hali paylaş"
                            >
                                <Smile size={17} />
                            </button>
                            <input
                                ref={inputRef}
                                className="input flex-1 h-10"
                                style={{ borderColor: 'rgba(26,43,74,0.20)', color: '#1A2B4A' }}
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Mesajınızı yazın..."
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!inputText.trim() || sending}
                                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                style={{
                                    background: inputText.trim() ? 'linear-gradient(135deg,#2a9d8f,#38b2a5)' : 'rgba(240,247,245,0.9)',
                                    border: inputText.trim() ? 'none' : '1px solid rgba(42,157,143,0.15)',
                                    color: inputText.trim() ? 'white' : '#a8c5c1',
                                    boxShadow: inputText.trim() ? '0 3px 12px rgba(42,157,143,0.3)' : 'none',
                                }}
                            >
                                {sending ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : <Send size={16} />}
                            </button>
                        </div>
                        <p className="text-[9px] text-center mt-2" style={{ color: '#8097B8' }}>
                            Mesajlarınız şifrelenerek saklanır · Yalnızca psikologunuz görebilir
                        </p>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
