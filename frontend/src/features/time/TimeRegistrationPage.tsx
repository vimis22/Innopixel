import { useCallback, useMemo, useRef, useState } from "react";
import type { ISODate } from "../../types/domain";
import type { TimeOverview, TimeRegistration } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import LoadingState from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/States";
import { AlertIcon, CalendarIcon, CheckSquareIcon, ClockIcon } from "../../components/icons/AppIcons";
import { formatLongDate, startOfWeek } from "../../utils/date";
import { isAdmin } from "../auth/permissions";
import { useActiveProjects, useMyProjects } from "../workspace/hooks";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import AdjustHoursPanel from "./AdjustHoursPanel";
import LiveClockPanel from "./LiveClockPanel";
import MyHoursTable from "./MyHoursTable";
import type { HoursPeriod } from "./timePeriod";
import TeamHoursPanel from "./TeamHoursPanel";
import WeeklyHoursChart from "./WeeklyHoursChart";
import { formatHours, liveWorkedSeconds } from "./timeFormat";
import { timeApi } from "./timeApi";
import { useNow, useTimeQuery } from "./useTimeQuery";
import "./time.css";

// The overview plus when it arrived, so the live clock can follow the server's time, not the device's
type LoadedOverview = TimeOverview & { skewMs: number };

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

    // Every change bumps `refresh`, and each section reloads its own data
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

    const [chartWeek, setChartWeek] = useState<ISODate | null>(null);
    const [period, setPeriod] = useState<{ kind: HoursPeriod; anchor: ISODate | null }>({ kind: "week", anchor: null });
    const [adjust, setAdjust] = useState<{ date: ISODate | null; id: string | null }>({ date: null, id: null });
    const adjustRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    if (!overview) {
        return overviewQuery.failed ? (
            <div className="page">
                <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost" onClick={overviewQuery.retry}>{t.retry}</button>} />
            </div>
        ) : <LoadingState />;
    }

    const today = overview.today;
    const currentWeek = startOfWeek(today);

    // The running registration keeps counting between requests
    const active = overview.active;
    const liveExtraSeconds = active ? Math.max(0, liveWorkedSeconds(active, now) - liveWorkedSeconds(active, Date.parse(overview.serverTime))) : 0;
    const liveToday = active?.date === today ? liveExtraSeconds : 0;
    const liveWeek = active && active.date >= currentWeek ? liveExtraSeconds : 0;
    const todaySeconds = overview.todayMinutes * 60 + liveToday;
    const weekMinutes = overview.weekMinutes + Math.floor(liveWeek / 60);

    function editRegistration(registration: TimeRegistration) {
        setAdjust({ date: registration.date, id: registration.id });
        adjustRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function showWeekDetails(weekStart: ISODate) {
        setPeriod({ kind: "week", anchor: weekStart });
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <div className="page time-page">
            <PageHeader
                Icon={ClockIcon}
                title={t.title}
                lead={t.lead}
                aside={<p className="date-greeting"><span>{formatLongDate(today)}</span></p>}
            />

            <StatGrid label={t.statsLabel}>
                <StatCard label={t.statToday} value={formatHours(Math.floor(todaySeconds / 60))} Icon={ClockIcon}
                    hint={t.ofPlanned(formatHours(overview.todayPlannedMinutes))} />
                <StatCard label={t.statWeek} value={formatHours(weekMinutes)} Icon={CalendarIcon} tone="danger"
                    hint={t.ofPlanned(formatHours(overview.weekPlannedMinutes))} />
                <StatCard label={t.statMissing} value={overview.missingDaysThisMonth} Icon={AlertIcon} tone="pink" hint={t.missingHint} />
                <StatCard label={t.statPending} value={formatHours(overview.pendingMinutes)} Icon={CheckSquareIcon} tone="success"
                    hint={admin ? t.pendingTeamHint(overview.pendingEmployees) : t.pendingOwnHint} />
            </StatGrid>

            <div className="time-columns">
                <LiveClockPanel overview={overview} now={now} todaySeconds={todaySeconds} projects={projects} onChanged={changed}>
                    <WeeklyHoursChart
                        weekStart={chartWeek ?? currentWeek}
                        currentWeekStart={currentWeek}
                        refresh={refresh}
                        liveMinutes={active ? { date: active.date, minutes: Math.floor(liveWorkedSeconds(active, now) / 60) } : null}
                        onWeekChange={setChartWeek}
                        onSeeDetails={showWeekDetails}
                    />
                </LiveClockPanel>
                <div ref={adjustRef} className="time-anchor">
                    <AdjustHoursPanel
                        user={me}
                        admin={admin}
                        date={adjust.date ?? today}
                        selectedId={adjust.id}
                        today={today}
                        refresh={refresh}
                        projects={projects}
                        onDateChange={(date) => setAdjust({ date, id: null })}
                        onSaved={changed}
                    />
                </div>
            </div>

            <div className={`time-columns ${admin ? "time-columns--wide-aside" : "time-columns--single"}`}>
                <div ref={tableRef} className="time-anchor">
                    <MyHoursTable
                        period={period.kind}
                        anchor={period.anchor ?? today}
                        today={today}
                        admin={admin}
                        refresh={refresh}
                        projectsById={projectsById}
                        onPeriodChange={(kind, anchor) => setPeriod({ kind, anchor })}
                        onEdit={editRegistration}
                        onChanged={changed}
                    />
                </div>
                {admin && <TeamHoursPanel weekStart={currentWeek} refresh={refresh} onChanged={changed} />}
            </div>
        </div>
    );
}

export default TimeRegistrationPage;
