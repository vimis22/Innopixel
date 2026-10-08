import { useMemo, useState } from "react";
import type { Project } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import FilterPopover from "../../components/ui/FilterPopover";
import { CalendarIcon } from "../../components/icons/AppIcons";
import { useProjectColors } from "../workspace/hooks";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import GanttChart, { type GanttSelection } from "./GanttChart";
import ProjectOverviewPanel from "./ProjectOverviewPanel";
import TaskSchedulePanel from "./TaskSchedulePanel";
import { computeRange, type GanttGrouping, type GanttPeriod, type GanttViewMode } from "./ganttLayout";
import "./gantt.css";

const VIEW_KEY = "innopixel.ganttView";
const VIEW_MODES: GanttViewMode[] = ["month", "week", "day"];

function savedMode(): GanttViewMode {
    const saved = localStorage.getItem(VIEW_KEY);
    return VIEW_MODES.includes(saved as GanttViewMode) ? (saved as GanttViewMode) : "month";
}

interface ProjectTimelineProps {
    projectIds: string[];
    grouping: GanttGrouping;
    // Optional project picker (the Gantt page); the project detail page shows a single project
    projectFilter?: { options: Project[]; selected: string[]; onChange: (ids: string[]) => void };
}

// Toolbar + Gantt chart + side panel, shared by /app/gantt and the project timeline tab
function ProjectTimeline({ projectIds, grouping, projectFilter }: ProjectTimelineProps) {
    const text = useAppText();
    const t = text.gantt;
    const { data } = useWorkspaceData();
    const colors = useProjectColors();
    const [mode, setMode] = useState<GanttViewMode>(savedMode);
    const [period, setPeriod] = useState<GanttPeriod>("ALL");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [selection, setSelection] = useState<GanttSelection>(null);
    const [todaySignal, setTodaySignal] = useState(0);

    const { projects, tasks, milestones, dependencies } = useMemo(() => {
        const ids = new Set(projectIds);
        const scopedTasks = data.tasks.filter((task) => ids.has(task.projectId));
        const taskIds = new Set(scopedTasks.map((task) => task.id));
        return {
            projects: data.projects.filter((p) => ids.has(p.id)).sort((a, b) => a.startDate.localeCompare(b.startDate)),
            tasks: scopedTasks,
            milestones: data.milestones.filter((m) => ids.has(m.projectId)),
            dependencies: data.dependencies.filter((d) => taskIds.has(d.predecessorId) && taskIds.has(d.successorId)),
        };
    }, [data, projectIds]);

    const range = useMemo(() => computeRange(tasks, milestones, mode, period), [tasks, milestones, mode, period]);

    // Without an explicit choice the panel shows the first project
    const selectedTask = selection?.kind === "task" ? tasks.find((task) => task.id === selection.id) : undefined;
    const selectedProject = selectedTask
        ? undefined
        : projects.find((p) => p.id === (selection?.kind === "project" ? selection.id : projects[0]?.id));

    function changeMode(next: GanttViewMode) {
        setMode(next);
        localStorage.setItem(VIEW_KEY, next);
    }

    function toggleGroup(key: string) {
        setCollapsed((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    const modeLabels: Record<GanttViewMode, string> = { month: t.month, week: t.week, day: t.day };

    return (
        <div className="timeline-layout">
            <section className="panel panel--flush timeline-main" aria-label={t.title}>
                <div className="gantt-toolbar">
                    <label className="labelled-control">
                        {t.period}
                        <span className="control-with-icon">
                            <CalendarIcon aria-hidden="true" />
                            <select className="control" value={period} onChange={(e) => setPeriod(e.target.value as GanttPeriod)}>
                                <option value="ALL">{t.periodAll}</option>
                                <option value="THIS_MONTH">{t.periodThisMonth}</option>
                                <option value="NEXT_3_MONTHS">{t.periodNext3}</option>
                                <option value="AROUND">{t.periodAround}</option>
                            </select>
                        </span>
                    </label>
                    <span className="labelled-control" id="gantt-view-label">{t.view}</span>
                    <div className="segmented" role="group" aria-labelledby="gantt-view-label">
                        {VIEW_MODES.map((m) => (
                            <button key={m} type="button" className={mode === m ? "is-active" : ""} aria-pressed={mode === m} onClick={() => changeMode(m)}>{modeLabels[m]}</button>
                        ))}
                    </div>
                    <div className="toolbar-end">
                        <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setTodaySignal((n) => n + 1)}>{t.today}</button>
                        {projectFilter && (
                            <FilterPopover
                                label={text.common.filters}
                                title={t.filtersTitle}
                                activeCount={projectFilter.options.length - projectFilter.selected.length}
                                footer={
                                    <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => projectFilter.onChange(projectFilter.options.map((p) => p.id))}>
                                        {text.common.all}
                                    </button>
                                }
                            >
                                <div className="checkbox-list" role="group" aria-label={t.filtersTitle}>
                                    {projectFilter.options.map((p) => {
                                        const checked = projectFilter.selected.includes(p.id);
                                        return (
                                            <label key={p.id} className="checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => projectFilter.onChange(checked ? projectFilter.selected.filter((id) => id !== p.id) : [...projectFilter.selected, p.id])}
                                                />
                                                <span className="dot" style={{ background: colors.get(p.id) }} aria-hidden="true" />
                                                <span>{p.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </FilterPopover>
                        )}
                    </div>
                </div>

                {projects.length === 0 ? (
                    <p className="muted gantt-empty">{t.noProjectsSelected}</p>
                ) : (
                    <GanttChart
                        projects={projects}
                        tasks={tasks}
                        milestones={milestones}
                        dependencies={dependencies}
                        grouping={grouping}
                        mode={mode}
                        range={range}
                        colors={colors}
                        selection={selection ?? (selectedProject ? { kind: "project", id: selectedProject.id } : null)}
                        onSelect={setSelection}
                        collapsed={collapsed}
                        onToggleGroup={toggleGroup}
                        scrollToTodaySignal={todaySignal}
                    />
                )}
            </section>

            {selectedTask ? (
                <TaskSchedulePanel
                    key={`${selectedTask.id}-${selectedTask.startDate}-${selectedTask.dueDate}`}
                    task={selectedTask}
                    onClose={() => setSelection({ kind: "project", id: selectedTask.projectId })}
                />
            ) : selectedProject ? (
                <ProjectOverviewPanel project={selectedProject} color={colors.get(selectedProject.id)} />
            ) : null}
        </div>
    );
}

export default ProjectTimeline;
