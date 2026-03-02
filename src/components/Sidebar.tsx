'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, Calendar, MessageSquare,
    BookOpen, Shield, LogOut, Star,
    AlertTriangle, FileText, Home, Zap, X
} from 'lucide-react';
import LosevLogo from './LosevLogo';

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
    { href: '/psychologist/chat', label: 'Sohbet', icon: <MessageSquare size={16} /> },
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

const roleConfig: Record<string, { color: string; label: string; gradient: string; light: string; border: string }> = {
    admin: { color: '#F0B94A', label: 'Admin', gradient: 'linear-gradient(135deg,#C89030,#F0B94A)', light: 'rgba(240,185,74,0.12)', border: 'rgba(240,185,74,0.30)' },
    psychologist: { color: '#5295E8', label: 'Psikolog', gradient: 'linear-gradient(135deg,#3A7FD5,#5295E8)', light: 'rgba(58,127,213,0.14)', border: 'rgba(58,127,213,0.35)' },
    patient: { color: '#5DC49A', label: 'Hasta', gradient: 'linear-gradient(135deg,#4DAA82,#5DC49A)', light: 'rgba(77,170,130,0.14)', border: 'rgba(77,170,130,0.35)' },
    family_member: { color: '#E8705A', label: 'Aile Üyesi', gradient: 'linear-gradient(135deg,#E8705A,#F08870)', light: 'rgba(232,112,90,0.14)', border: 'rgba(232,112,90,0.35)' },
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

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <aside
            className="sidebar"
            style={{ position: 'relative' }}   /* override any stray CSS */
        >
            {/* Mobile close button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center z-50"
                    style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(180,200,230,0.80)' }}
                >
                    <X size={16} />
                </button>
            )}

            {/* ── Logo ── */}
            <div className="mb-8 px-1 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg,#3A7FD5,#5295E8)',
                            boxShadow: '0 3px 12px rgba(58,127,213,0.40)',
                        }}
                    >
                        <LosevLogo size={20} className="relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-bold text-base tracking-tight"><span style={{ color: '#E30613' }}>LÖ</span><span className="text-white">SEV</span></span>
                            <span
                                className="font-black text-base"
                                style={{
                                    background: 'linear-gradient(135deg,#5295E8,#5DC49A)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >PSİ</span>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest mt-px"
                            style={{ color: 'rgba(130,160,210,0.65)' }}>
                            psych · support
                        </p>
                    </div>
                </div>
            </div>

            {/* ── User card ── */}
            <div
                className="mb-6 p-3 rounded-2xl relative z-10"
                style={{
                    background: rc.light,
                    border: `1px solid ${rc.border}`,
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0 relative overflow-hidden"
                        style={{
                            background: rc.gradient,
                            boxShadow: `0 3px 10px ${rc.color}40`,
                        }}
                    >
                        {user.name.charAt(0)}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate text-white">{user.name}</p>
                        <p className="text-xs font-semibold truncate mt-0.5" style={{ color: rc.color }}>
                            {rc.label}{user.subRole && ` · ${subRoleLabels[user.subRole] || user.subRole}`}
                        </p>
                    </div>
                    {/* Online dot */}
                    <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#5DC49A', boxShadow: '0 0 6px rgba(77,170,130,0.6)' }}
                    />
                </div>
            </div>

            {/* ── Navigation ── */}
            <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-2 z-10 relative"
                style={{ color: 'rgba(130,160,210,0.50)' }}>
                Navigasyon
            </p>
            <nav className="flex-1 space-y-0.5 relative z-10">
                {navItems.map(item => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/' &&
                            pathname.startsWith(item.href) &&
                            item.href.split('/').length >= pathname.split('/').length - 1);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span style={{ opacity: isActive ? 1 : 0.70 }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* ── Footer / Logout ── */}
            <div className="mt-4 pt-4 relative z-10"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                    onClick={handleLogout}
                    className="nav-item w-full"
                    style={{ color: 'rgba(232,112,90,0.75)' }}
                >
                    <LogOut size={16} />
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </aside>
    );
}
