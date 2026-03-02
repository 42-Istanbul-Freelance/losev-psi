'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

export default function HomePage() {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading) {
			if (!user) router.push('/login');
			else if (user.role === 'admin') router.push('/admin');
			else if (user.role === 'psychologist') router.push('/psychologist');
			else router.push('/member');
		}
	}, [user, loading, router]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
					style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
					<Heart size={24} className="text-white" />
				</div>
				<div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
			</div>
		</div>
	);
}
