'use client';

import { useEffect, useState, useRef } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff, Volume2, Maximize2, PhoneOff } from 'lucide-react';

interface Appointment {
    id: number;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    type: string;
    status: string;
    member_name: string;
    psychologist_name: string;
}

export default function SessionPage({ params }: { params: Promise<{ appointmentId: string }> }) {
    const { appointmentId } = use(params);
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const router = useRouter();

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionTime, setSessionTime] = useState(0);
    const [ending, setEnding] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Fetch appointment
        apiFetch('/api/appointments')
            .then(r => r.json())
            .then(data => {
                const apt = (data.appointments || []).find((a: Appointment) => a.id === parseInt(appointmentId));
                setAppointment(apt || null);
                setLoading(false);
            });

        // Start timer
        timerRef.current = setInterval(() => {
            setSessionTime(s => s + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [appointmentId]);

    // Auto-play video when loaded
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => {/* autoplay blocked */ });
        }
    }, [loading]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const endSession = async () => {
        setEnding(true);
        if (timerRef.current) clearInterval(timerRef.current);

        // Mark appointment as completed
        await apiFetch(`/api/appointments/${appointmentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'completed' }),
        });

        // Brief pause for UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push(user?.role === 'psychologist' ? '/psychologist' : '/member');
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">Seans hazırlanıyor...</p>
            </div>
        </div>
    );

    if (!appointment) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <p className="text-zinc-400">Randevu bulunamadı</p>
                <button onClick={() => router.back()} className="btn-secondary mt-4">Geri Dön</button>
            </div>
        </div>
    );

    const psychologistName = user?.role === 'psychologist' ? appointment.member_name : appointment.psychologist_name;
    const myName = user?.name || 'Siz';

    return (
        <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col overflow-hidden">
            {/* Session Video Area */}
            <div className="flex-1 relative">
                {/* Main "remote" video — mock session video */}
                <div className="absolute inset-0">
                    {/* NOTE: /public/mock-session.mp4 will be replaced with the real MP4 file provided by the client */}
                    <video
                        ref={videoRef}
                        src="/mock-session.mp4"
                        className="w-full h-full object-cover"
                        loop
                        muted={false}
                        playsInline
                        onError={() => {
                            // Fallback: gradient background when MP4 is not yet provided
                            if (videoRef.current) videoRef.current.style.display = 'none';
                        }}
                    />
                    {/* Fallback gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-950 to-zinc-950 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-8xl mb-4">🧠</div>
                            <p className="text-white/40 text-sm font-mono">[Seans Simülasyonu]</p>
                        </div>
                    </div>
                </div>

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between"
                    style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-white text-xs font-bold font-mono">CANLI</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                            <span className="text-white text-sm font-mono">{formatTime(sessionTime)}</span>
                        </div>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm">
                        <p className="text-white text-sm font-medium">{appointment.title}</p>
                    </div>
                </div>

                {/* Participant name overlay (remote) */}
                <div className="absolute bottom-4 md:bottom-24 left-4 z-10">
                    <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
                        <p className="text-white text-sm font-medium">{psychologistName || 'Karşı Taraf'}</p>
                    </div>
                </div>

                {/* Self preview (PiP) */}
                <div className="absolute bottom-4 md:bottom-24 right-4 z-10 w-32 h-24 md:w-48 md:h-36 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                        {camOn ? (
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-indigo-500/30 border border-indigo-500/50 flex items-center justify-center text-xl font-bold text-white mx-auto mb-1">
                                    {myName.charAt(0)}
                                </div>
                            </div>
                        ) : (
                            <VideoOff size={24} className="text-zinc-500" />
                        )}
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <p className="text-white text-[10px] bg-black/50 rounded px-1.5 py-0.5">{myName} (Siz)</p>
                    </div>
                </div>
            </div>

            {/* Controls bar */}
            <div className="relative z-20 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/50">
                <div className="max-w-lg mx-auto px-4 py-5 flex items-center justify-center gap-4">
                    {/* Mic toggle */}
                    <button
                        onClick={() => setMicOn(!micOn)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${micOn
                                ? 'bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700'
                                : 'bg-red-600 border-red-500 text-white'
                            }`}
                        title={micOn ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
                    >
                        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>

                    {/* Camera toggle */}
                    <button
                        onClick={() => setCamOn(!camOn)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${camOn
                                ? 'bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700'
                                : 'bg-red-600 border-red-500 text-white'
                            }`}
                        title={camOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                    >
                        {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>

                    {/* End session */}
                    <button
                        onClick={endSession}
                        disabled={ending}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 border-2 border-red-400 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                        title="Seansı Bitir"
                    >
                        {ending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <PhoneOff size={24} />
                        )}
                    </button>

                    {/* Volume */}
                    <button
                        className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-600 text-white hover:bg-zinc-700 flex items-center justify-center transition-all"
                        title="Ses"
                    >
                        <Volume2 size={20} />
                    </button>

                    {/* Fullscreen */}
                    <button
                        onClick={() => document.documentElement.requestFullscreen?.()}
                        className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-600 text-white hover:bg-zinc-700 flex items-center justify-center transition-all"
                        title="Tam Ekran"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>

                {ending && (
                    <div className="text-center pb-3">
                        <p className="text-zinc-400 text-sm">Seans sonlandırılıyor, puanlar hesaplanıyor... 🏆</p>
                    </div>
                )}
            </div>
        </div>
    );
}
