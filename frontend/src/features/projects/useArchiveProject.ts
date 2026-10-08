import { useCallback } from "react";
import type { Project } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

// Archive (after confirmation) or restore a project
export function useArchiveProject() {
    const text = useAppText();
    const t = text.projects;
    const { actions } = useWorkspaceData();
    const { confirm } = useFeedback();
    const run = useRunAction();

    return useCallback(async (project: Project) => {
        if (project.archived) {
            return run(() => actions.setProjectArchived(project.id, false), t.restored_toast);
        }
        const yes = await confirm({ title: t.archiveTitle, message: t.archiveMessage(project.name), confirmLabel: text.common.archive, danger: true });
        return yes ? run(() => actions.setProjectArchived(project.id, true), t.archived_toast) : false;
    }, [actions, confirm, run, t, text.common.archive]);
}
