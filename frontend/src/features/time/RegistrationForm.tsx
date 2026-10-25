import { useEffect, useState, type FormEvent } from "react";
import type { ISODate, Project } from "../../types/domain";
import type { TimeRegistration, TimeRegistrationInput } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import { useRunAction } from "../../components/ui/Feedback";
import { isValidISODate } from "../../utils/date";
import { formatClock, formatHours, formWorkedMinutes, parseClock, spanMinutes } from "./timeFormat";
import { timeApi } from "./timeApi";

const MAX_REMARKS = 2000;

interface RegistrationFormProps {
    registration: TimeRegistration | null;   // null: a new registration
    initialDate: ISODate;
    today: ISODate;
    userId?: string;             // administrators registering for a colleague
    admin: boolean;
    projects: Project[];
    onDirtyChange?: (dirty: boolean) => void;
    onCancel: () => void;
    onSaved: () => void;
}

interface FormValues {
    date: string;
    clockIn: string;
    clockOut: string;
    breakMinutes: string;
    projectId: string;
    remarks: string;
}

type Errors = Partial<Record<keyof FormValues, string>>;

function initialValues(registration: TimeRegistration | null, date: ISODate): FormValues {
    return {
        date: registration?.date ?? date,
        clockIn: registration ? formatClock(registration.clockIn) : "08:00",
        clockOut: registration?.clockOut ? formatClock(registration.clockOut) : registration ? "" : "16:00",
        breakMinutes: String(registration?.breakMinutes ?? 30),
        projectId: registration?.projectId ?? "",
        remarks: registration?.remarks ?? "",
    };
}

/*
 * Add or correct a registration. A clock-out before the clock-in is the next day (a shift over
 * midnight), as on the server. The server validates everything again (times, breaks, overlaps,
 * permissions); a change made by an employee has to be approved again.
 */
function RegistrationForm({ registration, initialDate, today, userId, admin, projects, onDirtyChange, onCancel, onSaved }: RegistrationFormProps) {
    const text = useAppText();
    const t = text.time;
    const run = useRunAction();
    const [initial] = useState(() => initialValues(registration, initialDate));
    const [values, setValues] = useState(initial);
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const locked = !admin && registration?.status === "APPROVED";

    const dirty = (Object.keys(values) as (keyof FormValues)[]).some((key) => values[key] !== initial[key]);
    useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

    const set = (key: keyof FormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));
    const breakMinutes = values.breakMinutes.trim() === "" ? Number.NaN : Number(values.breakMinutes);
    const worked = formWorkedMinutes(values.clockIn, values.clockOut, breakMinutes);
    const start = parseClock(values.clockIn);
    const end = parseClock(values.clockOut);
    const overnight = start !== null && end !== null && end <= start;

    // The registration's own project stays selectable even if the user has since left it
    const projectOptions = registration?.projectId && !projects.some((p) => p.id === registration.projectId)
        ? [{ id: registration.projectId, name: registration.projectName ?? "" }, ...projects]
        : projects;

    function validate(): Errors {
        const e: Errors = {};
        if (!isValidISODate(values.date)) e.date = t.validation.dateRequired;
        else if (values.date > today) e.date = t.validation.futureNotAllowed;
        if (start === null) e.clockIn = t.validation.timeInvalid;
        if (end === null) e.clockOut = t.validation.timeInvalid;
        if (spanMinutes(values.clockIn, values.clockOut) !== null && worked === null) e.breakMinutes = t.validation.breakInvalid;
        if (values.remarks.length > MAX_REMARKS) e.remarks = t.validation.remarksTooLong;
        return e;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        const input: TimeRegistrationInput = {
            date: values.date,
            clockIn: values.clockIn,
            clockOut: values.clockOut,
            breakMinutes,
            projectId: values.projectId || null,
            remarks: values.remarks.trim() || null,
            userId,
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
    const error = (key: keyof FormValues) => errors[key] && <p id={`time-${key}-error`} className="field-error">{errors[key]}</p>;

    const notice = locked
        ? t.approvedLockedHint
        : registration?.status === "ACTIVE"
            ? t.editingActive
            : registration
                ? (admin ? t.editingExisting : t.correctionHint)
                : (admin ? t.newRegistration : t.newRegistrationEmployee);

    return (
        <form className="time-form" onSubmit={handleSubmit} noValidate>
            <p className={`time-adjust-notice ${locked ? "is-locked" : ""}`}>{notice}</p>
            <fieldset className="form-fieldset" disabled={saving || locked}>
                <div className={`field field--full ${errors.date ? "field--invalid" : ""}`}>
                    <label htmlFor="time-date">{t.dateLabel}</label>
                    <input {...fieldProps("date")} type="date" max={today} value={values.date} onChange={(e) => set("date", e.target.value)} disabled={registration !== null} />
                    {error("date")}
                </div>
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
                {overnight && <p className="field-hint field--full">{t.overnightHint}</p>}
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
                <div className="field field--full">
                    <label htmlFor="time-projectId">{t.projectOptional}</label>
                    <select id="time-projectId" value={values.projectId} onChange={(e) => set("projectId", e.target.value)}>
                        <option value="">{t.noProject}</option>
                        {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className={`field field--full ${errors.remarks ? "field--invalid" : ""}`}>
                    <label htmlFor="time-remarks">{t.remarksOptional}</label>
                    <textarea
                        {...fieldProps("remarks")} rows={3} maxLength={MAX_REMARKS} placeholder={t.remarksPlaceholder}
                        value={values.remarks} onChange={(e) => set("remarks", e.target.value)}
                    />
                    {error("remarks")}
                </div>
            </fieldset>
            {!locked && (
                <div className="form-actions">
                    <button type="button" className="app-btn app-btn--ghost" onClick={onCancel} disabled={saving}>{text.common.cancel}</button>
                    <button type="submit" className="app-btn app-btn--primary" disabled={saving || (registration !== null && !dirty)}>
                        {saving ? text.common.saving : registration ? t.saveChanges : t.addRegistration}
                    </button>
                </div>
            )}
        </form>
    );
}

export default RegistrationForm;
