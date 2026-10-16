import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../utils/chatbotHelpers";

const STEP_MS = 40;
const MAX_DURATION_MS = 2600;

// Reveals an answer word by word while the mascot "speaks", then calls onDone.
// With reduced motion (or when not active) the full text is shown at once.
export function useRevealText(text: string, active: boolean, onDone: () => void): string {
    const [shown, setShown] = useState<number | null>(null);

    useEffect(() => {
        if (!active) return;
        if (prefersReducedMotion()) {
            const done = setTimeout(onDone, 0);
            return () => clearTimeout(done);
        }
        const total = text.length;
        const steps = Math.max(1, Math.min(MAX_DURATION_MS, total * 18) / STEP_MS);
        const perStep = Math.ceil(total / steps);
        let position = 0;
        const timer = setInterval(() => {
            position = Math.min(total, position + perStep);
            // Never cut a word in half
            const next = position >= total ? total : Math.max(position, text.indexOf(" ", position) === -1 ? total : text.indexOf(" ", position));
            position = next;
            setShown(next);
            if (next >= total) {
                clearInterval(timer);
                onDone();
            }
        }, STEP_MS);
        return () => clearInterval(timer);
    }, [text, active, onDone]);

    if (!active || shown === null) return active && !prefersReducedMotion() ? "" : text;
    return text.slice(0, shown);
}
