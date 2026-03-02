'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, Calendar, MessageSquare,
    BookOpen, Shield, LogOut, Heart, Star,
    AlertTriangle, FileText, Home, Zap, X
} from 'lucide-react';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
    { href: '/admin', label: 'Genel Bakış', icon: <LayoutDashboard size={16} /> },
    { href: '/admin/families', label: 'Aile Grupları', icon: <Users size={16} /> },
    { href: '/admin/psychologists', label: 'Psikologlar', icon: <Shield size={16} /> },
    { href: '/admin/resources', label: 'Kaynak Kütüphanesi', icon: <BookOpen size={16} /> },
    { href: '/admin/assign', label: 'Psikolog Ata', icon: <Zap size={16} /> },
];
const psychologistNav: NavItem[] = [
    { href: '/psychologist', label: 'Ana Panel', icon: <LayoutDashboard size={16} /> },
    { href: '/psychologist/appointments', label: 'Randevular', icon: <Calendar size={16} /> },
    { href: '/psychologist/notes', label: 'Seans Notları', icon: <FileText size={16} /> },
    { href: '/psychologist/alerts', label: 'Zor Gün Alertleri', icon: <AlertTriangle size={16} /> },
];
const memberNav: NavItem[] = [
    { href: '/member', label: 'Anasayfa', icon: <Home size={16} /> },
    { href: '/member/chat', label: 'Psikologumla Sohbet', icon: <MessageSquare size={16} /> },
    { href: '/member/appointments', label: 'Randevularım', icon: <Calendar size={16} /> },
    { href: '/member/resources', label: 'Kaynaklarım', icon: <BookOpen size={16} /> },
    { href: '/member/hero', label: 'Kahraman Yolculuğum', icon: <Star size={16} /> },
];

const roleConfig: Record<string, { color: string; label: string; gradient: string; light: string }> = {
    admin: { color: '#c4645a', label: 'Admin', gradient: 'linear-gradient(135deg,#c4645a,#d4786e)', light: 'rgba(196,100,90,0.09)' },
    psychologist: { color: '#2a9d8f', label: 'Psikolog', gradient: 'linear-gradient(135deg,#2a9d8f,#38b2a5)', light: 'rgba(42,157,143,0.09)' },
    patient: { color: '#52b788', label: 'Hasta', gradient: 'linear-gradient(135deg,#52b788,#3a9a6a)', light: 'rgba(82,183,136,0.09)' },
    family_member: { color: '#d08080', label: 'Aile Üyesi', gradient: 'linear-gradient(135deg,#d08080,#e09090)', light: 'rgba(208,128,128,0.09)' },
};
const subRoleLabels: Record<string, string> = { mother: 'Anne', father: 'Baba', sibling: 'Kardeş', other: 'Diğer' };

interface SidebarProps { onClose?: () => void; }

export default function Sidebar({ onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    if (!user) return null;

    const navItems = user.role === 'admin' ? adminNav
        : user.role === 'psychologist' ? psychologistNav
            : memberNav;

    const rc = roleConfig[user.role] || roleConfig.psychologist;

    const handleNavClick = () => { if (onClose) onClose(); };

    return (
        <aside
            className="sidebar"
            style={{
                background: '#ffffff',
                borderRight: '1px solid rgba(42,157,143,0.1)',
                boxShadow: '3px 0 20px rgba(42,157,143,0.05)',
            }}
        >
            {/* Mobile close button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center z-50"
                    style={{ background: 'rgba(42,157,143,0.08)', color: '#6b9994' }}
                >
                    <X size={16} />
                </button>
            )}

            {/* Logo */}
            <div className="mb-7 px-1 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#2a9d8f,#38b2a5)', boxShadow: '0 3px 10px rgba(42,157,143,0.25)' }}
                    >
                        <Heart size={16} className="text-white relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-bold text-base tracking-tight" style={{ color: '#1e3a35' }}>LÖSEV</span>
                            <span className="font-black text-base" style={{ background: 'linear-gradient(135deg,#2a9d8f,#52b788)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PSİ</span>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#8aada8', marginTop: '1px' }}>
                            psych · support
                        </p>
                    </div>
                </div>
            </div>

            {/* User card */}
            <div
                className="mb-6 p-3 rounded-2xl relative z-10"
                style={{ background: rc.light, border: `1px solid ${rc.color}25` }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0 relative overflow-hidden"
                        style={{ background: rc.gradient, boxShadow: `0 3px 10px ${rc.color}30` }}
                    >
                        {user.name.charAt(0)}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate" style={{ color: '#1e3a35' }}>{user.name}</p>
                        <p className="text-xs font-semibold truncate mt-0.5" style={{ color: rc.color }}>
                            {rc.label}{user.subRole && ` · ${subRoleLabels[user.subRole] || user.subRole}`}
                        </p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#52b788', boxShadow: '0 0 6px rgba(82,183,136,0.5)' }} />
                </div>
            </div>

            {/* Nav */}
            <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-2 z-10 relative" style={{ color: '#a8c5c1' }}>
                Navigasyon
            </p>
            <nav className="flex-1 space-y-0.5 relative z-10">
                {navItems.map(item => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href) &&
                            item.href.split('/').length >= pathname.split('/').length - 1);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={handleNavClick}
                        >
                            <span style={{ color: isActive ? '#2a9d8f' : '#a8c5c1' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="mt-6 pt-4 relative z-10" style={{ borderTop: '1px solid rgba(42,157,143,0.1)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: '#a8c5c1' }}>Hesap</p>
                <button
                    onClick={async () => { await logout(); router.push('/login'); }}
                    className="nav-item w-full text-left group"
                >
                    <LogOut size={16} style={{ color: '#a8c5c1' }} className="group-hover:text-red-400 transition-colors" />
                    <span className="group-hover:text-red-500 transition-colors">Çıkış Yap</span>
                </button>
            </div>
            <p className="text-[9px] text-center mt-4 font-mono relative z-10" style={{ color: '#c5dad8' }}>
                LÖSEV © {new Date().getFullYear()}
            </p>
        </aside>
    );
}
