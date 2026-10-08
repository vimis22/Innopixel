import { useEffect, useRef, useState } from "react";

// Same logic as AnimateOnScroll, for components that render their own root element
export function useScrollAnimation<T extends HTMLElement>(threshold = 0.15) {
    const ref = useRef<T>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, inView };
}
