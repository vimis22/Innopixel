import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { addDays, startOfWeek, todayISO } from "../../utils/date";
import { useRunAction } from "../../components/ui/Feedback";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { ArrowRightIcon, ClockIcon } from "../../components/icons/AppIcons";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import { TimeStatusPill } from "../time/TimeStatusPill";
import { formatClock, formatHours, numericDate } from "../time/timeFormat";
import { timeApi } from "../time/timeApi";
import { useTimeQuery } from "../time/useTimeQuery";

const RECENT_DAYS = 14;
const WORKDAYS = 5;              // the backend spreads the planned hours over Monday–Friday

interface EmployeeTimeTabProps {
    user: User;
    onDirtyChange: (dirty: boolean) => void;
}

// "Tidsregistrering" for one employee (administrators): planned hours, this week and the latest records
function EmployeeTimeTab({ user, onDirtyChange }: EmployeeTimeTabProps) {
    const text = useAppText();
    const t = text.team;
    const tt = text.time;
    const { actions } = useWorkspaceData();
    const run = useRunAction();
    const today = todayISO();
    const weekStart = startOfWeek(today);
    const team = useTimeQuery(() => timeApi.team(weekStart), [weekStart]);
    const recent = useTimeQuery(() => timeApi.registrations(addDays(today, -(RECENT_DAYS - 1)), today, user.id), [user.id, today]);
    const member = team.data?.members.find((m) => m.userId === user.id);

    const [hours, setHours] = useState(String(user.expectedWeeklyHours));
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const dirty = hours !== String(user.expectedWeeklyHours);
    useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

    async function saveHours(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const value = Number(hours);
        if (hours.trim() === "" || !Number.isFinite(value) || value < 0 || value > 80 || !Number.isInteger(value * 2)) {
            return setError(t.validation.expectedHoursInvalid);
        }
        setError(null);
        setSaving(true);
        const { name, email, role, title, department, phone } = user;
        await run(() => actions.updateUser(user.id, { name, email, role, title, department, phone, expectedWeeklyHours: value }), t.updated_toast);
        setSaving(false);
    }

    const rows = recent.data ? [...recent.data].sort((a, b) => b.clockIn.localeCompare(a.clockIn)).slice(0, 6) : null;

    return (
        <div className="stack">
            <form className="employee-hours" onSubmit={saveHours} noValidate>
                <div className={`field ${error ? "field--invalid" : ""}`}>
                    <label htmlFor="employee-hours">{t.expectedHours}</label>
                    <div className="employee-hours-row">
                        <input
                            id="employee-hours" type="number" min={0} max={80} step={0.5} inputMode="decimal"
                            value={hours} onChange={(e) => setHours(e.target.value)} disabled={saving}
                            aria-invalid={Boolean(error)} aria-describedby={error ? "employee-hours-error" : "employee-hours-hint"}
                        />
                        <button type="submit" className="app-btn app-btn--primary app-btn--sm" disabled={!dirty || saving}>
                            {saving ? text.common.saving : text.common.save}
                        </button>
                    </div>
                    {error ? <p id="employee-hours-error" className="field-error">{error}</p> : <p id="employee-hours-hint" className="field-hint">{t.expectedHoursHint}</p>}
                </div>
                <div className="field">
                    <span className="field-label">{t.workdays}</span>
                    <ul className="weekday-chips" aria-label={t.workdays}>
                        {text.dates.weekdaysShort.map((day, i) => (
                            <li key={day} className={i < WORKDAYS ? "is-on" : ""}>{day}<span className="sr-only">{i < WORKDAYS ? ` – ${t.workday}` : ""}</span></li>
                        ))}
                    </ul>
                    <p className="field-hint">{t.workdaysHint(formatHours((user.expectedWeeklyHours / WORKDAYS) * 60))}</p>
                </div>
            </form>

            {team.failed ? (
                <ErrorState title={tt.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={team.retry}>{tt.retry}</button>} />
            ) : (
                <dl className="kpi-row" aria-busy={!team.data}>
                    <div><dt>{t.weekRegistered}</dt><dd>{member ? formatHours(member.workedMinutes) : "–"}<small> / {member ? formatHours(member.expectedMinutes) : "–"}</small></dd></div>
                    <div><dt>{t.missingDays}</dt><dd className={member && member.missingDays > 0 ? "text-danger" : ""}>{member?.missingDays ?? "–"}</dd></div>
                    <div><dt>{t.pendingApprovals}</dt><dd>{member?.pendingCount ?? "–"}</dd></div>
                </dl>
            )}

            <section className="detail-section">
                <h3 className="detail-section-title">{t.recentRecords}</h3>
                {recent.failed ? (
                    <ErrorState title={tt.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={recent.retry}>{tt.retry}</button>} />
                ) : rows === null ? (
                    <div className="time-table-loading" aria-hidden="true" />
                ) : rows.length === 0 ? (
                    <EmptyState Icon={ClockIcon} title={t.noRecords(RECENT_DAYS)} compact />
                ) : (
                    <div className="table-wrap">
                        <table className="table table--compact">
                            <thead>
                                <tr>
                                    <th scope="col">{tt.colDate}</th>
                                    <th scope="col">{tt.colIn}</th>
                                    <th scope="col">{tt.colOut}</th>
                                    <th scope="col" className="num">{tt.colHours}</th>
                                    <th scope="col">{tt.colStatus}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id}>
                                        <td className="nowrap">{numericDate(r.date)}</td>
                                        <td>{formatClock(r.clockIn)}</td>
                                        <td>{r.clockOut ? formatClock(r.clockOut) : "–"}</td>
                                        <td className="num">{formatHours(r.workedMinutes)}</td>
                                        <td><TimeStatusPill status={r.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Link to={`${APP_ROUTES.time}?tab=punches&user=${encodeURIComponent(user.id)}`} className="link-arrow">
                {t.seeFullTime} <ArrowRightIcon aria-hidden="true" />
            </Link>
        </div>
    );
}

export default EmployeeTimeTab;
