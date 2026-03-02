'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Rocket } from 'lucide-react';
import Image from 'next/image';

/* ------------------------------------------------------------------ */
/*  Card data                                                          */
/* ------------------------------------------------------------------ */

interface CardData {
    id: number;
    title: string;
    image: string;
    content: React.ReactNode;
}

const FeatureRow = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
    <div className="flex items-start gap-3 py-2">
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{icon}</span>
        <div>
            <p className="font-bold text-sm" style={{ color: '#1A2B4A' }}>{title}</p>
            <p className="text-xs leading-relaxed" style={{ color: '#3D5475' }}>{desc}</p>
        </div>
    </div>
);

const RoleBox = ({ icon, label, desc, color }: { icon: string; label: string; desc: string; color: string }) => (
    <div className="flex-1 flex flex-col items-center text-center p-3 rounded-2xl border"
        style={{ background: `${color}08`, borderColor: `${color}20` }}>
        <span className="text-3xl mb-2">{icon}</span>
        <p className="font-bold text-sm" style={{ color }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#3D5475' }}>{desc}</p>
    </div>
);

function buildCards(): CardData[] {
    return [
        {
            id: 1,
            title: "LÖSEV PSİ'ye Hoşgeldiniz",
            image: '/onboarding/welcome.png',
            content: (
                <div>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: '#3D5475' }}>
                        Bu platform; kanser tanısı almış bireyler ve aileleri ile psikologları bir araya getiren,
                        her bireyin psikolojik iyilik halini desteklemek için tasarlanmış güvenli bir destek alanıdır.
                    </p>
                    <div className="flex gap-3">
                        <RoleBox icon="🧒" label="Hasta" desc="Tedavi sürecindeki birey" color="#4DAA82" />
                        <RoleBox icon="👨‍👩‍👧" label="Hasta Yakını" desc="Anne, baba, kardeş veya diğer aile bireyleri" color="#E8705A" />
                        <RoleBox icon="🧠" label="Psikolog" desc="Aileye atanmış destek uzmanı" color="#3A7FD5" />
                    </div>
                </div>
            ),
        },
        {
            id: 2,
            title: 'Sen ve Ailen İçin Neler Var?',
            image: '/onboarding/features.png',
            content: (
                <div className="space-y-1">
                    <FeatureRow icon="🆘" title="Zor Bir Gün Geçiriyorum" desc="Kötü hissettiğinde tek tıkla psikoloğuna anında bildirim gönder." />
                    <FeatureRow icon="💬" title="İstediğin Zaman Sohbet Et" desc="Psikoloğunla zaman fark etmeksizin mesajlaş, duygunu durum mesajıyla paylaş." />
                    <FeatureRow icon="📅" title="Randevularını Takip Et" desc="Yaklaşan ve geçmiş seanslarını kolayca görüntüle." />
                    <FeatureRow icon="🎥" title="Çevrimiçi Seans" desc="Psikoloğunla platform üzerinden canlı görüşme yap." />
                </div>
            ),
        },
        {
            id: 3,
            title: 'Gelişimini Takip Et',
            image: '/onboarding/progress.png',
            content: (
                <div className="space-y-1">
                    <FeatureRow icon="🎓" title="Sana Özel Eğitimler" desc="Psikoloğun tarafından seçilmiş videolar ve etkinliklerle kendini geliştir." />
                    <FeatureRow icon="🏆" title="Kahraman Yolculuğu" desc="Her seans, eğitim ve aktiviteden puan kazan; Tomurcuk'tan Efsane'ye yüksel." />
                    <FeatureRow icon="👁️" title="Aile Durumu Takibi" desc="Aile bireylerinin genel iyilik durumu kolayca izlenebilir, kimse gözden kaçmaz." />
                </div>
            ),
        },
        {
            id: 4,
            title: 'Psikolog Olarak Neler Yapabilirsin?',
            image: '/onboarding/psychologist.png',
            content: (
                <div className="space-y-1">
                    <FeatureRow icon="👨‍👩‍👧" title="Aile Grubunu Yönet" desc="Sana atanan ailenin her bireyini ayrı ayrı takip et." />
                    <FeatureRow icon="📝" title="Randevu Oluştur" desc="Hasta veya aile bireyine özel seans randevusu belirle." />
                    <FeatureRow icon="🗒️" title="Seans Notları Al" desc="Her görüşme sonrası not ekle; psikolog değişse bile hafıza kaybolmaz." />
                    <FeatureRow icon="📚" title="İçerik Ata" desc="Kaynak kütüphanesinden bireye uygun video ve etkinlikleri seç, ata." />
                    <FeatureRow icon="🚨" title="Zor Gün Uyarılarını Gör" desc="Aile bireylerinin gönderdiği zor gün bildirimlerini anında takip et." />
                    <FeatureRow icon="⭐" title="Puan Ver" desc="Gösterilen cesaret ve ilerleme için manuel puan ekle, motivasyonu artır." />
                </div>
            ),
        },
        {
            id: 5,
            title: 'Her Şey Hazır 🎉',
            image: '/onboarding/ready.png',
            content: (
                <div className="text-center py-4">
                    <p className="text-sm leading-relaxed" style={{ color: '#3D5475' }}>
                        LÖSEV PSİ; hastalar, aileler ve psikologlar için güvenli, kişisel ve anlık bir destek köprüsüdür.
                        Paneline geçerek kullanmaya başlayabilirsin.
                    </p>
                </div>
            ),
        },
    ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface OnboardingModalProps {
    role: string;
}

const STORAGE_KEY = 'losev_onboarding_vFinal_2';

export default function OnboardingModal({ role }: OnboardingModalProps) {
    const [visible, setVisible] = useState(false);
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const [animating, setAnimating] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Build role-specific card list
    const allCards = buildCards();
    const cards = role === 'psychologist'
        ? allCards.filter(c => [1, 4, 5].includes(c.id))
        : allCards.filter(c => [1, 2, 3, 5].includes(c.id));

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) setVisible(true);
    }, []);

    // Lock body scroll
    useEffect(() => {
        if (visible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [visible]);

    const close = useCallback(() => {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
        setVisible(false);
    }, [dontShowAgain]);

    const goTo = useCallback((idx: number, dir: 'left' | 'right') => {
        if (animating || idx < 0 || idx >= cards.length) return;
        setDirection(dir);
        setAnimating(true);
        setTimeout(() => {
            setCurrent(idx);
            setAnimating(false);
        }, 250);
    }, [animating, cards.length]);

    const prev = () => goTo(current - 1, 'left');
    const next = () => goTo(current + 1, 'right');

    if (!visible) return null;

    const card = cards[current];
    const isLast = current === cards.length - 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(6px)' }}>

            {/* Modal container */}
            <div
                className="relative w-full max-w-lg rounded-3xl overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.98)',
                    border: '1.5px solid rgba(58,127,213,0.14)',
                    boxShadow: '0 32px 80px rgba(26,43,74,0.22), 0 8px 24px rgba(58,127,213,0.12)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={close}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(26,43,74,0.06)', color: '#3D5475' }}
                    aria-label="Kapat"
                >
                    <X size={16} />
                </button>

                {/* Card content with slide animation */}
                <div className="overflow-hidden">
                    <div
                        className="transition-all duration-300 ease-in-out"
                        style={{
                            opacity: animating ? 0 : 1,
                            transform: animating
                                ? `translateX(${direction === 'right' ? '-30px' : '30px'})`
                                : 'translateX(0)',
                        }}
                    >
                        {/* Image */}
                        <div className="flex justify-center pt-6 pb-2 px-6">
                            <div className="relative w-44 h-44 rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(58,127,213,0.04)' }}>
                                <Image
                                    src={card.image}
                                    alt={card.title}
                                    fill
                                    className="object-contain p-2"
                                    sizes="176px"
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-black text-center px-6 mt-2" style={{ color: '#1A2B4A' }}>
                            {card.title}
                        </h2>

                        {/* Content */}
                        <div className="px-6 pt-3 pb-4 max-h-[40vh] overflow-y-auto">
                            {card.content}
                        </div>
                    </div>
                </div>

                {/* Bottom bar: checkbox + arrows + dots + CTA */}
                <div className="px-6 py-3 border-t flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="peer appearance-none w-5 h-5 rounded-md border-2 transition-all cursor-pointer"
                                    style={{
                                        borderColor: 'rgba(58,127,213,0.3)',
                                        background: dontShowAgain ? '#3A7FD5' : 'transparent',
                                    }}
                                />
                                {dontShowAgain && (
                                    <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm font-bold select-none" style={{ color: '#1A2B4A' }}>Bir daha gösterme</span>
                        </label>
                        <p className="text-[10px] ml-7 -mt-1" style={{ color: '#8097B8' }}>Bu kutucuğu işaretleyip kapatırsanız bilgilendirme ekranı bir daha açılmayacaktır.</p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        {/* Left arrow */}
                        <button
                            onClick={prev}
                            disabled={current === 0}
                            className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all disabled:opacity-20"
                            style={{
                                background: current === 0 ? 'transparent' : 'rgba(58,127,213,0.06)',
                                borderColor: 'rgba(58,127,213,0.15)',
                                color: '#3A7FD5',
                            }}
                            aria-label="Önceki"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {/* Dots */}
                        <div className="flex items-center gap-2">
                            {cards.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i, i > current ? 'right' : 'left')}
                                    className="transition-all duration-300"
                                    style={{
                                        width: i === current ? 24 : 8,
                                        height: 8,
                                        borderRadius: 99,
                                        background: i === current
                                            ? 'linear-gradient(135deg,#3A7FD5,#5295E8)'
                                            : 'rgba(58,127,213,0.18)',
                                    }}
                                    aria-label={`Kart ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Right arrow / CTA */}
                        {isLast ? (
                            <button
                                onClick={close}
                                className="h-10 px-5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg,#3A7FD5,#5295E8)',
                                    boxShadow: '0 4px 16px rgba(58,127,213,0.35)',
                                }}
                            >
                                <Rocket size={15} />
                                Hadi Başlayalım
                            </button>
                        ) : (
                            <button
                                onClick={next}
                                className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:scale-105"
                                style={{
                                    background: 'rgba(58,127,213,0.06)',
                                    borderColor: 'rgba(58,127,213,0.15)',
                                    color: '#3A7FD5',
                                }}
                                aria-label="Sonraki"
                            >
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
