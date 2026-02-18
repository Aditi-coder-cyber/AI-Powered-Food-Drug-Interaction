import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isGuest: boolean;
    riskProfile: {
        age: string;
        conditions: string[];
        allergies: string[];
    } | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (name: string, email: string, password: string) => Promise<boolean>;
    loginAsGuest: () => void;
    logout: () => void;
    clearError: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Auto-load user on mount if token exists
    useEffect(() => {
        const loadUser = async () => {
            const token = api.getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await api.getMe();
            if (res.success && res.data) {
                setUser({
                    ...res.data.user,
                    isGuest: false,
                });
            } else {
                // Token is invalid or expired
                api.logout();
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const refreshUser = useCallback(async () => {
        const res = await api.getMe();
        if (res.success && res.data) {
            setUser({
                ...res.data.user,
                isGuest: false,
            });
        }
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setError(null);
        const res = await api.login(email, password);

        if (res.success && res.data) {
            setUser({
                ...res.data.user,
                isGuest: false,
            });
            return true;
        }

        setError(res.error?.message || 'Login failed');
        return false;
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
        setError(null);
        const res = await api.register(name, email, password);

        if (res.success && res.data) {
            setUser({
                ...res.data.user,
                isGuest: false,
            });
            return true;
        }

        setError(res.error?.message || 'Signup failed');
        return false;
    }, []);

    const loginAsGuest = useCallback(() => {
        setUser({
            id: 'guest',
            name: 'Guest',
            email: '',
            role: 'user',
            isGuest: true,
            riskProfile: null,
        });
    }, []);

    const logout = useCallback(() => {
        api.logout();
        setUser(null);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                signup,
                loginAsGuest,
                logout,
                clearError,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
