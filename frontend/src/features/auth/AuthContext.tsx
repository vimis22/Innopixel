import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "../../types/domain";
import { authService } from "../../config/auth";
import api, { apiStatus } from "../../services/api";

interface AuthContextValue {
    user: User | null;
    initializing: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Restore a previous session on page load (the server checks the login cookie)
    useEffect(() => {
        let cancelled = false;
        authService.restore()
            .then((session) => {
                if (!cancelled) setUser(session?.user ?? null);
            })
            .catch(() => {
                if (!cancelled) setUser(null);
            })
            .finally(() => {
                if (!cancelled) setInitializing(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // When the session expires (or the account is deactivated) every API call answers 401:
    // drop the user, so RequireAuth sends them back to the login page.
    useEffect(() => {
        const interceptor = api.interceptors.response.use(undefined, (error: unknown) => {
            if (apiStatus(error) === 401) setUser(null);
            return Promise.reject(error);
        });
        return () => api.interceptors.response.eject(interceptor);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const session = await authService.login(email, password);
        setUser(session.user);
        return session.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } finally {
            setUser(null);
        }
    }, []);

    const changePassword = useCallback(
        (currentPassword: string, newPassword: string) => authService.changePassword(currentPassword, newPassword),
        [],
    );

    const value = useMemo(
        () => ({ user, initializing, login, logout, changePassword }),
        [user, initializing, login, logout, changePassword],
    );

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
