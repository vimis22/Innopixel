/*
 * Personal UI preferences: what they are and their defaults. Stored per user in this browser by
 * PreferencesContext; applied to the page by useApplyPreferences.
 */

export interface NotificationPreferences {
    taskAssigned: boolean;
    deadlines: boolean;
    milestones: boolean;
    projectChanges: boolean;
    timeTracking: boolean;
    weekly: boolean;
}

// Accent colors of the workspace; orange is Innopixel's own. The colors themselves live in styles/app/tokens.css.
export const ACCENT_COLORS = ["orange", "blue", "violet", "pink", "teal", "green"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export const TEXT_SIZES = ["small", "medium", "large"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export interface Preferences {
    sidebarCollapsed: boolean;
    reduceMotion: boolean;       // turns off animations in the workspace (on top of the OS setting)
    highContrast: boolean;       // stronger borders and text
    accent: AccentColor;
    textSize: TextSize;
    notifications: NotificationPreferences;
}

export const DEFAULT_PREFERENCES: Preferences = {
    sidebarCollapsed: false,
    reduceMotion: false,
    highContrast: false,
    accent: "orange",
    textSize: "medium",
    notifications: { taskAssigned: true, deadlines: true, milestones: true, projectChanges: true, timeTracking: true, weekly: false },
};

// Saved values from an older version or edited by hand fall back to the default, one by one
export function sanitizePreferences(saved: Partial<Preferences> | null | undefined): Preferences {
    const merged = { ...DEFAULT_PREFERENCES, ...saved, notifications: { ...DEFAULT_PREFERENCES.notifications, ...saved?.notifications } };
    return {
        ...merged,
        accent: ACCENT_COLORS.includes(merged.accent) ? merged.accent : DEFAULT_PREFERENCES.accent,
        textSize: TEXT_SIZES.includes(merged.textSize) ? merged.textSize : DEFAULT_PREFERENCES.textSize,
        highContrast: merged.highContrast === true,
        reduceMotion: merged.reduceMotion === true,
        sidebarCollapsed: merged.sidebarCollapsed === true,
    };
}

