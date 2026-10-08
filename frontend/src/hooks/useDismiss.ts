import { useEffect, type RefObject } from "react";

// Closes a popover (menu, dropdown, search results) on an outside click or Escape
export function useDismiss(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) close();
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") close();
        }

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open, ref, close]);
}
