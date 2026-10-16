import type { ISODate, Project } from "../../types/domain";
import type { TimeRegistration, TimeStatus } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import ActionMenu, { type MenuAction } from "../../components/ui/ActionMenu";
import ProjectThumb from "../../components/ui/ProjectThumb";
import { Pill, type PillTone } from "../../components/ui/Badges";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, EditIcon, TrashIcon } from "../../components/icons/AppIcons";
import { addDays, formatDate, formatMonth, startOfMonth, startOfWeek } from "../../utils/date";
import { periodRange, type HoursPeriod } from "./timePeriod";
import { downloadFile, formatClock, formatHours, numericDate, shiftMonth, toCsv, weekdayIndex } from "./timeFormat";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

const statusTone: Record<TimeStatus, PillTone> = { ACTIVE: "accent", PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export function TimeStatusPill({ status }: { status: TimeStatus }) {
    const t = useAppText().time;
    return <Pill tone={statusTone[status]}>{t.status[status]}</Pill>;
}

interface MyHoursTableProps {
    period: HoursPeriod;
    anchor: ISODate;             // any day inside the period shown
    today: ISODate;
    admin: boolean;
    refresh: number;
    projectsById: Map<string, Project>;
    onPeriodChange: (period: HoursPeriod, anchor: ISODate) => void;
    onEdit: (registration: TimeRegistration) => void;
    onChanged: () => void;
}

// "Mine løntimer": the user's own registrations for a week or a month, with CSV export
function MyHoursTable({ period, anchor, today, admin, refresh, projectsById, onPeriodChange, onEdit, onChanged }: MyHoursTableProps) {
    const text = useAppText();
    const t = text.time;
    const run = useRunAction();
    const { confirm } = useFeedback();
    const { from, to } = periodRange(period, anchor);
    const { data, failed, retry } = useTimeQuery(async () => ({ from, list: await timeApi.registrations(from, to) }), [from, to, refresh]);

    const rows = data?.from === from
        ? [...data.list].sort((a, b) => b.clockIn.localeCompare(a.clockIn))
        : null;
    const total = rows?.reduce((sum, r) => sum + r.workedMinutes, 0) ?? 0;
    const isCurrent = period === "week" ? from === startOfWeek(today) : from === startOfMonth(today);
    const shift = (direction: 1 | -1) => onPeriodChange(period, period === "week" ? addDays(from, 7 * direction) : shiftMonth(from, direction));
    const rangeLabel = period === "week" ? t.weekOf(formatDate(from, false), formatDate(to)) : formatMonth(from);

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

    async function remove(registration: TimeRegistration) {
        const yes = await confirm({ title: t.deleteTitle, message: t.deleteMessage(numericDate(registration.date)), confirmLabel: text.common.delete, danger: true });
        if (!yes) return;
        if (await run(() => timeApi.remove(registration.id), t.deleted_toast)) onChanged();
    }

    // Approved registrations are locked for employees (the server enforces the same rule)
    function actionsFor(registration: TimeRegistration): MenuAction[] {
        if (!admin && registration.status === "APPROVED") return [];
        return [
            { label: text.common.edit, Icon: EditIcon, onSelect: () => onEdit(registration) },
            { label: text.common.delete, Icon: TrashIcon, onSelect: () => void remove(registration), danger: true },
        ];
    }

    return (
        <Panel
            title={t.myHoursTitle}
            flush
            className="time-hours-panel"
            action={
                <div className="toolbar">
                    <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={exportCsv} disabled={!rows || rows.length === 0}>
                        {t.export}
                    </button>
                    <div className="time-nav time-period" role="group" aria-label={t.periodLabel}>
                        <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.previousPeriod} onClick={() => shift(-1)}>
                            <ChevronLeftIcon />
                        </button>
                        <span className="time-period-label" aria-live="polite"><CalendarIcon aria-hidden="true" />{rangeLabel}</span>
                        <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.nextPeriod} disabled={isCurrent} onClick={() => shift(1)}>
                            <ChevronRightIcon />
                        </button>
                    </div>
                    <PillTabs
                        label={t.periodLabel}
                        value={period}
                        onChange={(value) => onPeriodChange(value, from > today ? today : from)}
                        options={[{ value: "week", label: t.weekly }, { value: "month", label: t.monthly }]}
                    />
                </div>
            }
        >
            {failed ? (
                <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={retry}>{t.retry}</button>} />
            ) : rows === null ? (
                <div className="time-table-loading" aria-hidden="true" />
            ) : rows.length === 0 ? (
                <EmptyState Icon={ClockIcon} title={t.noRegistrations} compact />
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
                                    <th scope="col" className="col-actions"><span className="sr-only">{text.common.details}</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => {
                                    const project = r.projectId ? projectsById.get(r.projectId) : undefined;
                                    return (
                                        <tr key={r.id} className={r.status === "ACTIVE" ? "is-live" : undefined}>
                                            <td className="nowrap">{numericDate(r.date)}</td>
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
                                            <td className="col-actions">
                                                <ActionMenu label={`${text.common.details} ${numericDate(r.date)}`} actions={actionsFor(r)} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="table-footer time-table-footer">{t.totalLabel(formatHours(total))}</p>
                </>
            )}
        </Panel>
    );
}

export default MyHoursTable;
