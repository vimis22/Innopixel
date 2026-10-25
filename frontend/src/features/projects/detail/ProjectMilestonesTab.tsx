import { useState } from "react";
import { useAppText } from "../../../i18n/app/useAppText";
import Panel from "../../../components/ui/Panel";
import { EmptyState } from "../../../components/ui/States";
import { FlagIcon, PlusIcon } from "../../../components/icons/AppIcons";
import { canManageProject } from "../../auth/permissions";
import MilestoneDrawer from "../../milestones/MilestoneDrawer";
import MilestoneFormModal from "../../milestones/MilestoneFormModal";
import MilestoneTable from "../../milestones/MilestoneTable";
import { useMilestoneActions } from "../../milestones/useMilestoneActions";
import { useMilestoneRows, type MilestoneRow } from "../../milestones/useMilestoneRows";
import type { ProjectSummary } from "../../workspace/selectors";
import { useCurrentUser } from "../../workspace/WorkspaceContext";

function ProjectMilestonesTab({ summary }: { summary: ProjectSummary }) {
    const text = useAppText();
    const user = useCurrentUser();
    const rows = useMilestoneRows(summary.project.id).sort((a, b) => a.milestone.dueDate.localeCompare(b.milestone.dueDate));
    const [editing, setEditing] = useState<MilestoneRow | "new" | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const actionsFor = useMilestoneActions(setEditing);
    const opened = rows.find((r) => r.milestone.id === openId);

    return (
        <div className="stack">
            {canManageProject(user, summary.project) && (
                <div className="tab-toolbar">
                    <button type="button" className="app-btn app-btn--primary app-btn--sm toolbar-end" onClick={() => setEditing("new")}>
                        <PlusIcon aria-hidden="true" /> {text.milestones.create}
                    </button>
                </div>
            )}
            <Panel flush>
                {rows.length === 0
                    ? <EmptyState Icon={FlagIcon} title={text.milestones.empty} compact />
                    : <MilestoneTable rows={rows} showProject={false} onOpen={(row) => setOpenId(row.milestone.id)} onEdit={setEditing} />}
            </Panel>
            {opened && <MilestoneDrawer row={opened} actions={actionsFor(opened)} onClose={() => setOpenId(null)} />}
            {editing && (
                <MilestoneFormModal milestone={editing === "new" ? undefined : editing.milestone} projectId={summary.project.id} onClose={() => setEditing(null)} />
            )}
        </div>
    );
}

export default ProjectMilestonesTab;
