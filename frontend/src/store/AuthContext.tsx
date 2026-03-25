import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type UserInfo } from '../api/auth';

interface AuthContextType {
    user: UserInfo | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (window.location.pathname === '/login') {
            setIsLoading(false);
            return;
        }

        authApi.csrf()
            .then(() => authApi.me())
            .then(setUser)
            .catch(() => {
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        await authApi.csrf();
        const userInfo = await authApi.login({ email, password });
        setUser(userInfo);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // ignore logout errors
        }
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
