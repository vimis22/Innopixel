import { useState, type FormEvent } from "react";
import type { ProfileInput } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { PHONE_PATTERN } from "../../utils/validation";
import { Avatar } from "../../components/ui/Avatar";
import { useRunAction } from "../../components/ui/Feedback";
import { LockIcon } from "../../components/icons/AppIcons";
import { DEPARTMENTS } from "../workspace/constants";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";

type Errors = Partial<Record<keyof ProfileInput, string>>;

function ProfileSection() {
    const text = useAppText();
    const t = text.settings;
    const user = useCurrentUser();
    const { actions } = useWorkspaceData();
    const run = useRunAction();

    const initial: ProfileInput = { name: user.name, title: user.title, department: user.department, phone: user.phone };
    const [values, setValues] = useState<ProfileInput>(initial);
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const dirty = (Object.keys(initial) as (keyof ProfileInput)[]).some((key) => (values[key] ?? "") !== (initial[key] ?? ""));

    const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => setValues((v) => ({ ...v, [key]: value }));

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e: Errors = {};
        if (!values.name.trim()) e.name = text.team.validation.nameRequired;
        if (!values.title.trim()) e.title = text.team.validation.titleRequired;
        if (values.phone && !PHONE_PATTERN.test(values.phone.trim())) e.phone = text.team.validation.phoneInvalid;
        setErrors(e);
        if (Object.keys(e).length > 0) return;
        setSaving(true);
        await run(() => actions.updateOwnProfile(values), t.profileSaved);
        setSaving(false);
    }

    const invalid = (key: keyof ProfileInput) => ({
        "aria-invalid": Boolean(errors[key]),
        "aria-describedby": errors[key] ? `profile-${key}-error` : undefined,
    });
    const error = (key: keyof ProfileInput) => errors[key] && <p id={`profile-${key}-error`} className="field-error">{errors[key]}</p>;

    return (
        <>
            <div className="profile-card">
                <Avatar user={user} size="xl" showTitle={false} />
                <div className="profile-card-text">
                    <strong>{user.name}</strong>
                    <span className="text-secondary">{text.roles[user.role]}</span>
                    <span className="text-secondary">{user.email}</span>
                </div>
                <button type="button" className="app-btn app-btn--ghost" disabled aria-describedby="password-unavailable" title={t.changePasswordUnavailable}>
                    <LockIcon aria-hidden="true" /> {t.changePassword}
                </button>
                <p id="password-unavailable" className="sr-only">{t.changePasswordUnavailable}</p>
            </div>

            <form className="form-grid" onSubmit={handleSubmit} noValidate>
                <fieldset className="form-fieldset" disabled={saving}>
                    <div className={`field ${errors.name ? "field--invalid" : ""}`}>
                        <label htmlFor="profile-name">{t.fullName}</label>
                        <input id="profile-name" value={values.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" {...invalid("name")} />
                        {error("name")}
                    </div>
                    <div className="field">
                        <label htmlFor="profile-email">{t.email}</label>
                        <input id="profile-email" value={user.email} disabled aria-describedby="profile-email-hint" />
                        <p id="profile-email-hint" className="field-hint">{t.emailLocked}</p>
                    </div>
                    <div className="field">
                        <label htmlFor="profile-role">{t.role}</label>
                        <input id="profile-role" value={text.roles[user.role]} disabled aria-describedby="profile-role-hint" />
                        <p id="profile-role-hint" className="field-hint">{t.roleLocked}</p>
                    </div>
                    <div className={`field ${errors.phone ? "field--invalid" : ""}`}>
                        <label htmlFor="profile-phone">{t.phone}</label>
                        <input id="profile-phone" type="tel" value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} autoComplete="tel" {...invalid("phone")} />
                        {error("phone")}
                    </div>
                    <div className={`field ${errors.title ? "field--invalid" : ""}`}>
                        <label htmlFor="profile-title">{t.jobTitle}</label>
                        <input id="profile-title" value={values.title} onChange={(e) => set("title", e.target.value)} autoComplete="organization-title" {...invalid("title")} />
                        {error("title")}
                    </div>
                    <div className="field">
                        <label htmlFor="profile-department">{t.department}</label>
                        <select id="profile-department" value={values.department ?? ""} onChange={(e) => set("department", e.target.value || null)}>
                            <option value="">{t.noDepartment}</option>
                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="app-btn app-btn--primary app-btn--lg" disabled={!dirty || saving}>{saving ? text.common.saving : t.saveChanges}</button>
                        <button type="button" className="app-btn app-btn--ghost app-btn--lg" disabled={!dirty || saving} onClick={() => { setValues(initial); setErrors({}); }}>
                            {text.common.cancel}
                        </button>
                    </div>
                </fieldset>
            </form>
        </>
    );
}

export default ProfileSection;
