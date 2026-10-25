import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_PREFERENCES, sanitizePreferences, type Preferences } from "./preferences";

export type { NotificationPreferences, Preferences } from "./preferences";

/*
 * Personal UI preferences, stored per user in this browser. They only affect the interface;
 * nothing here is sent anywhere (e-mail notifications would need a backend).
 */

const storageKey = (userId: string) => `innopixel.preferences.${userId}`;

function load(userId: string): Preferences {
    try {
        return sanitizePreferences(JSON.parse(localStorage.getItem(storageKey(userId)) ?? "null") as Partial<Preferences> | null);
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

interface PreferencesContextValue {
    preferences: Preferences;
    update: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ userId, children }: { userId: string; children: ReactNode }) {
    const [preferences, setPreferences] = useState<Preferences>(() => load(userId));

    const update = useCallback((patch: Partial<Preferences>) => {
        setPreferences((current) => {
            const next = { ...current, ...patch, notifications: { ...current.notifications, ...patch.notifications } };
            localStorage.setItem(storageKey(userId), JSON.stringify(next));
            return next;
        });
    }, [userId]);

    const value = useMemo(() => ({ preferences, update }), [preferences, update]);
    return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error("usePreferences must be used inside <PreferencesProvider>");
    }
    return context;
}
