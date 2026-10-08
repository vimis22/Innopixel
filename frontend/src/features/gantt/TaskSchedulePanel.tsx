import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Task } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { diffDays, formatDate, isValidISODate } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import ProgressBar from "../../components/ui/ProgressBar";
import { UserChip } from "../../components/ui/Avatar";
import { OverdueBadge, PriorityBadge, TaskStatusBadge } from "../../components/ui/Badges";
import { useRunAction } from "../../components/ui/Feedback";
import { CloseIcon } from "../../components/icons/Icons";
import { EditIcon } from "../../components/icons/AppIcons";
import { canManageProject } from "../auth/permissions";
import { isTaskOverdue, taskProgress } from "../workspace/progress";
import { userById } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import { useTaskDialog } from "../tasks/TaskDialog";

// The task selected in the Gantt chart: dates (editable by managers), dependencies and a link to the full task
function TaskSchedulePanel({ task, onClose }: { task: Task; onClose: () => void }) {
    const text = useAppText();
    const t = text.gantt;
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();
    const { openTask } = useTaskDialog();

    const project = data.projects.find((p) => p.id === task.projectId);
    const canEdit = project ? canManageProject(user, project) : false;
    const [start, setStart] = useState(task.startDate);
    const [due, setDue] = useState(task.dueDate);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const related = (ids: string[]) => ids.map((id) => data.tasks.find((x) => x.id === id)).filter((x): x is Task => Boolean(x));
    const predecessors = related(data.dependencies.filter((d) => d.successorId === task.id).map((d) => d.predecessorId));
    const successors = related(data.dependencies.filter((d) => d.predecessorId === task.id).map((d) => d.successorId));
    const changed = start !== task.startDate || due !== task.dueDate;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isValidISODate(start) || !isValidISODate(due)) return setError(text.tasks.validation.datesRequired);
        if (due < start) return setError(text.tasks.validation.dueBeforeStart);
        setError(null);
        setSaving(true);
        await run(() => actions.updateTaskSchedule(task.id, { startDate: start, dueDate: due }), t.scheduleSaved);
        setSaving(false);
    }

    return (
        <aside className="panel detail-panel" aria-labelledby={`schedule-${task.id}`}>
            <header className="detail-panel-head">
                <h2 id={`schedule-${task.id}`} className="panel-title">{task.title}</h2>
                <button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label={text.common.close}><CloseIcon /></button>
            </header>
            {project && <Link to={APP_ROUTES.project(project.id)} className="detail-project">{project.name}</Link>}

            <div className="tag-list">
                <TaskStatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {isTaskOverdue(task) && <OverdueBadge />}
            </div>

            <dl className="detail-facts">
                <div><dt>{text.common.assignee}</dt><dd><UserChip user={userById(data, task.assigneeId)} fallback={text.common.unassigned} /></dd></div>
                <div><dt>{text.tasks.group}</dt><dd>{task.group}</dd></div>
                <div><dt>{t.duration}</dt><dd>{text.common.days(diffDays(task.startDate, task.dueDate) + 1)}</dd></div>
                <div className="detail-facts-wide"><dt>{text.common.progress}</dt><dd><ProgressBar value={taskProgress(task)} label={text.common.progress} size="sm" /></dd></div>
            </dl>

            {canEdit ? (
                <form className="detail-section" onSubmit={handleSubmit} noValidate>
                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="panel-start">{text.common.start}</label>
                            <input id="panel-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} disabled={saving} />
                        </div>
                        <div className="field">
                            <label htmlFor="panel-due">{text.common.deadline}</label>
                            <input id="panel-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={saving} />
                        </div>
                    </div>
                    {error && <p className="field-error" role="alert">{error}</p>}
                    <div className="detail-actions">
                        <button type="submit" className="app-btn app-btn--primary app-btn--sm" disabled={!changed || saving}>{saving ? text.common.saving : text.common.save}</button>
                    </div>
                </form>
            ) : (
                <p className="small text-secondary">{formatDate(task.startDate)} – {formatDate(task.dueDate)}<br />{t.readOnlyHint}</p>
            )}

            <section className="detail-section">
                <h3 className="detail-section-title">{t.dependencies}</h3>
                {predecessors.length === 0 && successors.length === 0 && <p className="small muted">{t.noDependencies}</p>}
                {predecessors.length > 0 && (
                    <div>
                        <p className="xsmall muted">{t.dependsOn}</p>
                        <ul className="dependency-list">
                            {predecessors.map((p) => (
                                <li key={p.id} className={task.startDate < p.dueDate ? "text-danger" : ""}>{p.title} <span className="muted">({formatDate(p.dueDate, false)})</span></li>
                            ))}
                        </ul>
                    </div>
                )}
                {successors.length > 0 && (
                    <div>
                        <p className="xsmall muted">{t.blocks}</p>
                        <ul className="dependency-list">{successors.map((s) => <li key={s.id}>{s.title} <span className="muted">({formatDate(s.startDate, false)})</span></li>)}</ul>
                    </div>
                )}
            </section>

            <div className="detail-actions">
                <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => openTask(task.id)}>
                    <EditIcon aria-hidden="true" /> {t.openTask}
                </button>
            </div>
        </aside>
    );
}

export default TaskSchedulePanel;
