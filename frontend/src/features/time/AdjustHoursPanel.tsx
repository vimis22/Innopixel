import { useState, type FormEvent } from "react";
import type { ISODate, Project, User } from "../../types/domain";
import type { TimeRegistration, TimeRegistrationInput } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import { Avatar } from "../../components/ui/Avatar";
import { useRunAction } from "../../components/ui/Feedback";
import { ChevronLeftIcon, ChevronRightIcon } from "../../components/icons/AppIcons";
import { addDays, formatLongDate, isValidISODate } from "../../utils/date";
import { formatClock, formatHours, formWorkedMinutes, parseClock, spanMinutes } from "./timeFormat";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

const MAX_REMARKS = 2000;

interface AdjustHoursPanelProps {
    user: User;
    admin: boolean;
    date: ISODate;
    selectedId: string | null;   // a registration picked in "Mine løntimer"; otherwise the day's latest
    today: ISODate;
    refresh: number;
    projects: Project[];
    onDateChange: (date: ISODate) => void;
    onSaved: () => void;
}

// "Juster løntimer": correct or add a registration for a day. The server validates everything again
// (times, breaks, overlaps, permissions); a change made by an employee has to be approved again.
function AdjustHoursPanel({ user, admin, date, selectedId, today, refresh, projects, onDateChange, onSaved }: AdjustHoursPanelProps) {
    const text = useAppText();
    const t = text.time;
    const { data } = useTimeQuery(async () => ({ date, list: await timeApi.registrations(date, date) }), [date, refresh]);
    const [resetKey, setResetKey] = useState(0);

    // Until the chosen day has loaded, show nothing rather than the previous day's values
    const forDay = data?.date === date ? data.list : null;
    const registration = forDay ? (forDay.find((r) => r.id === selectedId) ?? forDay.at(-1) ?? null) : undefined;

    return (
        <Panel title={t.adjustTitle} className="time-adjust-panel">
            <div className="time-adjust-user">
                <Avatar user={user} size="md" showTitle={false} />
                <div>
                    <strong>{user.name}</strong>
                    <span>{user.title || text.roles[user.role]}</span>
                </div>
            </div>

            <div className="time-adjust-date">
                <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.previousDay} onClick={() => onDateChange(addDays(date, -1))}>
                    <ChevronLeftIcon />
                </button>
                <label className="time-adjust-date-field">
                    <span className="sr-only">{t.dateLabel}</span>
                    <input
                        type="date" className="control" value={date} max={today}
                        onChange={(e) => isValidISODate(e.target.value) && e.target.value <= today && onDateChange(e.target.value)}
                    />
                    <span className="time-adjust-date-text" aria-hidden="true">{formatLongDate(date)}</span>
                </label>
                <button type="button" className="icon-btn icon-btn--sm icon-btn--bordered" aria-label={t.nextDay} disabled={date >= today} onClick={() => onDateChange(addDays(date, 1))}>
                    <ChevronRightIcon />
                </button>
            </div>

            {registration === undefined ? (
                <div className="time-adjust-loading" aria-hidden="true" />
            ) : (
                <AdjustForm
                    // A new day, a changed registration (e.g. clocked out meanwhile) or "Annuller" starts the
                    // form over from the saved values
                    key={`${date}-${formKey(registration)}-${resetKey}`}
                    date={date}
                    today={today}
                    registration={registration}
                    locked={!admin && registration?.status === "APPROVED"}
                    projects={projects}
                    onCancel={() => setResetKey((k) => k + 1)}
                    onSaved={onSaved}
                />
            )}
        </Panel>
    );
}

function formKey(r: TimeRegistration | null): string {
    return r ? [r.id, r.clockIn, r.clockOut, r.breakMinutes, r.projectId, r.remarks, r.status].join("|") : "new";
}

interface FormValues {
    clockIn: string;
    clockOut: string;
    breakMinutes: string;
    projectId: string;
    remarks: string;
}

type Errors = Partial<Record<keyof FormValues | "date", string>>;

function AdjustForm({ date, today, registration, locked, projects, onCancel, onSaved }: {
    date: ISODate;
    today: ISODate;
    registration: TimeRegistration | null;
    locked: boolean;
    projects: Project[];
    onCancel: () => void;
    onSaved: () => void;
}) {
    const text = useAppText();
    const t = text.time;
    const run = useRunAction();
    const [values, setValues] = useState<FormValues>(() => ({
        clockIn: registration ? formatClock(registration.clockIn) : "08:00",
        clockOut: registration?.clockOut ? formatClock(registration.clockOut) : registration ? "" : "16:00",
        breakMinutes: String(registration?.breakMinutes ?? 30),
        projectId: registration?.projectId ?? "",
        remarks: registration?.remarks ?? "",
    }));
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);

    const set = (key: keyof FormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));
    const breakMinutes = values.breakMinutes.trim() === "" ? Number.NaN : Number(values.breakMinutes);
    const worked = formWorkedMinutes(values.clockIn, values.clockOut, breakMinutes);
    const overnight = parseClock(values.clockIn) !== null && parseClock(values.clockOut) !== null
        && (parseClock(values.clockOut) ?? 0) <= (parseClock(values.clockIn) ?? 0);

    // The registration's own project stays selectable even if the user has since left it
    const projectOptions = registration?.projectId && !projects.some((p) => p.id === registration.projectId)
        ? [{ id: registration.projectId, name: registration.projectName ?? "" }, ...projects]
        : projects;

    function validate(): Errors {
        const e: Errors = {};
        if (!isValidISODate(date)) e.date = t.validation.dateRequired;
        else if (date > today) e.date = t.validation.futureNotAllowed;
        if (parseClock(values.clockIn) === null) e.clockIn = t.validation.timeInvalid;
        if (parseClock(values.clockOut) === null) e.clockOut = t.validation.timeInvalid;
        const span = spanMinutes(values.clockIn, values.clockOut);
        if (span !== null && worked === null) e.breakMinutes = t.validation.breakInvalid;
        if (values.remarks.length > MAX_REMARKS) e.remarks = t.validation.remarksTooLong;
        return e;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const input: TimeRegistrationInput = {
            date,
            clockIn: values.clockIn,
            clockOut: values.clockOut,
            breakMinutes,
            projectId: values.projectId || null,
            remarks: values.remarks.trim() || null,
        };
        setSaving(true);
        const ok = await run(() => (registration ? timeApi.update(registration.id, input) : timeApi.create(input)), t.saved_toast);
        setSaving(false);
        if (ok) onSaved();
    }

    const fieldProps = (key: keyof FormValues) => ({
        id: `time-${key}`,
        "aria-invalid": Boolean(errors[key]),
        "aria-describedby": errors[key] ? `time-${key}-error` : undefined,
    });
    const error = (key: keyof Errors) => errors[key] && <p id={`time-${key}-error`} className="field-error">{errors[key]}</p>;

    const notice = locked
        ? t.approvedLockedHint
        : registration?.status === "ACTIVE"
            ? t.editingActive
            : registration ? t.editingExisting : t.newRegistration;

    return (
        <form className="time-adjust-form" onSubmit={handleSubmit} noValidate>
            <p className={`time-adjust-notice ${locked ? "is-locked" : ""}`}>{notice}</p>
            {error("date")}
            <fieldset className="form-fieldset" disabled={saving || locked}>
                <div className="field-row">
                    <div className={`field ${errors.clockIn ? "field--invalid" : ""}`}>
                        <label htmlFor="time-clockIn">{t.clockIn}</label>
                        <input {...fieldProps("clockIn")} type="time" value={values.clockIn} onChange={(e) => set("clockIn", e.target.value)} required />
                        {error("clockIn")}
                    </div>
                    <div className={`field ${errors.clockOut ? "field--invalid" : ""}`}>
                        <label htmlFor="time-clockOut">{t.clockOut}</label>
                        <input {...fieldProps("clockOut")} type="time" value={values.clockOut} onChange={(e) => set("clockOut", e.target.value)} required />
                        {error("clockOut")}
                    </div>
                </div>
                {overnight && <p className="field-hint">{t.overnightHint}</p>}
                <div className="field-row">
                    <div className={`field ${errors.breakMinutes ? "field--invalid" : ""}`}>
                        <label htmlFor="time-breakMinutes">{t.breakMinutes}</label>
                        <input
                            {...fieldProps("breakMinutes")} type="number" min={0} max={1440} step={1} inputMode="numeric"
                            value={values.breakMinutes} onChange={(e) => set("breakMinutes", e.target.value)}
                        />
                        {error("breakMinutes")}
                    </div>
                    <div className="field">
                        <span className="field-label" id="time-total-label">{t.totalTime}</span>
                        <output className="time-adjust-total" aria-labelledby="time-total-label" aria-live="polite">
                            {worked === null ? "–" : t.totalHours(formatHours(worked))}
                        </output>
                    </div>
                </div>
                <div className="field">
                    <label htmlFor="time-projectId">{t.projectOptional}</label>
                    <select id="time-projectId" value={values.projectId} onChange={(e) => set("projectId", e.target.value)}>
                        <option value="">{t.noProject}</option>
                        {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className={`field ${errors.remarks ? "field--invalid" : ""}`}>
                    <label htmlFor="time-remarks">{t.remarksOptional}</label>
                    <textarea
                        {...fieldProps("remarks")} rows={3} maxLength={MAX_REMARKS} placeholder={t.remarksPlaceholder}
                        value={values.remarks} onChange={(e) => set("remarks", e.target.value)}
                    />
                    {error("remarks")}
                </div>
            </fieldset>
            <div className="time-adjust-actions">
                <button type="button" className="app-btn app-btn--ghost" onClick={onCancel} disabled={saving || locked}>{text.common.cancel}</button>
                <button type="submit" className="app-btn app-btn--primary" disabled={saving || locked}>
                    {saving ? text.common.saving : t.saveChanges}
                </button>
            </div>
        </form>
    );
}

export default AdjustHoursPanel;
