import type { Task, TaskPriority, TaskStatus } from "../../types/domain";
import { addDays, todayISO } from "../../utils/date";
import { isTaskOverdue } from "../workspace/progress";
import { compareByProgress, comparePriority, compareTasksByUrgency } from "../workspace/selectors";

export type TaskStatusFilter = TaskStatus | "ALL";
export type TaskDeadlineFilter = "ALL" | "TODAY" | "WEEK" | "OVERDUE";
export type TaskSortKey = "deadline" | "priority" | "progress" | "project";

export interface TaskFilters {
    query: string;
    status: TaskStatusFilter;
    deadline: TaskDeadlineFilter;
    projectId: string;           // "" = all
    priority: TaskPriority | "ALL";
}

export const EMPTY_TASK_FILTERS: TaskFilters = { query: "", status: "ALL", deadline: "ALL", projectId: "", priority: "ALL" };

// Open tasks only for the deadline buckets: finished work is never "due today"
export function matchesDeadline(task: Task, deadline: TaskDeadlineFilter, today = todayISO()): boolean {
    switch (deadline) {
        case "ALL": return true;
        case "TODAY": return task.status !== "DONE" && task.dueDate === today;
        case "WEEK": return task.status !== "DONE" && task.dueDate >= today && task.dueDate <= addDays(today, 7);
        case "OVERDUE": return isTaskOverdue(task, today);
    }
}

export function filterTasks(tasks: Task[], filters: TaskFilters, today = todayISO()): Task[] {
    const query = filters.query.trim().toLowerCase();
    return tasks.filter((task) =>
        (filters.status === "ALL" || task.status === filters.status)
        && matchesDeadline(task, filters.deadline, today)
        && (!filters.projectId || task.projectId === filters.projectId)
        && (filters.priority === "ALL" || task.priority === filters.priority)
        && (!query || `${task.title} ${task.description} ${task.group}`.toLowerCase().includes(query)));
}

export function sortTasks(tasks: Task[], key: TaskSortKey, projectName: (id: string) => string): Task[] {
    const comparators: Record<TaskSortKey, (a: Task, b: Task) => number> = {
        deadline: compareTasksByUrgency,
        priority: (a, b) => comparePriority(a, b) || compareTasksByUrgency(a, b),
        progress: (a, b) => compareByProgress(a, b) || compareTasksByUrgency(a, b),
        project: (a, b) => projectName(a.projectId).localeCompare(projectName(b.projectId), "da") || compareTasksByUrgency(a, b),
    };
    // Finished tasks always sink to the bottom; what's left to do comes first
    return [...tasks].sort((a, b) => Number(a.status === "DONE") - Number(b.status === "DONE") || comparators[key](a, b));
}

// Secondary filters live in the filter popover; count them for its badge
export function countSecondaryFilters(filters: TaskFilters): number {
    return [filters.query.trim() !== "", filters.projectId !== "", filters.priority !== "ALL"].filter(Boolean).length;
}
