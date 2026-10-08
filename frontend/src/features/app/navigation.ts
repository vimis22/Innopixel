import type { ComponentType } from "react";
import { APP_ROUTES } from "../../config/routes";
import type { Role } from "../../types/domain";
import type { AppText } from "../../i18n/app/da";
import type { IconProps } from "../../components/icons/Icons";
import {
    CheckSquareIcon, DashboardIcon, FlagIcon, FolderIcon, GanttIcon, KanbanIcon, SettingsIcon, UsersIcon,
} from "../../components/icons/AppIcons";

export interface AppNavItem {
    to: string;
    label: (text: AppText) => string;
    Icon: ComponentType<IconProps>;
    roles?: Role[];
    end?: boolean;
}

// Sidebar entries. New modules (time tracking, budgets…) are added here.
export const APP_NAV: AppNavItem[] = [
    { to: APP_ROUTES.dashboard, label: (t) => t.nav.dashboard, Icon: DashboardIcon, end: true },
    { to: APP_ROUTES.projects, label: (t) => t.nav.projects, Icon: FolderIcon },
    { to: APP_ROUTES.tasks, label: (t) => t.nav.tasks, Icon: CheckSquareIcon },
    { to: APP_ROUTES.gantt, label: (t) => t.nav.gantt, Icon: GanttIcon },
    { to: APP_ROUTES.board, label: (t) => t.nav.board, Icon: KanbanIcon },
    { to: APP_ROUTES.milestones, label: (t) => t.nav.milestones, Icon: FlagIcon },
    { to: APP_ROUTES.team, label: (t) => t.nav.team, Icon: UsersIcon },
    { to: APP_ROUTES.settings, label: (t) => t.nav.settings, Icon: SettingsIcon },
];

export function pageTitle(pathname: string, text: AppText): string {
    const match = [...APP_NAV]
        .sort((a, b) => b.to.length - a.to.length)
        .find((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/")));
    return match ? match.label(text) : text.brand;
}
