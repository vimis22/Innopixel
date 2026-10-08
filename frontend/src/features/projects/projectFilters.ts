import type { ProjectStatus } from "../../types/domain";
import { addDays, todayISO } from "../../utils/date";
import type { ProjectSummary } from "../workspace/selectors";
import type { SortState } from "../../components/ui/Table";

// "DELAYED" filters on schedule status, "ARCHIVED" shows archived projects (administrators only)
export type ProjectStatusFilter = ProjectStatus | "ALL" | "DELAYED" | "ARCHIVED";
export type ProjectPeriodFilter = "ALL" | "THIS_MONTH" | "QUARTER" | "OVERDUE";
export type ProjectSortKey = "name" | "status" | "progress" | "deadline" | "team";

export interface ProjectFilters {
    query: string;
    status: ProjectStatusFilter;
    client: string;              // "" = all
    memberId: string;            // "" = all
    period: ProjectPeriodFilter;
}

export const EMPTY_PROJECT_FILTERS: ProjectFilters = { query: "", status: "ALL", client: "", memberId: "", period: "ALL" };

const statusOrder: Record<ProjectStatus, number> = { ACTIVE: 0, PLANNED: 1, ON_HOLD: 2, COMPLETED: 3, CANCELLED: 4 };

function matchesPeriod(endDate: string, period: ProjectPeriodFilter, today: string): boolean {
    switch (period) {
        case "ALL": return true;
        case "THIS_MONTH": return endDate.slice(0, 7) === today.slice(0, 7);
        case "QUARTER": return endDate >= today && endDate <= addDays(today, 90);
        case "OVERDUE": return endDate < today;
    }
}

export function filterProjects(summaries: ProjectSummary[], filters: ProjectFilters, today = todayISO()): ProjectSummary[] {
    const query = filters.query.trim().toLowerCase();
    return summaries.filter(({ project, schedule, memberIds }) => {
        if (filters.status === "ARCHIVED" ? !project.archived : project.archived) return false;
        if (filters.status === "DELAYED" && schedule !== "DELAYED") return false;
        if (filters.status !== "ALL" && filters.status !== "DELAYED" && filters.status !== "ARCHIVED" && project.status !== filters.status) return false;
        if (filters.client && project.client !== filters.client) return false;
        if (filters.memberId && !memberIds.includes(filters.memberId)) return false;
        if (!matchesPeriod(project.endDate, filters.period, today)) return false;
        return !query || `${project.name} ${project.client} ${project.description}`.toLowerCase().includes(query);
    });
}

const comparators: Record<ProjectSortKey, (a: ProjectSummary, b: ProjectSummary) => number> = {
    name: (a, b) => a.project.name.localeCompare(b.project.name, "da"),
    status: (a, b) => statusOrder[a.project.status] - statusOrder[b.project.status],
    progress: (a, b) => (a.progress.value ?? -1) - (b.progress.value ?? -1),
    deadline: (a, b) => a.project.endDate.localeCompare(b.project.endDate),
    team: (a, b) => a.memberIds.length - b.memberIds.length,
};

export function sortProjects(summaries: ProjectSummary[], sort: SortState<ProjectSortKey>): ProjectSummary[] {
    const direction = sort.direction === "asc" ? 1 : -1;
    // Ties fall back to the deadline, so the order is always predictable
    return [...summaries].sort((a, b) => direction * comparators[sort.key](a, b) || comparators.deadline(a, b));
}

export function countActiveFilters(filters: ProjectFilters): number {
    return [filters.query.trim() !== "", filters.status !== "ALL", filters.client !== "", filters.memberId !== "", filters.period !== "ALL"].filter(Boolean).length;
}
