import { useCallback } from "react";
import type { Task } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { useRunAction } from "../../components/ui/Feedback";
import { canUpdateTaskProgress } from "../auth/permissions";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";

// Task actions shared by the dashboard, My Tasks and the detail panel
export function useTaskActions() {
    const text = useAppText();
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();

    const canUpdate = useCallback((task: Task) => {
        const project = data.projects.find((p) => p.id === task.projectId);
        return project ? canUpdateTaskProgress(user, task, project) : false;
    }, [data.projects, user]);

    // Done ⇄ in progress (reopening keeps the reported progress below 100 %)
    const toggleDone = useCallback((task: Task) => {
        const done = task.status === "DONE";
        return run(
            () => actions.updateTaskProgress(task.id, { status: done ? "IN_PROGRESS" : "DONE" }),
            done ? text.tasks.reopened : text.tasks.markedDone,
        );
    }, [actions, run, text]);

    return { canUpdate, toggleDone };
}
