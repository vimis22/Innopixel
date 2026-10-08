import { useState, type FormEvent } from "react";
import type { Project, ProjectInput, ProjectStatus } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { addDays, isValidISODate, todayISO } from "../../utils/date";
import Modal from "../../components/ui/Modal";
import { useRunAction } from "../../components/ui/Feedback";
import { canAdministerProject } from "../auth/permissions";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import { PROJECT_STATUSES } from "../workspace/constants";

interface ProjectFormModalProps {
    project?: Project;          // edit when given, otherwise create
    onClose: () => void;
    onSaved?: (projectId: string) => void;
}

type Errors = Partial<Record<"name" | "client" | "managerId" | "startDate" | "endDate", string>>;

// Rendered only while open, so the form state starts fresh every time
function ProjectFormModal({ project, onClose, onSaved }: ProjectFormModalProps) {
    const text = useAppText();
    const t = text.projects;
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();

    const activeUsers = data.users.filter((u) => u.active || u.id === project?.managerId);
    const [values, setValues] = useState<ProjectInput>(() => ({
        name: project?.name ?? "",
        description: project?.description ?? "",
        client: project?.client ?? "",
        managerId: project?.managerId ?? user.id,
        status: project?.status ?? "PLANNED",
        startDate: project?.startDate ?? todayISO(),
        endDate: project?.endDate ?? addDays(todayISO(), 60),
        imageUrl: project?.imageUrl ?? null,
        memberIds: project ? data.members.filter((m) => m.projectId === project.id).map((m) => m.userId) : [user.id],
    }));
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const canChangeManager = canAdministerProject(user);

    function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
        setValues((v) => ({ ...v, [key]: value }));
    }

    function toggleMember(id: string) {
        set("memberIds", values.memberIds.includes(id) ? values.memberIds.filter((m) => m !== id) : [...values.memberIds, id]);
    }

    function validate(): Errors {
        const e: Errors = {};
        if (!values.name.trim()) e.name = t.validation.nameRequired;
        if (!values.client.trim()) e.client = t.validation.clientRequired;
        if (!values.managerId) e.managerId = t.validation.managerRequired;
        if (!isValidISODate(values.startDate)) e.startDate = t.validation.datesRequired;
        if (!isValidISODate(values.endDate)) e.endDate = t.validation.datesRequired;
        else if (isValidISODate(values.startDate) && values.endDate < values.startDate) e.endDate = t.validation.endBeforeStart;
        return e;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) {
            document.getElementById(`project-${Object.keys(e)[0]}`)?.focus();
            return;
        }
        setSaving(true);
        let savedId = project?.id ?? "";
        const ok = project
            ? await run(() => actions.updateProject(project.id, values), t.updated_toast)
            : await run(async () => {
                savedId = (await actions.createProject(values)).id;
            }, t.created_toast);
        setSaving(false);
        if (ok) {
            onClose();
            onSaved?.(savedId);
        }
    }

    const invalid = (key: keyof Errors) => ({
        "aria-invalid": Boolean(errors[key]),
        "aria-describedby": errors[key] ? `project-${key}-error` : undefined,
    });
    const error = (key: keyof Errors) => errors[key] && <p id={`project-${key}-error`} className="field-error">{errors[key]}</p>;

    return (
        <Modal
            open
            title={project ? t.edit : t.create}
            onClose={onClose}
            size="lg"
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={saving}>{text.common.cancel}</button>
                    <button type="submit" form="project-form" className="app-btn app-btn--primary" disabled={saving}>
                        {saving ? text.common.saving : project ? text.common.save : text.common.create}
                    </button>
                </>
            }
        >
            <form id="project-form" className="form-grid" onSubmit={handleSubmit} noValidate>
                <fieldset className="form-fieldset" disabled={saving}>
                    <div className={`field field--full ${errors.name ? "field--invalid" : ""}`}>
                        <label htmlFor="project-name">{t.name}</label>
                        <input id="project-name" value={values.name} onChange={(e) => set("name", e.target.value)} autoFocus {...invalid("name")} />
                        {error("name")}
                    </div>

                    <div className={`field ${errors.client ? "field--invalid" : ""}`}>
                        <label htmlFor="project-client">{t.client}</label>
                        <input id="project-client" value={values.client} onChange={(e) => set("client", e.target.value)} {...invalid("client")} />
                        {error("client")}
                    </div>

                    <div className={`field ${errors.managerId ? "field--invalid" : ""}`}>
                        <label htmlFor="project-managerId">{t.manager}</label>
                        <select
                            id="project-managerId"
                            value={values.managerId}
                            onChange={(e) => set("managerId", e.target.value)}
                            disabled={!canChangeManager}
                            {...invalid("managerId")}
                        >
                            {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name} – {u.title}</option>)}
                        </select>
                        {error("managerId")}
                    </div>

                    <div className="field">
                        <label htmlFor="project-status">{text.common.status}</label>
                        <select id="project-status" value={values.status} onChange={(e) => set("status", e.target.value as ProjectStatus)}>
                            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{text.projectStatus[s]}</option>)}
                        </select>
                    </div>

                    <div className="field-row">
                        <div className={`field ${errors.startDate ? "field--invalid" : ""}`}>
                            <label htmlFor="project-startDate">{text.common.start}</label>
                            <input id="project-startDate" type="date" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} {...invalid("startDate")} />
                            {error("startDate")}
                        </div>
                        <div className={`field ${errors.endDate ? "field--invalid" : ""}`}>
                            <label htmlFor="project-endDate">{text.common.end}</label>
                            <input id="project-endDate" type="date" value={values.endDate} onChange={(e) => set("endDate", e.target.value)} {...invalid("endDate")} />
                            {error("endDate")}
                        </div>
                    </div>

                    <div className="field field--full">
                        <label htmlFor="project-imageUrl">{t.imageUrl}</label>
                        <input
                            id="project-imageUrl"
                            value={values.imageUrl ?? ""}
                            onChange={(e) => set("imageUrl", e.target.value || null)}
                            aria-describedby="project-imageUrl-hint"
                            placeholder="/images/…"
                        />
                        <p id="project-imageUrl-hint" className="field-hint">{t.imageUrlHint}</p>
                    </div>

                    <div className="field field--full">
                        <label htmlFor="project-description">{text.common.description}</label>
                        <textarea id="project-description" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
                    </div>

                    <div className="field field--full">
                        <span className="field-label" id="project-members-label">{t.members}</span>
                        <div className="checkbox-list checkbox-list--grid" role="group" aria-labelledby="project-members-label">
                            {data.users.filter((u) => u.active).map((u) => {
                                const isManager = u.id === values.managerId;
                                return (
                                    <label key={u.id} className="checkbox-item">
                                        <input type="checkbox" checked={isManager || values.memberIds.includes(u.id)} disabled={isManager} onChange={() => toggleMember(u.id)} />
                                        <span>{u.name}</span>
                                        <small className="muted">{isManager ? t.isManager : u.title}</small>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
}

export default ProjectFormModal;
