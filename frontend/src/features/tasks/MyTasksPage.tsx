import { useMemo, useState } from "react";
import type { TaskPriority } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { todayISO } from "../../utils/date";
import PageHeader from "../../components/ui/PageHeader";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import FilterPopover from "../../components/ui/FilterPopover";
import { EmptyState } from "../../components/ui/States";
import { AlertIcon, CalendarIcon, CheckIcon, CheckSquareIcon, FlagIcon, SearchIcon } from "../../components/icons/AppIcons";
import { TASK_PRIORITIES, TASK_STATUSES } from "../workspace/constants";
import { useMyTasks } from "../workspace/hooks";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import TaskTable from "./TaskTable";
import TaskDetailPanel from "./TaskDetailPanel";
import {
    countSecondaryFilters, EMPTY_TASK_FILTERS, filterTasks, matchesDeadline, sortTasks,
    type TaskDeadlineFilter, type TaskFilters, type TaskSortKey, type TaskStatusFilter,
} from "./taskFilters";
import "./tasks.css";

function MyTasksPage() {
    const text = useAppText();
    const t = text.tasks;
    const { data } = useWorkspaceData();
    const myTasks = useMyTasks();
    const [filters, setFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
    const [sort, setSort] = useState<TaskSortKey>("deadline");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const today = todayISO();
    const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? "";
    const rows = useMemo(
        () => sortTasks(filterTasks(myTasks, filters, today), sort, (id) => data.projects.find((p) => p.id === id)?.name ?? ""),
        [myTasks, filters, sort, today, data.projects],
    );
    // Keep the panel open only for tasks that still exist and belong to the user
    const selected = myTasks.find((task) => task.id === selectedId) ?? null;
    const myProjectIds = [...new Set(myTasks.map((task) => task.projectId))];

    const set = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
    const deadlineShortcut = (deadline: TaskDeadlineFilter) => ({
        onClick: () => setFilters((f) => ({ ...f, deadline: f.deadline === deadline ? "ALL" : deadline, status: "ALL" })),
        active: filters.deadline === deadline,
    });
    const count = (deadline: TaskDeadlineFilter) => myTasks.filter((task) => matchesDeadline(task, deadline, today)).length;

    const statusTabs = [
        { value: "ALL" as TaskStatusFilter, label: t.tabAll, count: myTasks.length },
        ...TASK_STATUSES.map((status) => ({
            value: status as TaskStatusFilter,
            label: status === "DONE" ? t.tabDone : text.taskStatus[status],
            count: myTasks.filter((task) => task.status === status).length,
        })),
    ];

    return (
        <div className="page">
            <PageHeader title={t.title} lead={t.lead} />

            <StatGrid label={text.dashboard.statsLabel}>
                <StatCard label={t.statToday} value={count("TODAY")} Icon={CalendarIcon} {...deadlineShortcut("TODAY")} />
                <StatCard label={t.statWeek} value={count("WEEK")} Icon={FlagIcon} tone="pink" {...deadlineShortcut("WEEK")} />
                <StatCard label={t.statOverdue} value={count("OVERDUE")} Icon={AlertIcon} tone="danger" {...deadlineShortcut("OVERDUE")} />
                <StatCard
                    label={t.statDone}
                    value={myTasks.filter((task) => task.status === "DONE").length}
                    Icon={CheckIcon}
                    tone="success"
                    onClick={() => setFilters((f) => ({ ...f, deadline: "ALL", status: f.status === "DONE" ? "ALL" : "DONE" }))}
                    active={filters.status === "DONE" && filters.deadline === "ALL"}
                />
            </StatGrid>

            <div className={`page-columns ${selected ? "" : "page-columns--single"}`}>
                <div className="stack">
                    <div className="toolbar">
                        <PillTabs label={text.common.status} options={statusTabs} value={filters.status} onChange={(status) => set("status", status)} />
                        <div className="toolbar-end">
                            <label className="labelled-control">
                                {text.common.sortBy}
                                <select className="control" value={sort} onChange={(e) => setSort(e.target.value as TaskSortKey)}>
                                    <option value="deadline">{t.sortDeadline}</option>
                                    <option value="priority">{t.sortPriority}</option>
                                    <option value="progress">{t.sortProgress}</option>
                                    <option value="project">{t.sortProject}</option>
                                </select>
                            </label>
                            <FilterPopover
                                label={text.common.filters}
                                title={t.filtersTitle}
                                activeCount={countSecondaryFilters(filters)}
                                footer={countSecondaryFilters(filters) > 0 && (
                                    <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setFilters((f) => ({ ...f, query: "", projectId: "", priority: "ALL" }))}>
                                        {text.common.clearFilters}
                                    </button>
                                )}
                            >
                                <div className="field">
                                    <label htmlFor="task-filter-query">{text.common.search}</label>
                                    <div className="search-field">
                                        <SearchIcon aria-hidden="true" />
                                        <input id="task-filter-query" type="search" placeholder={t.searchPlaceholder} value={filters.query} onChange={(e) => set("query", e.target.value)} />
                                    </div>
                                </div>
                                <div className="field">
                                    <label htmlFor="task-filter-project">{text.common.project}</label>
                                    <select id="task-filter-project" value={filters.projectId} onChange={(e) => set("projectId", e.target.value)}>
                                        <option value="">{t.allProjects}</option>
                                        {myProjectIds.map((id) => <option key={id} value={id}>{projectName(id)}</option>)}
                                    </select>
                                </div>
                                <div className="field">
                                    <label htmlFor="task-filter-priority">{text.common.priority}</label>
                                    <select id="task-filter-priority" value={filters.priority} onChange={(e) => set("priority", e.target.value as TaskPriority | "ALL")}>
                                        <option value="ALL">{t.allPriorities}</option>
                                        {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{text.priority[p]}</option>)}
                                    </select>
                                </div>
                            </FilterPopover>
                        </div>
                    </div>

                    <Panel flush>
                        {rows.length === 0 ? (
                            <EmptyState
                                Icon={CheckSquareIcon}
                                title={myTasks.length === 0 ? t.emptyNone : t.empty}
                                action={myTasks.length > 0 && (
                                    <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setFilters(EMPTY_TASK_FILTERS)}>
                                        {text.common.clearFilters}
                                    </button>
                                )}
                            />
                        ) : (
                            <TaskTable tasks={rows} selectedId={selected?.id ?? null} onSelect={(id) => setSelectedId(id === selectedId ? null : id)} />
                        )}
                    </Panel>
                </div>

                {selected && <TaskDetailPanel task={selected} onClose={() => setSelectedId(null)} />}
            </div>
        </div>
    );
}

export default MyTasksPage;
