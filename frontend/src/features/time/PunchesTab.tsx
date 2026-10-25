import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ISODate, Project, User } from "../../types/domain";
import type { TimeRegistration } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import ProjectThumb from "../../components/ui/ProjectThumb";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, PlusIcon } from "../../components/icons/AppIcons";
import { addDays, formatDate, formatMonth, isValidISODate, startOfMonth, startOfWeek } from "../../utils/date";
import RegistrationDrawer from "./RegistrationDrawer";
import { TimeStatusPill } from "./TimeStatusPill";
import { danishDate, downloadFile, formatClock, formatHours, formatSigned, numericDate, shiftMonth, toCsv, weekdayIndex } from "./timeFormat";
import { periodRange, type HoursPeriod } from "./timePeriod";
import { daysBetween, missingWorkdays, plannedMinutesIn } from "./timePlan";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

interface PunchesTabProps {
    me: User;
    admin: boolean;
    users: User[];               // employees an administrator may pick (active)
    today: ISODate;
    projects: Project[];
    projectsById: Map<string, Project>;
    refresh: number;
    onChanged: () => void;
}

type Opened = { registration: TimeRegistration | null; date: ISODate };

// "Stemplinger": the actual recorded time (never the plan), per employee and period, with corrections
function PunchesTab({ me, admin, users, today, projects, projectsById, refresh, onChanged }: PunchesTabProps) {
    const text = useAppText();
    const t = text.time;
    const [params, setParams] = useSearchParams();
    const requestedUser = params.get("user");
    const owner = (admin && users.find((u) => u.id === requestedUser)) || me;
    const [period, setPeriod] = useState<HoursPeriod>("week");
    // ?from= (e.g. "Se detaljer" under the week chart) opens a given period
    const [anchor, setAnchor] = useState<ISODate>(() => {
        const from = params.get("from");
        return from && isValidISODate(from) && from <= today ? from : today;
    });
    const [day, setDay] = useState<ISODate | null>(null);
    const [opened, setOpened] = useState<Opened | null>(null);

    const { from, to } = periodRange(period, anchor);
    const { data, failed, retry } = useTimeQuery(
        async () => ({ key: `${owner.id}|${from}`, list: await timeApi.registrations(from, to, owner.id === me.id ? undefined : owner.id) }),
        [owner.id, from, to, refresh],
    );
    const rows = data?.key === `${owner.id}|${from}` ? [...data.list].sort((a, b) => b.clockIn.localeCompare(a.clockIn)) : null;

    // As on the server: nothing is planned or missing before the account existed, and today is still open
    const created = danishDate(owner.createdAt);
    const countFrom = created > from ? created : from;
    const missing = useMemo(
        () => new Set(rows ? missingWorkdays(countFrom, to < today ? to : addDays(today, -1), rows) : []),
        [rows, countFrom, to, today],
    );
    const shown = rows?.filter((r) => !day || r.date === day) ?? null;
    const worked = rows?.reduce((sum, r) => sum + r.workedMinutes, 0) ?? 0;
    const planned = plannedMinutesIn(countFrom, to < today ? to : today, owner.expectedWeeklyHours);
    const minutesOn = (date: ISODate) => rows?.filter((r) => r.date === date).reduce((sum, r) => sum + r.workedMinutes, 0) ?? 0;

    const isCurrent = period === "week" ? from === startOfWeek(today) : from === startOfMonth(today);
    const rangeLabel = period === "week" ? t.weekOf(formatDate(from, false), formatDate(to)) : formatMonth(from);

    function shift(direction: 1 | -1) {
        setDay(null);
        setAnchor(period === "week" ? addDays(from, 7 * direction) : shiftMonth(from, direction));
    }

    function selectOwner(userId: string) {
        setDay(null);
        setParams((p) => {
            if (userId === me.id) p.delete("user");
            else p.set("user", userId);
            return p;
        }, { replace: true });
    }

    function exportCsv() {
        if (!rows) return;
        const header = [t.colDate, t.colDay, t.colIn, t.colOut, t.colBreak, t.colHours, t.colProject, t.colStatus, t.colRemarks];
        const lines = [...rows].reverse().map((r) => [
            numericDate(r.date),
            text.dates.weekdaysShort[weekdayIndex(r.date)],
            formatClock(r.clockIn),
            r.clockOut ? formatClock(r.clockOut) : "",
            String(r.breakMinutes),
            formatHours(r.workedMinutes),
            r.projectName ?? "",
            t.status[r.status],
            r.remarks ?? "",
        ]);
        downloadFile(t.exportFile(from, to), toCsv([header, ...lines]));
    }

    return (
        <div className="stack">
            <div className="toolbar">
                {admin && (
                    <label className="labelled-control">
                        {t.employee}
                        <select className="control" value={owner.id} onChange={(e) => selectOwner(e.target.value)}>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}{u.id === me.id ? ` (${text.team.you})` : ""}</option>)}
                        </select>
                    </label>
                )}
                <PillTabs
                    label={t.periodLabel}
                    value={period}
                    onChange={(value) => { setPeriod(value); setDay(null); setAnchor(from > today ? today : from); }}
                    options={[{ value: "week", label: t.weekly }, { value: "month", label: t.monthly }]}
                />
                <div className="time-nav time-period" role="group" aria-label={t.periodLabel}>
                    <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.previousPeriod} onClick={() => shift(-1)}><ChevronLeftIcon /></button>
                    <span className="time-period-label" aria-live="polite"><CalendarIcon aria-hidden="true" />{rangeLabel}</span>
                    <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.nextPeriod} disabled={isCurrent} onClick={() => shift(1)}><ChevronRightIcon /></button>
                </div>
                <div className="toolbar-end">
                    <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={exportCsv} disabled={!rows || rows.length === 0}>{t.export}</button>
                    <button type="button" className="app-btn app-btn--primary app-btn--sm" onClick={() => setOpened({ registration: null, date: day && day <= today ? day : today })}>
                        <PlusIcon aria-hidden="true" /> {t.addRegistration}
                    </button>
                </div>
            </div>

            <dl className="kpi-row">
                <div><dt>{t.kpiRegistered}</dt><dd>{formatHours(worked)}</dd></div>
                <div><dt>{t.kpiPlanned}</dt><dd>{formatHours(planned)}</dd></div>
                <div><dt>{t.kpiDifference}</dt><dd className={worked - planned < 0 ? "text-danger" : ""}>{formatSigned(worked - planned)}</dd></div>
                <div><dt>{t.statMissing}</dt><dd className={missing.size > 0 ? "text-danger" : ""}>{rows ? missing.size : "–"}</dd></div>
            </dl>

            <Panel title={t.calendarTitle} subtitle={t.calendarHint}>
                <div className={`punch-days punch-days--${period}`} role="group" aria-label={t.calendarTitle}>
                    {(period === "month" ? leadingBlanks(from) : []).map((key) => <span key={key} className="punch-day is-blank" aria-hidden="true" />)}
                    {daysBetween(from, to).map((date) => {
                        const minutes = minutesOn(date);
                        const isMissing = missing.has(date);
                        const future = date > today;
                        return (
                            <button
                                key={date}
                                type="button"
                                className={`punch-day ${isMissing ? "is-missing" : ""} ${day === date ? "is-selected" : ""} ${date === today ? "is-today" : ""}`}
                                aria-pressed={day === date}
                                disabled={future}
                                onClick={() => setDay(day === date ? null : date)}
                                aria-label={`${formatDate(date)}: ${isMissing ? t.missingPunch : t.hoursShort(formatHours(minutes))}`}
                            >
                                <span className="punch-day-name">{text.dates.weekdaysShort[weekdayIndex(date)]} {Number(date.slice(8))}.</span>
                                <span className="punch-day-hours">{future ? "" : isMissing ? t.missingShort : minutes > 0 ? formatHours(minutes) : "–"}</span>
                            </button>
                        );
                    })}
                </div>
            </Panel>

            <Panel
                title={day ? t.registrationsOn(formatDate(day)) : t.registrationsTitle}
                flush
                action={day && <button type="button" className="link-arrow" onClick={() => setDay(null)}>{t.showWholePeriod}</button>}
            >
                {failed ? (
                    <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={retry}>{t.retry}</button>} />
                ) : shown === null ? (
                    <div className="time-table-loading" aria-hidden="true" />
                ) : shown.length === 0 ? (
                    <EmptyState Icon={ClockIcon} title={day && missing.has(day) ? t.missingPunchText : t.noRegistrations} compact
                        action={day && day <= today && (
                            <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setOpened({ registration: null, date: day })}>
                                <PlusIcon aria-hidden="true" /> {t.addRegistration}
                            </button>
                        )}
                    />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="table time-table">
                                <thead>
                                    <tr>
                                        <th scope="col">{t.colDate}</th>
                                        <th scope="col">{t.colDay}</th>
                                        <th scope="col">{t.colIn}</th>
                                        <th scope="col">{t.colOut}</th>
                                        <th scope="col">{t.colBreak}</th>
                                        <th scope="col" className="num">{t.colHours}</th>
                                        <th scope="col">{t.colProject}</th>
                                        <th scope="col">{t.colStatus}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.map((r) => {
                                        const project = r.projectId ? projectsById.get(r.projectId) : undefined;
                                        return (
                                            <tr key={r.id} className={`is-clickable ${r.status === "ACTIVE" ? "is-live" : ""}`} onClick={() => setOpened({ registration: r, date: r.date })}>
                                                <td className="nowrap">
                                                    <button type="button" className="cell-title time-row-button" onClick={(e) => { e.stopPropagation(); setOpened({ registration: r, date: r.date }); }}>
                                                        {numericDate(r.date)}
                                                    </button>
                                                </td>
                                                <td>{text.dates.weekdaysShort[weekdayIndex(r.date)]}</td>
                                                <td className="nowrap">{formatClock(r.clockIn)}</td>
                                                <td className="nowrap">{r.clockOut ? formatClock(r.clockOut) : "–"}</td>
                                                <td className="nowrap">{t.minutesShort(r.breakMinutes)}</td>
                                                <td className="num nowrap">{formatHours(r.workedMinutes)}</td>
                                                <td>
                                                    {r.projectName ? (
                                                        <span className="cell-main" title={r.remarks ?? undefined}>
                                                            <ProjectThumb project={project ?? { name: r.projectName, imageUrl: null }} size="sm" />
                                                            <span className="truncate">{r.projectName}</span>
                                                        </span>
                                                    ) : <span className="muted" title={r.remarks ?? undefined}>–</span>}
                                                </td>
                                                <td><TimeStatusPill status={r.status} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="table-footer time-table-footer">{t.totalLabel(formatHours(shown.reduce((sum, r) => sum + r.workedMinutes, 0)))}</p>
                    </>
                )}
            </Panel>

            {opened && (
                <RegistrationDrawer
                    key={opened.registration?.id ?? `new-${opened.date}`}
                    registration={opened.registration}
                    date={opened.date}
                    today={today}
                    owner={owner}
                    me={me}
                    admin={admin}
                    projects={projects}
                    onClose={() => setOpened(null)}
                    onChanged={onChanged}
                />
            )}
        </div>
    );
}

// Empty cells before the 1st, so a month starts under its weekday
function leadingBlanks(monthStart: ISODate): string[] {
    return Array.from({ length: weekdayIndex(monthStart) }, (_, i) => `blank-${i}`);
}

export default PunchesTab;
