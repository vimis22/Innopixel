import { useState } from "react";
import { Link } from "react-router-dom";
import type { ISODate, User } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import Drawer from "../../components/ui/Drawer";
import { Avatar, UserChip } from "../../components/ui/Avatar";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { ArrowRightIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, UsersIcon } from "../../components/icons/AppIcons";
import { addDays, formatDate, formatLongDate, formatMonth, startOfMonth, startOfWeek } from "../../utils/date";
import { TimeStatusPill } from "./TimeStatusPill";
import { danishDate, endOfMonth, formatClock, formatHours, formatSigned, shiftMonth, weekdayIndex } from "./timeFormat";
import { daysBetween, plannedMinutes } from "./timePlan";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

type View = "day" | "week" | "month";

function viewRange(view: View, anchor: ISODate): { from: ISODate; to: ISODate } {
    if (view === "day") return { from: anchor, to: anchor };
    if (view === "week") return { from: startOfWeek(anchor), to: addDays(startOfWeek(anchor), 6) };
    return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
}

interface SchedulesTabProps {
    me: User;
    admin: boolean;
    users: User[];               // active employees
    today: ISODate;
}

/*
 * "Arbejdsplaner": the planned working time per employee and day. The backend has no shifts yet
 * (no create, edit, delete, accept or decline), so the plan shown is the standard plan the system
 * uses everywhere: the weekly hours spread over Monday–Friday. Actual time lives under Stemplinger.
 */
function SchedulesTab({ me, admin, users, today }: SchedulesTabProps) {
    const text = useAppText();
    const t = text.time;
    const [view, setView] = useState<View>("week");
    const [anchor, setAnchor] = useState<ISODate>(today);
    const [department, setDepartment] = useState("");
    const [userId, setUserId] = useState("");
    const [opened, setOpened] = useState<{ user: User; date: ISODate } | null>(null);

    const { from, to } = viewRange(view, anchor);
    const days = daysBetween(from, to);
    const departments = [...new Set(users.map((u) => u.department).filter((d): d is string => Boolean(d)))].sort();
    const people = admin
        ? users.filter((u) => (!department || u.department === department) && (!userId || u.id === userId))
        : [me];
    const label = view === "day" ? formatLongDate(from) : view === "week" ? t.weekOf(formatDate(from, false), formatDate(to)) : formatMonth(from);
    // Nothing is planned before an account existed (as on the server)
    const plannedFor = (user: User, date: ISODate) => (date < danishDate(user.createdAt) ? 0 : plannedMinutes(date, user.expectedWeeklyHours));

    function shift(direction: 1 | -1) {
        setAnchor(view === "day" ? addDays(anchor, direction) : view === "week" ? addDays(from, 7 * direction) : shiftMonth(from, direction));
    }

    return (
        <div className="stack">
            <p className="notice"><InfoIcon aria-hidden="true" />{admin ? t.schedulesAdminNotice : t.schedulesNotice}</p>

            <div className="toolbar">
                <PillTabs
                    label={t.viewLabel}
                    value={view}
                    onChange={setView}
                    options={[{ value: "day", label: text.gantt.day }, { value: "week", label: text.gantt.week }, { value: "month", label: text.gantt.month }]}
                />
                <div className="time-nav time-period" role="group" aria-label={t.periodLabel}>
                    <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.previousPeriod} onClick={() => shift(-1)}><ChevronLeftIcon /></button>
                    <span className="time-period-label" aria-live="polite"><CalendarIcon aria-hidden="true" />{label}</span>
                    <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.nextPeriod} onClick={() => shift(1)}><ChevronRightIcon /></button>
                </div>
                <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setAnchor(today)}>{text.gantt.today}</button>
                {admin && (
                    <div className="toolbar-end">
                        <select className="control" aria-label={text.team.department} value={department} onChange={(e) => setDepartment(e.target.value)}>
                            <option value="">{text.team.allDepartments}</option>
                            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select className="control" aria-label={t.employee} value={userId} onChange={(e) => setUserId(e.target.value)}>
                            <option value="">{t.allEmployees}</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <Panel flush>
                {people.length === 0 ? (
                    <EmptyState Icon={UsersIcon} title={text.team.noMembersFound} compact />
                ) : (
                    <div className="table-wrap">
                        <table className={`table schedule-table schedule-table--${view}`}>
                            <caption className="sr-only">{t.scheduleCaption(label)}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className="schedule-name">{t.employee}</th>
                                    {days.map((day) => (
                                        <th key={day} scope="col" className={`schedule-day ${day === today ? "is-today" : ""} ${weekdayIndex(day) >= 5 ? "is-weekend" : ""}`}>
                                            <span>{text.dates.weekdaysShort[weekdayIndex(day)]}</span>
                                            <span>{Number(day.slice(8))}</span>
                                        </th>
                                    ))}
                                    <th scope="col" className="num">{t.colTotal}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {people.map((user) => (
                                    <tr key={user.id}>
                                        <th scope="row" className="schedule-name">
                                            <span className="cell-main">
                                                <Avatar user={user} size="xs" showTitle={false} />
                                                <span className="truncate">{user.name}</span>
                                            </span>
                                        </th>
                                        {days.map((day) => {
                                            const minutes = plannedFor(user, day);
                                            return (
                                                <td key={day} className={`schedule-cell ${day === today ? "is-today" : ""}`}>
                                                    {minutes > 0 ? (
                                                        <button
                                                            type="button"
                                                            className="schedule-shift"
                                                            onClick={() => setOpened({ user, date: day })}
                                                            aria-label={t.shiftLabel(user.name, formatDate(day), formatHours(minutes))}
                                                        >
                                                            {formatHours(minutes)}
                                                        </button>
                                                    ) : <span className="muted" aria-label={t.noShift}>–</span>}
                                                </td>
                                            );
                                        })}
                                        <td className="num nowrap"><strong>{formatHours(days.reduce((sum, day) => sum + plannedFor(user, day), 0))}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {opened && <PlannedDayDrawer user={opened.user} date={opened.date} today={today} me={me} planned={plannedFor(opened.user, opened.date)} onClose={() => setOpened(null)} />}
        </div>
    );
}

// One planned day next to what was actually registered that day
function PlannedDayDrawer({ user, date, today, me, planned, onClose }: { user: User; date: ISODate; today: ISODate; me: User; planned: number; onClose: () => void }) {
    const text = useAppText();
    const t = text.time;
    const past = date <= today;
    const { data, failed, retry } = useTimeQuery(
        () => (past ? timeApi.registrations(date, date, user.id === me.id ? undefined : user.id) : Promise.resolve([])),
        [date, user.id],
    );
    const worked = data?.reduce((sum, r) => sum + r.workedMinutes, 0) ?? 0;

    return (
        <Drawer open title={formatLongDate(date)} subtitle={<UserChip user={user} fallback="" />} onClose={onClose} closeLabel={t.close}>
            <dl className="detail-facts">
                <div><dt>{t.shiftType}</dt><dd>{t.standardShift}</dd></div>
                <div><dt>{t.kpiPlanned}</dt><dd>{t.hoursShort(formatHours(planned))}</dd></div>
                <div><dt>{t.weeklyBasis}</dt><dd>{t.hoursShort(formatHours(user.expectedWeeklyHours * 60))}</dd></div>
                {past && data && <div><dt>{t.kpiRegistered}</dt><dd>{t.hoursShort(formatHours(worked))}</dd></div>}
                {past && data && <div><dt>{t.kpiDifference}</dt><dd className={worked < planned ? "text-danger" : ""}>{formatSigned(worked - planned)}</dd></div>}
            </dl>

            <section className="detail-section">
                <h3 className="detail-section-title">{t.actualTitle}</h3>
                {!past ? (
                    <p className="small muted">{t.futureDay}</p>
                ) : failed ? (
                    <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={retry}>{t.retry}</button>} />
                ) : !data ? (
                    <div className="time-table-loading" aria-hidden="true" />
                ) : data.length === 0 ? (
                    <p className="small text-danger">{date < today ? t.missingPunchText : t.noRegistrationsYet}</p>
                ) : (
                    <ul className="list">
                        {data.map((r) => (
                            <li key={r.id} className="list-row planned-actual">
                                <span>{formatClock(r.clockIn)}–{r.clockOut ? formatClock(r.clockOut) : "…"}</span>
                                <span className="muted small">{t.colBreak.toLowerCase()} {t.minutesShort(r.breakMinutes)}</span>
                                <strong>{t.hoursShort(formatHours(r.workedMinutes))}</strong>
                                <TimeStatusPill status={r.status} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p className="notice"><InfoIcon aria-hidden="true" />{t.shiftActionsUnavailable}</p>

            {past && (
                <Link to={`${APP_ROUTES.time}?tab=punches${user.id === me.id ? "" : `&user=${encodeURIComponent(user.id)}`}`} className="link-arrow" onClick={onClose}>
                    {t.openPunches} <ArrowRightIcon aria-hidden="true" />
                </Link>
            )}
        </Drawer>
    );
}

export default SchedulesTab;
