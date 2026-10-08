import type { DragEvent, KeyboardEvent } from "react";
import type { Task } from "../../types/domain";
import { formatDate } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import { Avatar } from "../../components/ui/Avatar";
import { PriorityBadge } from "../../components/ui/Badges";
import { AlertIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, FolderIcon } from "../../components/icons/AppIcons";
import { isTaskOverdue } from "../workspace/progress";
import { userById } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

interface KanbanCardProps {
    task: Task;
    movable: boolean;
    saving: boolean;
    dragging: boolean;
    canMoveLeft: boolean;
    canMoveRight: boolean;
    onOpen: () => void;
    onMove: (direction: -1 | 1) => void;
    onDragStart: (event: DragEvent<HTMLLIElement>) => void;
    onDragEnd: () => void;
}

// A concise card: what, which project, who, how urgent, when
function KanbanCard({ task, movable, saving, dragging, canMoveLeft, canMoveRight, onOpen, onMove, onDragStart, onDragEnd }: KanbanCardProps) {
    const text = useAppText();
    const t = text.board;
    const { data } = useWorkspaceData();
    const project = data.projects.find((p) => p.id === task.projectId);
    const assignee = userById(data, task.assigneeId);
    const overdue = isTaskOverdue(task);

    // Keyboard alternative to dragging: Alt + arrow keys moves the focused card
    function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (!event.altKey || !movable) return;
        if (event.key === "ArrowRight" && canMoveRight) {
            event.preventDefault();
            onMove(1);
        }
        if (event.key === "ArrowLeft" && canMoveLeft) {
            event.preventDefault();
            onMove(-1);
        }
    }

    return (
        <li
            className={`kanban-card kanban-card--${task.status.toLowerCase()} ${dragging ? "is-dragging" : ""} ${saving ? "is-pending" : ""}`}
            draggable={movable && !saving}
            aria-busy={saving}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <button type="button" className="kanban-card-body" onClick={onOpen} onKeyDown={onKeyDown} aria-describedby={movable ? "kanban-key-hint" : undefined}>
                <span className="kanban-card-title">{task.title}</span>
                {project && <span className="kanban-card-project"><FolderIcon aria-hidden="true" /><span className="truncate">{project.name}</span></span>}
                <span className="kanban-card-row">
                    <span className="user-chip">
                        <Avatar user={assignee} size="sm" showTitle={false} />
                        <span className="truncate">{assignee?.name ?? text.common.unassigned}</span>
                    </span>
                    <PriorityBadge priority={task.priority} />
                </span>
                <span className="kanban-card-row">
                    <span className="tag">{task.group}</span>
                    <span className={`kanban-card-date ${overdue ? "text-danger" : ""}`}>
                        {overdue ? <AlertIcon aria-hidden="true" /> : <CalendarIcon aria-hidden="true" />}
                        {formatDate(task.dueDate)}
                        {overdue && <span className="sr-only">{text.common.overdue}</span>}
                    </span>
                </span>
            </button>
            {movable && (
                <div className="kanban-card-moves">
                    <button type="button" className="icon-btn icon-btn--sm" disabled={!canMoveLeft || saving} onClick={() => onMove(-1)} aria-label={`${t.moveLeft}: ${task.title}`} title={t.moveLeft}>
                        <ChevronLeftIcon />
                    </button>
                    <button type="button" className="icon-btn icon-btn--sm" disabled={!canMoveRight || saving} onClick={() => onMove(1)} aria-label={`${t.moveRight}: ${task.title}`} title={t.moveRight}>
                        <ChevronRightIcon />
                    </button>
                </div>
            )}
        </li>
    );
}

export default KanbanCard;
