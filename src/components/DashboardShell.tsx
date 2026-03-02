'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

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

    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: '#f3f8f7' }}>
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                        style={{ borderColor: 'rgba(42,157,143,0.3)', borderTopColor: '#2a9d8f' }} />
                    <p className="text-sm font-medium" style={{ color: '#6b9994' }}>Yükleniyor...</p>
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
        <div className="flex min-h-screen" style={{ background: '#f3f8f7' }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ background: 'rgba(30,58,53,0.3)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — hidden on mobile unless toggled */}
            <div className={`
        fixed left-0 top-0 bottom-0 z-40
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <main className="flex-1 min-h-screen lg:ml-0"
                style={{ background: '#f3f8f7' }}>

                {/* Mobile top bar */}
                <div
                    className="lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        borderColor: 'rgba(42,157,143,0.12)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: 'rgba(42,157,143,0.08)', color: '#2a9d8f' }}
                        aria-label="Menüyü aç"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#2a9d8f,#38b2a5)' }}>
                            <span className="text-white text-xs">❤</span>
                        </div>
                        <span className="font-black text-sm">
                            <span style={{ color: '#1e3a35' }}>LÖSEV</span>
                            <span style={{ background: 'linear-gradient(135deg,#2a9d8f,#52b788)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> PSİ</span>
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
