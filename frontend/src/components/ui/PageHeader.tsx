import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "../icons/Icons";

interface PageHeaderProps {
    title: string;
    highlight?: string;          // appended to the title in the brand gradient, e.g. the user's first name
    lead?: ReactNode;
    aside?: ReactNode;           // primary actions or a date greeting
    Icon?: ComponentType<IconProps>;
}

function PageHeader({ title, highlight, lead, aside, Icon }: PageHeaderProps) {
    return (
        <header className="page-header">
            <PixelDecoration />
            <div className="page-header-text">
                <h1 className="page-title">
                    {Icon && <span className="page-title-icon" aria-hidden="true"><Icon /></span>}
                    {title}
                    {highlight && <span className="page-title-highlight">{highlight}</span>}
                </h1>
                {lead && <p className="page-lead">{lead}</p>}
            </div>
            {aside && <div className="page-header-aside">{aside}</div>}
        </header>
    );
}

// The faint dot-and-line network from the public site's background, as a static accent
const NODES: [number, number, number][] = [[40, 60, 2.5], [120, 30, 3], [200, 90, 2], [260, 40, 3.5], [330, 110, 2.5], [170, 150, 3], [300, 160, 2]];
const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [4, 6], [5, 6]];

function PixelDecoration() {
    return (
        <svg className="page-decoration" viewBox="0 0 360 180" aria-hidden="true" focusable="false">
            {LINKS.map(([a, b]) => (
                <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
            ))}
            {NODES.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)}
        </svg>
    );
}

export default PageHeader;
