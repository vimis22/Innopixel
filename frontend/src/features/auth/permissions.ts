import type { Project, ProjectMember, Task, User } from "../../types/domain";

/*
 * Permission rules for the UI. In the browser they only decide what to show; the backend enforces
 * the same rules on every request (backend/src/Innopixel.Workspace/Application/WorkspaceRules.cs).
 */

export function isAdmin(user: User): boolean {
    return user.role === "ADMIN";
}

export function isProjectMember(user: User, projectId: string, members: ProjectMember[]): boolean {
    return members.some((m) => m.projectId === projectId && m.userId === user.id);
}

export function canViewProject(user: User, project: Project, members: ProjectMember[]): boolean {
    return isAdmin(user) || project.managerId === user.id || isProjectMember(user, project.id, members);
}

export function canCreateProject(user: User): boolean {
    return isAdmin(user);
}

// Create/archive projects and change managers: administrators only
export function canAdministerProject(user: User): boolean {
    return isAdmin(user);
}

// Plan the project: tasks, schedule, milestones and members
export function canManageProject(user: User, project: Project): boolean {
    return isAdmin(user) || project.managerId === user.id;
}

// The assignee may update status and progress of their own task
export function canUpdateTaskProgress(user: User, task: Task, project: Project): boolean {
    return canManageProject(user, project) || task.assigneeId === user.id;
}

export function canManageTeam(user: User): boolean {
    return isAdmin(user);
}
