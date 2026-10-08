import type {
    ChecklistItem, MilestoneInput, ProfileInput, Project, ProjectInput, Task, TaskInput, TaskProgressPatch,
    TaskSchedulePatch, User, UserInput, WorkspaceData,
} from "../../types/domain";

/*
 * Contract between the UI and the data source.
 *
 * Today it is implemented by mockRepository (localStorage, development only).
 * Later an ApiWorkspaceRepository can implement the same interface with axios calls to the
 * ASP.NET Core Web API (see services/api.ts). The server then takes the acting user from the
 * auth token instead of `actorId`, and enforces the permission rules itself.
 */
export interface WorkspaceRepository {
    load(actorId: string): Promise<WorkspaceData>;

    createProject(actorId: string, input: ProjectInput): Promise<Project>;
    updateProject(actorId: string, projectId: string, input: ProjectInput): Promise<void>;
    setProjectArchived(actorId: string, projectId: string, archived: boolean): Promise<void>;
    addProjectMember(actorId: string, projectId: string, userId: string): Promise<void>;
    removeProjectMember(actorId: string, projectId: string, userId: string): Promise<void>;
    setUserProjects(actorId: string, userId: string, projectIds: string[]): Promise<void>;

    createTask(actorId: string, input: TaskInput): Promise<Task>;
    updateTask(actorId: string, taskId: string, input: TaskInput): Promise<void>;
    updateTaskProgress(actorId: string, taskId: string, patch: TaskProgressPatch): Promise<void>;
    updateTaskSchedule(actorId: string, taskId: string, patch: TaskSchedulePatch): Promise<void>;
    updateTaskChecklist(actorId: string, taskId: string, checklist: ChecklistItem[]): Promise<void>;
    deleteTask(actorId: string, taskId: string): Promise<void>;

    createMilestone(actorId: string, input: MilestoneInput): Promise<void>;
    updateMilestone(actorId: string, milestoneId: string, input: MilestoneInput): Promise<void>;
    setMilestoneCompleted(actorId: string, milestoneId: string, completed: boolean): Promise<void>;
    deleteMilestone(actorId: string, milestoneId: string): Promise<void>;

    createUser(actorId: string, input: UserInput): Promise<User>;
    updateUser(actorId: string, userId: string, input: UserInput): Promise<void>;
    setUserActive(actorId: string, userId: string, active: boolean): Promise<void>;
    updateOwnProfile(actorId: string, profile: ProfileInput): Promise<void>;
}

// Errors with a message that is safe to show to the user
export class RepositoryError extends Error {
    readonly code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION";

    constructor(code: "FORBIDDEN" | "NOT_FOUND" | "VALIDATION", message: string) {
        super(message);
        this.code = code;
        this.name = "RepositoryError";
    }
}
