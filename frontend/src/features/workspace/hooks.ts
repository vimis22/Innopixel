import { useMemo } from "react";
import type { Project, Task } from "../../types/domain";
import { activeProjects, buildProjectColors, visibleTasks } from "./selectors";
import { useCurrentUser, useWorkspaceData } from "./WorkspaceContext";

// Derived views of the shared workspace data. Pages use these instead of filtering on their own,
// so "my projects" and "my tasks" mean the same thing everywhere.

export function useActiveProjects(): Project[] {
    const { data } = useWorkspaceData();
    return useMemo(() => activeProjects(data), [data]);
}

// Projects the user manages or is a member of (for administrators too)
export function useMyProjects(): Project[] {
    const { data } = useWorkspaceData();
    const user = useCurrentUser();
    return useMemo(
        () => activeProjects(data).filter((p) => p.managerId === user.id || data.members.some((m) => m.projectId === p.id && m.userId === user.id)),
        [data, user.id],
    );
}

export function useMyTasks(): Task[] {
    const { data } = useWorkspaceData();
    const user = useCurrentUser();
    return useMemo(() => visibleTasks(data).filter((t) => t.assigneeId === user.id), [data, user.id]);
}

// Stable identity color per project (CSS custom property reference)
export function useProjectColors(): Map<string, string> {
    const { data } = useWorkspaceData();
    return useMemo(() => buildProjectColors(data.projects), [data.projects]);
}
