import type { ProjectStatus, TaskPriority, TaskStatus } from "../../types/domain";

// Display order of the enum values in selects, columns and charts
export const PROJECT_STATUSES: ProjectStatus[] = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
export const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
export const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const DEPARTMENTS = ["Ledelse", "Produktion", "Udvikling", "Design", "Kunder & salg"] as const;
