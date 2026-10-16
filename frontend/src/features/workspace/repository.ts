import type {
    ChecklistItem, CreatedUser, MilestoneInput, ProfileInput, Project, ProjectInput, Task, TaskInput, TaskProgressPatch,
    TaskSchedulePatch, UserInput, WorkspaceData,
} from "../../types/domain";

/*
 * Contract between the UI and the data source, implemented by apiRepository (the ASP.NET Core Web API).
 * The server takes the acting user from the login cookie and enforces the permission rules itself;
 * the rules in auth/permissions.ts only decide what the UI shows.
 */
export interface WorkspaceRepository {
    load(): Promise<WorkspaceData>;

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

    // Returns the new account and a temporary password, shown once to the administrator
    createUser(input: UserInput): Promise<CreatedUser>;
    updateUser(userId: string, input: UserInput): Promise<void>;
    setUserActive(userId: string, active: boolean): Promise<void>;
    resetUserPassword(userId: string): Promise<string>;
    updateOwnProfile(profile: ProfileInput): Promise<void>;
}

export type RepositoryErrorCode = "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "UNAVAILABLE";

// Errors with a message that is safe to show to the user
export class RepositoryError extends Error {
    readonly code: RepositoryErrorCode;

    constructor(code: RepositoryErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = "RepositoryError";
    }
}
