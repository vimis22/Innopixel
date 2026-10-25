import { useState } from "react";
import type { ISODate, Project } from "../../types/domain";
import type { TimeOverview } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import Panel from "../../components/ui/Panel";
import { EmptyState } from "../../components/ui/States";
import { AlertIcon, ArrowRightIcon, CalendarIcon, CheckSquareIcon, ClockIcon } from "../../components/icons/AppIcons";
import { addDays, formatDate, startOfWeek } from "../../utils/date";
import LiveClockPanel from "./LiveClockPanel";
import WeeklyHoursChart from "./WeeklyHoursChart";
import { TimeStatusPill } from "./TimeStatusPill";
import { formatClock, formatHours, liveWorkedSeconds } from "./timeFormat";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

const RECENT_DAYS = 14;
const RECENT_SHOWN = 5;

export type TimeTabKey = "overview" | "schedules" | "punches" | "approvals" | "reports";

interface OverviewTabProps {
    overview: TimeOverview;
    now: number;                 // server-corrected current time (ms)
    admin: boolean;
    projects: Project[];
    refresh: number;
    onChanged: () => void;
    onOpenTab: (tab: TimeTabKey, weekStart?: ISODate) => void;
}

// "Oversigt": today and this week at a glance, the clock-in/out, today's plan and the latest activity
function OverviewTab({ overview, now, admin, projects, refresh, onChanged, onOpenTab }: OverviewTabProps) {
    const t = useAppText().time;
    const today = overview.today;
    const currentWeek = startOfWeek(today);
    const [chartWeek, setChartWeek] = useState<ISODate | null>(null);
    const recent = useTimeQuery(() => timeApi.registrations(addDays(today, -(RECENT_DAYS - 1)), today), [today, refresh]);

    // The running registration keeps counting between requests
    const active = overview.active;
    const liveExtraSeconds = active ? Math.max(0, liveWorkedSeconds(active, now) - liveWorkedSeconds(active, Date.parse(overview.serverTime))) : 0;
    const todaySeconds = overview.todayMinutes * 60 + (active?.date === today ? liveExtraSeconds : 0);
    const weekMinutes = overview.weekMinutes + Math.floor((active && active.date >= currentWeek ? liveExtraSeconds : 0) / 60);
    const latest = recent.data ? [...recent.data].sort((a, b) => b.clockIn.localeCompare(a.clockIn)).slice(0, RECENT_SHOWN) : null;

    return (
        <div className="stack">
            <StatGrid label={t.statsLabel}>
                <StatCard label={t.statToday} value={formatHours(Math.floor(todaySeconds / 60))} Icon={ClockIcon}
                    hint={t.ofPlanned(formatHours(overview.todayPlannedMinutes))} />
                <StatCard label={t.statWeek} value={formatHours(weekMinutes)} Icon={CalendarIcon} tone="danger"
                    hint={t.ofPlanned(formatHours(overview.weekPlannedMinutes))} />
                <StatCard label={t.statMissing} value={overview.missingDaysThisMonth} Icon={AlertIcon} tone="pink" hint={t.missingHint}
                    onClick={() => onOpenTab("punches")} />
                <StatCard label={t.statPending} value={formatHours(overview.pendingMinutes)} Icon={CheckSquareIcon} tone="success"
                    hint={admin ? t.pendingTeamHint(overview.pendingEmployees) : t.pendingOwnHint} onClick={() => onOpenTab("approvals")} />
            </StatGrid>

            <div className="time-columns">
                <LiveClockPanel overview={overview} now={now} todaySeconds={todaySeconds} projects={projects} onChanged={onChanged}>
                    <WeeklyHoursChart
                        weekStart={chartWeek ?? currentWeek}
                        currentWeekStart={currentWeek}
                        refresh={refresh}
                        liveMinutes={active ? { date: active.date, minutes: Math.floor(liveWorkedSeconds(active, now) / 60) } : null}
                        onWeekChange={setChartWeek}
                        onSeeDetails={(weekStart) => onOpenTab("punches", weekStart)}
                    />
                </LiveClockPanel>

                <div className="side-column">
                    <Panel title={t.todayPlanTitle}>
                        <div className="today-plan">
                            <span className="today-plan-date"><strong>{Number(today.slice(8))}</strong>{formatDate(today, false).replace(/^\d+\.\s*/, "")}</span>
                            <div className="cell-text">
                                {overview.todayPlannedMinutes > 0 ? (
                                    <>
                                        <span className="cell-title">{t.hoursShort(formatHours(overview.todayPlannedMinutes))}</span>
                                        <span className="cell-sub">{t.standardShift}</span>
                                    </>
                                ) : <span className="cell-sub">{t.noShiftToday}</span>}
                            </div>
                            <button type="button" className="link-arrow" onClick={() => onOpenTab("schedules")}>{t.seeSchedule}<ArrowRightIcon aria-hidden="true" /></button>
                        </div>
                    </Panel>

                    <Panel
                        title={t.recentActivity}
                        action={<button type="button" className="link-arrow" onClick={() => onOpenTab("punches")}>{t.seeAll}<ArrowRightIcon aria-hidden="true" /></button>}
                    >
                        {recent.failed ? (
                            <p className="small text-danger" role="alert">{t.loadFailed}</p>
                        ) : latest === null ? (
                            <div className="time-adjust-loading" aria-hidden="true" />
                        ) : latest.length === 0 ? (
                            <EmptyState Icon={ClockIcon} title={t.noEvents} compact />
                        ) : (
                            <ul className="list">
                                {latest.map((r) => (
                                    <li key={r.id} className="list-row time-recent">
                                        <div className="cell-text">
                                            <span className="cell-title">{r.date === today ? t.todayCapital : formatDate(r.date)}</span>
                                            <span className="cell-sub">
                                                {formatClock(r.clockIn)}–{r.clockOut ? formatClock(r.clockOut) : "…"}
                                                {r.projectName && ` · ${r.projectName}`}
                                            </span>
                                        </div>
                                        <span className="small nowrap">{t.hoursShort(formatHours(r.workedMinutes))}</span>
                                        <TimeStatusPill status={r.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}

export default OverviewTab;
