import { useEffect, useState } from "react";

// True once the page has been scrolled further than `threshold` pixels
export function useScrolled(threshold = 50) {
    const [scrolled, setScrolled] = useState(() => window.scrollY > threshold);

    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > threshold);
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [threshold]);

    return scrolled;
}
