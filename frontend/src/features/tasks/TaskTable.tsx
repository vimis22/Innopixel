import type { Task } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import ProjectThumb from "../../components/ui/ProjectThumb";
import ProgressBar from "../../components/ui/ProgressBar";
import ActionMenu, { type MenuAction } from "../../components/ui/ActionMenu";
import { UserChip } from "../../components/ui/Avatar";
import { PriorityBadge, TaskStatusBadge } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { CheckIcon, EditIcon, EyeIcon } from "../../components/icons/AppIcons";
import { taskProgress } from "../workspace/progress";
import { userById } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import { useTaskDialog } from "./TaskDialog";
import { useTaskActions } from "./useTaskActions";

interface TaskTableProps {
    tasks: Task[];
    selectedId?: string | null;
    onSelect?: (taskId: string) => void;   // opens a side panel; without it, rows open the task dialog
    showProject?: boolean;
    showAssignee?: boolean;
}

// Concise task rows: title, project, priority, deadline, status, progress. Details live in the panel/dialog.
function TaskTable({ tasks, selectedId = null, onSelect, showProject = true, showAssignee = false }: TaskTableProps) {
    const text = useAppText();
    const t = text.tasks;
    const { data } = useWorkspaceData();
    const { openTask } = useTaskDialog();
    const { canUpdate, toggleDone } = useTaskActions();
    const select = (task: Task) => (onSelect ? onSelect(task.id) : openTask(task.id));

    function actionsFor(task: Task): MenuAction[] {
        const actions: MenuAction[] = [];
        if (onSelect) actions.push({ label: text.common.details, Icon: EyeIcon, onSelect: () => onSelect(task.id) });
        actions.push({ label: t.editTask, Icon: EditIcon, onSelect: () => openTask(task.id) });
        if (canUpdate(task)) {
            actions.push({ label: task.status === "DONE" ? t.markOpen(task.title) : t.markDone(task.title), Icon: CheckIcon, onSelect: () => void toggleDone(task) });
        }
        return actions;
    }

    return (
        <div className="table-wrap">
            <table className="table task-table">
                <thead>
                    <tr>
                        <th scope="col" className="col-check"><span className="sr-only">{text.taskStatus.DONE}</span></th>
                        <th scope="col">{t.colTask}</th>
                        {showProject && <th scope="col">{text.common.project}</th>}
                        {showAssignee && <th scope="col">{text.common.assignee}</th>}
                        <th scope="col">{text.common.priority}</th>
                        <th scope="col">{text.common.deadline}</th>
                        <th scope="col">{text.common.status}</th>
                        <th scope="col" className="col-progress">{text.common.progress}</th>
                        <th scope="col" className="col-actions"><span className="sr-only">{text.common.details}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task) => {
                        const project = data.projects.find((p) => p.id === task.projectId);
                        const done = task.status === "DONE";
                        return (
                            <tr key={task.id} className={`is-clickable ${selectedId === task.id ? "is-selected" : ""}`} onClick={() => select(task)}>
                                <td className="col-check" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={done}
                                        disabled={!canUpdate(task)}
                                        onChange={() => void toggleDone(task)}
                                        aria-label={done ? t.markOpen(task.title) : t.markDone(task.title)}
                                    />
                                </td>
                                <td>
                                    <div className="cell-text">
                                        <button
                                            type="button"
                                            className={`cell-title task-title ${done ? "is-done" : ""}`}
                                            onClick={(e) => { e.stopPropagation(); select(task); }}
                                            aria-pressed={onSelect ? selectedId === task.id : undefined}
                                        >
                                            {task.title}
                                        </button>
                                        <span className="cell-sub truncate task-subtitle">{task.description || task.group}</span>
                                    </div>
                                </td>
                                {showProject && (
                                    <td>
                                        {project && (
                                            <span className="cell-main">
                                                <ProjectThumb project={project} size="sm" />
                                                <span className="truncate project-name-cell">{project.name}</span>
                                            </span>
                                        )}
                                    </td>
                                )}
                                {showAssignee && <td><UserChip user={userById(data, task.assigneeId)} fallback={text.common.unassigned} /></td>}
                                <td><PriorityBadge priority={task.priority} /></td>
                                <td className="nowrap"><DueLabel date={task.dueDate} done={done} /></td>
                                <td><TaskStatusBadge status={task.status} /></td>
                                <td className="col-progress"><ProgressBar value={taskProgress(task)} label={`${text.common.progress}: ${task.title}`} size="sm" /></td>
                                <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                                    <ActionMenu label={text.common.actionsFor(task.title)} actions={actionsFor(task)} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default TaskTable;
