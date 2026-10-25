import { useCallback } from "react";
import type { MenuAction } from "../../components/ui/ActionMenu";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { CheckIcon, EditIcon, RefreshIcon, TrashIcon } from "../../components/icons/AppIcons";
import { useAppText } from "../../i18n/app/useAppText";
import { canManageProject } from "../auth/permissions";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import type { MilestoneRow } from "./useMilestoneRows";

// The actions on a milestone, shared by the table's "⋮" menu and the milestone drawer.
// Only project managers and administrators get any (the server checks again).
export function useMilestoneActions(onEdit: (row: MilestoneRow) => void) {
    const text = useAppText();
    const t = text.milestones;
    const user = useCurrentUser();
    const { actions } = useWorkspaceData();
    const { confirm } = useFeedback();
    const run = useRunAction();

    // Resolves to true when the milestone was deleted
    const remove = useCallback(async ({ milestone }: MilestoneRow) => {
        const yes = await confirm({ title: t.deleteTitle, message: t.deleteMessage(milestone.title), confirmLabel: text.common.delete, danger: true });
        return yes && run(() => actions.deleteMilestone(milestone.id), t.deleted_toast);
    }, [actions, confirm, run, t, text.common.delete]);

    const actionsFor = useCallback((row: MilestoneRow, onDeleted?: () => void): MenuAction[] => {
        const { milestone, info, project } = row;
        if (!canManageProject(user, project)) return [];
        const list: MenuAction[] = [{ label: text.common.edit, Icon: EditIcon, onSelect: () => onEdit(row) }];
        // Milestones with related tasks complete themselves; only manual ones can be toggled
        if (!info.automatic) {
            const completing = info.state !== "COMPLETED";
            list.push({
                label: completing ? t.markComplete : t.markIncomplete,
                Icon: completing ? CheckIcon : RefreshIcon,
                onSelect: () => void run(() => actions.setMilestoneCompleted(milestone.id, completing), completing ? t.completed_toast : t.reopened_toast),
            });
        }
        list.push({
            label: text.common.delete,
            Icon: TrashIcon,
            danger: true,
            onSelect: () => void remove(row).then((deleted) => deleted && onDeleted?.()),
        });
        return list;
    }, [actions, onEdit, remove, run, t, text.common, user]);

    return actionsFor;
}
