import { useState } from "react";
import type { Milestone } from "../../../types/domain";
import { useAppText } from "../../../i18n/app/useAppText";
import Panel from "../../../components/ui/Panel";
import { EmptyState } from "../../../components/ui/States";
import { FlagIcon, PlusIcon } from "../../../components/icons/AppIcons";
import { canManageProject } from "../../auth/permissions";
import MilestoneFormModal from "../../milestones/MilestoneFormModal";
import MilestoneTable from "../../milestones/MilestoneTable";
import { useMilestoneRows } from "../../milestones/useMilestoneRows";
import type { ProjectSummary } from "../../workspace/selectors";
import { useCurrentUser } from "../../workspace/WorkspaceContext";

function ProjectMilestonesTab({ summary }: { summary: ProjectSummary }) {
    const text = useAppText();
    const user = useCurrentUser();
    const rows = useMilestoneRows(summary.project.id).sort((a, b) => a.milestone.dueDate.localeCompare(b.milestone.dueDate));
    const [editing, setEditing] = useState<Milestone | "new" | null>(null);

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
                    : <MilestoneTable rows={rows} showProject={false} onEdit={setEditing} />}
            </Panel>
            {editing && (
                <MilestoneFormModal milestone={editing === "new" ? undefined : editing} projectId={summary.project.id} onClose={() => setEditing(null)} />
            )}
        </div>
    );
}

export default ProjectMilestonesTab;
