import type { Milestone, Project, Task, User, WorkspaceData } from "../../types/domain";
import { diffDays, todayISO } from "../../utils/date";
import {
    isTaskOverdue, milestoneInfo, projectProgress, scheduleStatus, taskCompletion, timeElapsed,
    type MilestoneInfo, type ProgressResult, type ScheduleStatus,
} from "./progress";

// Everything screens need to know about a project, computed once per data change
export interface ProjectSummary {
    project: Project;
    tasks: Task[];
    milestones: Milestone[];
    memberIds: string[];
    progress: ProgressResult;
    completion: { done: number; total: number };
    milestoneCompletion: { done: number; total: number };
    overdueTasks: number;
    schedule: ScheduleStatus;
    elapsed: number;
    nextMilestone: Milestone | null;
}

export function buildProjectSummaries(data: WorkspaceData, today = todayISO()): Map<string, ProjectSummary> {
    const summaries = new Map<string, ProjectSummary>();
    for (const project of data.projects) {
        const tasks = data.tasks.filter((t) => t.projectId === project.id);
        const milestones = data.milestones
            .filter((m) => m.projectId === project.id)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        const infos = milestones.map((m) => milestoneInfo(m, tasks, today));

        summaries.set(project.id, {
            project,
            tasks,
            milestones,
            memberIds: data.members.filter((m) => m.projectId === project.id).map((m) => m.userId),
            progress: projectProgress(tasks),
            completion: taskCompletion(tasks),
            milestoneCompletion: { done: infos.filter((i) => i.state === "COMPLETED").length, total: milestones.length },
            overdueTasks: tasks.filter((t) => isTaskOverdue(t, today)).length,
            schedule: scheduleStatus(project, tasks, milestones, today),
            elapsed: timeElapsed(project, today),
            nextMilestone: milestones.find((_, i) => infos[i].state !== "COMPLETED") ?? null,
        });
    }
    return summaries;
}

export function getMilestoneInfo(data: WorkspaceData, milestone: Milestone, today = todayISO()): MilestoneInfo {
    return milestoneInfo(milestone, data.tasks.filter((t) => t.projectId === milestone.projectId), today);
}

export function userById(data: WorkspaceData, id: string | null): User | undefined {
    return id ? data.users.find((u) => u.id === id) : undefined;
}

// Projects that are visible in overviews (not archived)
export function activeProjects(data: WorkspaceData): Project[] {
    return data.projects.filter((p) => !p.archived);
}

export function visibleTasks(data: WorkspaceData): Task[] {
    const ids = new Set(activeProjects(data).map((p) => p.id));
    return data.tasks.filter((t) => ids.has(t.projectId));
}

const priorityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

export function compareTasksByUrgency(a: Task, b: Task): number {
    return a.dueDate.localeCompare(b.dueDate) || priorityRank[a.priority] - priorityRank[b.priority];
}

export function comparePriority(a: Task, b: Task): number {
    return priorityRank[a.priority] - priorityRank[b.priority];
}

const PROJECT_COLOR_SLOTS = 8;

/*
 * Each project keeps the same color everywhere (Gantt, dashboard, calendar). Colors follow the
 * creation order, so they don't change when filters hide projects. The palette has eight validated
 * slots; further projects get a neutral color instead of reusing one.
 */
export function buildProjectColors(projects: Project[]): Map<string, string> {
    const ordered = [...projects].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    return new Map(ordered.map((p, i) => [p.id, i < PROJECT_COLOR_SLOTS ? `var(--project-${i + 1})` : "var(--project-other)"]));
}

export function daysUntil(date: string, today = todayISO()): number {
    return diffDays(today, date);
}

export function compareByProgress(a: Task, b: Task): number {
    return a.progress - b.progress;
}
