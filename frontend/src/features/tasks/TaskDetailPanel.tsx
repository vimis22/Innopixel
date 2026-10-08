import { Link } from "react-router-dom";
import type { Task } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import ProjectThumb from "../../components/ui/ProjectThumb";
import ProgressBar from "../../components/ui/ProgressBar";
import { UserChip } from "../../components/ui/Avatar";
import { PriorityBadge } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { CloseIcon } from "../../components/icons/Icons";
import { CalendarIcon, EditIcon, InfoIcon } from "../../components/icons/AppIcons";
import { taskProgress } from "../workspace/progress";
import { userById } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import { useTaskDialog } from "./TaskDialog";
import TaskChecklist from "./TaskChecklist";
import TaskStatusSelect from "./TaskStatusSelect";
import { useTaskActions } from "./useTaskActions";

// Side panel with everything about one task. Editing beyond status and checklist happens in the task dialog.
function TaskDetailPanel({ task, onClose }: { task: Task; onClose: () => void }) {
    const text = useAppText();
    const t = text.tasks;
    const { data } = useWorkspaceData();
    const { openTask } = useTaskDialog();
    const { canUpdate } = useTaskActions();
    const project = data.projects.find((p) => p.id === task.projectId);

    return (
        <aside className="panel detail-panel" aria-labelledby={`task-panel-${task.id}`}>
            <header className="detail-panel-head">
                <h2 id={`task-panel-${task.id}`} className="panel-title">{task.title}</h2>
                <button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label={t.closeDetails}><CloseIcon /></button>
            </header>

            {project && (
                <Link to={APP_ROUTES.project(project.id)} className="detail-project">
                    <ProjectThumb project={project} />
                    <span>{project.name}</span>
                </Link>
            )}

            <dl className="detail-facts">
                <div><dt>{text.common.deadline}</dt><dd><CalendarIcon className="inline-icon muted" aria-hidden="true" /> <DueLabel date={task.dueDate} done={task.status === "DONE"} withRelative /></dd></div>
                <div><dt>{text.common.priority}</dt><dd><PriorityBadge priority={task.priority} /></dd></div>
                <div><dt>{text.common.status}</dt><dd><TaskStatusSelect task={task} /></dd></div>
                <div><dt>{text.common.assignee}</dt><dd><UserChip user={userById(data, task.assigneeId)} fallback={text.common.unassigned} /></dd></div>
                <div className="detail-facts-wide"><dt>{text.common.progress}</dt><dd><ProgressBar value={taskProgress(task)} label={text.common.progress} /></dd></div>
            </dl>

            <section className="detail-section">
                <h3 className="detail-section-title">{text.common.description}</h3>
                <p className="prose small">{task.description || text.common.noDescription}</p>
            </section>

            <TaskChecklist key={task.id} task={task} editable={canUpdate(task)} />

            <p className="notice"><InfoIcon aria-hidden="true" />{t.attachmentsNote}</p>

            <div className="detail-actions">
                <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => openTask(task.id)}>
                    <EditIcon aria-hidden="true" /> {t.editTask}
                </button>
            </div>
        </aside>
    );
}

export default TaskDetailPanel;
