import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { IconProps } from "../icons/Icons";
import { ArrowRightIcon } from "../icons/AppIcons";

export type StatTone = "accent" | "danger" | "success" | "pink" | "neutral";

interface StatCardBaseProps {
    label: string;
    value: ReactNode;
    Icon: ComponentType<IconProps>;
    tone?: StatTone;
    hint?: ReactNode;            // short context, e.g. "næste 14 dage" (never an invented trend)
}

// A stat card is either static, a link, or a filter toggle
type StatCardProps = StatCardBaseProps & (
    | { to?: undefined; onClick?: undefined; active?: undefined }
    | { to: string; onClick?: undefined; active?: undefined }
    | { to?: undefined; onClick: () => void; active?: boolean }
);

function StatCard({ label, value, Icon, tone = "accent", hint, to, onClick, active }: StatCardProps) {
    const content = (
        <>
            <span className={`stat-card-icon stat-card-icon--${tone}`} aria-hidden="true"><Icon /></span>
            <span className="stat-card-body">
                <span className="stat-card-value">{value}</span>
                <span className="stat-card-label">{label}</span>
                {hint && <span className="stat-card-hint">{hint}</span>}
            </span>
            {(to || onClick) && <ArrowRightIcon className="stat-card-arrow" aria-hidden="true" />}
        </>
    );

    if (to) return <Link to={to} className="stat-card">{content}</Link>;
    if (onClick) {
        return (
            <button type="button" className={`stat-card ${active ? "is-active" : ""}`} onClick={onClick} aria-pressed={active}>
                {content}
            </button>
        );
    }
    return <div className="stat-card">{content}</div>;
}

export function StatGrid({ children, label }: { children: ReactNode; label: string }) {
    return <section className="stat-grid" aria-label={label}>{children}</section>;
}

export default StatCard;
