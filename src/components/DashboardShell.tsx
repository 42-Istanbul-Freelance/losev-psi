'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import LosevLogo from './LosevLogo';
import OnboardingModal from './OnboardingModal';

interface DashboardShellProps {
    children: React.ReactNode;
    requiredRole?: string | string[];
}

export default function DashboardShell({ children, requiredRole }: DashboardShellProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (!loading && user && requiredRole) {
            const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            if (!roles.includes(user.role)) {
                if (user.role === 'admin') router.push('/admin');
                else if (user.role === 'psychologist') router.push('/psychologist');
                else router.push('/member');
            }
        }
    }, [user, loading, requiredRole, router]);

    // Close sidebar on route change
    useEffect(() => { setSidebarOpen(false); }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F5FB' }}>
                <div className="text-center">
                    <div
                        className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                        style={{ borderColor: 'rgba(58,127,213,0.25)', borderTopColor: '#3A7FD5' }}
                    />
                    <p className="text-sm font-medium" style={{ color: '#8097B8' }}>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;
    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) return null;
    }

    return (
        <div className="flex min-h-screen" style={{ background: '#F2F5FB' }}>

            {/* ── Mobile overlay ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ background: 'rgba(10,20,40,0.45)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/*
             * ── Sidebar wrapper ──
             *
             * MOBILE  : fixed overlay (translate-x trick)
             * DESKTOP : sticky column in normal flex flow — NO double-fixed issue
             *
             * The .sidebar CSS class must NOT have position:fixed anymore.
             * It fills this wrapper via height:100%.
             */}
            <div
                className={[
                    /* mobile: fixed overlay */
                    'fixed left-0 top-0 bottom-0 z-40',
                    'transform transition-transform duration-300 ease-in-out',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    /* desktop: reset to normal sticky column */
                    'lg:translate-x-0 lg:relative lg:z-auto lg:flex-shrink-0',
                    'lg:sticky lg:top-0 lg:h-screen',
                ].join(' ')}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* ── Main content ── */}
            <main className="flex-1 min-h-screen" style={{ background: '#F2F5FB' }}>

                {/* Mobile top bar */}
                <div
                    className="lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
                    style={{
                        background: 'rgba(255,255,255,0.96)',
                        borderColor: 'rgba(58,127,213,0.10)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: 'rgba(58,127,213,0.08)', color: '#3A7FD5' }}
                        aria-label="Menüyü aç"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#1A2B4A,#3A7FD5)' }}
                        >
                            <LosevLogo size={18} />
                        </div>
                        <span className="font-black text-sm">
                            <span style={{ color: '#E30613' }}>LÖ</span><span style={{ color: '#1A2B4A' }}>SEV</span>
                            <span style={{
                                background: 'linear-gradient(135deg,#3A7FD5,#5295E8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}> PSİ</span>
                        </span>
                    </div>
                    <div className="w-9" />
                </div>

                <div className="p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>

        </div>
    );
}
