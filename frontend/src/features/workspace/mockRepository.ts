import type {
    ActivityLog, ActivityType, ChecklistItem, Milestone, Project, ProjectInput, Task, TaskInput,
    TaskStatus, User, UserInput, WorkspaceData,
} from "../../types/domain";
import { da } from "../../i18n/app/da";
import { createId } from "../../utils/id";
import { isValidISODate } from "../../utils/date";
import { EMAIL_PATTERN, PHONE_PATTERN } from "../../utils/validation";
import {
    canAdministerProject, canCreateProject, canManageProject, canManageTeam, canUpdateTaskProgress, canViewProject,
} from "../auth/permissions";
import { delay, readDb, writeDb } from "./mockDb";
import { milestoneInfo } from "./progress";
import { RepositoryError, type WorkspaceRepository } from "./repository";

/*
 * DEVELOPMENT ONLY. Simulates the backend: validation, permission checks, activity logging
 * and persistence (localStorage). The checks here imitate what the ASP.NET Core API must
 * enforce; running in the browser they offer no real security.
 */

const v = da.projects.validation;
const tv = da.tasks.validation;

function forbidden(): never {
    throw new RepositoryError("FORBIDDEN", da.common.noAccess);
}

function notFound(): never {
    throw new RepositoryError("NOT_FOUND", da.errors.notFoundText);
}

function invalid(message: string): never {
    throw new RepositoryError("VALIDATION", message);
}

function actorOf(db: WorkspaceData, actorId: string): User {
    const actor = db.users.find((u) => u.id === actorId && u.active);
    return actor ?? forbidden();
}

function projectOf(db: WorkspaceData, projectId: string): Project {
    return db.projects.find((p) => p.id === projectId) ?? notFound();
}

function taskOf(db: WorkspaceData, taskId: string): Task {
    return db.tasks.find((t) => t.id === taskId) ?? notFound();
}

function log(db: WorkspaceData, actorId: string, type: ActivityType, message: string, projectId: string | null, taskId: string | null = null) {
    const entry: ActivityLog = { id: createId("a"), type, actorId, projectId, taskId, message, createdAt: new Date().toISOString() };
    // Newest first, capped so localStorage doesn't grow forever
    db.activity = [entry, ...db.activity].slice(0, 200);
}

function isMember(db: WorkspaceData, projectId: string, userId: string) {
    return db.members.some((m) => m.projectId === projectId && m.userId === userId);
}

function addMember(db: WorkspaceData, projectId: string, userId: string) {
    if (!isMember(db, projectId, userId)) {
        db.members.push({ projectId, userId, addedAt: new Date().toISOString() });
    }
}

function validateProject(db: WorkspaceData, input: ProjectInput) {
    if (!input.name.trim()) invalid(v.nameRequired);
    if (!input.client.trim()) invalid(v.clientRequired);
    if (!db.users.some((u) => u.id === input.managerId && u.active)) invalid(v.managerRequired);
    if (!isValidISODate(input.startDate) || !isValidISODate(input.endDate)) invalid(v.datesRequired);
    if (input.endDate < input.startDate) invalid(v.endBeforeStart);
}

function validateTask(db: WorkspaceData, input: TaskInput, taskId?: string) {
    if (!input.title.trim()) invalid(tv.titleRequired);
    if (!input.group.trim()) invalid(tv.groupRequired);
    if (!isValidISODate(input.startDate) || !isValidISODate(input.dueDate)) invalid(tv.datesRequired);
    if (input.dueDate < input.startDate) invalid(tv.dueBeforeStart);
    if (input.progress < 0 || input.progress > 100) invalid(tv.progressRange);
    if (input.estimateHours !== null && input.estimateHours <= 0) invalid(tv.estimateRange);
    if (input.assigneeId && !isMember(db, input.projectId, input.assigneeId)) invalid(tv.assigneeNotMember);
    if (input.milestoneId && !db.milestones.some((m) => m.id === input.milestoneId && m.projectId === input.projectId)) notFound();
    for (const id of input.predecessorIds) {
        if (id === taskId || !db.tasks.some((t) => t.id === id && t.projectId === input.projectId)) notFound();
    }
}

// Keeps progress consistent with the status
function normalizeProgress(status: TaskStatus, progress: number, previous?: TaskStatus): number {
    if (status === "DONE") return 100;
    if (previous === "DONE" && progress >= 100) return 90;
    return Math.round(Math.max(0, Math.min(100, progress)));
}

// Records milestones that became complete (or were reopened) because their tasks changed
function syncMilestones(db: WorkspaceData, actorId: string, milestoneIds: (string | null)[]) {
    for (const id of new Set(milestoneIds)) {
        const milestone = db.milestones.find((m) => m.id === id);
        if (!milestone) continue;
        const info = milestoneInfo(milestone, db.tasks);
        if (!info.automatic) continue;
        if (info.state === "COMPLETED" && !milestone.completedAt) {
            milestone.completedAt = new Date().toISOString();
            log(db, actorId, "MILESTONE_COMPLETED", `fuldførte milepælen "${milestone.title}"`, milestone.projectId);
        } else if (info.state !== "COMPLETED" && milestone.completedAt) {
            milestone.completedAt = null;
        }
    }
}

function setPredecessors(db: WorkspaceData, taskId: string, predecessorIds: string[]) {
    db.dependencies = db.dependencies.filter((d) => d.successorId !== taskId);
    for (const predecessorId of new Set(predecessorIds)) {
        db.dependencies.push({ id: createId("d"), predecessorId, successorId: taskId });
    }
}

// Run a mutation against a fresh copy of the database and persist it
async function mutate<T>(fn: (db: WorkspaceData) => T): Promise<T> {
    await delay();
    const db = readDb();
    const result = fn(db);
    writeDb(db);
    return result;
}

export const mockRepository: WorkspaceRepository = {
    async load(actorId) {
        await delay(400);
        const db = readDb();
        const actor = actorOf(db, actorId);
        if (actor.role === "ADMIN") return db;

        // Employees only receive the projects they take part in, like a scoped API response
        const projects = db.projects.filter((p) => canViewProject(actor, p, db.members));
        const ids = new Set(projects.map((p) => p.id));
        const tasks = db.tasks.filter((t) => ids.has(t.projectId));
        const taskIds = new Set(tasks.map((t) => t.id));
        return {
            ...db,
            projects,
            tasks,
            members: db.members.filter((m) => ids.has(m.projectId)),
            milestones: db.milestones.filter((m) => ids.has(m.projectId)),
            dependencies: db.dependencies.filter((d) => taskIds.has(d.predecessorId) && taskIds.has(d.successorId)),
            statusHistory: db.statusHistory.filter((h) => ids.has(h.projectId)),
            activity: db.activity.filter((a) => a.projectId !== null && ids.has(a.projectId)),
        };
    },

    createProject: (actorId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        if (!canCreateProject(actor)) forbidden();
        validateProject(db, input);

        const now = new Date().toISOString();
        const project: Project = {
            id: createId("p"),
            name: input.name.trim(),
            description: input.description.trim(),
            client: input.client.trim(),
            managerId: input.managerId,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            imageUrl: input.imageUrl?.trim() || null,
            archived: false,
            createdAt: now,
            updatedAt: now,
        };
        db.projects.push(project);
        for (const userId of new Set([input.managerId, ...input.memberIds])) addMember(db, project.id, userId);
        db.statusHistory.push({ id: createId("h"), projectId: project.id, from: null, to: project.status, changedBy: actorId, changedAt: now });
        log(db, actorId, "PROJECT_CREATED", `oprettede projektet "${project.name}"`, project.id);
        return project;
    }),

    updateProject: (actorId, projectId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const project = projectOf(db, projectId);
        if (!canManageProject(actor, project)) forbidden();
        // Only administrators can hand a project to another manager
        if (input.managerId !== project.managerId && !canAdministerProject(actor)) forbidden();
        validateProject(db, input);

        const now = new Date().toISOString();
        if (input.status !== project.status) {
            db.statusHistory.push({ id: createId("h"), projectId, from: project.status, to: input.status, changedBy: actorId, changedAt: now });
            log(db, actorId, "PROJECT_STATUS", `ændrede status på "${input.name.trim()}" til ${da.projectStatus[input.status]}`, projectId);
        } else {
            log(db, actorId, "PROJECT_UPDATED", `opdaterede projektet "${input.name.trim()}"`, projectId);
        }

        Object.assign(project, {
            name: input.name.trim(),
            description: input.description.trim(),
            client: input.client.trim(),
            managerId: input.managerId,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            imageUrl: input.imageUrl?.trim() || null,
            updatedAt: now,
        });

        // The member list in the form is authoritative; the manager is always a member
        const wanted = new Set([input.managerId, ...input.memberIds]);
        const removed = db.members.filter((m) => m.projectId === projectId && !wanted.has(m.userId)).map((m) => m.userId);
        db.members = db.members.filter((m) => m.projectId !== projectId || wanted.has(m.userId));
        for (const userId of wanted) addMember(db, projectId, userId);
        for (const task of db.tasks) {
            if (task.projectId === projectId && task.assigneeId && removed.includes(task.assigneeId) && task.status !== "DONE") {
                task.assigneeId = null;
            }
        }
    }),

    setProjectArchived: (actorId, projectId, archived) => mutate((db) => {
        const actor = actorOf(db, actorId);
        if (!canAdministerProject(actor)) forbidden();
        const project = projectOf(db, projectId);
        project.archived = archived;
        project.updatedAt = new Date().toISOString();
        log(db, actorId, archived ? "PROJECT_ARCHIVED" : "PROJECT_RESTORED",
            `${archived ? "arkiverede" : "gendannede"} projektet "${project.name}"`, projectId);
    }),

    addProjectMember: (actorId, projectId, userId) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const project = projectOf(db, projectId);
        if (!canManageProject(actor, project)) forbidden();
        const user = db.users.find((u) => u.id === userId && u.active) ?? notFound();
        addMember(db, projectId, userId);
        log(db, actorId, "MEMBER_ADDED", `tilføjede ${user.name} til "${project.name}"`, projectId);
    }),

    removeProjectMember: (actorId, projectId, userId) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const project = projectOf(db, projectId);
        if (!canManageProject(actor, project)) forbidden();
        if (project.managerId === userId) invalid(da.projects.managerCannotBeRemoved);
        const user = db.users.find((u) => u.id === userId) ?? notFound();
        db.members = db.members.filter((m) => !(m.projectId === projectId && m.userId === userId));
        for (const task of db.tasks) {
            if (task.projectId === projectId && task.assigneeId === userId && task.status !== "DONE") task.assigneeId = null;
        }
        log(db, actorId, "MEMBER_REMOVED", `fjernede ${user.name} fra "${project.name}"`, projectId);
    }),

    setUserProjects: (actorId, userId, projectIds) => mutate((db) => {
        const actor = actorOf(db, actorId);
        if (!canManageTeam(actor)) forbidden();
        const user = db.users.find((u) => u.id === userId) ?? notFound();
        const wanted = new Set(projectIds);

        for (const project of db.projects) {
            const member = isMember(db, project.id, userId);
            if (wanted.has(project.id) && !member) {
                addMember(db, project.id, userId);
                log(db, actorId, "MEMBER_ADDED", `tilføjede ${user.name} til "${project.name}"`, project.id);
            } else if (!wanted.has(project.id) && member && project.managerId !== userId) {
                db.members = db.members.filter((m) => !(m.projectId === project.id && m.userId === userId));
                for (const task of db.tasks) {
                    if (task.projectId === project.id && task.assigneeId === userId && task.status !== "DONE") task.assigneeId = null;
                }
                log(db, actorId, "MEMBER_REMOVED", `fjernede ${user.name} fra "${project.name}"`, project.id);
            }
        }
    }),

    createTask: (actorId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const project = projectOf(db, input.projectId);
        if (!canManageProject(actor, project)) forbidden();
        validateTask(db, input);

        const now = new Date().toISOString();
        const task: Task = {
            id: createId("t"),
            projectId: input.projectId,
            title: input.title.trim(),
            description: input.description.trim(),
            status: input.status,
            priority: input.priority,
            assigneeId: input.assigneeId,
            group: input.group.trim(),
            startDate: input.startDate,
            dueDate: input.dueDate,
            progress: normalizeProgress(input.status, input.progress),
            estimateHours: input.estimateHours,
            milestoneId: input.milestoneId,
            checklist: [],
            createdAt: now,
            updatedAt: now,
        };
        db.tasks.push(task);
        setPredecessors(db, task.id, input.predecessorIds);
        log(db, actorId, "TASK_CREATED", `oprettede opgaven "${task.title}"`, task.projectId, task.id);
        syncMilestones(db, actorId, [task.milestoneId]);
        return task;
    }),

    updateTask: (actorId, taskId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const task = taskOf(db, taskId);
        const project = projectOf(db, task.projectId);
        // Moving a task between projects is not supported
        if (!canManageProject(actor, project) || input.projectId !== task.projectId) forbidden();
        validateTask(db, input, taskId);

        const previousMilestone = task.milestoneId;
        const statusChanged = input.status !== task.status;
        Object.assign(task, {
            title: input.title.trim(),
            description: input.description.trim(),
            priority: input.priority,
            assigneeId: input.assigneeId,
            group: input.group.trim(),
            startDate: input.startDate,
            dueDate: input.dueDate,
            progress: normalizeProgress(input.status, input.progress, task.status),
            status: input.status,
            estimateHours: input.estimateHours,
            milestoneId: input.milestoneId,
            updatedAt: new Date().toISOString(),
        });
        setPredecessors(db, taskId, input.predecessorIds);
        log(db, actorId, statusChanged ? "TASK_STATUS" : "TASK_UPDATED",
            statusChanged ? `flyttede "${task.title}" til ${da.taskStatus[task.status]}` : `opdaterede opgaven "${task.title}"`,
            task.projectId, taskId);
        syncMilestones(db, actorId, [previousMilestone, task.milestoneId]);
    }),

    updateTaskProgress: (actorId, taskId, patch) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const task = taskOf(db, taskId);
        const project = projectOf(db, task.projectId);
        if (!canUpdateTaskProgress(actor, task, project)) forbidden();

        const status = patch.status ?? task.status;
        const progress = patch.progress ?? task.progress;
        if (progress < 0 || progress > 100) invalid(tv.progressRange);
        const statusChanged = status !== task.status;

        task.progress = normalizeProgress(status, progress, task.status);
        task.status = status;
        task.updatedAt = new Date().toISOString();

        log(db, actorId, statusChanged ? "TASK_STATUS" : "TASK_UPDATED",
            statusChanged ? `flyttede "${task.title}" til ${da.taskStatus[status]}` : `opdaterede fremdrift på "${task.title}" til ${task.progress} %`,
            task.projectId, taskId);
        syncMilestones(db, actorId, [task.milestoneId]);
    }),

    updateTaskSchedule: (actorId, taskId, patch) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const task = taskOf(db, taskId);
        if (!canManageProject(actor, projectOf(db, task.projectId))) forbidden();
        if (!isValidISODate(patch.startDate) || !isValidISODate(patch.dueDate)) invalid(tv.datesRequired);
        if (patch.dueDate < patch.startDate) invalid(tv.dueBeforeStart);

        task.startDate = patch.startDate;
        task.dueDate = patch.dueDate;
        task.updatedAt = new Date().toISOString();
        log(db, actorId, "TASK_UPDATED", `ændrede tidsplanen for "${task.title}"`, task.projectId, taskId);
    }),

    updateTaskChecklist: (actorId, taskId, checklist) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const task = taskOf(db, taskId);
        if (!canUpdateTaskProgress(actor, task, projectOf(db, task.projectId))) forbidden();
        task.checklist = checklist
            .map<ChecklistItem>((item) => ({ id: item.id || createId("c"), text: item.text.trim(), done: item.done }))
            .filter((item) => item.text.length > 0);
        task.updatedAt = new Date().toISOString();
    }),

    deleteTask: (actorId, taskId) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const task = taskOf(db, taskId);
        if (!canManageProject(actor, projectOf(db, task.projectId))) forbidden();
        db.tasks = db.tasks.filter((t) => t.id !== taskId);
        db.dependencies = db.dependencies.filter((d) => d.predecessorId !== taskId && d.successorId !== taskId);
        log(db, actorId, "TASK_DELETED", `slettede opgaven "${task.title}"`, task.projectId);
        syncMilestones(db, actorId, [task.milestoneId]);
    }),

    createMilestone: (actorId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const project = projectOf(db, input.projectId);
        if (!canManageProject(actor, project)) forbidden();
        if (!input.title.trim()) invalid(da.milestones.validation.titleRequired);
        if (!isValidISODate(input.dueDate)) invalid(da.milestones.validation.dateRequired);

        const milestone: Milestone = {
            id: createId("m"),
            projectId: input.projectId,
            title: input.title.trim(),
            description: input.description.trim(),
            dueDate: input.dueDate,
            completedManually: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
        };
        db.milestones.push(milestone);
        for (const task of db.tasks) {
            if (task.projectId === input.projectId && input.taskIds.includes(task.id)) task.milestoneId = milestone.id;
        }
        log(db, actorId, "MILESTONE_CREATED", `oprettede milepælen "${milestone.title}"`, input.projectId);
        syncMilestones(db, actorId, [milestone.id]);
    }),

    updateMilestone: (actorId, milestoneId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const milestone = db.milestones.find((m) => m.id === milestoneId) ?? notFound();
        if (!canManageProject(actor, projectOf(db, milestone.projectId)) || input.projectId !== milestone.projectId) forbidden();
        if (!input.title.trim()) invalid(da.milestones.validation.titleRequired);
        if (!isValidISODate(input.dueDate)) invalid(da.milestones.validation.dateRequired);

        milestone.title = input.title.trim();
        milestone.description = input.description.trim();
        milestone.dueDate = input.dueDate;
        for (const task of db.tasks) {
            if (task.projectId !== milestone.projectId) continue;
            if (input.taskIds.includes(task.id)) task.milestoneId = milestoneId;
            else if (task.milestoneId === milestoneId) task.milestoneId = null;
        }
        log(db, actorId, "MILESTONE_UPDATED", `opdaterede milepælen "${milestone.title}"`, milestone.projectId);
        syncMilestones(db, actorId, [milestoneId]);
    }),

    setMilestoneCompleted: (actorId, milestoneId, completed) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const milestone = db.milestones.find((m) => m.id === milestoneId) ?? notFound();
        if (!canManageProject(actor, projectOf(db, milestone.projectId))) forbidden();
        // Milestones with related tasks follow their tasks and can't be toggled by hand
        if (milestoneInfo(milestone, db.tasks).automatic) forbidden();

        milestone.completedManually = completed;
        milestone.completedAt = completed ? new Date().toISOString() : null;
        log(db, actorId, completed ? "MILESTONE_COMPLETED" : "MILESTONE_UPDATED",
            `${completed ? "fuldførte" : "genåbnede"} milepælen "${milestone.title}"`, milestone.projectId);
    }),

    deleteMilestone: (actorId, milestoneId) => mutate((db) => {
        const actor = actorOf(db, actorId);
        const milestone = db.milestones.find((m) => m.id === milestoneId) ?? notFound();
        if (!canManageProject(actor, projectOf(db, milestone.projectId))) forbidden();
        db.milestones = db.milestones.filter((m) => m.id !== milestoneId);
        for (const task of db.tasks) if (task.milestoneId === milestoneId) task.milestoneId = null;
        log(db, actorId, "MILESTONE_DELETED", `slettede milepælen "${milestone.title}"`, milestone.projectId);
    }),

    createUser: (actorId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        if (!canManageTeam(actor)) forbidden();
        validateUser(db, input);
        const user: User = {
            id: createId("u"),
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            role: input.role,
            title: input.title.trim(),
            department: input.department?.trim() || null,
            phone: input.phone?.trim() || null,
            active: true,
            createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        log(db, actorId, "USER_CREATED", `oprettede brugeren ${user.name}`, null);
        return user;
    }),

    updateUser: (actorId, userId, input) => mutate((db) => {
        const actor = actorOf(db, actorId);
        if (!canManageTeam(actor)) forbidden();
        const user = db.users.find((u) => u.id === userId) ?? notFound();
        validateUser(db, input, userId);
        if (user.role === "ADMIN" && input.role !== "ADMIN" && activeAdmins(db, userId) === 0) invalid(da.team.validation.lastAdmin);
        Object.assign(user, {
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            role: input.role,
            title: input.title.trim(),
            department: input.department?.trim() || null,
            phone: input.phone?.trim() || null,
        });
        log(db, actorId, "USER_UPDATED", `opdaterede brugeren ${user.name}`, null);
    }),

    setUserActive: (actorId, userId, active) => mutate((db) => {
        const actor = actorOf(db, actorId);
        if (!canManageTeam(actor)) forbidden();
        if (userId === actorId) invalid(da.team.cannotDeactivateSelf);
        const user = db.users.find((u) => u.id === userId) ?? notFound();
        if (!active && user.role === "ADMIN" && activeAdmins(db, userId) === 0) invalid(da.team.validation.lastAdmin);
        user.active = active;
        log(db, actorId, "USER_UPDATED", `${active ? "aktiverede" : "deaktiverede"} brugeren ${user.name}`, null);
    }),

    updateOwnProfile: (actorId, profile) => mutate((db) => {
        const actor = actorOf(db, actorId);
        if (!profile.name.trim()) invalid(da.team.validation.nameRequired);
        if (!profile.title.trim()) invalid(da.team.validation.titleRequired);
        if (profile.phone && !PHONE_PATTERN.test(profile.phone.trim())) invalid(da.team.validation.phoneInvalid);
        actor.name = profile.name.trim();
        actor.title = profile.title.trim();
        actor.department = profile.department?.trim() || null;
        actor.phone = profile.phone?.trim() || null;
    }),
};

function activeAdmins(db: WorkspaceData, exceptUserId: string) {
    return db.users.filter((u) => u.role === "ADMIN" && u.active && u.id !== exceptUserId).length;
}

function validateUser(db: WorkspaceData, input: UserInput, userId?: string) {
    if (!input.name.trim()) invalid(da.team.validation.nameRequired);
    if (!EMAIL_PATTERN.test(input.email.trim())) invalid(da.team.validation.emailInvalid);
    if (!input.title.trim()) invalid(da.team.validation.titleRequired);
    if (input.phone && !PHONE_PATTERN.test(input.phone.trim())) invalid(da.team.validation.phoneInvalid);
    const email = input.email.trim().toLowerCase();
    if (db.users.some((u) => u.email === email && u.id !== userId)) invalid(da.team.validation.emailTaken);
}
