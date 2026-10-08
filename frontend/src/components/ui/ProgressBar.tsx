import type { CSSProperties } from "react";

interface ProgressBarProps {
    value: number | null;          // null = cannot be calculated (shown as "–")
    label: string;                 // accessible name
    marker?: number;               // optional reference point, e.g. share of time elapsed
    markerLabel?: string;
    tone?: "brand" | "success" | "warning" | "danger";
    color?: string;                // explicit fill color (e.g. a project's identity color); overrides tone
    size?: "sm" | "md" | "lg";
    showValue?: boolean;
}

function ProgressBar({ value, label, marker, markerLabel, tone = "brand", color, size = "md", showValue = true }: ProgressBarProps) {
    const clamped = value === null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
    const fillClass = color ? "progress-fill--color" : `progress-fill--${tone}`;

    return (
        <div className={`progress progress--${size}`}>
            <div
                className="progress-track"
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value ?? undefined}
                aria-valuetext={value === null ? "–" : `${clamped} %`}
            >
                <div
                    className={`progress-fill ${fillClass}`}
                    style={{ width: `${clamped}%`, ...(color ? { "--progress-color": color } : {}) } as CSSProperties}
                />
                {marker !== undefined && (
                    <div className="progress-marker" style={{ left: `${Math.max(0, Math.min(100, marker))}%` }} title={markerLabel} />
                )}
            </div>
            {showValue && <span className="progress-value">{value === null ? "–" : `${clamped}%`}</span>}
        </div>
    );
}

export default ProgressBar;
