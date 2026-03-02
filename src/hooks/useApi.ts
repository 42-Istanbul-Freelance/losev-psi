'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

/**
 * Authenticated fetch helper — automatically includes JWT token
 */
export function useApi() {
    const { token } = useAuth();

    const apiFetch = useCallback(
        async (url: string, options: RequestInit = {}) => {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(options.headers as Record<string, string> || {}),
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch(url, { ...options, headers });
            return res;
        },
        [token]
    );

    return { apiFetch };
}
