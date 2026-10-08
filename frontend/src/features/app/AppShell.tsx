import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAppText } from "../../i18n/app/useAppText";
import { FeedbackProvider } from "../../components/ui/Feedback";
import LoadingState from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/States";
import { useAuth } from "../auth/AuthContext";
import { PreferencesProvider, usePreferences } from "../preferences/PreferencesContext";
import { TaskDialogProvider } from "../tasks/TaskDialog";
import { WorkspaceProvider, useWorkspace } from "../workspace/WorkspaceContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { pageTitle } from "./navigation";

function ShellLayout() {
    const text = useAppText();
    const { data, loading, error, reload } = useWorkspace();
    const { preferences, update } = usePreferences();
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Start at the top of each page and name the browser tab after it
    useEffect(() => {
        document.querySelector(".app-content")?.scrollTo({ top: 0, behavior: "instant" });
        document.title = `${pageTitle(pathname, text)} · ${text.brand}`;
    }, [pathname, text]);

    let content;
    if (loading && !data) content = <LoadingState />;
    else if (error && !data) {
        content = (
            <ErrorState
                title={text.errors.loadFailed}
                message={error}
                action={<button className="app-btn app-btn--primary" onClick={() => void reload()}>{text.common.retry}</button>}
            />
        );
    } else content = <TaskDialogProvider><Outlet /></TaskDialogProvider>;

    const classes = ["app-shell", preferences.sidebarCollapsed ? "app-shell--collapsed" : "", drawerOpen ? "app-shell--drawer-open" : ""];

    return (
        <div className={classes.join(" ")}>
            <a href="#app-main" className="skip-link">Spring til indhold</a>
            <Sidebar
                collapsed={preferences.sidebarCollapsed}
                onToggleCollapsed={() => update({ sidebarCollapsed: !preferences.sidebarCollapsed })}
                onNavigate={() => setDrawerOpen(false)}
            />
            {drawerOpen && <div className="app-drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}

            <div className="app-main-column">
                <Topbar onOpenMenu={() => setDrawerOpen(true)} />
                <main id="app-main" className="app-content" tabIndex={-1}>
                    {content}
                </main>
            </div>
        </div>
    );
}

// Providers for everything behind the login
function AppShell() {
    const { user } = useAuth();
    return (
        <WorkspaceProvider>
            <PreferencesProvider key={user?.id} userId={user?.id ?? "anonymous"}>
                <FeedbackProvider>
                    <ShellLayout />
                </FeedbackProvider>
            </PreferencesProvider>
        </WorkspaceProvider>
    );
}

export default AppShell;
