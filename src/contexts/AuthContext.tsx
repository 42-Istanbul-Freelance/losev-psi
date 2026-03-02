'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    subRole: string | null;
    familyGroupId: number | null;
    age: number | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const stored = localStorage.getItem('losev_token');
        const storedUser = localStorage.getItem('losev_user');
        if (stored && storedUser) {
            setToken(stored);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Giriş başarısız');

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('losev_token', data.token);
        localStorage.setItem('losev_user', JSON.stringify(data.user));
    }, []);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setToken(null);
        setUser(null);
        localStorage.removeItem('losev_token');
        localStorage.removeItem('losev_user');
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
