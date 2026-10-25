import { useEffect, useState, type FormEvent } from "react";
import type { CreatedUser, Role, User, UserInput } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { EMAIL_PATTERN, PHONE_PATTERN } from "../../utils/validation";
import { Avatar } from "../../components/ui/Avatar";
import { Pill } from "../../components/ui/Badges";
import { useRunAction } from "../../components/ui/Feedback";
import { DEPARTMENTS } from "../workspace/constants";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import { accountApi } from "./accountApi";

const ROLES: Role[] = ["EMPLOYEE", "ADMIN"];
type Errors = Partial<Record<keyof UserInput, string>>;

interface EmployeeGeneralTabProps {
    user?: User;                         // undefined: a new employee
    readOnly: boolean;
    onDirtyChange: (dirty: boolean) => void;
    onCreated: (created: CreatedUser) => void;
}

function toInput(user?: User): UserInput {
    return {
        name: user?.name ?? "",
        email: user?.email ?? "",
        role: user?.role ?? "EMPLOYEE",
        title: user?.title ?? "",
        department: user?.department ?? null,
        phone: user?.phone ?? null,
        expectedWeeklyHours: user?.expectedWeeklyHours ?? 37,
    };
}

// "Generelt": name, contact details, job and system role. A new account gets a temporary password.
function EmployeeGeneralTab({ user, readOnly, onDirtyChange, onCreated }: EmployeeGeneralTabProps) {
    const text = useAppText();
    const t = text.team;
    const { actions } = useWorkspaceData();
    const run = useRunAction();
    const [saved, setSaved] = useState(() => toInput(user));
    const [values, setValues] = useState(saved);
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    // New accounts: e-mail an invitation to choose a password, when e-mail is set up (otherwise a temporary password)
    const [emailConfigured, setEmailConfigured] = useState(false);
    const [sendInvitation, setSendInvitation] = useState(true);

    useEffect(() => {
        if (user || readOnly) return;
        let current = true;
        accountApi.emailConfigured().then((configured) => current && setEmailConfigured(configured), () => undefined);
        return () => {
            current = false;
        };
    }, [user, readOnly]);

    const dirty = (Object.keys(values) as (keyof UserInput)[]).some((key) => (values[key] ?? "") !== (saved[key] ?? ""));
    useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

    const set = <K extends keyof UserInput>(key: K, value: UserInput[K]) => setValues((v) => ({ ...v, [key]: value }));

    function validate(): Errors {
        const e: Errors = {};
        if (!values.name.trim()) e.name = t.validation.nameRequired;
        if (!EMAIL_PATTERN.test(values.email.trim())) e.email = t.validation.emailInvalid;
        if (!values.title.trim()) e.title = t.validation.titleRequired;
        if (values.phone && !PHONE_PATTERN.test(values.phone.trim())) e.phone = t.validation.phoneInvalid;
        const hours = values.expectedWeeklyHours ?? 37;
        if (!Number.isFinite(hours) || hours < 0 || hours > 80 || !Number.isInteger(hours * 2)) e.expectedWeeklyHours = t.validation.expectedHoursInvalid;
        return e;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        if (user) {
            const ok = await run(() => actions.updateUser(user.id, values), t.updated_toast);
            if (ok) setSaved(values);
        } else {
            let created: CreatedUser | null = null;
            const ok = await run(async () => {
                created = await actions.createUser({ ...values, sendInvitation: emailConfigured && sendInvitation });
            }, t.created_toast);
            if (ok && created) onCreated(created);
        }
        setSaving(false);
    }

    const fieldProps = (key: keyof UserInput) => ({
        id: `employee-${key}`,
        "aria-invalid": Boolean(errors[key]),
        "aria-describedby": errors[key] ? `employee-${key}-error` : undefined,
    });
    const error = (key: keyof UserInput) => errors[key] && <p id={`employee-${key}-error`} className="field-error">{errors[key]}</p>;

    return (
        <form className="stack" onSubmit={handleSubmit} noValidate>
            {user ? (
                <div className="employee-identity">
                    <Avatar user={user} size="xl" showTitle={false} />
                    <div className="cell-text">
                        <strong>{user.name}</strong>
                        <span className="small text-secondary">{[user.title, user.department].filter(Boolean).join(" · ")}</span>
                        <span><Pill tone={user.active ? "success" : "neutral"}>{user.active ? t.active : t.inactive}</Pill></span>
                    </div>
                </div>
            ) : (
                <p className="form-hint-banner">{t.newAccountNotice}</p>
            )}

            <fieldset className="form-fieldset" disabled={saving || readOnly}>
                <div className={`field field--full ${errors.name ? "field--invalid" : ""}`}>
                    <label htmlFor="employee-name">{t.name}</label>
                    <input {...fieldProps("name")} value={values.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
                    {error("name")}
                </div>
                <div className={`field field--full ${errors.email ? "field--invalid" : ""}`}>
                    <label htmlFor="employee-email">{t.email}</label>
                    <input {...fieldProps("email")} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" />
                    {error("email")}
                </div>
                <div className={`field ${errors.title ? "field--invalid" : ""}`}>
                    <label htmlFor="employee-title">{t.jobTitle}</label>
                    <input {...fieldProps("title")} value={values.title} onChange={(e) => set("title", e.target.value)} />
                    {error("title")}
                </div>
                <div className="field">
                    <label htmlFor="employee-department">{t.department}</label>
                    <select id="employee-department" value={values.department ?? ""} onChange={(e) => set("department", e.target.value || null)}>
                        <option value="">{text.settings.noDepartment}</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className={`field ${errors.phone ? "field--invalid" : ""}`}>
                    <label htmlFor="employee-phone">{t.phone}</label>
                    <input {...fieldProps("phone")} type="tel" value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
                    {error("phone")}
                </div>
                <div className="field">
                    <label htmlFor="employee-role">{t.role}</label>
                    <select id="employee-role" value={values.role} onChange={(e) => set("role", e.target.value as Role)}>
                        {ROLES.map((r) => <option key={r} value={r}>{text.roles[r]}</option>)}
                    </select>
                </div>
                {!user && (
                    <div className="field field--full">
                        <label className="checkbox-item">
                            <input type="checkbox" checked={emailConfigured && sendInvitation} disabled={!emailConfigured}
                                onChange={(e) => setSendInvitation(e.target.checked)} aria-describedby="employee-invite-hint" />
                            <span>{t.access.sendInvitation}</span>
                        </label>
                        <p id="employee-invite-hint" className="field-hint">{emailConfigured ? t.access.sendInvitationHint : t.access.invitationUnavailable}</p>
                    </div>
                )}
                {!user && (
                    <div className={`field ${errors.expectedWeeklyHours ? "field--invalid" : ""}`}>
                        <label htmlFor="employee-expectedWeeklyHours">{t.expectedHours}</label>
                        <input
                            {...fieldProps("expectedWeeklyHours")}
                            type="number" min={0} max={80} step={0.5} inputMode="decimal"
                            value={Number.isNaN(values.expectedWeeklyHours) ? "" : values.expectedWeeklyHours}
                            onChange={(e) => set("expectedWeeklyHours", e.target.value === "" ? Number.NaN : Number(e.target.value))}
                        />
                        <p className="field-hint">{t.expectedHoursHint}</p>
                        {error("expectedWeeklyHours")}
                    </div>
                )}
            </fieldset>

            {user && <p className="field-hint">{t.statusLockedHint}</p>}

            {!readOnly && (
                <div className="form-actions">
                    {user && (
                        <button type="button" className="app-btn app-btn--ghost" disabled={!dirty || saving} onClick={() => { setValues(saved); setErrors({}); }}>
                            {text.common.cancel}
                        </button>
                    )}
                    <button type="submit" className="app-btn app-btn--primary" disabled={saving || (user !== undefined && !dirty)}>
                        {saving ? text.common.saving : user ? t.saveChanges : text.common.create}
                    </button>
                </div>
            )}
        </form>
    );
}

export default EmployeeGeneralTab;
