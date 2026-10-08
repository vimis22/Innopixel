import type { Task } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { PriorityBadge } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { CheckIcon } from "../../components/icons/AppIcons";
import { useTaskDialog } from "../tasks/TaskDialog";
import { useTaskActions } from "../tasks/useTaskActions";

// The user's next tasks: a round check button (colored by priority) to finish a task right here
function TaskQuickList({ tasks }: { tasks: Task[] }) {
    const text = useAppText();
    const { openTask } = useTaskDialog();
    const { canUpdate, toggleDone } = useTaskActions();

    return (
        <ul className="list">
            {tasks.map((task) => {
                const done = task.status === "DONE";
                return (
                    <li key={task.id} className="list-row task-quick-row">
                        <button
                            type="button"
                            className={`task-check task-check--${task.priority.toLowerCase()} ${done ? "is-done" : ""}`}
                            onClick={() => void toggleDone(task)}
                            disabled={!canUpdate(task)}
                            aria-pressed={done}
                            aria-label={done ? text.tasks.markOpen(task.title) : text.tasks.markDone(task.title)}
                        >
                            {done && <CheckIcon aria-hidden="true" />}
                        </button>
                        <button type="button" className={`cell-title task-quick-title truncate ${done ? "is-done" : ""}`} onClick={() => openTask(task.id)}>
                            {task.title}
                        </button>
                        <PriorityBadge priority={task.priority} />
                        <span className="task-quick-due"><DueLabel date={task.dueDate} done={done} /></span>
                    </li>
                );
            })}
        </ul>
    );
}

export default TaskQuickList;
