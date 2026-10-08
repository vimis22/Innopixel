import type { ReactNode } from "react";
import { useScrollAnimation } from "../../hooks/useScrollAnimation";

interface AnimateOnScrollProps {
    children: ReactNode;
    className?: string;
}

function AnimateOnScroll({ children, className = "" }: AnimateOnScrollProps) {
    const { ref, inView } = useScrollAnimation<HTMLDivElement>();

    return (
        <div ref={ref} className={`animate-on-scroll ${inView ? "in-view" : ""} ${className}`}>
            {children}
        </div>
    );
}

export default AnimateOnScroll;
