import { useState, type FormEvent } from "react";
import type { Milestone, MilestoneInput } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { addDays, formatDate, isValidISODate, todayISO } from "../../utils/date";
import Modal from "../../components/ui/Modal";
import { useRunAction } from "../../components/ui/Feedback";
import { canManageProject } from "../auth/permissions";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";

interface MilestoneFormModalProps {
    milestone?: Milestone;
    projectId?: string;
    onClose: () => void;
}

type Errors = Partial<Record<"title" | "projectId" | "dueDate", string>>;

function MilestoneFormModal({ milestone, projectId, onClose }: MilestoneFormModalProps) {
    const text = useAppText();
    const t = text.milestones;
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();

    const projects = data.projects.filter((p) => !p.archived && canManageProject(user, p));
    const [values, setValues] = useState<MilestoneInput>(() => ({
        projectId: milestone?.projectId ?? projects.find((p) => p.id === projectId)?.id ?? projects[0]?.id ?? "",
        title: milestone?.title ?? "",
        description: milestone?.description ?? "",
        dueDate: milestone?.dueDate ?? addDays(todayISO(), 14),
        taskIds: milestone ? data.tasks.filter((x) => x.milestoneId === milestone.id).map((x) => x.id) : [],
    }));
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);

    const projectTasks = data.tasks
        .filter((x) => x.projectId === values.projectId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    function set<K extends keyof MilestoneInput>(key: K, value: MilestoneInput[K]) {
        setValues((v) => ({ ...v, [key]: value, ...(key === "projectId" ? { taskIds: [] } : {}) }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e: Errors = {};
        if (!values.title.trim()) e.title = t.validation.titleRequired;
        if (!values.projectId) e.projectId = t.validation.projectRequired;
        if (!isValidISODate(values.dueDate)) e.dueDate = t.validation.dateRequired;
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        const ok = milestone
            ? await run(() => actions.updateMilestone(milestone.id, values), t.updated_toast)
            : await run(() => actions.createMilestone(values), t.created_toast);
        setSaving(false);
        if (ok) onClose();
    }

    const otherMilestone = (taskMilestoneId: string | null) =>
        taskMilestoneId && taskMilestoneId !== milestone?.id ? data.milestones.find((m) => m.id === taskMilestoneId)?.title : undefined;

    return (
        <Modal
            open
            title={milestone ? t.edit : t.create}
            onClose={onClose}
            size="lg"
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={saving}>{text.common.cancel}</button>
                    <button type="submit" form="milestone-form" className="app-btn app-btn--primary" disabled={saving}>
                        {saving ? text.common.saving : milestone ? text.common.save : text.common.create}
                    </button>
                </>
            }
        >
            <form id="milestone-form" className="form-grid" onSubmit={handleSubmit} noValidate>
                <fieldset className="form-fieldset" disabled={saving}>
                    <div className={`field field--full ${errors.title ? "field--invalid" : ""}`}>
                        <label htmlFor="ms-title">{t.name}</label>
                        <input id="ms-title" value={values.title} onChange={(e) => set("title", e.target.value)} autoFocus aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "ms-title-error" : undefined} />
                        {errors.title && <p id="ms-title-error" className="field-error">{errors.title}</p>}
                    </div>

                    <div className={`field ${errors.projectId ? "field--invalid" : ""}`}>
                        <label htmlFor="ms-project">{text.common.project}</label>
                        <select id="ms-project" value={values.projectId} onChange={(e) => set("projectId", e.target.value)} disabled={Boolean(milestone)}>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {errors.projectId && <p className="field-error">{errors.projectId}</p>}
                    </div>

                    <div className={`field ${errors.dueDate ? "field--invalid" : ""}`}>
                        <label htmlFor="ms-due">{text.common.deadline}</label>
                        <input id="ms-due" type="date" value={values.dueDate} onChange={(e) => set("dueDate", e.target.value)} aria-invalid={Boolean(errors.dueDate)} aria-describedby={errors.dueDate ? "ms-due-error" : undefined} />
                        {errors.dueDate && <p id="ms-due-error" className="field-error">{errors.dueDate}</p>}
                    </div>

                    <div className="field field--full">
                        <label htmlFor="ms-description">{text.common.description}</label>
                        <textarea id="ms-description" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
                    </div>

                    <div className="field field--full">
                        <span className="field-label" id="ms-tasks-label">{t.relatedTasks}</span>
                        <p className="field-hint">{t.relatedTasksHint}</p>
                        {projectTasks.length === 0 ? (
                            <p className="field-hint">{text.tasks.emptyProject}</p>
                        ) : (
                            <div className="checkbox-list" role="group" aria-labelledby="ms-tasks-label">
                                {projectTasks.map((x) => {
                                    const checked = values.taskIds.includes(x.id);
                                    const other = otherMilestone(x.milestoneId);
                                    return (
                                        <label key={x.id} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => set("taskIds", checked ? values.taskIds.filter((id) => id !== x.id) : [...values.taskIds, x.id])}
                                            />
                                            <span>{x.title}</span>
                                            <small className="muted">
                                                {formatDate(x.dueDate, false)}{other && !checked ? ` · ${other}` : ""}
                                            </small>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
}

export default MilestoneFormModal;
