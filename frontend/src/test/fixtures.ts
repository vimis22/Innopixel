import type { Milestone, Project, ProjectStatus, Task, TaskStatus, User, WorkspaceData } from "../types/domain";
import { addDays } from "../utils/date";

/*
 * Small, explicit data set for the unit tests (filters, selectors, Gantt layout).
 * Only used by tests; the app itself loads everything from the API.
 */

const CREATED = "2026-01-01T00:00:00.000Z";

function user(id: string, name: string, role: User["role"] = "EMPLOYEE"): User {
    return { id, name, email: `${id}@innopixel.dk`, role, title: "Udvikler", department: null, phone: null, active: true, expectedWeeklyHours: 37, createdAt: CREATED };
}

function project(id: string, name: string, status: ProjectStatus, start: string, end: string, description = ""): Project {
    return {
        id, name, description, client: "Kunde A/S", managerId: "u-admin", status, startDate: start, endDate: end,
        imageUrl: null, archived: false, createdAt: CREATED, updatedAt: CREATED,
    };
}

function task(id: string, projectId: string, status: TaskStatus, start: string, due: string, assigneeId: string | null, milestoneId: string | null = null): Task {
    return {
        id, projectId, title: `Opgave ${id}`, description: "", status, priority: "MEDIUM", assigneeId, group: "Udvikling",
        startDate: start, dueDate: due, progress: status === "DONE" ? 100 : 30, estimateHours: 8, milestoneId, checklist: [],
        createdAt: CREATED, updatedAt: CREATED,
    };
}

function milestone(id: string, projectId: string, dueDate: string): Milestone {
    return { id, projectId, title: `Milepæl ${id}`, description: "", dueDate, completedManually: false, completedAt: null, createdAt: CREATED };
}

// today is the date the scenario is built around (e.g. "2026-10-08")
export function createTestData(today: string): WorkspaceData {
    const d = (days: number) => addDays(today, days);

    return {
        users: [user("u-admin", "Michael Lundorff Hansen", "ADMIN"), user("u-dev", "Sara Nielsen")],
        projects: [
            project("p-vr-training", "VR-træning", "ACTIVE", d(-20), d(40)),
            project("p-museum", "Museumsudstilling", "ACTIVE", d(-60), d(-2)),
            project("p-architecture", "Arkitektur-visualisering", "PLANNED", d(5), d(60), "Nordlys over fjorden"),
            project("p-done", "Afsluttet app", "COMPLETED", d(-120), d(-30)),
        ],
        members: [
            { projectId: "p-vr-training", userId: "u-dev", addedAt: CREATED },
            { projectId: "p-museum", userId: "u-dev", addedAt: CREATED },
        ],
        tasks: [
            task("t-1", "p-vr-training", "DONE", d(-20), d(-10), "u-dev", "m-1"),
            task("t-2", "p-vr-training", "IN_PROGRESS", d(-5), d(-1), "u-dev", "m-1"),
            task("t-3", "p-vr-training", "TODO", d(1), d(10), "u-dev"),
            task("t-4", "p-museum", "IN_REVIEW", d(-30), d(-3), null),
            task("t-5", "p-done", "DONE", d(-120), d(-40), "u-dev"),
        ],
        dependencies: [{ id: "d-1", predecessorId: "t-2", successorId: "t-3" }],
        milestones: [milestone("m-1", "p-vr-training", d(15)), milestone("m-2", "p-vr-training", d(35))],
        statusHistory: [],
        activity: [],
    };
}
