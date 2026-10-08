import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import Panel from "../../components/ui/Panel";
import { EmptyState } from "../../components/ui/States";
import { Pager, type SortState } from "../../components/ui/Table";
import { AlertIcon, CalendarIcon, FolderIcon, PlayIcon, PlusIcon, SearchIcon } from "../../components/icons/AppIcons";
import { canCreateProject, isAdmin } from "../auth/permissions";
import { PROJECT_STATUSES } from "../workspace/constants";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import ProjectFormModal from "./ProjectFormModal";
import ProjectsTable from "./ProjectsTable";
import { useArchiveProject } from "./useArchiveProject";
import {
    countActiveFilters, EMPTY_PROJECT_FILTERS, filterProjects, sortProjects,
    type ProjectFilters, type ProjectPeriodFilter, type ProjectSortKey, type ProjectStatusFilter,
} from "./projectFilters";
import "./projects.css";

const PAGE_SIZE = 8;

function ProjectsPage() {
    const text = useAppText();
    const t = text.projects;
    const user = useCurrentUser();
    const { data, summaries } = useWorkspaceData();
    const navigate = useNavigate();
    const archive = useArchiveProject();

    const [filters, setFilters] = useState<ProjectFilters>(EMPTY_PROJECT_FILTERS);
    const [sort, setSort] = useState<SortState<ProjectSortKey>>({ key: "status", direction: "asc" });
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<Project | "new" | null>(null);

    const all = useMemo(() => [...summaries.values()], [summaries]);
    const current = all.filter((s) => !s.project.archived);
    const rows = useMemo(() => sortProjects(filterProjects(all, filters), sort), [all, filters, sort]);
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const clients = [...new Set(current.map((s) => s.project.client))].sort((a, b) => a.localeCompare(b, "da"));
    const members = data.users.filter((u) => u.active && current.some((s) => s.memberIds.includes(u.id)));

    function setFilter<K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) {
        setFilters((f) => ({ ...f, [key]: value }));
        setPage(1);
    }

    // The stat cards double as quick status filters
    const statusShortcut = (status: ProjectStatusFilter) => ({
        onClick: () => setFilter("status", filters.status === status && status !== "ALL" ? "ALL" : status),
        active: filters.status === status,
    });

    return (
        <div className="page">
            <PageHeader
                title={t.title}
                lead={t.lead}
                aside={canCreateProject(user) && (
                    <button type="button" className="app-btn app-btn--primary app-btn--lg" onClick={() => setEditing("new")}>
                        <PlusIcon aria-hidden="true" /> {t.create}
                    </button>
                )}
            />

            <StatGrid label={text.dashboard.statsLabel}>
                <StatCard label={t.statAll} value={current.length} Icon={FolderIcon} {...statusShortcut("ALL")} />
                <StatCard label={t.statActive} value={current.filter((s) => s.project.status === "ACTIVE").length} Icon={PlayIcon} tone="success" {...statusShortcut("ACTIVE")} />
                <StatCard label={t.statPlanned} value={current.filter((s) => s.project.status === "PLANNED").length} Icon={CalendarIcon} {...statusShortcut("PLANNED")} />
                <StatCard label={t.statDelayed} value={current.filter((s) => s.schedule === "DELAYED").length} Icon={AlertIcon} tone="danger" {...statusShortcut("DELAYED")} />
            </StatGrid>

            <div className="toolbar" role="search">
                <div className="search-field">
                    <SearchIcon aria-hidden="true" />
                    <input type="search" className="control" placeholder={t.searchShort} aria-label={t.searchPlaceholder} value={filters.query} onChange={(e) => setFilter("query", e.target.value)} />
                </div>
                <div className="toolbar-end">
                    <select className="control" aria-label={t.filterStatus} value={filters.status} onChange={(e) => setFilter("status", e.target.value as ProjectStatusFilter)}>
                        <option value="ALL">{t.allStatuses}</option>
                        {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{text.projectStatus[s]}</option>)}
                        <option value="DELAYED">{text.schedule.DELAYED}</option>
                        {isAdmin(user) && <option value="ARCHIVED">{t.archivedOption}</option>}
                    </select>
                    <select className="control" aria-label={t.filterClient} value={filters.client} onChange={(e) => setFilter("client", e.target.value)}>
                        <option value="">{t.allClients}</option>
                        {clients.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="control" aria-label={t.filterTeam} value={filters.memberId} onChange={(e) => setFilter("memberId", e.target.value)}>
                        <option value="">{t.allMembers}</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <select className="control" aria-label={t.filterPeriod} value={filters.period} onChange={(e) => setFilter("period", e.target.value as ProjectPeriodFilter)}>
                        <option value="ALL">{t.allPeriods}</option>
                        <option value="THIS_MONTH">{t.periodThisMonth}</option>
                        <option value="QUARTER">{t.periodQuarter}</option>
                        <option value="OVERDUE">{t.periodOverdue}</option>
                    </select>
                </div>
            </div>

            <Panel flush>
                {rows.length === 0 ? (
                    <EmptyState
                        Icon={FolderIcon}
                        title={all.length === 0 ? (isAdmin(user) ? t.emptyNone : t.emptyEmployee) : t.empty}
                        action={countActiveFilters(filters) > 0 && (
                            <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setFilters(EMPTY_PROJECT_FILTERS)}>
                                {text.common.clearFilters}
                            </button>
                        )}
                    />
                ) : (
                    <>
                        <ProjectsTable rows={visible} sort={sort} onSort={setSort} onEdit={setEditing} onArchive={(p) => void archive(p)} />
                        <footer className="table-footer">
                            <span>{text.common.showing(visible.length, rows.length, t.noun)}</span>
                            <Pager
                                page={currentPage}
                                pageCount={pageCount}
                                onChange={setPage}
                                labels={{ previous: text.common.previousPage, next: text.common.nextPage, page: text.common.page }}
                            />
                        </footer>
                    </>
                )}
            </Panel>

            {editing && (
                <ProjectFormModal
                    project={editing === "new" ? undefined : editing}
                    onClose={() => setEditing(null)}
                    onSaved={(id) => editing === "new" && navigate(APP_ROUTES.project(id))}
                />
            )}
        </div>
    );
}

export default ProjectsPage;
