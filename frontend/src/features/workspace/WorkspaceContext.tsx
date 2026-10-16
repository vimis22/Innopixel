import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
    ChecklistItem, CreatedUser, MilestoneInput, ProfileInput, Project, ProjectInput, Task, TaskInput, TaskProgressPatch,
    TaskSchedulePatch, User, UserInput, WorkspaceData,
} from "../../types/domain";
import { workspaceRepository as repo } from "../../config/services";
import { useAuth } from "../auth/AuthContext";
import { buildProjectSummaries, type ProjectSummary } from "./selectors";

/*
 * The single source of truth for the internal platform. Every page reads from `data`,
 * and every change goes through the repository, after which the data is reloaded.
 * That keeps the dashboard, projects, Kanban, Gantt and milestones in sync (mutate, then refetch).
 */

interface WorkspaceActions {
    createProject(input: ProjectInput): Promise<Project>;
    updateProject(projectId: string, input: ProjectInput): Promise<void>;
    setProjectArchived(projectId: string, archived: boolean): Promise<void>;
    addProjectMember(projectId: string, userId: string): Promise<void>;
    removeProjectMember(projectId: string, userId: string): Promise<void>;
    setUserProjects(userId: string, projectIds: string[]): Promise<void>;
    createTask(input: TaskInput): Promise<Task>;
    updateTask(taskId: string, input: TaskInput): Promise<void>;
    updateTaskProgress(taskId: string, patch: TaskProgressPatch): Promise<void>;
    updateTaskSchedule(taskId: string, patch: TaskSchedulePatch): Promise<void>;
    updateTaskChecklist(taskId: string, checklist: ChecklistItem[]): Promise<void>;
    deleteTask(taskId: string): Promise<void>;
    createMilestone(input: MilestoneInput): Promise<void>;
    updateMilestone(milestoneId: string, input: MilestoneInput): Promise<void>;
    setMilestoneCompleted(milestoneId: string, completed: boolean): Promise<void>;
    deleteMilestone(milestoneId: string): Promise<void>;
    createUser(input: UserInput): Promise<CreatedUser>;
    updateUser(userId: string, input: UserInput): Promise<void>;
    setUserActive(userId: string, active: boolean): Promise<void>;
    resetUserPassword(userId: string): Promise<string>;
    updateOwnProfile(profile: ProfileInput): Promise<void>;
}

interface WorkspaceContextValue {
    data: WorkspaceData | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    summaries: Map<string, ProjectSummary>;
    actions: WorkspaceActions;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? "";
    const [data, setData] = useState<WorkspaceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        try {
            const next = await repo.load();
            setData(next);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch when the signed-in user changes; the server decides what this user may see.
    // State is only set after the request resolves.
    useEffect(() => {
        // eslint-disable-next-line react/set-state-in-effect
        void reload();
    }, [reload, userId]);

    const actions = useMemo<WorkspaceActions>(() => {
        // Run the mutation, then refetch so all screens see the new state
        async function run<T>(fn: () => Promise<T>): Promise<T> {
            const result = await fn();
            await reload();
            return result;
        }
        return {
            createProject: (input) => run(() => repo.createProject(input)),
            updateProject: (id, input) => run(() => repo.updateProject(id, input)),
            setProjectArchived: (id, archived) => run(() => repo.setProjectArchived(id, archived)),
            addProjectMember: (projectId, memberId) => run(() => repo.addProjectMember(projectId, memberId)),
            removeProjectMember: (projectId, memberId) => run(() => repo.removeProjectMember(projectId, memberId)),
            setUserProjects: (memberId, projectIds) => run(() => repo.setUserProjects(memberId, projectIds)),
            createTask: (input) => run(() => repo.createTask(input)),
            updateTask: (id, input) => run(() => repo.updateTask(id, input)),
            updateTaskProgress: (id, patch) => run(() => repo.updateTaskProgress(id, patch)),
            updateTaskSchedule: (id, patch) => run(() => repo.updateTaskSchedule(id, patch)),
            updateTaskChecklist: (id, checklist) => run(() => repo.updateTaskChecklist(id, checklist)),
            deleteTask: (id) => run(() => repo.deleteTask(id)),
            createMilestone: (input) => run(() => repo.createMilestone(input)),
            updateMilestone: (id, input) => run(() => repo.updateMilestone(id, input)),
            setMilestoneCompleted: (id, completed) => run(() => repo.setMilestoneCompleted(id, completed)),
            deleteMilestone: (id) => run(() => repo.deleteMilestone(id)),
            createUser: (input) => run(() => repo.createUser(input)),
            updateUser: (id, input) => run(() => repo.updateUser(id, input)),
            setUserActive: (id, active) => run(() => repo.setUserActive(id, active)),
            resetUserPassword: (id) => run(() => repo.resetUserPassword(id)),
            updateOwnProfile: (profile) => run(() => repo.updateOwnProfile(profile)),
        };
    }, [reload]);

    const summaries = useMemo(() => (data ? buildProjectSummaries(data) : new Map<string, ProjectSummary>()), [data]);

    const value = useMemo(
        () => ({ data, loading, error, reload, summaries, actions }),
        [data, loading, error, reload, summaries, actions],
    );

    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
    }
    return context;
}

// For pages rendered inside the app shell, which only renders once data is loaded
// eslint-disable-next-line react/only-export-components
export function useWorkspaceData() {
    const { data, summaries, actions } = useWorkspace();
    if (!data) {
        throw new Error("useWorkspaceData used before the workspace was loaded");
    }
    return { data, summaries, actions };
}

// The signed-in user with the latest profile data from the workspace
// eslint-disable-next-line react/only-export-components
export function useCurrentUser(): User {
    const { user } = useAuth();
    const { data } = useWorkspace();
    if (!user) {
        throw new Error("useCurrentUser used without a signed-in user");
    }
    return data?.users.find((u) => u.id === user.id) ?? user;
}
