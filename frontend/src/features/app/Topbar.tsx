import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES, ROUTES } from "../../config/routes";
import { USE_MOCK_API } from "../../config/services";
import { useAppText } from "../../i18n/app/useAppText";
import { useDismiss } from "../../hooks/useDismiss";
import ThemeToggle from "../../components/common/ThemeToggle";
import { Avatar } from "../../components/ui/Avatar";
import ProjectThumb from "../../components/ui/ProjectThumb";
import { ChevronDownIcon, InfoIcon, LogoutIcon, MenuIcon, SearchIcon, SettingsIcon } from "../../components/icons/AppIcons";
import { useAuth } from "../auth/AuthContext";
import { useCurrentUser, useWorkspace } from "../workspace/WorkspaceContext";

const MIN_QUERY = 2;

function GlobalSearch() {
    const text = useAppText();
    const { data } = useWorkspace();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const listId = useId();
    const close = useCallback(() => setOpen(false), []);
    useDismiss(open, ref, close);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!data || q.length < MIN_QUERY) return null;
        const archived = new Set(data.projects.filter((p) => p.archived).map((p) => p.id));
        return {
            projects: data.projects.filter((p) => !p.archived && `${p.name} ${p.client}`.toLowerCase().includes(q)).slice(0, 4),
            tasks: data.tasks.filter((t) => !archived.has(t.projectId) && t.title.toLowerCase().includes(q)).slice(0, 5),
            people: data.users.filter((u) => u.active && `${u.name} ${u.title}`.toLowerCase().includes(q)).slice(0, 3),
        };
    }, [data, query]);

    function go(path: string) {
        setOpen(false);
        setQuery("");
        navigate(path);
    }

    const projectOf = (id: string) => data?.projects.find((p) => p.id === id);
    const empty = results && results.projects.length + results.tasks.length + results.people.length === 0;

    return (
        <div className="global-search" ref={ref}>
            <div className="search-field">
                <SearchIcon aria-hidden="true" />
                <input
                    type="search"
                    className="control"
                    placeholder={text.topbar.searchPlaceholder}
                    aria-label={text.common.search}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    aria-expanded={open && results !== null}
                    aria-controls={listId}
                />
            </div>
            {open && results && (
                <div className="search-results" id={listId}>
                    {empty && <p className="search-empty">{text.topbar.searchEmpty}</p>}
                    {results.projects.length > 0 && (
                        <div>
                            <p className="search-heading">{text.topbar.searchProjects}</p>
                            {results.projects.map((p) => (
                                <button key={p.id} type="button" className="search-result" onClick={() => go(APP_ROUTES.project(p.id))}>
                                    <ProjectThumb project={p} size="sm" />
                                    <span>{p.name}<small>{p.client}</small></span>
                                </button>
                            ))}
                        </div>
                    )}
                    {results.tasks.length > 0 && (
                        <div>
                            <p className="search-heading">{text.topbar.searchTasks}</p>
                            {results.tasks.map((t) => (
                                <button key={t.id} type="button" className="search-result" onClick={() => go(`${APP_ROUTES.project(t.projectId)}?tab=tasks&task=${t.id}`)}>
                                    <span>{t.title}<small>{projectOf(t.projectId)?.name}</small></span>
                                </button>
                            ))}
                        </div>
                    )}
                    {results.people.length > 0 && (
                        <div>
                            <p className="search-heading">{text.topbar.searchPeople}</p>
                            {results.people.map((u) => (
                                <button key={u.id} type="button" className="search-result" onClick={() => go(`${APP_ROUTES.team}?q=${encodeURIComponent(u.name)}`)}>
                                    <Avatar user={u} size="xs" showTitle={false} />
                                    <span>{u.name}<small>{u.title}</small></span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function UserMenu() {
    const text = useAppText();
    const user = useCurrentUser();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(open, ref, close);

    async function handleLogout() {
        await logout();
        navigate(ROUTES.login, { replace: true });
    }

    return (
        <div className="user-menu" ref={ref}>
            <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={`${text.topbar.userMenu}: ${user.name}`}
            >
                <Avatar user={user} size="md" showTitle={false} />
                <span className="user-menu-text">
                    <span className="user-menu-name">{user.name}</span>
                    <span className="user-menu-role">{text.roles[user.role]}</span>
                </span>
                <ChevronDownIcon className="user-menu-chevron" aria-hidden="true" />
            </button>
            {open && (
                <div className="menu" role="menu">
                    <div className="user-menu-header">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                    </div>
                    <Link to={APP_ROUTES.settings} role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
                        <SettingsIcon aria-hidden="true" />
                        {text.topbar.profile}
                    </Link>
                    <button type="button" role="menuitem" className="menu-item" onClick={() => void handleLogout()}>
                        <LogoutIcon aria-hidden="true" />
                        {text.topbar.logout}
                    </button>
                </div>
            )}
        </div>
    );
}

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
    const text = useAppText();
    return (
        <header className="app-topbar">
            <button type="button" className="icon-btn app-menu-btn" onClick={onOpenMenu} aria-label={text.nav.openMenu}>
                <MenuIcon />
            </button>
            <GlobalSearch />
            <div className="app-topbar-actions">
                {USE_MOCK_API && (
                    <span className="demo-pill" title={text.topbar.demoTooltip} tabIndex={0} aria-label={text.topbar.demoTooltip}>
                        <InfoIcon aria-hidden="true" />
                        <span>{text.demoBadge}</span>
                    </span>
                )}
                <ThemeToggle />
                <UserMenu />
            </div>
        </header>
    );
}

export default Topbar;
