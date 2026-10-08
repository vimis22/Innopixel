import { createContext, useCallback, useContext, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { addDays, isValidISODate, todayISO } from "../../utils/date";
import Modal from "../../components/ui/Modal";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { AlertIcon, TrashIcon } from "../../components/icons/AppIcons";
import { canManageProject, canUpdateTaskProgress } from "../auth/permissions";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import { TASK_PRIORITIES, TASK_STATUSES } from "../workspace/constants";


type DialogState =
    | { kind: "closed" }
    | { kind: "create"; defaults: Partial<TaskInput> }
    | { kind: "edit"; taskId: string };

interface TaskDialogContextValue {
    openTask: (taskId: string) => void;
    createTask: (defaults?: Partial<TaskInput>) => void;
}

const TaskDialogContext = createContext<TaskDialogContextValue | undefined>(undefined);

// One task dialog for the whole app, so every page edits tasks the same way
export function TaskDialogProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DialogState>({ kind: "closed" });
    const openTask = useCallback((taskId: string) => setState({ kind: "edit", taskId }), []);
    const createTask = useCallback((defaults: Partial<TaskInput> = {}) => setState({ kind: "create", defaults }), []);
    const value = useMemo(() => ({ openTask, createTask }), [openTask, createTask]);

    return (
        <TaskDialogContext.Provider value={value}>
            {children}
            {state.kind !== "closed" && (
                <TaskForm
                    key={state.kind === "edit" ? state.taskId : "new"}
                    state={state}
                    onClose={() => setState({ kind: "closed" })}
                />
            )}
        </TaskDialogContext.Provider>
    );
}

// eslint-disable-next-line react/only-export-components
export function useTaskDialog() {
    const context = useContext(TaskDialogContext);
    if (!context) {
        throw new Error("useTaskDialog must be used inside <TaskDialogProvider>");
    }
    return context;
}

interface FormValues {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string;
    group: string;
    startDate: string;
    dueDate: string;
    progress: string;
    estimateHours: string;
    milestoneId: string;
    predecessorIds: string[];
}

type Errors = Partial<Record<keyof FormValues, string>>;

function toValues(task: Task | undefined, defaults: Partial<TaskInput>, predecessorIds: string[], fallbackProject: string): FormValues {
    const today = todayISO();
    return {
        projectId: task?.projectId ?? defaults.projectId ?? fallbackProject,
        title: task?.title ?? defaults.title ?? "",
        description: task?.description ?? "",
        status: task?.status ?? defaults.status ?? "TODO",
        priority: task?.priority ?? defaults.priority ?? "MEDIUM",
        assigneeId: task?.assigneeId ?? defaults.assigneeId ?? "",
        group: task?.group ?? defaults.group ?? "",
        startDate: task?.startDate ?? defaults.startDate ?? today,
        dueDate: task?.dueDate ?? defaults.dueDate ?? addDays(today, 7),
        progress: String(task?.progress ?? 0),
        estimateHours: task?.estimateHours != null ? String(task.estimateHours) : "",
        milestoneId: task?.milestoneId ?? defaults.milestoneId ?? "",
        predecessorIds,
    };
}

function TaskForm({ state, onClose }: { state: Exclude<DialogState, { kind: "closed" }>; onClose: () => void }) {
    const text = useAppText();
    const t = text.tasks;
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();
    const { confirm } = useFeedback();

    const task = state.kind === "edit" ? data.tasks.find((x) => x.id === state.taskId) : undefined;
    const manageableProjects = data.projects.filter((p) => !p.archived && canManageProject(user, p));

    const [values, setValues] = useState<FormValues>(() =>
        toValues(
            task,
            state.kind === "create" ? state.defaults : {},
            task ? data.dependencies.filter((d) => d.successorId === task.id).map((d) => d.predecessorId) : [],
            manageableProjects[0]?.id ?? "",
        ),
    );
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);

    const project = data.projects.find((p) => p.id === values.projectId);

    // The task was deleted elsewhere, or the user may not create tasks anywhere
    if ((state.kind === "edit" && !task) || (state.kind === "create" && manageableProjects.length === 0) || !project) {
        return (
            <Modal open title={state.kind === "edit" ? t.view : t.create} onClose={onClose} size="sm">
                <p>{state.kind === "edit" ? text.errors.notFoundText : text.common.noAccess}</p>
            </Modal>
        );
    }

    const fullEdit = canManageProject(user, project);
    const progressEdit = fullEdit || (task !== undefined && canUpdateTaskProgress(user, task, project));
    const readOnly = !progressEdit;

    const members = data.users.filter((u) => data.members.some((m) => m.projectId === project.id && m.userId === u.id));
    const milestones = data.milestones.filter((m) => m.projectId === project.id);
    const projectTasks = data.tasks.filter((x) => x.projectId === project.id && x.id !== task?.id);
    const groups = [...new Set(data.tasks.filter((x) => x.projectId === project.id).map((x) => x.group))];

    function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setValues((v) => {
            const next = { ...v, [key]: value };
            // Keep status and progress consistent while editing
            if (key === "status" && value === "DONE") next.progress = "100";
            if (key === "projectId") {
                next.assigneeId = "";
                next.milestoneId = "";
                next.predecessorIds = [];
            }
            return next;
        });
    }

    function validate(): Errors {
        const e: Errors = {};
        if (fullEdit) {
            if (!values.title.trim()) e.title = t.validation.titleRequired;
            if (!values.group.trim()) e.group = t.validation.groupRequired;
            if (!isValidISODate(values.startDate)) e.startDate = t.validation.datesRequired;
            if (!isValidISODate(values.dueDate)) e.dueDate = t.validation.datesRequired;
            else if (isValidISODate(values.startDate) && values.dueDate < values.startDate) e.dueDate = t.validation.dueBeforeStart;
            if (values.estimateHours.trim() && !(Number(values.estimateHours) > 0)) e.estimateHours = t.validation.estimateRange;
        }
        const progress = Number(values.progress);
        if (values.progress.trim() === "" || !Number.isFinite(progress) || progress < 0 || progress > 100) e.progress = t.validation.progressRange;
        return e;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        const input: TaskInput = {
            projectId: values.projectId,
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            assigneeId: values.assigneeId || null,
            group: values.group,
            startDate: values.startDate,
            dueDate: values.dueDate,
            progress: Number(values.progress),
            estimateHours: values.estimateHours.trim() ? Number(values.estimateHours) : null,
            milestoneId: values.milestoneId || null,
            predecessorIds: values.predecessorIds,
        };

        let ok: boolean;
        if (!task) ok = await run(() => actions.createTask(input), t.created_toast);
        else if (fullEdit) ok = await run(() => actions.updateTask(task.id, input), t.updated_toast);
        else ok = await run(() => actions.updateTaskProgress(task.id, { status: input.status, progress: input.progress }), t.updated_toast);

        setSaving(false);
        if (ok) onClose();
    }

    async function handleDelete() {
        if (!task) return;
        const yes = await confirm({ title: t.deleteTitle, message: t.deleteMessage(task.title), confirmLabel: text.common.delete, danger: true });
        if (yes && (await run(() => actions.deleteTask(task.id), t.deleted_toast))) onClose();
    }

    const title = !task ? t.create : readOnly ? t.view : t.edit;
    const field = (key: keyof FormValues) => ({
        "aria-invalid": Boolean(errors[key]),
        "aria-describedby": errors[key] ? `task-${key}-error` : undefined,
    });
    const error = (key: keyof FormValues) =>
        errors[key] && <p id={`task-${key}-error`} className="field-error">{errors[key]}</p>;

    return (
        <Modal
            open
            title={title}
            onClose={onClose}
            size="lg"
            footer={
                <>
                    {task && fullEdit && (
                        <button type="button" className="app-btn app-btn--danger-ghost app-btn--left" onClick={() => void handleDelete()} disabled={saving}>
                            <TrashIcon aria-hidden="true" />
                            {text.common.delete}
                        </button>
                    )}
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={saving}>
                        {readOnly ? text.common.close : text.common.cancel}
                    </button>
                    {!readOnly && (
                        <button type="submit" form="task-form" className="app-btn app-btn--primary" disabled={saving}>
                            {saving ? text.common.saving : !task ? text.common.create : text.common.save}
                        </button>
                    )}
                </>
            }
        >
            {(readOnly || !fullEdit) && (
                <p className="form-hint-banner">{readOnly ? t.readOnly : t.limitedEdit}</p>
            )}

            <form id="task-form" className="form-grid" onSubmit={handleSubmit} noValidate>
                <fieldset disabled={saving || readOnly} className="form-fieldset">
                    <div className={`field field--full ${errors.title ? "field--invalid" : ""}`}>
                        <label htmlFor="task-title">{t.name}</label>
                        <input id="task-title" value={values.title} onChange={(e) => set("title", e.target.value)} disabled={!fullEdit} autoFocus={fullEdit} {...field("title")} />
                        {error("title")}
                    </div>

                    {!task && (
                        <div className="field">
                            <label htmlFor="task-project">{text.common.project}</label>
                            <select id="task-project" value={values.projectId} onChange={(e) => set("projectId", e.target.value)}>
                                {manageableProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className={`field ${errors.group ? "field--invalid" : ""}`}>
                        <label htmlFor="task-group">{t.group}</label>
                        <input id="task-group" list="task-groups" placeholder={t.groupPlaceholder} value={values.group} onChange={(e) => set("group", e.target.value)} disabled={!fullEdit} {...field("group")} />
                        <datalist id="task-groups">
                            {groups.map((g) => <option key={g} value={g} />)}
                        </datalist>
                        {error("group")}
                    </div>

                    <div className="field">
                        <label htmlFor="task-assignee">{text.common.assignee}</label>
                        <select id="task-assignee" value={values.assigneeId} onChange={(e) => set("assigneeId", e.target.value)} disabled={!fullEdit}>
                            <option value="">{text.common.unassigned}</option>
                            {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="task-status">{text.common.status}</label>
                        <select id="task-status" value={values.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
                            {TASK_STATUSES.map((s) => <option key={s} value={s}>{text.taskStatus[s]}</option>)}
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="task-priority">{text.common.priority}</label>
                        <select id="task-priority" value={values.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)} disabled={!fullEdit}>
                            {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{text.priority[p]}</option>)}
                        </select>
                    </div>

                    <div className={`field ${errors.startDate ? "field--invalid" : ""}`}>
                        <label htmlFor="task-start">{text.common.start}</label>
                        <input id="task-start" type="date" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} disabled={!fullEdit} {...field("startDate")} />
                        {error("startDate")}
                    </div>

                    <div className={`field ${errors.dueDate ? "field--invalid" : ""}`}>
                        <label htmlFor="task-due">{text.common.deadline}</label>
                        <input id="task-due" type="date" value={values.dueDate} onChange={(e) => set("dueDate", e.target.value)} disabled={!fullEdit} {...field("dueDate")} />
                        {error("dueDate")}
                    </div>

                    <div className={`field ${errors.progress ? "field--invalid" : ""}`}>
                        <label htmlFor="task-progress">{text.common.progress} (%)</label>
                        <div className="range-field">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={Number(values.progress) || 0}
                                onChange={(e) => set("progress", e.target.value)}
                                disabled={values.status === "DONE"}
                                aria-label={text.common.progress}
                            />
                            <input
                                id="task-progress"
                                type="number"
                                min={0}
                                max={100}
                                value={values.progress}
                                onChange={(e) => set("progress", e.target.value)}
                                disabled={values.status === "DONE"}
                                {...field("progress")}
                            />
                        </div>
                        {error("progress")}
                    </div>

                    <div className={`field ${errors.estimateHours ? "field--invalid" : ""}`}>
                        <label htmlFor="task-estimate">{t.estimate}</label>
                        <input id="task-estimate" type="number" min={1} value={values.estimateHours} onChange={(e) => set("estimateHours", e.target.value)} disabled={!fullEdit} {...field("estimateHours")} />
                        {error("estimateHours")}
                    </div>

                    <div className="field">
                        <label htmlFor="task-milestone">{t.milestone}</label>
                        <select id="task-milestone" value={values.milestoneId} onChange={(e) => set("milestoneId", e.target.value)} disabled={!fullEdit}>
                            <option value="">{text.common.none}</option>
                            {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                    </div>

                    <div className="field field--full">
                        <label htmlFor="task-description">{text.common.description}</label>
                        <textarea id="task-description" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} disabled={!fullEdit} />
                    </div>

                    <div className="field field--full">
                        <span className="field-label" id="task-preds-label">{t.predecessors}</span>
                        <p className="field-hint">{t.predecessorsHint}</p>
                        {projectTasks.length === 0 ? (
                            <p className="field-hint">{t.noOtherTasks}</p>
                        ) : (
                            <div className="checkbox-list" role="group" aria-labelledby="task-preds-label">
                                {projectTasks.map((x) => {
                                    const checked = values.predecessorIds.includes(x.id);
                                    const conflict = checked && x.dueDate > values.startDate;
                                    return (
                                        <label key={x.id} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={!fullEdit}
                                                onChange={() =>
                                                    set("predecessorIds", checked ? values.predecessorIds.filter((id) => id !== x.id) : [...values.predecessorIds, x.id])
                                                }
                                            />
                                            <span>{x.title}</span>
                                            {conflict && (
                                                <span className="checkbox-warning" title={t.dependencyWarning}>
                                                    <AlertIcon aria-hidden="true" /> {t.dependencyWarning}
                                                </span>
                                            )}
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
