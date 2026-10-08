import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "../../types/domain";
import { authService } from "../../config/auth";

interface AuthContextValue {
    user: User | null;
    initializing: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Restore a previous session on page load
    useEffect(() => {
        let cancelled = false;
        authService.restore()
            .then((session) => {
                if (!cancelled) setUser(session?.user ?? null);
            })
            .finally(() => {
                if (!cancelled) setInitializing(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const session = await authService.login(email, password);
        setUser(session.user);
        return session.user;
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
    }, []);

    const value = useMemo(() => ({ user, initializing, login, logout }), [user, initializing, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return context;
}
