import { useMemo } from "react";
import type { Milestone, Project, User } from "../../types/domain";
import type { MilestoneInfo } from "../workspace/progress";
import { activeProjects, getMilestoneInfo } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

export interface MilestoneRow {
    milestone: Milestone;
    info: MilestoneInfo;
    project: Project;
    responsible: User[];         // assignees of the related tasks, or the project manager
    percent: number | null;      // share of related tasks done; null for manual milestones
    completedOn: string;         // completion date if recorded, otherwise the due date
}

// All milestones of non-archived projects with their derived state, computed once per data change
export function useMilestoneRows(projectId?: string): MilestoneRow[] {
    const { data } = useWorkspaceData();

    return useMemo(() => {
        const projects = new Map(activeProjects(data).map((p) => [p.id, p]));
        return data.milestones
            .filter((m) => projects.has(m.projectId) && (!projectId || m.projectId === projectId))
            .map((milestone) => {
                const project = projects.get(milestone.projectId)!;
                const info = getMilestoneInfo(data, milestone);
                const assigneeIds = new Set(info.related.map((t) => t.assigneeId).filter((id): id is string => id !== null));
                const responsible = assigneeIds.size
                    ? data.users.filter((u) => assigneeIds.has(u.id))
                    : data.users.filter((u) => u.id === project.managerId);
                return {
                    milestone,
                    info,
                    project,
                    responsible,
                    percent: info.automatic ? Math.round((info.done / info.related.length) * 100) : null,
                    completedOn: milestone.completedAt?.slice(0, 10) ?? milestone.dueDate,
                };
            });
    }, [data, projectId]);
}
