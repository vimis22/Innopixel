import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { AvatarState } from "../types/chatbot.types";
import { prefersReducedMotion } from "../utils/chatbotHelpers";

// Short-lived reactions (a greeting when the chat opens, a confused look after an error)
type Reaction = Extract<AvatarState, "greeting" | "happy" | "error">;

const REACTION_MS: Record<Reaction, number> = { greeting: 2400, happy: 1600, error: 3600 };

export interface ConversationSignals {
    pending: boolean;            // waiting for an answer
    speaking: boolean;           // an answer is being revealed
    typing: boolean;             // the visitor has text in the input
}

// One predictable order: what the assistant is busy with first, then reactions, then the visitor
export function deriveAvatarState(signals: ConversationSignals, reaction: Reaction | null): AvatarState {
    if (signals.pending) return "thinking";
    if (signals.speaking) return "speaking";
    if (reaction) return reaction;
    if (signals.typing) return "listening";
    return "idle";
}

// A reaction shown for a moment; combine it with the conversation using deriveAvatarState()
export function useAvatarReaction() {
    const [reaction, setReaction] = useState<Reaction | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const react = useCallback((next: Reaction) => {
        clearTimeout(timer.current);
        setReaction(next);
        timer.current = setTimeout(() => setReaction(null), REACTION_MS[next]);
    }, []);

    return { reaction, react };
}

// The eyes follow the pointer a little. Writes CSS variables directly (no React render per mouse move),
// at most once per animation frame, and does nothing for visitors who prefer reduced motion.
export function useAvatarLook(target: RefObject<HTMLElement | null>, enabled: boolean) {
    useEffect(() => {
        const element = target.current;
        if (!enabled || !element || prefersReducedMotion()) return;

        let frame = 0;
        let lastEvent: PointerEvent | null = null;

        function update() {
            frame = 0;
            if (!element || !lastEvent) return;
            const box = element.getBoundingClientRect();
            const dx = lastEvent.clientX - (box.left + box.width / 2);
            const dy = lastEvent.clientY - (box.top + box.height / 2);
            const distance = Math.hypot(dx, dy) || 1;
            const strength = Math.min(1, distance / 320);
            element.style.setProperty("--look-x", ((dx / distance) * strength).toFixed(3));
            element.style.setProperty("--look-y", ((dy / distance) * strength).toFixed(3));
        }

        function onMove(event: PointerEvent) {
            lastEvent = event;
            if (!frame) frame = requestAnimationFrame(update);
        }

        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            window.removeEventListener("pointermove", onMove);
            cancelAnimationFrame(frame);
            element.style.removeProperty("--look-x");
            element.style.removeProperty("--look-y");
        };
    }, [target, enabled]);
}
