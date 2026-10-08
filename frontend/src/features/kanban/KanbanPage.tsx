import { useState, type DragEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { Task, TaskStatus } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/States";
import { useRunAction } from "../../components/ui/Feedback";
import { FolderIcon, KanbanIcon, PlusIcon } from "../../components/icons/AppIcons";
import { canManageProject } from "../auth/permissions";
import { TASK_STATUSES } from "../workspace/constants";
import { useActiveProjects } from "../workspace/hooks";
import { comparePriority } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import { useTaskDialog } from "../tasks/TaskDialog";
import { useTaskActions } from "../tasks/useTaskActions";
import KanbanCard from "./KanbanCard";
import "./kanban.css";

const ALL = "all";

function KanbanPage() {
    const text = useAppText();
    const t = text.board;
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const projects = useActiveProjects();
    const { openTask, createTask } = useTaskDialog();
    const { canUpdate } = useTaskActions();
    const run = useRunAction();
    const [params, setParams] = useSearchParams();
    const [onlyMine, setOnlyMine] = useState(false);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
    // Optimistic moves: shown immediately, cleared once the repository confirmed (or rejected) them
    const [pending, setPending] = useState<Record<string, TaskStatus>>({});

    const requested = params.get("project");
    const selected = projects.some((p) => p.id === requested) ? requested! : ALL;
    const selectedProject = projects.find((p) => p.id === selected);
    const projectIds = new Set(selectedProject ? [selectedProject.id] : projects.map((p) => p.id));

    const tasks = data.tasks
        .filter((task) => projectIds.has(task.projectId) && (!onlyMine || task.assigneeId === user.id))
        .map((task) => (pending[task.id] ? { ...task, status: pending[task.id] } : task));

    // Where new tasks go: the selected project, or the first project the user may plan
    const createTarget = selectedProject && canManageProject(user, selectedProject)
        ? selectedProject
        : selected === ALL ? projects.find((p) => canManageProject(user, p)) : undefined;

    async function move(task: Task, status: TaskStatus) {
        // One move per card at a time, so a slow save can't be overtaken by the next click
        if (task.status === status || !canUpdate(task) || pending[task.id]) return;
        setPending((p) => ({ ...p, [task.id]: status }));
        await run(() => actions.updateTaskProgress(task.id, { status }), t.moved(text.taskStatus[status]));
        setPending((p) => {
            const next = { ...p };
            delete next[task.id];
            return next;
        });
    }

    function onDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
        event.preventDefault();
        setDropTarget(null);
        setDragging(null);
        const task = tasks.find((x) => x.id === event.dataTransfer.getData("text/plain"));
        if (task) void move(task, status);
    }

    return (
        <div className="page">
            <PageHeader
                title={t.title}
                lead={t.lead}
                aside={projects.length > 0 && (
                    <>
                        <span className="control-with-icon">
                            <FolderIcon aria-hidden="true" />
                            <select
                                className="control"
                                aria-label={t.selectProject}
                                value={selected}
                                onChange={(e) => setParams(e.target.value === ALL ? {} : { project: e.target.value }, { replace: true })}
                            >
                                <option value={ALL}>{t.allProjects}</option>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </span>
                        {createTarget && (
                            <button type="button" className="app-btn app-btn--primary app-btn--lg" onClick={() => createTask({ projectId: createTarget.id })}>
                                <PlusIcon aria-hidden="true" /> {t.newTask}
                            </button>
                        )}
                    </>
                )}
            />

            {projects.length === 0 ? (
                <EmptyState Icon={KanbanIcon} title={t.noProjects} />
            ) : (
                <>
                    <label className="labelled-control kanban-filter">
                        <input type="checkbox" className="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
                        {t.filterMine}
                    </label>

                    <div className="kanban">
                        {TASK_STATUSES.map((status, columnIndex) => {
                            const columnTasks = tasks
                                .filter((task) => task.status === status)
                                .sort((a, b) => comparePriority(a, b) || a.dueDate.localeCompare(b.dueDate));
                            return (
                                <section
                                    key={status}
                                    className={`kanban-column ${dropTarget === status ? "is-drop-target" : ""}`}
                                    aria-labelledby={`col-${status}`}
                                    onDragOver={(e) => {
                                        if (!dragging) return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = "move";
                                        setDropTarget(status);
                                    }}
                                    onDragLeave={(e) => {
                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
                                    }}
                                    onDrop={(e) => onDrop(e, status)}
                                >
                                    <header className="kanban-column-header">
                                        <span className={`kanban-dot kanban-dot--${status.toLowerCase()}`} aria-hidden="true" />
                                        <h2 id={`col-${status}`}>{text.taskStatus[status]}</h2>
                                        <span className="kanban-count">{columnTasks.length}</span>
                                    </header>

                                    <ul className="kanban-list">
                                        {columnTasks.length === 0 && <li className="kanban-empty">{t.empty}</li>}
                                        {columnTasks.map((task) => (
                                            <KanbanCard
                                                key={task.id}
                                                task={task}
                                                movable={canUpdate(task)}
                                                saving={Boolean(pending[task.id])}
                                                dragging={dragging === task.id}
                                                canMoveLeft={columnIndex > 0}
                                                canMoveRight={columnIndex < TASK_STATUSES.length - 1}
                                                onOpen={() => openTask(task.id)}
                                                onMove={(direction) => void move(task, TASK_STATUSES[columnIndex + direction])}
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("text/plain", task.id);
                                                    e.dataTransfer.effectAllowed = "move";
                                                    setDragging(task.id);
                                                }}
                                                onDragEnd={() => {
                                                    setDragging(null);
                                                    setDropTarget(null);
                                                }}
                                            />
                                        ))}
                                    </ul>

                                    {createTarget && (
                                        <button
                                            type="button"
                                            className="kanban-add"
                                            onClick={() => createTask({ projectId: createTarget.id, status, progress: status === "DONE" ? 100 : 0 })}
                                            aria-label={`${t.addTask}: ${text.taskStatus[status]}`}
                                        >
                                            <PlusIcon aria-hidden="true" /> {t.addTask}
                                        </button>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                </>
            )}
            <p id="kanban-key-hint" className="sr-only">{t.keyHint}</p>
        </div>
    );
}

export default KanbanPage;
