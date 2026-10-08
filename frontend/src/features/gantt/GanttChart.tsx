import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { Milestone, Project, Task, TaskDependency } from "../../types/domain";
import { addDays, diffDays, formatDate, formatMonth, isWeekend, parseDate, todayISO } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import { Avatar } from "../../components/ui/Avatar";
import ProjectThumb from "../../components/ui/ProjectThumb";
import { useRunAction } from "../../components/ui/Feedback";
import { CheckCircleFilledIcon, ChevronDownIcon, ChevronRightIcon, CircleIcon } from "../../components/icons/AppIcons";
import { canManageProject } from "../auth/permissions";
import { isTaskOverdue, milestoneInfo, projectProgress, taskProgress } from "../workspace/progress";
import { userById } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import {
    buildRows, DAY_WIDTH, HEADER_HEIGHT, headerCells, LABEL_WIDTH, ROW_HEIGHT, rowOffsets,
    type GanttGrouping, type GanttGroupRow, type GanttRow, type GanttViewMode, type TimelineRange,
} from "./ganttLayout";

export type GanttSelection = { kind: "task"; id: string } | { kind: "project"; id: string } | null;

interface GanttChartProps {
    projects: Project[];
    tasks: Task[];
    milestones: Milestone[];
    dependencies: TaskDependency[];
    grouping: GanttGrouping;
    mode: GanttViewMode;
    range: TimelineRange;
    colors: Map<string, string>;
    selection: GanttSelection;
    onSelect: (selection: GanttSelection) => void;
    collapsed: Set<string>;
    onToggleGroup: (key: string) => void;
    scrollToTodaySignal: number;   // incremented by the toolbar's "I dag" button
}

interface DragState {
    taskId: string;
    mode: "move" | "start" | "end";
    originX: number;
    deltaDays: number;
    moved: boolean;
}

const weekdayShort = new Intl.DateTimeFormat("da-DK", { weekday: "short" });

// Puts "today" about a third into the visible timeline, so recent and overdue work stays in view
function todayScrollLeft(el: HTMLElement, rangeStart: string, today: string, dayWidth: number): number {
    return Math.max(0, diffDays(rangeStart, today) * dayWidth - (el.clientWidth - LABEL_WIDTH) * 0.3);
}

function TaskStatusIcon({ task }: { task: Task }) {
    if (task.status === "DONE") return <CheckCircleFilledIcon className="gantt-status gantt-status--done" aria-hidden="true" />;
    const active = task.status === "IN_PROGRESS" || task.status === "IN_REVIEW";
    return <CircleIcon className={`gantt-status ${active ? "gantt-status--active" : ""}`} aria-hidden="true" />;
}

function GanttChart({
    projects, tasks, milestones, dependencies, grouping, mode, range, colors, selection, onSelect, collapsed, onToggleGroup, scrollToTodaySignal,
}: GanttChartProps) {
    const text = useAppText();
    const t = text.gantt;
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();
    const scrollRef = useRef<HTMLDivElement>(null);
    // Set after a drag, so the click that follows doesn't count as a selection
    const justDragged = useRef(false);
    const [drag, setDrag] = useState<DragState | null>(null);
    const [saving, setSaving] = useState(false);

    const dw = DAY_WIDTH[mode];
    const today = todayISO();
    const timelineWidth = range.days * dw;
    const x = (date: string) => diffDays(range.start, date) * dw;
    const colorOf = (projectId: string) => colors.get(projectId) ?? "var(--accent)";
    const editable = (task: Task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return project ? canManageProject(user, project) : false;
    };

    // While dragging, the task is drawn with its preview dates
    const previewTasks = useMemo(() => {
        if (!drag || drag.deltaDays === 0) return tasks;
        return tasks.map((task) => {
            if (task.id !== drag.taskId) return task;
            let startDate = drag.mode === "end" ? task.startDate : addDays(task.startDate, drag.deltaDays);
            let dueDate = drag.mode === "start" ? task.dueDate : addDays(task.dueDate, drag.deltaDays);
            if (dueDate < startDate) {
                if (drag.mode === "start") startDate = dueDate;
                else dueDate = startDate;
            }
            return { ...task, startDate, dueDate };
        });
    }, [tasks, drag]);

    const rows = useMemo(
        () => buildRows(projects, previewTasks, milestones, grouping, collapsed, t.milestones),
        [projects, previewTasks, milestones, grouping, collapsed, t.milestones],
    );
    const offsets = useMemo(() => rowOffsets(rows), [rows]);
    const totalHeight = offsets[offsets.length - 1];
    const header = useMemo(
        () => headerCells(range, mode, { month: formatMonth, week: t.weekShort, weekday: (d) => weekdayShort.format(parseDate(d)).replace(".", "") }),
        [range, mode, t.weekShort],
    );

    // Start at today whenever the zoom or period changes, or the toolbar asks for it
    useEffect(() => {
        const el = scrollRef.current;
        // "instant": style.css makes every element scroll smoothly by default
        el?.scrollTo({ left: todayScrollLeft(el, range.start, today, dw), behavior: scrollToTodaySignal ? "smooth" : "instant" });
    }, [range.start, dw, today, scrollToTodaySignal]);

    /* ---------- Drag to reschedule (managers only) ---------- */

    function startDrag(event: ReactPointerEvent<HTMLElement>, task: Task, dragMode: DragState["mode"]) {
        if (!editable(task) || saving || event.button !== 0) return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrag({ taskId: task.id, mode: dragMode, originX: event.clientX, deltaDays: 0, moved: false });
    }

    function moveDrag(event: ReactPointerEvent<HTMLElement>) {
        if (!drag || saving) return;
        const dx = event.clientX - drag.originX;
        const deltaDays = Math.round(dx / dw);
        if (deltaDays !== drag.deltaDays || (!drag.moved && Math.abs(dx) > 3)) setDrag({ ...drag, deltaDays, moved: drag.moved || Math.abs(dx) > 3 });
    }

    async function endDrag(task: Task) {
        if (!drag || saving) return;
        const current = drag;
        if (current.moved && current.mode === "move") justDragged.current = true;
        const preview = previewTasks.find((p) => p.id === task.id);
        if (!current.moved || current.deltaDays === 0 || !preview) {
            setDrag(null);
            return;
        }
        // Keep the preview on screen until the repository has saved the new dates
        setSaving(true);
        await run(() => actions.updateTaskSchedule(task.id, { startDate: preview.startDate, dueDate: preview.dueDate }), t.scheduleSaved);
        setSaving(false);
        setDrag(null);
        onSelect({ kind: "task", id: task.id });
    }

    /* ---------- Dependency arrows ---------- */

    const rowIndex = new Map(rows.map((row, i) => [row.key, i]));
    const taskById = new Map(previewTasks.map((task) => [task.id, task]));
    const arrows = dependencies.flatMap((dep) => {
        const from = taskById.get(dep.predecessorId);
        const to = taskById.get(dep.successorId);
        const fromRow = rowIndex.get(dep.predecessorId);
        const toRow = rowIndex.get(dep.successorId);
        if (!from || !to || fromRow === undefined || toRow === undefined) return [];
        const x1 = x(from.dueDate) + dw;
        const y1 = offsets[fromRow] + ROW_HEIGHT.task / 2;
        const x2 = x(to.startDate);
        const y2 = offsets[toRow] + ROW_HEIGHT.task / 2;
        const midY = y2 > y1 ? offsets[toRow] : offsets[toRow] + ROW_HEIGHT.task;
        const d = x2 - 8 >= x1 + 8
            ? `M ${x1} ${y1} H ${x1 + 8} V ${y2} H ${x2 - 2}`
            : `M ${x1} ${y1} H ${x1 + 8} V ${midY} H ${x2 - 10} V ${y2} H ${x2 - 2}`;
        return [{ id: dep.id, d, conflict: to.startDate < from.dueDate }];
    });

    /* ---------- Rendering ---------- */

    function renderTaskBar(task: Task) {
        const overdue = isTaskOverdue(task, today);
        const canDrag = editable(task);
        const width = Math.max((diffDays(task.startDate, task.dueDate) + 1) * dw, 6);
        const progress = taskProgress(task);
        const assignee = userById(data, task.assigneeId);
        const selected = selection?.kind === "task" && selection.id === task.id;
        const tooltip = [
            task.title,
            `${formatDate(task.startDate)} – ${formatDate(task.dueDate)} (${text.common.days(diffDays(task.startDate, task.dueDate) + 1)})`,
            `${text.common.progress}: ${progress} %`,
            assignee ? `${text.common.assignee}: ${assignee.name}` : "",
            overdue ? text.common.overdue : "",
        ].filter(Boolean).join("\n");

        const classes = ["gantt-bar", overdue ? "gantt-bar--overdue" : "", selected ? "is-selected" : "", canDrag ? "is-draggable" : "", drag?.taskId === task.id ? "is-dragging" : ""];
        return (
            <div className={classes.join(" ")} style={{ left: x(task.startDate), width, "--bar-color": colorOf(task.projectId) } as CSSProperties} title={tooltip}>
                <button
                    type="button"
                    className="gantt-bar-body"
                    onPointerDown={(e) => startDrag(e, task, "move")}
                    onPointerMove={moveDrag}
                    onPointerUp={() => void endDrag(task)}
                    onPointerCancel={() => setDrag(null)}
                    onClick={() => {
                        if (justDragged.current) {
                            justDragged.current = false;
                            return;
                        }
                        onSelect({ kind: "task", id: task.id });
                    }}
                    aria-label={`${task.title}, ${formatDate(task.startDate)} – ${formatDate(task.dueDate)}, ${progress} %`}
                    aria-pressed={selected}
                >
                    <span className="gantt-bar-progress" style={{ width: `${progress}%` }} />
                </button>
                {canDrag && (["start", "end"] as const).map((edge) => (
                    <span
                        key={edge}
                        className={`gantt-handle gantt-handle--${edge}`}
                        onPointerDown={(e) => startDrag(e, task, edge)}
                        onPointerMove={moveDrag}
                        onPointerUp={() => void endDrag(task)}
                        aria-hidden="true"
                    />
                ))}
            </div>
        );
    }

    function renderDiamond(milestone: Milestone, small = false) {
        const info = milestoneInfo(milestone, data.tasks.filter((task) => task.projectId === milestone.projectId), today);
        return (
            <span
                key={milestone.id}
                className={`gantt-milestone gantt-milestone--${info.state.toLowerCase()} ${small ? "gantt-milestone--small" : ""}`}
                style={{ left: x(milestone.dueDate) + dw / 2, "--bar-color": colorOf(milestone.projectId) } as CSSProperties}
                title={`${milestone.title}\n${formatDate(milestone.dueDate)} · ${text.milestoneState[info.state]}`}
                role="img"
                aria-label={`${t.legendMilestone}: ${milestone.title}, ${formatDate(milestone.dueDate)}, ${text.milestoneState[info.state]}`}
            />
        );
    }

    function renderGroup(group: GanttGroupRow) {
        const progress = projectProgress(group.tasks).value ?? 0;
        const color = group.project ? colorOf(group.project.id) : group.tasks[0] ? colorOf(group.tasks[0].projectId) : "var(--accent)";
        const starts = group.tasks.map((task) => task.startDate).sort();
        const ends = group.tasks.map((task) => task.dueDate).sort();
        const selected = selection?.kind === "project" && group.project?.id === selection.id;

        return (
            <div className={`gantt-row gantt-row--group ${selected ? "is-selected" : ""}`} key={group.key} style={{ height: ROW_HEIGHT.group }}>
                <div className="gantt-label gantt-label--group">
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => onToggleGroup(group.key)} aria-expanded={!group.collapsed} aria-label={t.toggleGroup(group.label)}>
                        {group.collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                    </button>
                    {group.project && <ProjectThumb project={group.project} size="sm" color={color} />}
                    <button
                        type="button"
                        className="gantt-group-info"
                        onClick={() => group.project && onSelect({ kind: "project", id: group.project.id })}
                        disabled={!group.project}
                        aria-pressed={group.project ? selected : undefined}
                    >
                        <span className="gantt-group-name truncate">{group.label}</span>
                        {group.tasks.length > 0 && (
                            <span className="gantt-group-progress">
                                <span>{t.percentDone(progress)}</span>
                                <span className="gantt-mini-bar" aria-hidden="true"><span style={{ width: `${progress}%`, background: color }} /></span>
                            </span>
                        )}
                    </button>
                </div>
                <div className="gantt-track">
                    {starts.length > 0 && (
                        <div
                            className="gantt-summary"
                            style={{ left: x(starts[0]), width: (diffDays(starts[0], ends[ends.length - 1]) + 1) * dw, "--bar-color": color } as CSSProperties}
                            title={`${group.label}: ${formatDate(starts[0])} – ${formatDate(ends[ends.length - 1])} · ${progress} %`}
                        >
                            <span className="gantt-summary-progress" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                    {group.milestones.map((m) => renderDiamond(m, true))}
                </div>
            </div>
        );
    }

    function renderRow(row: GanttRow) {
        if (row.kind === "group") return renderGroup(row);

        if (row.kind === "milestone") {
            return (
                <div className="gantt-row" key={row.key} style={{ height: ROW_HEIGHT.milestone }}>
                    <div className="gantt-label gantt-label--item">
                        <span className="gantt-diamond-icon" style={{ "--bar-color": colorOf(row.milestone.projectId) } as CSSProperties} aria-hidden="true" />
                        <span className="truncate">{row.milestone.title}</span>
                    </div>
                    <div className="gantt-track">{renderDiamond(row.milestone)}</div>
                </div>
            );
        }

        const task = row.task;
        const selected = selection?.kind === "task" && selection.id === task.id;
        return (
            <div className={`gantt-row ${selected ? "is-selected" : ""}`} key={row.key} style={{ height: ROW_HEIGHT.task }}>
                <div className="gantt-label gantt-label--item">
                    <TaskStatusIcon task={task} />
                    <button type="button" className="gantt-task-name truncate" onClick={() => onSelect({ kind: "task", id: task.id })} title={task.title}>
                        {task.title}
                    </button>
                    {isTaskOverdue(task, today) && <span className="gantt-overdue-dot" title={text.common.overdue} />}
                    <Avatar user={userById(data, task.assigneeId)} size="xs" />
                </div>
                <div className="gantt-track">{renderTaskBar(task)}</div>
            </div>
        );
    }

    if (rows.length === 0) return <p className="muted gantt-empty">{t.empty}</p>;

    const todayX = x(today) + dw / 2;
    const showToday = today >= range.start && today <= range.end;

    return (
        <div className="gantt-scroll" ref={scrollRef} style={{ "--label-width": `${LABEL_WIDTH}px` } as CSSProperties}>
            <div className="gantt-canvas" style={{ width: LABEL_WIDTH + timelineWidth }}>
                <div className="gantt-header" style={{ height: HEADER_HEIGHT }}>
                    <div className="gantt-label gantt-label--header">{grouping === "project" ? t.projectColumn : t.taskColumn}</div>
                    <div className="gantt-header-timeline" style={{ width: timelineWidth }}>
                        <div className="gantt-header-row">
                            {header.top.map((c) => (
                                <div key={c.key} className="gantt-header-cell gantt-header-cell--top" style={{ left: c.left, width: c.width }}>
                                    {/* Sticky, so the label stays readable while scrolling through a long month */}
                                    <span className="gantt-header-sticky">{c.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="gantt-header-row">
                            {header.bottom.map((c) => (
                                <div key={c.key} className={`gantt-header-cell ${mode !== "month" && isWeekend(c.date) ? "is-weekend" : ""}`} style={{ left: c.left, width: c.width }}>
                                    {c.label}
                                </div>
                            ))}
                        </div>
                        {showToday && <span className="gantt-today-pill" style={{ left: todayX }}>{t.today}</span>}
                    </div>
                </div>

                <div className="gantt-body" style={{ height: totalHeight }}>
                    <div className="gantt-grid" style={{ left: LABEL_WIDTH, width: timelineWidth }} aria-hidden="true">
                        {mode !== "month" && header.bottom.filter((c) => isWeekend(c.date)).map((c) => <div key={c.key} className="gantt-weekend" style={{ left: c.left, width: c.width }} />)}
                        {header.bottom.map((c) => <div key={c.key} className="gantt-gridline" style={{ left: c.left }} />)}
                        {showToday && <div className="gantt-today" style={{ left: todayX }} />}
                    </div>

                    {rows.map(renderRow)}

                    <svg className="gantt-arrows" style={{ left: LABEL_WIDTH }} width={timelineWidth} height={totalHeight} aria-hidden="true">
                        <defs>
                            <marker id="gantt-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                                <path d="M0,0 L8,4 L0,8 z" className="gantt-arrow-head" />
                            </marker>
                            <marker id="gantt-arrow-conflict" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                                <path d="M0,0 L8,4 L0,8 z" className="gantt-arrow-head gantt-arrow-head--conflict" />
                            </marker>
                        </defs>
                        {arrows.map((a) => (
                            <path key={a.id} d={a.d} className={`gantt-arrow ${a.conflict ? "gantt-arrow--conflict" : ""}`} markerEnd={`url(#${a.conflict ? "gantt-arrow-conflict" : "gantt-arrow"})`} />
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
}

export default GanttChart;
