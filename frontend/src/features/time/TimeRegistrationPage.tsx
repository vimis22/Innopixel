import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ISODate } from "../../types/domain";
import type { TimeOverview } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import Tabs, { TabPanel } from "../../components/ui/Tabs";
import LoadingState from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/States";
import { ClockIcon } from "../../components/icons/AppIcons";
import { formatLongDate } from "../../utils/date";
import { isAdmin } from "../auth/permissions";
import { useActiveProjects, useMyProjects } from "../workspace/hooks";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import ApprovalsTab from "./ApprovalsTab";
import OverviewTab, { type TimeTabKey } from "./OverviewTab";
import PunchesTab from "./PunchesTab";
import ReportsTab from "./ReportsTab";
import SchedulesTab from "./SchedulesTab";
import { timeApi } from "./timeApi";
import { useNow, useTimeQuery } from "./useTimeQuery";
import "./time.css";

const TABS: TimeTabKey[] = ["overview", "schedules", "punches", "approvals", "reports"];

// The overview plus when it arrived, so the live clock can follow the server's time, not the device's
type LoadedOverview = TimeOverview & { skewMs: number };

/*
 * Tidsregistrering in five tabs, each with one purpose. The tab is part of the URL (?tab=), so links,
 * reloads and the browser's back button keep it. Planned time (Arbejdsplaner) and recorded time
 * (Stemplinger) are kept apart; approvals and reports build on the recorded time.
 */
function TimeRegistrationPage() {
    const text = useAppText();
    const t = text.time;
    const me = useCurrentUser();
    const admin = isAdmin(me);
    const { data: workspace } = useWorkspaceData();
    const activeProjects = useActiveProjects();
    const myProjects = useMyProjects();
    const projects = admin ? activeProjects : myProjects;   // the projects the server lets this user pick
    const projectsById = useMemo(() => new Map(workspace.projects.map((p) => [p.id, p])), [workspace.projects]);
    const activeUsers = useMemo(() => workspace.users.filter((u) => u.active).sort((a, b) => a.name.localeCompare(b.name, "da")), [workspace.users]);
    const [params, setParams] = useSearchParams();
    const requested = params.get("tab") as TimeTabKey | null;
    const tab: TimeTabKey = requested && TABS.includes(requested) ? requested : "overview";

    // Every change bumps `refresh`, and each tab reloads its own data
    const [refresh, setRefresh] = useState(0);
    const changed = useCallback(() => setRefresh((r) => r + 1), []);
    const overviewQuery = useTimeQuery<LoadedOverview>(
        async () => {
            const overview = await timeApi.overview();
            return { ...overview, skewMs: Date.parse(overview.serverTime) - Date.now() };
        },
        [refresh],
    );
    const overview = overviewQuery.data;
    const now = useNow(Boolean(overview?.active)) + (overview?.skewMs ?? 0);

    // Pushes a history entry, so the back button returns to the previous tab. `from` opens Stemplinger at a given week.
    function openTab(next: TimeTabKey, from?: ISODate) {
        setParams(next === "overview" ? {} : { tab: next, ...(from ? { from } : {}) });
    }

    if (!overview) {
        return overviewQuery.failed ? (
            <div className="page">
                <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost" onClick={overviewQuery.retry}>{t.retry}</button>} />
            </div>
        ) : <LoadingState />;
    }

    const today = overview.today;
    const labels: Record<TimeTabKey, string> = {
        overview: t.tabOverview,
        schedules: t.tabSchedules,
        punches: t.tabPunches,
        approvals: t.tabApprovals,
        reports: t.tabReports,
    };

    return (
        <div className="page time-page">
            <PageHeader
                Icon={ClockIcon}
                title={t.title}
                lead={t.lead}
                aside={<p className="date-greeting"><span>{formatLongDate(today)}</span></p>}
            />

            <Tabs id="time" label={t.title} value={tab} onChange={(next) => openTab(next)} options={TABS.map((key) => ({ value: key, label: labels[key] }))} />

            <TabPanel id="time" value={tab}>
                {tab === "overview" && (
                    <OverviewTab overview={overview} now={now} admin={admin} projects={projects} refresh={refresh} onChanged={changed} onOpenTab={openTab} />
                )}
                {tab === "schedules" && <SchedulesTab me={me} admin={admin} users={activeUsers} today={today} />}
                {tab === "punches" && (
                    <PunchesTab me={me} admin={admin} users={activeUsers} today={today} projects={projects} projectsById={projectsById} refresh={refresh} onChanged={changed} />
                )}
                {tab === "approvals" && (
                    <ApprovalsTab me={me} admin={admin} users={workspace.users} today={today} projects={projects} refresh={refresh} onChanged={changed} />
                )}
                {tab === "reports" && <ReportsTab me={me} admin={admin} users={activeUsers} today={today} projects={activeProjects} refresh={refresh} />}
            </TabPanel>
        </div>
    );
}

export default TimeRegistrationPage;
