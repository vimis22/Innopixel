// Domain models for the internal project management platform.
// Shapes mirror the planned ASP.NET Core / PostgreSQL entities, so the mock
// repository can later be replaced by HTTP calls without touching the UI.

export type ISODate = string;      // "YYYY-MM-DD" (calendar date, no time zone)
export type ISODateTime = string;  // full ISO timestamp

export type Role = "ADMIN" | "EMPLOYEE";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    title: string;
    department: string | null;
    phone: string | null;
    active: boolean;
    createdAt: ISODateTime;
}

export type ProjectStatus = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface Project {
    id: string;
    name: string;
    description: string;
    client: string;
    managerId: string;
    status: ProjectStatus;
    startDate: ISODate;
    endDate: ISODate;
    imageUrl: string | null;       // thumbnail; a generated tile is shown when missing
    archived: boolean;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}

export interface ProjectMember {
    projectId: string;
    userId: string;
    addedAt: ISODateTime;
}

export interface ChecklistItem {
    id: string;
    text: string;
    done: boolean;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string | null;
    group: string;                 // phase, used for grouping in the Gantt chart
    startDate: ISODate;
    dueDate: ISODate;
    progress: number;              // 0-100, reported by the assignee
    estimateHours: number | null;  // used for weighted project progress
    milestoneId: string | null;
    checklist: ChecklistItem[];
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}

// Finish-to-start: the successor should not start before the predecessor is due.
export interface TaskDependency {
    id: string;
    predecessorId: string;
    successorId: string;
}

export interface Milestone {
    id: string;
    projectId: string;
    title: string;
    description: string;
    dueDate: ISODate;
    // Only used for milestones without related tasks; otherwise completion is derived from the tasks
    completedManually: boolean;
    completedAt: ISODateTime | null;
    createdAt: ISODateTime;
}

export interface ProjectStatusHistory {
    id: string;
    projectId: string;
    from: ProjectStatus | null;
    to: ProjectStatus;
    changedBy: string;
    changedAt: ISODateTime;
}

export type ActivityType =
    | "PROJECT_CREATED"
    | "PROJECT_UPDATED"
    | "PROJECT_STATUS"
    | "PROJECT_ARCHIVED"
    | "PROJECT_RESTORED"
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "TASK_STATUS"
    | "TASK_DELETED"
    | "MILESTONE_CREATED"
    | "MILESTONE_UPDATED"
    | "MILESTONE_COMPLETED"
    | "MILESTONE_DELETED"
    | "MEMBER_ADDED"
    | "MEMBER_REMOVED"
    | "USER_CREATED"
    | "USER_UPDATED";

export interface ActivityLog {
    id: string;
    type: ActivityType;
    actorId: string;
    projectId: string | null;
    taskId: string | null;
    message: string;               // human readable, written by the repository
    createdAt: ISODateTime;
}

// Everything the client holds in memory. A real API would expose these as separate endpoints.
export interface WorkspaceData {
    users: User[];
    projects: Project[];
    members: ProjectMember[];
    tasks: Task[];
    dependencies: TaskDependency[];
    milestones: Milestone[];
    statusHistory: ProjectStatusHistory[];
    activity: ActivityLog[];
}

/* ---------- Inputs used by forms and the repository ---------- */

export interface ProjectInput {
    name: string;
    description: string;
    client: string;
    managerId: string;
    status: ProjectStatus;
    startDate: ISODate;
    endDate: ISODate;
    imageUrl: string | null;
    memberIds: string[];
}

export interface TaskInput {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string | null;
    group: string;
    startDate: ISODate;
    dueDate: ISODate;
    progress: number;
    estimateHours: number | null;
    milestoneId: string | null;
    predecessorIds: string[];
}

// The fields an assignee without manager rights may change
export type TaskProgressPatch = Partial<Pick<Task, "status" | "progress">>;

export type TaskSchedulePatch = Pick<Task, "startDate" | "dueDate">;

export interface MilestoneInput {
    projectId: string;
    title: string;
    description: string;
    dueDate: ISODate;
    taskIds: string[];
}

export interface UserInput {
    name: string;
    email: string;
    role: Role;
    title: string;
    department: string | null;
    phone: string | null;
}

// What users may change about themselves (never their role or e-mail)
export type ProfileInput = Pick<User, "name" | "title" | "department" | "phone">;
