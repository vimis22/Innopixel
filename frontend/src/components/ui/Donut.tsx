import type { ReactNode } from "react";

export interface DonutSegment {
    key: string;
    value: number;
    color: string;
    label: string;
}

interface DonutProps {
    segments: DonutSegment[];
    size?: number;
    thickness?: number;
    center?: ReactNode;
    label: string;               // accessible summary, e.g. "12 færdige, 5 i gang, 4 ikke startet"
}

const GAP = 2; // px of surface between segments, so adjacent colors never touch

/*
 * Part-to-whole ring for a handful of segments (use a legend with counts next to it;
 * identity never relies on color alone).
 */
function Donut({ segments, size = 170, thickness = 18, center, label }: DonutProps) {
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const visible = segments.filter((s) => s.value > 0);

    let offset = 0;
    return (
        <div className="donut" style={{ width: size, height: size }} role="img" aria-label={label}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
                <circle className="donut-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={thickness} />
                {total > 0 && visible.map((segment) => {
                    const length = (segment.value / total) * circumference;
                    const gap = visible.length > 1 ? GAP : 0;
                    const dash = Math.max(0, length - gap);
                    const circle = (
                        <circle
                            key={segment.key}
                            className="donut-segment"
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={segment.color}
                            strokeWidth={thickness}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                        >
                            <title>{`${segment.label}: ${segment.value}`}</title>
                        </circle>
                    );
                    offset += length;
                    return circle;
                })}
            </svg>
            {center && <div className="donut-center">{center}</div>}
        </div>
    );
}

export default Donut;
