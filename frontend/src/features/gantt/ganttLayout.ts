import type { ISODate, Milestone, Project, Task } from "../../types/domain";
import { addDays, diffDays, isoWeek, maxDate, minDate, parseDate, startOfMonth, startOfWeek, todayISO } from "../../utils/date";

/* Pure layout calculations for the Gantt chart (no React), so they can be tested and memoised. */

export type GanttViewMode = "month" | "week" | "day";
export type GanttPeriod = "ALL" | "THIS_MONTH" | "NEXT_3_MONTHS" | "AROUND";
export type GanttGrouping = "project" | "phase";

export const DAY_WIDTH: Record<GanttViewMode, number> = { month: 9, week: 30, day: 56 };
export const ROW_HEIGHT = { group: 60, task: 36, milestone: 36 } as const;
export const HEADER_HEIGHT = 60;
export const LABEL_WIDTH = 300;

export type GanttGroupRow = { kind: "group"; key: string; label: string; project: Project | null; tasks: Task[]; milestones: Milestone[]; collapsed: boolean };

export type GanttRow =
    | GanttGroupRow
    | { kind: "task"; key: string; task: Task; groupKey: string }
    | { kind: "milestone"; key: string; milestone: Milestone; groupKey: string };

const MILESTONES_GROUP = "__milestones";

/*
 * Rows in display order. Project grouping: one group per project with its tasks followed by its
 * milestones. Phase grouping (single project): one group per phase, milestones in a final group.
 */
export function buildRows(
    projects: Project[],
    tasks: Task[],
    milestones: Milestone[],
    grouping: GanttGrouping,
    collapsed: Set<string>,
    milestonesLabel: string,
): GanttRow[] {
    const byStart = (a: Task, b: Task) => a.startDate.localeCompare(b.startDate) || a.dueDate.localeCompare(b.dueDate);
    const byDue = (a: Milestone, b: Milestone) => a.dueDate.localeCompare(b.dueDate);
    const groups: GanttGroupRow[] = [];

    if (grouping === "project") {
        for (const project of projects) {
            groups.push({
                kind: "group",
                key: project.id,
                label: project.name,
                project,
                tasks: tasks.filter((t) => t.projectId === project.id).sort(byStart),
                milestones: milestones.filter((m) => m.projectId === project.id).sort(byDue),
                collapsed: collapsed.has(project.id),
            });
        }
    } else {
        const phases = new Map<string, Task[]>();
        for (const task of [...tasks].sort(byStart)) phases.set(task.group, [...(phases.get(task.group) ?? []), task]);
        for (const [phase, phaseTasks] of phases) {
            groups.push({ kind: "group", key: phase, label: phase, project: null, tasks: phaseTasks, milestones: [], collapsed: collapsed.has(phase) });
        }
        if (milestones.length) {
            groups.push({
                kind: "group",
                key: MILESTONES_GROUP,
                label: milestonesLabel,
                project: null,
                tasks: [],
                milestones: [...milestones].sort(byDue),
                collapsed: collapsed.has(MILESTONES_GROUP),
            });
        }
    }

    const rows: GanttRow[] = [];
    for (const group of groups) {
        if (group.tasks.length === 0 && group.milestones.length === 0) continue;
        rows.push(group);
        if (group.collapsed) continue;
        for (const task of group.tasks) rows.push({ kind: "task", key: task.id, task, groupKey: group.key });
        for (const milestone of group.milestones) rows.push({ kind: "milestone", key: milestone.id, milestone, groupKey: group.key });
    }
    return rows;
}

// Top offset of every row (rows have different heights); the last entry is the total height
export function rowOffsets(rows: GanttRow[]): number[] {
    const offsets: number[] = [];
    let y = 0;
    for (const row of rows) {
        offsets.push(y);
        y += ROW_HEIGHT[row.kind];
    }
    offsets.push(y);
    return offsets;
}

export interface TimelineRange {
    start: ISODate;
    end: ISODate;
    days: number;
}

// Visible period: fitted to the data or a fixed preset around today, snapped to the view's units
export function computeRange(tasks: Task[], milestones: Milestone[], mode: GanttViewMode, period: GanttPeriod, today = todayISO()): TimelineRange {
    let first: ISODate;
    let last: ISODate;
    switch (period) {
        case "THIS_MONTH":
            first = startOfMonth(today);
            last = addDays(startOfMonth(addDays(first, 32)), -1);
            break;
        case "NEXT_3_MONTHS":
            first = addDays(today, -7);
            last = addDays(today, 90);
            break;
        case "AROUND":
            first = addDays(today, -90);
            last = addDays(today, 90);
            break;
        case "ALL": {
            const dates = [...tasks.flatMap((t) => [t.startDate, t.dueDate]), ...milestones.map((m) => m.dueDate), today];
            first = addDays(minDate(dates) ?? today, -7);
            last = addDays(maxDate(dates) ?? today, 14);
        }
    }

    const start = mode === "month" ? startOfMonth(first) : startOfWeek(first);
    const end = mode === "month" ? addDays(startOfMonth(addDays(startOfMonth(last), 32)), -1) : addDays(startOfWeek(last), 6);
    return { start, end, days: diffDays(start, end) + 1 };
}

export interface HeaderCell {
    key: string;
    label: string;
    left: number;
    width: number;
    date: ISODate;
}

/*
 * Two header rows. Month view: months / week starts. Week view: ISO weeks / days.
 * Day view: months / weekday + day.
 */
export function headerCells(
    range: TimelineRange,
    mode: GanttViewMode,
    labels: { month: (d: ISODate) => string; week: (n: number) => string; weekday: (d: ISODate) => string },
): { top: HeaderCell[]; bottom: HeaderCell[] } {
    const dw = DAY_WIDTH[mode];
    const top: HeaderCell[] = [];
    const bottom: HeaderCell[] = [];
    const cell = (from: ISODate, to: ISODate, label: string): HeaderCell => {
        const left = Math.max(0, diffDays(range.start, from)) * dw;
        const right = Math.min(range.days, diffDays(range.start, to)) * dw;
        return { key: from, label, left, width: right - left, date: from };
    };
    const nextMonth = (d: ISODate) => startOfMonth(addDays(startOfMonth(d), 32));

    if (mode === "week") {
        for (let week = startOfWeek(range.start); week <= range.end; week = addDays(week, 7)) top.push(cell(week, addDays(week, 7), labels.week(isoWeek(week))));
    } else {
        for (let month = startOfMonth(range.start); month <= range.end; month = nextMonth(month)) top.push(cell(month, nextMonth(month), labels.month(month)));
    }

    if (mode === "month") {
        for (let week = startOfWeek(range.start); week <= range.end; week = addDays(week, 7)) {
            const visibleStart = week < range.start ? range.start : week;
            bottom.push(cell(week, addDays(week, 7), String(parseDate(visibleStart).getDate())));
        }
    } else {
        for (let i = 0; i < range.days; i++) {
            const day = addDays(range.start, i);
            const dayNumber = parseDate(day).getDate();
            bottom.push(cell(day, addDays(day, 1), mode === "day" ? `${labels.weekday(day)} ${dayNumber}` : String(dayNumber)));
        }
    }
    return { top, bottom };
}

export function groupKeys(rows: GanttRow[]): string[] {
    return rows.filter((r) => r.kind === "group").map((r) => r.key);
}
