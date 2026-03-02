'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { MessageSquare, Calendar, BookOpen, Star, FileText } from 'lucide-react';

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
    sub_role: string | null;
    age: number | null;
}

interface Family {
    id: number;
    name: string;
    psychologist_name: string | null;
    member_count: number;
    members: Member[];
    created_at: string;
}

const subRoleLabels: Record<string, string> = {
    mother: 'Anne', father: 'Baba', sibling: 'Kardeş', other: 'Diğer'
};

export default function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { apiFetch } = useApi();
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/admin/families')
            .then(r => r.json())
            .then(data => {
                const f = (data.families || []).find((fam: Family) => fam.id === parseInt(id));
                setFamily(f || null);
                setLoading(false);
            });
    }, [id]);

    if (loading) return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-pulse space-y-4">
                <div className="h-12 rounded-xl" style={{ background: 'rgba(58,127,213,0.06)' }} />
                <div className="h-48 rounded-xl" style={{ background: 'rgba(58,127,213,0.06)' }} />
            </div>
        </DashboardShell>
    );

    if (!family) return (
        <DashboardShell requiredRole="psychologist">
            <div className="card p-12 text-center">
                <p style={{ color: '#3D5475' }}>Aile grubu bulunamadı</p>
                <Link href="/psychologist" className="btn-primary mt-4 inline-flex">Geri Dön</Link>
            </div>
        </DashboardShell>
    );

    return (
        <DashboardShell requiredRole="psychologist">
            <div className="animate-fade-in">
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#8097B8' }}>
                        <Link href="/psychologist" className="hover:underline" style={{ color: '#3A7FD5' }}>Ana Panel</Link>
                        <span>›</span>
                        <span style={{ color: '#1A2B4A' }}>{family.name}</span>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{family.name}</h1>
                    <p className="text-sm mt-1" style={{ color: '#3D5475' }}>{family.member_count} üye</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {family.members.map(member => (
                        <div key={member.id} className="card p-6">
                            {/* Member avatar */}
                            <div className="flex items-center gap-3 mb-5">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                                    style={{
                                        background: member.role === 'patient' ? 'rgba(77,170,130,0.12)' : 'rgba(232,112,90,0.12)',
                                        border: `1px solid ${member.role === 'patient' ? 'rgba(77,170,130,0.3)' : 'rgba(232,112,90,0.3)'}`,
                                        color: member.role === 'patient' ? '#28785A' : '#B84830'
                                    }}
                                >
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{member.name}</h3>
                                    <p className="text-xs mt-0.5" style={{ color: '#3D5475' }}>
                                        {member.role === 'patient' ? '🟢 Hasta' :
                                            `💗 ${subRoleLabels[member.sub_role || ''] || 'Aile Üyesi'}`}
                                        {member.age ? ` · ${member.age} yaş` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Quick links */}
                            <div className="space-y-2">
                                <Link
                                    href={`/psychologist/family/${id}/member/${member.id}`}
                                    className="flex items-center gap-2 p-2.5 rounded-lg border transition-all text-sm"
                                    style={{ background: 'rgba(247,252,251,0.8)', borderColor: 'rgba(58,127,213,0.10)', color: '#3D5475' }}
                                >
                                    <MessageSquare size={14} style={{ color: '#3A7FD5' }} />
                                    Sohbet
                                </Link>
                                <Link
                                    href={`/psychologist/appointments?memberId=${member.id}`}
                                    className="flex items-center gap-2 p-2.5 rounded-lg border transition-all text-sm"
                                    style={{ background: 'rgba(247,252,251,0.8)', borderColor: 'rgba(58,127,213,0.10)', color: '#3D5475' }}
                                >
                                    <Calendar size={14} style={{ color: '#4DAA82' }} />
                                    Randevular
                                </Link>
                                <Link
                                    href={`/psychologist/family/${id}/member/${member.id}#resources`}
                                    className="flex items-center gap-2 p-2.5 rounded-lg border transition-all text-sm"
                                    style={{ background: 'rgba(247,252,251,0.8)', borderColor: 'rgba(58,127,213,0.10)', color: '#3D5475' }}
                                >
                                    <BookOpen size={14} style={{ color: '#F0B94A' }} />
                                    Kaynaklar
                                </Link>
                                <Link
                                    href={`/psychologist/family/${id}/member/${member.id}#hero`}
                                    className="flex items-center gap-2 p-2.5 rounded-lg border transition-all text-sm"
                                    style={{ background: 'rgba(247,252,251,0.8)', borderColor: 'rgba(58,127,213,0.10)', color: '#3D5475' }}
                                >
                                    <Star size={14} style={{ color: '#F0B94A' }} />
                                    Kahraman Yolculuğu
                                </Link>
                            </div>

                            <Link
                                href={`/psychologist/family/${id}/member/${member.id}`}
                                className="btn-primary w-full mt-4 py-2 text-sm"
                            >
                                Profili Görüntüle →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardShell>
    );
}
