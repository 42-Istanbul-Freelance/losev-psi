'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Leaf } from 'lucide-react';
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
        { key: 'admin', emoji: '👑', label: 'Admin', color: '#b85555', bg: 'rgba(196,100,90,0.07)', border: 'rgba(196,100,90,0.2)' },
        { key: 'psy1', emoji: '🧠', label: 'Psikolog', color: '#2a9d8f', bg: 'rgba(42,157,143,0.07)', border: 'rgba(42,157,143,0.2)' },
        { key: 'patient', emoji: '🌿', label: 'Hasta', color: '#3a9a6a', bg: 'rgba(82,183,136,0.07)', border: 'rgba(82,183,136,0.2)' },
        { key: 'anne', emoji: '💗', label: 'Anne', color: '#9a5a5a', bg: 'rgba(208,128,128,0.07)', border: 'rgba(208,128,128,0.2)' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Soft teal aurora background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(42,157,143,0.12) 0%, transparent 70%)' }}
                />
                <div className="absolute w-[500px] h-[500px] rounded-full bottom-0 left-0 animate-float"
                    style={{ background: 'radial-gradient(circle, rgba(69,123,157,0.1) 0%, transparent 70%)', filter: 'blur(50px)', animationDuration: '7s' }}
                />
                <div className="absolute w-[400px] h-[400px] rounded-full top-0 right-0 animate-float"
                    style={{ background: 'radial-gradient(circle, rgba(82,183,136,0.1) 0%, transparent 70%)', filter: 'blur(50px)', animationDuration: '9s', animationDelay: '2s' }}
                />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#2a9d8f 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />
            </div>

            <div className="w-full max-w-[420px] animate-fade-in relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-4 animate-float" style={{ animationDuration: '5s' }}>
                        <div
                            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #2a9d8f, #38b2a5)',
                                boxShadow: '0 8px 28px rgba(42,157,143,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                            }}
                        >
                            <LosevLogo size={32} className="relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        <span style={{ color: '#E30613' }}>LÖ</span><span style={{ color: '#1e3a35' }}>SEV</span>
                        <span className="grad-text"> PSİ</span>
                    </h1>
                    <p className="text-sm mt-1.5 font-medium" style={{ color: '#6b9994' }}>Psikolojik Destek Platformu</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-teal-300/40" />
                        <Leaf size={12} style={{ color: '#2a9d8f', opacity: 0.5 }} />
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-teal-300/40" />
                    </div>
                </div>

                {/* Card */}
                <div
                    className="rounded-3xl p-7 relative overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.94)',
                        border: '1.5px solid rgba(42,157,143,0.14)',
                        boxShadow: '0 28px 64px rgba(30,58,53,0.09), 0 6px 18px rgba(42,157,143,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
                    }}
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(42,157,143,0.5), rgba(82,183,136,0.35), transparent)' }}
                    />
                    <h2 className="text-lg font-bold mb-5" style={{ color: '#1e3a35' }}>Hesabınıza Giriş Yapın</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8aada8' }}>
                                E-posta Adresi
                            </label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#a8c5c1' }} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className="input pl-10" placeholder="ornek@losev.org"
                                    required id="login-email" autoComplete="email" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8aada8' }}>Şifre</label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#a8c5c1' }} />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    className="input pl-10 pr-11" placeholder="••••••••"
                                    required id="login-password" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#a8c5c1' }}>
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl p-3"
                                style={{ background: 'rgba(196,100,90,0.07)', border: '1px solid rgba(196,100,90,0.2)' }}>
                                <AlertCircle size={15} style={{ color: '#b85555' }} className="flex-shrink-0" />
                                <span className="text-sm" style={{ color: '#b85555' }}>{error}</span>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1 text-base" id="login-submit">
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Doğrulanıyor...</>
                            ) : 'Giriş Yap →'}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: 'rgba(42,157,143,0.1)' }} />
                        <span className="text-xs font-mono" style={{ color: '#a8c5c1' }}>TEST GİRİŞİ</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(42,157,143,0.1)' }} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {quickButtons.map(qb => (
                            <button key={qb.key} type="button" onClick={() => quickLogin(qb.key)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all hover:scale-[1.03] active:scale-[0.97]"
                                style={{ background: qb.bg, borderColor: qb.border, color: qb.color }}>
                                <span className="text-base leading-none">{qb.emoji}</span>
                                <span className="text-xs font-bold">{qb.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-center text-xs mt-6 font-medium" style={{ color: '#a8c5c1' }}>
                    © {new Date().getFullYear()} LÖSEV — Lösemili Çocuklar Vakfı
                </p>
            </div>
        </div>
    );
}
