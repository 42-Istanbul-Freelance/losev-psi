/**
 * LÖSEV Logo Component
 * Simplified version of the LÖSEV (Lösemili Çocuklar Vakfı) logo
 * A stylized house/child figure representing protection and care
 */

interface LosevLogoProps {
    size?: number;
    className?: string;
}

export default function LosevLogo({ size = 24, className = '' }: LosevLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* House/roof shape - the protective shelter */}
            <path
                d="M32 6L8 28H16V52H48V28H56L32 6Z"
                fill="#E30613"
                stroke="#E30613"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            {/* Child figure inside the house */}
            {/* Head */}
            <circle cx="32" cy="30" r="5" fill="white" />
            {/* Body */}
            <path
                d="M32 35V46"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
            />
            {/* Arms */}
            <path
                d="M25 40L32 38L39 40"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
