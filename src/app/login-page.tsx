'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import LosevLogo from '@/components/LosevLogo';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await login(email, password);
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${localStorage.getItem('losev_token')}` }
            });
            const data = await res.json();
            const role = data.user?.role;
            if (role === 'admin') router.push('/admin');
            else if (role === 'psychologist') router.push('/psychologist');
            else router.push('/member');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Giriş başarısız');
        } finally { setLoading(false); }
    };

    const quickLogin = (preset: string) => {
        const creds: Record<string, [string, string]> = {
            admin: ['admin@losev.org', 'admin123'],
            psy1: ['ayse@losev.org', 'psikolog123'],
            patient: ['ahmet@yilmaz.com', 'hasta123'],
            anne: ['fatma@yilmaz.com', 'aile123'],
        };
        const [e, p] = creds[preset];
        setEmail(e); setPassword(p);
    };

    const quickButtons = [
        { key: 'admin', emoji: '👑', label: 'Admin', color: '#C89030', bg: 'rgba(240,185,74,0.08)', border: 'rgba(240,185,74,0.25)' },
        { key: 'psy1', emoji: '🧠', label: 'Psikolog', color: '#3A7FD5', bg: 'rgba(58,127,213,0.08)', border: 'rgba(58,127,213,0.25)' },
        { key: 'patient', emoji: '🌿', label: 'Hasta', color: '#3A8C6A', bg: 'rgba(77,170,130,0.08)', border: 'rgba(77,170,130,0.25)' },
        { key: 'anne', emoji: '💗', label: 'Anne', color: '#B84838', bg: 'rgba(232,112,90,0.08)', border: 'rgba(232,112,90,0.25)' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#F2F5FB' }}>

            {/* Background atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(58,127,213,0.10) 0%, transparent 70%)' }}
                />
                <div className="absolute w-[500px] h-[500px] rounded-full bottom-0 left-0 animate-float"
                    style={{ background: 'radial-gradient(circle, rgba(58,127,213,0.08) 0%, transparent 70%)', filter: 'blur(60px)', animationDuration: '7s' }}
                />
                <div className="absolute w-[400px] h-[400px] rounded-full top-0 right-0 animate-float"
                    style={{ background: 'radial-gradient(circle, rgba(77,170,130,0.08) 0%, transparent 70%)', filter: 'blur(60px)', animationDuration: '9s', animationDelay: '2s' }}
                />
                {/* Subtle dot grid */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: 'radial-gradient(#3A7FD5 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />
            </div>

            <div className="w-full max-w-[420px] animate-fade-in relative z-10">

                {/* Logo block */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-4 animate-float" style={{ animationDuration: '5s' }}>
                        <div
                            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #1A2B4A, #3A7FD5)',
                                boxShadow: '0 8px 32px rgba(58,127,213,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                            }}
                        >
                            <LosevLogo size={32} className="relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        <span style={{ color: '#E30613' }}>LÖ</span><span style={{ color: '#1A2B4A' }}>SEV</span>
                        <span className="grad-text"> PSİ</span>
                    </h1>
                    <p className="text-sm mt-1.5 font-medium" style={{ color: '#8097B8' }}>Psikolojik Destek Platformu</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-300/30" />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(58,127,213,0.40)' }} />
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-300/30" />
                    </div>
                </div>

                {/* Card */}
                <div
                    className="rounded-3xl p-7 relative overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.96)',
                        border: '1.5px solid rgba(58,127,213,0.12)',
                        boxShadow: '0 28px 64px rgba(26,43,74,0.10), 0 6px 18px rgba(58,127,213,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
                    }}
                >
                    {/* Top shimmer line */}
                    <div className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(58,127,213,0.5), rgba(77,170,130,0.35), transparent)' }}
                    />

                    <h2 className="text-lg font-bold mb-5" style={{ color: '#1A2B4A' }}>Hesabınıza Giriş Yapın</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                style={{ color: '#8097B8' }}>
                                E-posta Adresi
                            </label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9BAEC8' }} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className="input pl-10" placeholder="ornek@losev.org"
                                    required id="login-email" autoComplete="email" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                style={{ color: '#8097B8' }}>
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9BAEC8' }} />
                                <input type={showPassword ? 'text' : 'password'} value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input pl-10 pr-11" placeholder="••••••••"
                                    required id="login-password" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: '#9BAEC8' }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl p-3"
                                style={{ background: 'rgba(232,112,90,0.07)', border: '1px solid rgba(232,112,90,0.22)' }}>
                                <AlertCircle size={15} style={{ color: '#B84830' }} className="flex-shrink-0" />
                                <span className="text-sm" style={{ color: '#B84830' }}>{error}</span>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="btn-primary w-full py-3 mt-1 text-base" id="login-submit">
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Doğrulanıyor...</>
                            ) : 'Giriş Yap →'}
                        </button>
                    </form>

                </div>

                {/* ── DEV / Test Login Panel ── */}
                <div
                    className="mt-4 rounded-2xl p-4 relative overflow-hidden"
                    style={{
                        background: 'rgba(255, 248, 220, 0.60)',
                        border: '2px dashed rgba(200,144,48,0.45)',
                        boxShadow: '0 4px 20px rgba(200,144,48,0.08)',
                    }}
                >
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-3">
                        <div
                            className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase"
                            style={{ background: 'rgba(200,144,48,0.15)', color: '#A07020', border: '1px solid rgba(200,144,48,0.3)' }}
                        >
                            ⚠ DEV
                        </div>
                        <span className="text-xs font-bold" style={{ color: '#A07020' }}>Hızlı Test Girişi</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(200,144,48,0.20)' }} />
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(160,112,32,0.55)' }}>sadece geliştirme</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {quickButtons.map(qb => (
                            <button
                                key={qb.key}
                                type="button"
                                onClick={() => quickLogin(qb.key)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: qb.bg,
                                    borderColor: qb.border,
                                    color: qb.color,
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                }}
                            >
                                <span className="text-lg leading-none">{qb.emoji}</span>
                                <div>
                                    <div className="text-xs font-bold leading-tight">{qb.label}</div>
                                    <div className="text-[10px] font-mono opacity-60 leading-tight">tıkla → doldur</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-center text-xs mt-5 font-medium" style={{ color: '#9BAEC8' }}>
                    © {new Date().getFullYear()} LÖSEV — Lösemili Çocuklar Vakfı
                </p>
            </div>
        </div>
    );
}