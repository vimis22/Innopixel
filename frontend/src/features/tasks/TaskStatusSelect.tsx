import { useState } from "react";
import type { Task, TaskStatus } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { TaskStatusBadge } from "../../components/ui/Badges";
import { useRunAction } from "../../components/ui/Feedback";
import { canUpdateTaskProgress } from "../auth/permissions";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import { TASK_STATUSES } from "../workspace/constants";

// Inline status change for users allowed to update the task; a plain badge for everyone else
function TaskStatusSelect({ task }: { task: Task }) {
    const text = useAppText();
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();
    const [saving, setSaving] = useState(false);
    const project = data.projects.find((p) => p.id === task.projectId);

    if (!project || !canUpdateTaskProgress(user, task, project)) return <TaskStatusBadge status={task.status} />;

    async function change(status: TaskStatus) {
        setSaving(true);
        await run(() => actions.updateTaskProgress(task.id, { status }), text.board.moved(text.taskStatus[status]));
        setSaving(false);
    }

    return (
        <select
            className={`control status-select status-select--${task.status.toLowerCase()}`}
            value={task.status}
            onChange={(e) => void change(e.target.value as TaskStatus)}
            disabled={saving}
            aria-label={`${text.common.status}: ${task.title}`}
        >
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{text.taskStatus[s]}</option>)}
        </select>
    );
}

export default TaskStatusSelect;
