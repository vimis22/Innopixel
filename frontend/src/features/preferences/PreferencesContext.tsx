import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/*
 * Personal UI preferences, stored per user in this browser. They only affect the interface;
 * nothing here is sent anywhere (e-mail notifications would need a backend).
 */

export interface NotificationPreferences {
    taskAssigned: boolean;
    deadlines: boolean;
    milestones: boolean;
    weekly: boolean;
}

export interface Preferences {
    sidebarCollapsed: boolean;
    notifications: NotificationPreferences;
}

const DEFAULTS: Preferences = {
    sidebarCollapsed: false,
    notifications: { taskAssigned: true, deadlines: true, milestones: true, weekly: false },
};

const storageKey = (userId: string) => `innopixel.preferences.${userId}`;

function load(userId: string): Preferences {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "null") as Partial<Preferences> | null;
        return { ...DEFAULTS, ...saved, notifications: { ...DEFAULTS.notifications, ...saved?.notifications } };
    } catch {
        return DEFAULTS;
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
