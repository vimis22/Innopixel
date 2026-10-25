import { Link } from "react-router-dom";
import type { Task } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { diffDays, formatDate } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import Drawer from "../../components/ui/Drawer";
import ProgressBar from "../../components/ui/ProgressBar";
import { UserChip } from "../../components/ui/Avatar";
import { OverdueBadge, PriorityBadge } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { CheckIcon, EditIcon, FlagIcon, FolderIcon, RefreshIcon } from "../../components/icons/AppIcons";
import { canManageProject } from "../auth/permissions";
import { isTaskOverdue, taskProgress } from "../workspace/progress";
import { userById } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import TaskChecklist from "./TaskChecklist";
import TaskStatusSelect from "./TaskStatusSelect";
import { useTaskActions } from "./useTaskActions";
import "./tasks.css";

interface TaskDrawerProps {
    task: Task;
    onClose: () => void;
    onEdit: () => void;
}

// Everything about one task. Status and checklist change in place; other fields in the task dialog.
function TaskDrawer({ task, onClose, onEdit }: TaskDrawerProps) {
    const text = useAppText();
    const t = text.tasks;
    const user = useCurrentUser();
    const { data } = useWorkspaceData();
    const { canUpdate, toggleDone } = useTaskActions();
    const project = data.projects.find((p) => p.id === task.projectId);
    const milestone = data.milestones.find((m) => m.id === task.milestoneId);
    const done = task.status === "DONE";
    const editable = canUpdate(task);
    const manager = project ? canManageProject(user, project) : false;

    const related = (ids: string[]) => ids.map((id) => data.tasks.find((x) => x.id === id)).filter((x): x is Task => Boolean(x));
    const predecessors = related(data.dependencies.filter((d) => d.successorId === task.id).map((d) => d.predecessorId));
    const successors = related(data.dependencies.filter((d) => d.predecessorId === task.id).map((d) => d.successorId));

    return (
        <Drawer
            open
            title={task.title}
            onClose={onClose}
            closeLabel={t.closeDetails}
            subtitle={
                <>
                    {project && (
                        <Link to={APP_ROUTES.project(project.id)} className="drawer-link" onClick={onClose}>
                            <FolderIcon aria-hidden="true" />{project.name}
                        </Link>
                    )}
                    <PriorityBadge priority={task.priority} />
                    {isTaskOverdue(task) && <OverdueBadge />}
                </>
            }
            footer={
                <>
                    {editable && (
                        <button type="button" className="app-btn app-btn--ghost app-btn--left" onClick={() => void toggleDone(task)}>
                            {done ? <RefreshIcon aria-hidden="true" /> : <CheckIcon aria-hidden="true" />}
                            {done ? t.reopen : t.complete}
                        </button>
                    )}
                    <button type="button" className={`app-btn ${editable ? "app-btn--primary" : "app-btn--ghost"}`} onClick={onEdit}>
                        <EditIcon aria-hidden="true" /> {manager ? t.editTask : editable ? t.updateProgress : t.view}
                    </button>
                </>
            }
        >
            <dl className="detail-facts">
                <div><dt>{text.common.status}</dt><dd><TaskStatusSelect task={task} /></dd></div>
                <div><dt>{t.group}</dt><dd>{task.group || "–"}</dd></div>
                <div>
                    <dt>{t.milestone}</dt>
                    <dd>{milestone ? <><FlagIcon className="inline-icon muted" aria-hidden="true" />{milestone.title}</> : <span className="muted">{text.common.none}</span>}</dd>
                </div>
                <div><dt>{text.common.assignee}</dt><dd><UserChip user={userById(data, task.assigneeId)} fallback={text.common.unassigned} /></dd></div>
                <div><dt>{text.common.start}</dt><dd>{formatDate(task.startDate)}</dd></div>
                <div><dt>{text.common.deadline}</dt><dd><DueLabel date={task.dueDate} done={done} withRelative /></dd></div>
                <div><dt>{t.duration}</dt><dd>{text.common.days(diffDays(task.startDate, task.dueDate) + 1)}</dd></div>
                <div className="detail-facts-wide"><dt>{text.common.progress}</dt><dd><ProgressBar value={taskProgress(task)} label={text.common.progress} /></dd></div>
            </dl>

            <section className="detail-section">
                <h3 className="detail-section-title">{text.common.description}</h3>
                <p className="prose small">{task.description || text.common.noDescription}</p>
            </section>

            <TaskChecklist key={task.id} task={task} editable={editable} />

            {(predecessors.length > 0 || successors.length > 0) && (
                <section className="detail-section">
                    <h3 className="detail-section-title">{text.gantt.dependencies}</h3>
                    {predecessors.length > 0 && (
                        <div>
                            <p className="xsmall muted">{text.gantt.dependsOn}</p>
                            <ul className="dependency-list">
                                {predecessors.map((p) => (
                                    <li key={p.id} className={task.startDate < p.dueDate && p.status !== "DONE" ? "text-danger" : ""}>
                                        {p.title} <span className="muted">({formatDate(p.dueDate, false)})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {successors.length > 0 && (
                        <div>
                            <p className="xsmall muted">{text.gantt.blocks}</p>
                            <ul className="dependency-list">
                                {successors.map((s) => <li key={s.id}>{s.title} <span className="muted">({formatDate(s.startDate, false)})</span></li>)}
                            </ul>
                        </div>
                    )}
                </section>
            )}
        </Drawer>
    );
}

export default TaskDrawer;
