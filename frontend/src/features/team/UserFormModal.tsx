import { useState, type FormEvent } from "react";
import type { Role, User, UserInput } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { EMAIL_PATTERN, PHONE_PATTERN } from "../../utils/validation";
import Modal from "../../components/ui/Modal";
import { useRunAction } from "../../components/ui/Feedback";
import { DEPARTMENTS } from "../workspace/constants";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

const ROLES: Role[] = ["EMPLOYEE", "ADMIN"];
type Errors = Partial<Record<keyof UserInput, string>>;

// Administrators create and edit accounts (demo mode: stored locally, demo password)
function UserFormModal({ user, onClose }: { user?: User; onClose: () => void }) {
    const text = useAppText();
    const t = text.team;
    const { actions } = useWorkspaceData();
    const run = useRunAction();
    const [values, setValues] = useState<UserInput>({
        name: user?.name ?? "",
        email: user?.email ?? "",
        role: user?.role ?? "EMPLOYEE",
        title: user?.title ?? "",
        department: user?.department ?? null,
        phone: user?.phone ?? null,
    });
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof UserInput>(key: K, value: UserInput[K]) => setValues((v) => ({ ...v, [key]: value }));

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e: Errors = {};
        if (!values.name.trim()) e.name = t.validation.nameRequired;
        if (!EMAIL_PATTERN.test(values.email.trim())) e.email = t.validation.emailInvalid;
        if (!values.title.trim()) e.title = t.validation.titleRequired;
        if (values.phone && !PHONE_PATTERN.test(values.phone.trim())) e.phone = t.validation.phoneInvalid;
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        const ok = user
            ? await run(() => actions.updateUser(user.id, values), t.updated_toast)
            : await run(() => actions.createUser(values), t.created_toast);
        setSaving(false);
        if (ok) onClose();
    }

    const fieldProps = (key: keyof UserInput) => ({
        id: `user-${key}`,
        "aria-invalid": Boolean(errors[key]),
        "aria-describedby": errors[key] ? `user-${key}-error` : undefined,
    });
    const error = (key: keyof UserInput) => errors[key] && <p id={`user-${key}-error`} className="field-error">{errors[key]}</p>;

    return (
        <Modal
            open
            title={user ? t.edit : t.create}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={saving}>{text.common.cancel}</button>
                    <button type="submit" form="user-form" className="app-btn app-btn--primary" disabled={saving}>
                        {saving ? text.common.saving : user ? text.common.save : text.common.create}
                    </button>
                </>
            }
        >
            {!user && <p className="form-hint-banner">{t.demoNotice}</p>}
            <form id="user-form" className="form-grid" onSubmit={handleSubmit} noValidate>
                <fieldset className="form-fieldset" disabled={saving}>
                    <div className={`field field--full ${errors.name ? "field--invalid" : ""}`}>
                        <label htmlFor="user-name">{t.name}</label>
                        <input {...fieldProps("name")} value={values.name} onChange={(e) => set("name", e.target.value)} autoFocus />
                        {error("name")}
                    </div>
                    <div className={`field field--full ${errors.email ? "field--invalid" : ""}`}>
                        <label htmlFor="user-email">{t.email}</label>
                        <input {...fieldProps("email")} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
                        {error("email")}
                    </div>
                    <div className={`field ${errors.title ? "field--invalid" : ""}`}>
                        <label htmlFor="user-title">{t.jobTitle}</label>
                        <input {...fieldProps("title")} value={values.title} onChange={(e) => set("title", e.target.value)} />
                        {error("title")}
                    </div>
                    <div className="field">
                        <label htmlFor="user-department">{t.department}</label>
                        <select id="user-department" value={values.department ?? ""} onChange={(e) => set("department", e.target.value || null)}>
                            <option value="">{text.settings.noDepartment}</option>
                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className={`field ${errors.phone ? "field--invalid" : ""}`}>
                        <label htmlFor="user-phone">{t.phone}</label>
                        <input {...fieldProps("phone")} type="tel" value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
                        {error("phone")}
                    </div>
                    <div className="field">
                        <label htmlFor="user-role">{t.role}</label>
                        <select id="user-role" value={values.role} onChange={(e) => set("role", e.target.value as Role)}>
                            {ROLES.map((r) => <option key={r} value={r}>{text.roles[r]}</option>)}
                        </select>
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
}

export default UserFormModal;
