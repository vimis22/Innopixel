import { describe, expect, it } from "vitest";
import type { Milestone, Project, Task } from "../../types/domain";
import { isTaskOverdue, milestoneInfo, projectProgress, scheduleStatus, timeElapsed } from "./progress";

const TODAY = "2026-10-08";

function task(overrides: Partial<Task> = {}): Task {
    return {
        id: "t1", projectId: "p1", title: "Opgave", description: "", status: "TODO", priority: "MEDIUM", assigneeId: null,
        group: "Udvikling", startDate: "2026-10-01", dueDate: "2026-10-20", progress: 0, estimateHours: null,
        milestoneId: null, checklist: [], createdAt: "", updatedAt: "", ...overrides,
    };
}

const project: Project = {
    id: "p1", name: "Projekt", description: "", client: "Kunde", managerId: "u1", status: "ACTIVE",
    startDate: "2026-10-01", endDate: "2026-10-31", imageUrl: null, archived: false, createdAt: "", updatedAt: "",
};

const milestone = (overrides: Partial<Milestone> = {}): Milestone => ({
    id: "m1", projectId: "p1", title: "Milepæl", description: "", dueDate: "2026-10-20",
    completedManually: false, completedAt: null, createdAt: "", ...overrides,
});

describe("projectProgress", () => {
    it("has no value without tasks", () => {
        expect(projectProgress([])).toEqual({ value: null, method: "none" });
    });

    it("weights by estimated hours when every task has an estimate", () => {
        const tasks = [task({ estimateHours: 30, status: "DONE" }), task({ id: "t2", estimateHours: 10, progress: 0 })];
        expect(projectProgress(tasks)).toEqual({ value: 75, method: "weighted" });
    });

    it("falls back to the plain average when an estimate is missing", () => {
        const tasks = [task({ estimateHours: 30, status: "DONE" }), task({ id: "t2", progress: 50 })];
        expect(projectProgress(tasks)).toEqual({ value: 75, method: "average" });
    });

    it("counts DONE as 100 % regardless of reported progress", () => {
        expect(projectProgress([task({ status: "DONE", progress: 10 })]).value).toBe(100);
    });
});

describe("isTaskOverdue", () => {
    it("is overdue only when open and past the deadline", () => {
        expect(isTaskOverdue(task({ dueDate: "2026-10-07" }), TODAY)).toBe(true);
        expect(isTaskOverdue(task({ dueDate: "2026-10-07", status: "DONE" }), TODAY)).toBe(false);
        expect(isTaskOverdue(task({ dueDate: TODAY }), TODAY)).toBe(false);
    });
});

describe("milestoneInfo", () => {
    it("completes automatically when all related tasks are done", () => {
        const tasks = [task({ milestoneId: "m1", status: "DONE" }), task({ id: "t2", milestoneId: "m1", status: "DONE" })];
        expect(milestoneInfo(milestone(), tasks, TODAY).state).toBe("COMPLETED");
    });

    it("is overdue when unfinished after the due date", () => {
        const tasks = [task({ milestoneId: "m1" })];
        expect(milestoneInfo(milestone({ dueDate: "2026-10-01" }), tasks, TODAY).state).toBe("OVERDUE");
    });

    it("uses the manual flag when no tasks are related", () => {
        expect(milestoneInfo(milestone({ completedManually: true }), [], TODAY).state).toBe("COMPLETED");
        expect(milestoneInfo(milestone(), [], TODAY).automatic).toBe(false);
    });
});

describe("scheduleStatus", () => {
    it("maps non-active statuses directly", () => {
        expect(scheduleStatus({ ...project, status: "PLANNED" }, [], [], TODAY)).toBe("NOT_STARTED");
        expect(scheduleStatus({ ...project, status: "COMPLETED" }, [], [], TODAY)).toBe("DONE");
    });

    it("is delayed when a milestone is overdue", () => {
        const tasks = [task({ milestoneId: "m1", progress: 90 })];
        expect(scheduleStatus(project, tasks, [milestone({ dueDate: "2026-10-05" })], TODAY)).toBe("DELAYED");
    });

    it("is at risk when a task is overdue", () => {
        expect(scheduleStatus(project, [task({ dueDate: "2026-10-05", progress: 50 })], [], TODAY)).toBe("AT_RISK");
    });

    it("is on track when progress keeps up with time", () => {
        expect(timeElapsed(project, TODAY)).toBe(23);
        expect(scheduleStatus(project, [task({ progress: 20 })], [], TODAY)).toBe("ON_TRACK");
    });
});
