import type { CSSProperties } from "react";
import type { User } from "../../types/domain";

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// A stable hue per user, so the same person always gets the same avatar color
function hueFor(id: string): number {
    let hash = 0;
    for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
    return hash;
}

interface AvatarProps {
    user: Pick<User, "id" | "name"> | undefined;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    showTitle?: boolean;
}

export function Avatar({ user, size = "sm", showTitle = true }: AvatarProps) {
    if (!user) {
        return <span className={`avatar avatar--${size} avatar--empty`} aria-hidden="true">?</span>;
    }
    return (
        <span
            className={`avatar avatar--${size}`}
            style={{ "--avatar-hue": hueFor(user.id) } as CSSProperties}
            title={showTitle ? user.name : undefined}
            aria-hidden="true"
        >
            {initials(user.name)}
        </span>
    );
}

export function AvatarStack({ users, max = 4 }: { users: User[]; max?: number }) {
    const shown = users.slice(0, max);
    const rest = users.length - shown.length;
    return (
        <span className="avatar-stack" aria-label={users.map((u) => u.name).join(", ")} role="img">
            {shown.map((u) => <Avatar key={u.id} user={u} size="sm" />)}
            {rest > 0 && <span className="avatar avatar--sm avatar--more">+{rest}</span>}
        </span>
    );
}

// Avatar followed by the name, e.g. in tables
export function UserChip({ user, fallback }: { user: User | undefined; fallback: string }) {
    return (
        <span className="user-chip">
            <Avatar user={user} size="xs" showTitle={false} />
            <span>{user?.name ?? fallback}</span>
        </span>
    );
}
