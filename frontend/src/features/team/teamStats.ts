import type { Task } from "../../types/domain";
import { taskProgress } from "../workspace/progress";

export interface Workload {
    openTasks: number;
    remainingHours: number;      // estimate × share not yet done, summed over open tasks with an estimate
    unestimated: number;         // open tasks without an estimate (not included in the hours)
}

/*
 * Workload is shown as facts from the data (open tasks, estimated hours left), not as a capacity
 * percentage: there is no data about contracted hours or availability to compare against.
 */
export function workloadOf(userId: string, tasks: Task[]): Workload {
    const open = tasks.filter((t) => t.assigneeId === userId && t.status !== "DONE");
    const estimated = open.filter((t) => t.estimateHours !== null);
    return {
        openTasks: open.length,
        remainingHours: Math.round(estimated.reduce((sum, t) => sum + (t.estimateHours ?? 0) * (1 - taskProgress(t) / 100), 0)),
        unestimated: open.length - estimated.length,
    };
}
