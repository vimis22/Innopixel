import type { MouseEvent, ReactNode } from "react";

interface TiltCardProps {
    children: ReactNode;
    className?: string;
    maxTilt?: number;          // degrees, default 8 like the original
}

function TiltCard({ children, className = "", maxTilt = 8 }: TiltCardProps) {
    function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
        const card = event.currentTarget;
        const rect = card.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = ((centerY - y) / centerY) * maxTilt;
        const tiltY = ((x - centerX) / centerX) * maxTilt;

        card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-5px)`;
    }

    function handleMouseLeave(event: MouseEvent<HTMLDivElement>) {
        event.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
    }

    return (
        <div
            className={`tilt-card ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
}

export default TiltCard;