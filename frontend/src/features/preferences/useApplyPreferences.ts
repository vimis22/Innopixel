import { useEffect } from "react";
import type { Preferences } from "./preferences";

/*
 * Puts the appearance preferences on <html> as data attributes, which styles/app/tokens.css turns into colors,
 * sizes and contrast. They go on <html> (not the shell) because dialogs and drawers render in the browser's
 * top layer outside the shell. They are removed when leaving the platform, so the public site is untouched.
 */
export function useApplyPreferences({ accent, textSize, highContrast, reduceMotion }: Preferences) {
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.accent = accent;
        root.dataset.textSize = textSize;
        root.classList.toggle("high-contrast", highContrast);
        root.classList.toggle("reduced-motion", reduceMotion);
        return () => {
            delete root.dataset.accent;
            delete root.dataset.textSize;
            root.classList.remove("high-contrast", "reduced-motion");
        };
    }, [accent, textSize, highContrast, reduceMotion]);
}
