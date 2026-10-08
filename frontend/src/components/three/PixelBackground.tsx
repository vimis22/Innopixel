import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    baseColor: string;
    alpha: number;
}

const MOUSE_RADIUS = 150;
const LINK_DISTANCE = 130;

const isLightTheme = () => document.documentElement.getAttribute("data-theme") === "light";

// The floating pixel network behind the site (2D canvas, ported from app.js)
function PixelBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);
        let particles: Particle[] = [];
        let frameId = 0;
        const mouse: { x: number | null; y: number | null } = { x: null, y: null };

        function createParticle(): Particle {
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 1,
                baseColor: Math.random() > 0.5 ? "rgba(255, 125, 0, " : "rgba(255, 67, 68, ",
                alpha: Math.random() * 0.4 + 0.1,
            };
        }

        function initParticles() {
            // Scale particle count by screen size
            const count = Math.min(Math.max(Math.floor((width * height) / 10000), 40), 120);
            particles = Array.from({ length: count }, createParticle);
        }

        function updateParticle(p: Particle) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Push particles away from the cursor
            if (mouse.x !== null && mouse.y !== null) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_RADIUS) {
                    const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                    const angle = Math.atan2(dy, dx);
                    p.x += Math.cos(angle) * force * 1.5;
                    p.y += Math.sin(angle) * force * 1.5;
                }
            }
        }

        function drawParticle(p: Particle, light: boolean) {
            const alpha = light ? Math.min(p.alpha + 0.2, 0.75) : p.alpha;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fillStyle = `${p.baseColor}${alpha})`;
            ctx!.fill();
        }

        function drawLines(light: boolean) {
            const maxOpacity = light ? 0.3 : 0.15;
            ctx!.lineWidth = light ? 0.75 : 0.5;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < LINK_DISTANCE) {
                        ctx!.beginPath();
                        ctx!.moveTo(particles[i].x, particles[i].y);
                        ctx!.lineTo(particles[j].x, particles[j].y);
                        ctx!.strokeStyle = `rgba(255, 67, 68, ${(1 - dist / LINK_DISTANCE) * maxOpacity})`;
                        ctx!.stroke();
                    }
                }
            }
        }

        function animate() {
            // Read the theme every frame, so switching theme doesn't restart the animation
            const light = isLightTheme();
            ctx!.clearRect(0, 0, width, height);
            for (const p of particles) {
                updateParticle(p);
                drawParticle(p, light);
            }
            drawLines(light);
            frameId = requestAnimationFrame(animate);
        }

        function handleMouseMove(event: MouseEvent) {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }

        function handleMouseLeave() {
            mouse.x = null;
            mouse.y = null;
        }

        function handleResize() {
            width = canvas!.width = window.innerWidth;
            height = canvas!.height = window.innerHeight;
            initParticles();
        }

        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("resize", handleResize);

        initParticles();
        animate();

        // Stop the loop and remove listeners when the component unmounts
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return <canvas id="pixel-canvas" ref={canvasRef} />;
}

export default PixelBackground;
