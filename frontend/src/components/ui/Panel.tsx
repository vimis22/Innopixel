import { useId, type ReactNode } from "react";

interface PanelProps {
    title?: string;
    subtitle?: ReactNode;
    action?: ReactNode;          // e.g. a "Se alle" link or a filter
    flush?: boolean;             // content (tables) runs to the edges
    className?: string;
    children: ReactNode;
}

// A card with an optional header; the building block of every page
function Panel({ title, subtitle, action, flush = false, className = "", children }: PanelProps) {
    const titleId = useId();
    return (
        <section className={`panel ${flush ? "panel--flush" : ""} ${className}`} aria-labelledby={title ? titleId : undefined}>
            {(title || action) && (
                <header className="panel-header">
                    <div>
                        {title && <h2 id={titleId} className="panel-title">{title}</h2>}
                        {subtitle && <p className="panel-subtitle">{subtitle}</p>}
                    </div>
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

export default Panel;
