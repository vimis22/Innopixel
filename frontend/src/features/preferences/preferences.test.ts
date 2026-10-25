import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, sanitizePreferences } from "./preferences";

describe("sanitizePreferences", () => {
    it("gives the defaults (Innopixel orange, medium text) when nothing is saved", () => {
        expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
        expect(DEFAULT_PREFERENCES.accent).toBe("orange");
        expect(DEFAULT_PREFERENCES.textSize).toBe("medium");
        expect(DEFAULT_PREFERENCES.highContrast).toBe(false);
    });

    it("keeps valid saved choices", () => {
        const saved = sanitizePreferences({ accent: "teal", textSize: "large", highContrast: true, reduceMotion: true, sidebarCollapsed: true });
        expect(saved).toMatchObject({ accent: "teal", textSize: "large", highContrast: true, reduceMotion: true, sidebarCollapsed: true });
    });

    it("upgrades preferences saved before accent, text size and contrast existed", () => {
        const old = { sidebarCollapsed: true, reduceMotion: false, notifications: { taskAssigned: false } } as never;
        const saved = sanitizePreferences(old);
        expect(saved.sidebarCollapsed).toBe(true);
        expect(saved.accent).toBe("orange");
        expect(saved.textSize).toBe("medium");
        expect(saved.notifications).toEqual({ ...DEFAULT_PREFERENCES.notifications, taskAssigned: false });
    });

    it("replaces unknown or hand-edited values one by one", () => {
        const saved = sanitizePreferences({ accent: "rainbow", textSize: "huge", highContrast: "yes" } as never);
        expect(saved.accent).toBe("orange");
        expect(saved.textSize).toBe("medium");
        expect(saved.highContrast).toBe(false);
    });
});
