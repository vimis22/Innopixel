import type { ISODate, Milestone, Project, Task } from "../../types/domain";
import { diffDays, todayISO } from "../../utils/date";

/*
 * All progress and schedule calculations live here, so every screen shows the same numbers.
 *
 * - Task progress:      DONE counts as 100 %, otherwise the progress reported on the task.
 * - Project progress:   weighted by estimateHours when every task has an estimate,
 *                       otherwise the plain average of task progress. No tasks → no value.
 * - Task completion:    share of tasks with status DONE (independent of reported progress).
 * - Milestone:          completed when all related tasks are DONE; milestones without related
 *                       tasks are completed manually. Not completed + due date passed → overdue.
 * - Schedule status:    see scheduleStatus() below.
 */

export const AT_RISK_THRESHOLD = 20; // percentage points behind the time elapsed

export function isTaskOverdue(task: Task, today: ISODate = todayISO()): boolean {
    return task.status !== "DONE" && task.dueDate < today;
}

export function taskProgress(task: Task): number {
    if (task.status === "DONE") return 100;
    return Math.max(0, Math.min(100, task.progress));
}

export type ProgressMethod = "weighted" | "average" | "none";

export interface ProgressResult {
    value: number | null;
    method: ProgressMethod;
}

export function projectProgress(tasks: Task[]): ProgressResult {
    if (tasks.length === 0) return { value: null, method: "none" };

    const allEstimated = tasks.every((task) => task.estimateHours !== null && task.estimateHours > 0);
    if (allEstimated) {
        const totalHours = tasks.reduce((sum, task) => sum + (task.estimateHours ?? 0), 0);
        const doneHours = tasks.reduce((sum, task) => sum + (task.estimateHours ?? 0) * (taskProgress(task) / 100), 0);
        return { value: Math.round((doneHours / totalHours) * 100), method: "weighted" };
    }

    const average = tasks.reduce((sum, task) => sum + taskProgress(task), 0) / tasks.length;
    return { value: Math.round(average), method: "average" };
}

export function taskCompletion(tasks: Task[]): { done: number; total: number } {
    return { done: tasks.filter((task) => task.status === "DONE").length, total: tasks.length };
}

// Share of the planned period that has passed, 0-100
export function timeElapsed(project: Project, today: ISODate = todayISO()): number {
    const total = diffDays(project.startDate, project.endDate);
    if (total <= 0) return today >= project.endDate ? 100 : 0;
    const passed = diffDays(project.startDate, today);
    return Math.round(Math.max(0, Math.min(1, passed / total)) * 100);
}

export type MilestoneState = "UPCOMING" | "OVERDUE" | "COMPLETED";

export interface MilestoneInfo {
    state: MilestoneState;
    related: Task[];
    done: number;
    automatic: boolean; // completion is derived from related tasks
}

export function milestoneInfo(milestone: Milestone, tasks: Task[], today: ISODate = todayISO()): MilestoneInfo {
    const related = tasks.filter((task) => task.milestoneId === milestone.id);
    const done = related.filter((task) => task.status === "DONE").length;
    const automatic = related.length > 0;
    const completed = automatic ? done === related.length : milestone.completedManually;

    let state: MilestoneState = "UPCOMING";
    if (completed) state = "COMPLETED";
    else if (milestone.dueDate < today) state = "OVERDUE";

    return { state, related, done, automatic };
}

export type ScheduleStatus = "ON_TRACK" | "AT_RISK" | "DELAYED" | "NOT_STARTED" | "DONE" | "PAUSED" | "CANCELLED";

/*
 * Schedule status of a project:
 * - COMPLETED / ON_HOLD / CANCELLED projects map directly to DONE / PAUSED / CANCELLED.
 * - PLANNED projects are NOT_STARTED.
 * - ACTIVE projects are DELAYED if the end date has passed or a milestone is overdue,
 *   AT_RISK if a task is overdue or progress is more than AT_RISK_THRESHOLD points behind
 *   the share of time elapsed, otherwise ON_TRACK.
 */
export function scheduleStatus(
    project: Project,
    tasks: Task[],
    milestones: Milestone[],
    today: ISODate = todayISO(),
): ScheduleStatus {
    switch (project.status) {
        case "COMPLETED": return "DONE";
        case "ON_HOLD": return "PAUSED";
        case "CANCELLED": return "CANCELLED";
        case "PLANNED": return "NOT_STARTED";
        case "ACTIVE": break;
    }

    const overdueMilestone = milestones.some((m) => milestoneInfo(m, tasks, today).state === "OVERDUE");
    if (project.endDate < today || overdueMilestone) return "DELAYED";

    const progress = projectProgress(tasks).value;
    const behind = progress !== null && progress < timeElapsed(project, today) - AT_RISK_THRESHOLD;
    if (behind || tasks.some((task) => isTaskOverdue(task, today))) return "AT_RISK";

    return "ON_TRACK";
}
