import { describe, expect, it } from "vitest";
import type { TaskInput } from "../../types/domain";
import { addDays, todayISO } from "../../utils/date";
import { mockRepository as repo } from "./mockRepository";
import { RepositoryError } from "./repository";
import { getMilestoneInfo } from "./selectors";

const ADMIN = "u-mette";
const EMPLOYEE = "u-jonas";

function taskInput(projectId: string, overrides: Partial<TaskInput> = {}): TaskInput {
    return {
        projectId, title: "Ny opgave", description: "", status: "TODO", priority: "MEDIUM", assigneeId: EMPLOYEE,
        group: "Udvikling", startDate: todayISO(), dueDate: addDays(todayISO(), 5), progress: 0,
        estimateHours: 10, milestoneId: null, predecessorIds: [], ...overrides,
    };
}

describe("mock repository workflow", () => {
    it("keeps all views consistent from project creation to milestone completion", async () => {
        const project = await repo.createProject(ADMIN, {
            name: "Testprojekt", description: "", client: "Kunde", managerId: ADMIN, status: "ACTIVE",
            startDate: todayISO(), endDate: addDays(todayISO(), 30), imageUrl: null, memberIds: [EMPLOYEE],
        });
        const task = await repo.createTask(ADMIN, taskInput(project.id));
        await repo.createMilestone(ADMIN, { projectId: project.id, title: "Klar", description: "", dueDate: addDays(todayISO(), 10), taskIds: [task.id] });

        // The employee sees the new project and their task
        const employeeView = await repo.load(EMPLOYEE);
        expect(employeeView.projects.some((p) => p.id === project.id)).toBe(true);
        expect(employeeView.tasks.find((t) => t.id === task.id)?.assigneeId).toBe(EMPLOYEE);

        // The assignee finishes the task; the milestone completes and the activity is logged
        await repo.updateTaskProgress(EMPLOYEE, task.id, { status: "DONE" });
        const after = await repo.load(ADMIN);
        const milestone = after.milestones.find((m) => m.projectId === project.id)!;
        expect(after.tasks.find((t) => t.id === task.id)?.progress).toBe(100);
        expect(getMilestoneInfo(after, milestone).state).toBe("COMPLETED");
        expect(milestone.completedAt).not.toBeNull();
        expect(after.activity[0].type).toBe("MILESTONE_COMPLETED");
    });

    it("lets assignees update the checklist but not the schedule", async () => {
        const project = (await repo.load(ADMIN)).projects.find((p) => p.id === "p-vr-training")!;
        const task = await repo.createTask(ADMIN, taskInput(project.id));

        await repo.updateTaskChecklist(EMPLOYEE, task.id, [{ id: "", text: " Punkt ", done: false }, { id: "", text: "   ", done: false }]);
        const saved = (await repo.load(EMPLOYEE)).tasks.find((t) => t.id === task.id)!;
        expect(saved.checklist).toHaveLength(1);
        expect(saved.checklist[0].text).toBe("Punkt");

        await expect(repo.updateTaskSchedule(EMPLOYEE, task.id, { startDate: todayISO(), dueDate: todayISO() })).rejects.toBeInstanceOf(RepositoryError);
    });

    it("scopes employees to their own projects and blocks admin actions", async () => {
        const view = await repo.load("u-emil");
        expect(view.projects.every((p) => view.members.some((m) => m.projectId === p.id && m.userId === "u-emil"))).toBe(true);
        await expect(repo.setProjectArchived("u-emil", "p-vr-training", true)).rejects.toMatchObject({ code: "FORBIDDEN" });
        await expect(repo.createUser("u-emil", { name: "X", email: "x@innopixel.dk", role: "ADMIN", title: "X", department: null, phone: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("validates profile input and never changes the role", async () => {
        await expect(repo.updateOwnProfile(EMPLOYEE, { name: "Jonas", title: "Udvikler", department: null, phone: "abc" })).rejects.toMatchObject({ code: "VALIDATION" });
        await repo.updateOwnProfile(EMPLOYEE, { name: "Jonas K.", title: "Lead", department: "Udvikling", phone: "+45 12 34 56 78" });
        const me = (await repo.load(EMPLOYEE)).users.find((u) => u.id === EMPLOYEE)!;
        expect(me).toMatchObject({ name: "Jonas K.", title: "Lead", role: "EMPLOYEE" });
    });
});
