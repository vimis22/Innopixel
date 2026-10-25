import { useState } from "react";
import { useAppText } from "../../../i18n/app/useAppText";
import Panel from "../../../components/ui/Panel";
import { EmptyState } from "../../../components/ui/States";
import { CheckSquareIcon, PlusIcon } from "../../../components/icons/AppIcons";
import { canManageProject } from "../../auth/permissions";
import { useTaskDialog } from "../../tasks/TaskDialog";
import TaskTable from "../../tasks/TaskTable";
import { sortTasks } from "../../tasks/taskFilters";
import type { ProjectSummary } from "../../workspace/selectors";
import { useCurrentUser } from "../../workspace/WorkspaceContext";

function ProjectTasksTab({ summary }: { summary: ProjectSummary }) {
    const text = useAppText();
    const user = useCurrentUser();
    const { createTask } = useTaskDialog();
    const [showDone, setShowDone] = useState(true);

    const tasks = sortTasks(summary.tasks.filter((task) => showDone || task.status !== "DONE"), "deadline", () => "");

    return (
        <div className="stack">
            <div className="tab-toolbar">
                <label className="labelled-control">
                    <input type="checkbox" className="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
                    {text.tasks.showDone}
                </label>
                {canManageProject(user, summary.project) && (
                    <button type="button" className="app-btn app-btn--primary app-btn--sm toolbar-end" onClick={() => createTask({ projectId: summary.project.id })}>
                        <PlusIcon aria-hidden="true" /> {text.tasks.create}
                    </button>
                )}
            </div>
            <Panel flush>
                {tasks.length === 0
                    ? <EmptyState Icon={CheckSquareIcon} title={text.tasks.emptyProject} compact />
                    : <TaskTable tasks={tasks} showProject={false} showAssignee />}
            </Panel>
        </div>
    );
}

export default ProjectTasksTab;
