import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SessionUser } from "../../types/domain";
import { authService } from "../../config/auth";
import api, { apiErrorBody, apiStatus } from "../../services/api";

interface AuthContextValue {
    user: SessionUser | null;
    initializing: boolean;
    login: (email: string, password: string) => Promise<SessionUser>;
    logout: () => Promise<void>;
    // The server ends every other session; this one continues (and a required change is fulfilled)
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
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

    // When the session ends (expired, account deactivated, or the password changed on another device) every
    // API call answers 401: drop the user, so RequireAuth sends them back to the login page.
    // 403 PASSWORD_CHANGE_REQUIRED (e.g. an administrator set a temporary password meanwhile) shows the
    // "Vælg ny adgangskode" screen.
    useEffect(() => {
        const interceptor = api.interceptors.response.use(undefined, (error: unknown) => {
            if (apiStatus(error) === 401) setUser(null);
            if (apiStatus(error) === 403 && apiErrorBody(error)?.code === "PASSWORD_CHANGE_REQUIRED") {
                setUser((current) => (current ? { ...current, mustChangePassword: true } : current));
            }
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

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        setUser(await authService.changePassword(currentPassword, newPassword));
    }, []);

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
