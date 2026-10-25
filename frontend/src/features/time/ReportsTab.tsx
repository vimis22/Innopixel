import { useMemo, useState } from "react";
import type { ISODate, Project, User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import ProgressBar from "../../components/ui/ProgressBar";
import { UserChip } from "../../components/ui/Avatar";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { TrendIcon } from "../../components/icons/AppIcons";
import { addDays, diffDays, formatDate, isValidISODate, startOfMonth, startOfWeek } from "../../utils/date";
import { danishDate, downloadFile, endOfMonth, formatClock, formatHours, formatSigned, numericDate, shiftMonth, toCsv } from "./timeFormat";
import { minutesByProject, missingWorkdays, plannedMinutesIn } from "./timePlan";
import { useRegistrationsFor } from "./useRegistrations";

const MAX_DAYS = 93;             // the server's limit per request
type Preset = "week" | "month" | "lastMonth" | "custom";
const NO_PROJECT = "none";

interface ReportsTabProps {
    me: User;
    admin: boolean;
    users: User[];               // active employees
    today: ISODate;
    projects: Project[];
    refresh: number;
}

function presetRange(preset: Exclude<Preset, "custom">, today: ISODate): { from: ISODate; to: ISODate } {
    if (preset === "week") return { from: startOfWeek(today), to: addDays(startOfWeek(today), 6) };
    if (preset === "month") return { from: startOfMonth(today), to: endOfMonth(today) };
    const from = shiftMonth(today, -1);
    return { from, to: endOfMonth(from) };
}

// "Rapportering": registered against planned hours per employee and per project for a period, with CSV export
function ReportsTab({ me, admin, users, today, projects, refresh }: ReportsTabProps) {
    const text = useAppText();
    const t = text.time;
    const [preset, setPreset] = useState<Preset>("month");
    const [custom, setCustom] = useState(() => presetRange("month", today));
    const [userId, setUserId] = useState("");
    const [projectId, setProjectId] = useState("");

    const range = preset === "custom" ? custom : presetRange(preset, today);
    const rangeError = !isValidISODate(range.from) || !isValidISODate(range.to) || range.to < range.from
        ? t.validation.rangeInvalid
        : diffDays(range.from, range.to) + 1 > MAX_DAYS ? t.rangeTooLong(MAX_DAYS) : null;

    const people = useMemo(() => (admin ? users.filter((u) => !userId || u.id === userId) : [me]), [admin, users, userId, me]);
    const ids = useMemo(() => (rangeError ? [] : people.map((u) => u.id)), [people, rangeError]);
    const { data, failed, retry } = useRegistrationsFor(ids, range.from, range.to, refresh);

    const report = useMemo(() => {
        if (!data) return null;
        const until = range.to < today ? range.to : today;
        const rows = people.map((user) => {
            const all = data.byUser.get(user.id) ?? [];
            const registrations = projectId ? all.filter((r) => (projectId === NO_PROJECT ? r.projectId === null : r.projectId === projectId)) : all;
            // As on the server: nothing is planned or missing before the account existed, and today is still open
            const created = danishDate(user.createdAt);
            const countFrom = created > range.from ? created : range.from;
            const registered = registrations.reduce((sum, r) => sum + r.workedMinutes, 0);
            const planned = plannedMinutesIn(countFrom, until, user.expectedWeeklyHours);
            return {
                user,
                registrations,
                registered,
                planned,
                missing: missingWorkdays(countFrom, range.to < today ? range.to : addDays(today, -1), all).length,
                pending: registrations.filter((r) => r.status === "PENDING").length,
            };
        });
        const registrations = rows.flatMap((r) => r.registrations);
        return {
            rows,
            registrations,
            registered: rows.reduce((sum, r) => sum + r.registered, 0),
            planned: rows.reduce((sum, r) => sum + r.planned, 0),
            overtime: rows.reduce((sum, r) => sum + Math.max(0, r.registered - r.planned), 0),
            missing: rows.reduce((sum, r) => sum + r.missing, 0),
            pending: rows.reduce((sum, r) => sum + r.pending, 0),
            byProject: minutesByProject(registrations, t.noProject),
        };
    }, [data, people, projectId, range.from, range.to, today, t.noProject]);

    // With a project filter, the plan (which isn't per project) can't be compared
    const comparePlan = !projectId;
    const maxEmployee = Math.max(1, ...(report?.rows.map((r) => Math.max(r.registered, comparePlan ? r.planned : 0)) ?? []));
    const maxProject = Math.max(1, ...(report?.byProject.map((p) => p.minutes) ?? []));

    function exportCsv() {
        if (!report) return;
        const name = new Map(users.map((u) => [u.id, u.name]));
        const header = [t.employee, t.colDate, t.colIn, t.colOut, t.colBreak, t.colHours, t.colProject, t.colStatus, t.colRemarks];
        const lines = [...report.registrations].sort((a, b) => a.clockIn.localeCompare(b.clockIn)).map((r) => [
            name.get(r.userId) ?? me.name,
            numericDate(r.date),
            formatClock(r.clockIn),
            r.clockOut ? formatClock(r.clockOut) : "",
            String(r.breakMinutes),
            formatHours(r.workedMinutes),
            r.projectName ?? "",
            t.status[r.status],
            r.remarks ?? "",
        ]);
        downloadFile(t.reportFile(range.from, range.to), toCsv([header, ...lines]));
    }

    return (
        <div className="stack">
            <div className="toolbar">
                <PillTabs
                    label={t.periodLabel}
                    value={preset}
                    onChange={(value) => {
                        if (value === "custom" && preset !== "custom") setCustom(range);
                        setPreset(value);
                    }}
                    options={[
                        { value: "week", label: t.weekTitle },
                        { value: "month", label: t.thisMonth },
                        { value: "lastMonth", label: t.lastMonth },
                        { value: "custom", label: t.customPeriod },
                    ]}
                />
                {preset === "custom" && (
                    <span className="date-range">
                        <label className="sr-only" htmlFor="report-from">{t.fromDate}</label>
                        <input id="report-from" type="date" className="control" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
                        <span aria-hidden="true">–</span>
                        <label className="sr-only" htmlFor="report-to">{t.toDate}</label>
                        <input id="report-to" type="date" className="control" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
                    </span>
                )}
                {admin && (
                    <select className="control" aria-label={t.employee} value={userId} onChange={(e) => setUserId(e.target.value)}>
                        <option value="">{t.allEmployees}</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                )}
                <select className="control" aria-label={t.colProject} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">{t.allProjects}</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    <option value={NO_PROJECT}>{t.noProject}</option>
                </select>
                <button type="button" className="app-btn app-btn--ghost app-btn--sm toolbar-end" onClick={exportCsv} disabled={!report || report.registrations.length === 0}>
                    {t.export}
                </button>
            </div>

            <p className="small text-secondary" aria-live="polite">{t.reportRange(formatDate(range.from), formatDate(range.to))}</p>

            {rangeError ? (
                <p className="field-error" role="alert">{rangeError}</p>
            ) : failed ? (
                <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={retry}>{t.retry}</button>} />
            ) : !report ? (
                <div className="time-table-loading" aria-hidden="true" />
            ) : (
                <>
                    <dl className="kpi-row">
                        <div><dt>{t.kpiRegistered}</dt><dd>{formatHours(report.registered)}</dd></div>
                        {comparePlan && <div><dt>{t.kpiPlanned}</dt><dd>{formatHours(report.planned)}</dd></div>}
                        {comparePlan && <div><dt>{t.kpiDifference}</dt><dd className={report.registered < report.planned ? "text-danger" : ""}>{formatSigned(report.registered - report.planned)}</dd></div>}
                        {comparePlan && <div><dt>{t.kpiOvertime}</dt><dd>{formatHours(report.overtime)}</dd></div>}
                        <div><dt>{t.statMissing}</dt><dd className={report.missing > 0 ? "text-danger" : ""}>{report.missing}</dd></div>
                        <div><dt>{t.statPending}</dt><dd>{report.pending}</dd></div>
                    </dl>
                    {!comparePlan && <p className="field-hint">{t.projectFilterHint}</p>}

                    <div className="page-columns page-columns--even">
                        <Panel title={admin ? t.byEmployee : t.myHoursTitle} subtitle={comparePlan ? t.byEmployeeHint : undefined}>
                            <ul className="report-bars">
                                {report.rows.map((row) => (
                                    <li key={row.user.id}>
                                        <div className="report-bar-head">
                                            <UserChip user={row.user} fallback="" />
                                            <span className="small nowrap">
                                                <strong>{formatHours(row.registered)}</strong>
                                                {comparePlan && <span className="muted"> / {formatHours(row.planned)} · {formatSigned(row.registered - row.planned)}</span>}
                                            </span>
                                        </div>
                                        <ProgressBar
                                            value={(row.registered / maxEmployee) * 100}
                                            marker={comparePlan ? (row.planned / maxEmployee) * 100 : undefined}
                                            markerLabel={t.legendPlanned}
                                            label={t.employeeBarLabel(row.user.name, formatHours(row.registered), formatHours(row.planned))}
                                            tone={comparePlan && row.registered < row.planned ? "warning" : "brand"}
                                            size="sm"
                                            showValue={false}
                                        />
                                        {(row.missing > 0 || row.pending > 0) && (
                                            <p className="xsmall text-secondary">
                                                {row.missing > 0 && <span className="text-danger">{t.missingDaysCount(row.missing)}</span>}
                                                {row.missing > 0 && row.pending > 0 && " · "}
                                                {row.pending > 0 && t.pendingCount(row.pending)}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </Panel>

                        <Panel title={t.byProject}>
                            {report.byProject.length === 0 ? (
                                <EmptyState Icon={TrendIcon} title={t.noRegistrations} compact />
                            ) : (
                                <ul className="report-bars">
                                    {report.byProject.map((p) => (
                                        <li key={p.name}>
                                            <div className="report-bar-head">
                                                <span className="truncate">{p.name}</span>
                                                <span className="small nowrap"><strong>{formatHours(p.minutes)}</strong> <span className="muted">({Math.round((p.minutes / Math.max(1, report.registered)) * 100)} %)</span></span>
                                            </div>
                                            <ProgressBar value={(p.minutes / maxProject) * 100} label={`${p.name}: ${t.hoursShort(formatHours(p.minutes))}`} size="sm" showValue={false} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </div>
                </>
            )}
        </div>
    );
}

export default ReportsTab;
