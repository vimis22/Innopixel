import { describe, expect, it } from "vitest";
import { createSeedData } from "./seed";
import { buildProjectSummaries } from "./selectors";
import { EMPTY_PROJECT_FILTERS, filterProjects, sortProjects } from "../projects/projectFilters";
import { EMPTY_TASK_FILTERS, filterTasks, sortTasks } from "../tasks/taskFilters";
import { buildRows, computeRange, rowOffsets, ROW_HEIGHT } from "../gantt/ganttLayout";

const TODAY = "2026-10-08";
const data = createSeedData(TODAY);
const summaries = [...buildProjectSummaries(data, TODAY).values()];

describe("project filters", () => {
    it("hides archived projects unless asked for", () => {
        const withArchived = summaries.map((s, i) => (i === 0 ? { ...s, project: { ...s.project, archived: true } } : s));
        expect(filterProjects(withArchived, EMPTY_PROJECT_FILTERS, TODAY)).toHaveLength(summaries.length - 1);
        expect(filterProjects(withArchived, { ...EMPTY_PROJECT_FILTERS, status: "ARCHIVED" }, TODAY)).toHaveLength(1);
    });

    it("filters delayed projects by schedule status", () => {
        const delayed = filterProjects(summaries, { ...EMPTY_PROJECT_FILTERS, status: "DELAYED" }, TODAY);
        expect(delayed.map((s) => s.project.id)).toEqual(["p-museum"]);
    });

    it("searches name, client and description", () => {
        expect(filterProjects(summaries, { ...EMPTY_PROJECT_FILTERS, query: "nordlys" }, TODAY).map((s) => s.project.id)).toEqual(["p-architecture"]);
    });

    it("sorts by status with active projects first", () => {
        const sorted = sortProjects(summaries, { key: "status", direction: "asc" });
        expect(sorted[0].project.status).toBe("ACTIVE");
        expect(sorted[sorted.length - 1].project.status).toBe("COMPLETED");
    });
});

describe("task filters", () => {
    const jonas = data.tasks.filter((t) => t.assigneeId === "u-jonas");

    it("finds overdue tasks only among open ones", () => {
        const overdue = filterTasks(data.tasks, { ...EMPTY_TASK_FILTERS, deadline: "OVERDUE" }, TODAY);
        expect(overdue.length).toBeGreaterThan(0);
        expect(overdue.every((t) => t.status !== "DONE" && t.dueDate < TODAY)).toBe(true);
    });

    it("sinks finished tasks to the bottom", () => {
        const sorted = sortTasks(jonas, "deadline", () => "");
        const firstDone = sorted.findIndex((t) => t.status === "DONE");
        expect(sorted.slice(firstDone).every((t) => t.status === "DONE")).toBe(true);
    });
});

describe("gantt layout", () => {
    it("groups tasks and milestones per project, honouring collapsed groups", () => {
        const project = data.projects.find((p) => p.id === "p-vr-training")!;
        const tasks = data.tasks.filter((t) => t.projectId === project.id);
        const milestones = data.milestones.filter((m) => m.projectId === project.id);

        const rows = buildRows([project], tasks, milestones, "project", new Set(), "Milepæle");
        expect(rows).toHaveLength(1 + tasks.length + milestones.length);
        expect(rowOffsets(rows).at(-1)).toBe(ROW_HEIGHT.group + tasks.length * ROW_HEIGHT.task + milestones.length * ROW_HEIGHT.milestone);

        const collapsed = buildRows([project], tasks, milestones, "project", new Set([project.id]), "Milepæle");
        expect(collapsed).toHaveLength(1);
    });

    it("snaps the visible range to whole months in month view", () => {
        const range = computeRange(data.tasks, data.milestones, "month", "THIS_MONTH", TODAY);
        expect(range.start).toBe("2026-10-01");
        expect(range.end).toBe("2026-10-31");
        expect(range.days).toBe(31);
    });
});
