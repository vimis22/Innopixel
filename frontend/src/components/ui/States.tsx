import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "../icons/Icons";
import { AlertIcon } from "../icons/AppIcons";

interface EmptyStateProps {
    Icon?: ComponentType<IconProps>;
    title: string;
    children?: ReactNode;
    action?: ReactNode;
    compact?: boolean;
}

export function EmptyState({ Icon, title, children, action, compact = false }: EmptyStateProps) {
    return (
        <div className={`empty-state ${compact ? "empty-state--compact" : ""}`}>
            {Icon && <Icon className="empty-state-icon" aria-hidden="true" />}
            <p className="empty-state-title">{title}</p>
            {children && <div className="empty-state-text">{children}</div>}
            {action}
        </div>
    );
}

export function ErrorState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
    return (
        <div className="empty-state empty-state--error" role="alert">
            <AlertIcon className="empty-state-icon" aria-hidden="true" />
            <p className="empty-state-title">{title}</p>
            {message && <div className="empty-state-text">{message}</div>}
            {action}
        </div>
    );
}
