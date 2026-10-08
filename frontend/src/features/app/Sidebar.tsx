import { Link, NavLink } from "react-router-dom";
import { APP_ROUTES, ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { ChevronLeftIcon, ChevronRightIcon, GlobeIcon } from "../../components/icons/AppIcons";
import { useCurrentUser } from "../workspace/WorkspaceContext";
import { APP_NAV } from "./navigation";

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapsed: () => void;
    onNavigate: () => void;
}

function Sidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
    const text = useAppText();
    const user = useCurrentUser();
    const items = APP_NAV.filter((item) => !item.roles || item.roles.includes(user.role));

    return (
        <aside className="app-sidebar" aria-label="Hovedmenu">
            <div className="app-sidebar-brand">
                <Link to={APP_ROUTES.dashboard} className="app-logo" onClick={onNavigate} aria-label={text.brand}>
                    <img src="/images/logo-innopixel-white-text.svg" alt="" className="app-logo-full logo-dark" />
                    <img src="/images/logo-innopixel.svg" alt="" className="app-logo-full logo-light" />
                    <span className="app-logo-mono" aria-hidden="true">ip</span>
                </Link>
            </div>

            <nav className="app-nav">
                {items.map(({ to, label, Icon, end }) => (
                    <NavLink key={to} to={to} end={end} className="app-nav-link" onClick={onNavigate} title={collapsed ? label(text) : undefined}>
                        <Icon className="app-nav-icon" aria-hidden="true" />
                        <span className="app-nav-label">{label(text)}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="app-sidebar-footer">
                <Link to={ROUTES.home} className="app-nav-link" title={collapsed ? text.nav.backToSite : undefined}>
                    <GlobeIcon className="app-nav-icon" aria-hidden="true" />
                    <span className="app-nav-label">{text.nav.backToSite}</span>
                </Link>
                <button
                    type="button"
                    className="app-nav-link app-collapse-btn"
                    onClick={onToggleCollapsed}
                    aria-label={collapsed ? text.nav.expand : text.nav.collapse}
                    aria-expanded={!collapsed}
                >
                    {collapsed ? <ChevronRightIcon className="app-nav-icon" /> : <ChevronLeftIcon className="app-nav-icon" />}
                    <span className="app-nav-label">{text.nav.collapse}</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
