import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { ISODate, Milestone } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { addDays, formatDate, startOfWeek, todayISO } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import Panel from "../../components/ui/Panel";
import MiniCalendar from "../../components/ui/MiniCalendar";
import { EmptyState } from "../../components/ui/States";
import { AlertIcon, CalendarIcon, CheckIcon, FlagIcon, PlusIcon } from "../../components/icons/AppIcons";
import { canManageProject } from "../auth/permissions";
import { useActiveProjects, useProjectColors } from "../workspace/hooks";
import { useCurrentUser } from "../workspace/WorkspaceContext";
import MilestoneFormModal from "./MilestoneFormModal";
import MilestoneTable from "./MilestoneTable";
import { useMilestoneRows, type MilestoneRow } from "./useMilestoneRows";
import "./milestones.css";

const COMPLETED_PREVIEW = 5;

function MilestonesPage() {
    const text = useAppText();
    const t = text.milestones;
    const user = useCurrentUser();
    const projects = useActiveProjects();
    const colors = useProjectColors();
    const [projectId, setProjectId] = useState("");
    const [editing, setEditing] = useState<Milestone | "new" | null>(null);
    const [selectedDay, setSelectedDay] = useState<ISODate | null>(null);
    const [showAllCompleted, setShowAllCompleted] = useState(false);
    const rows = useMilestoneRows(projectId || undefined);

    const today = todayISO();
    const weekEnd = addDays(startOfWeek(today), 6);

    const groups = useMemo(() => {
        const byDue = (a: MilestoneRow, b: MilestoneRow) => a.milestone.dueDate.localeCompare(b.milestone.dueDate);
        return {
            overdue: rows.filter((r) => r.info.state === "OVERDUE").sort(byDue),
            upcoming: rows.filter((r) => r.info.state === "UPCOMING").sort(byDue),
            completed: rows.filter((r) => r.info.state === "COMPLETED").sort((a, b) => b.completedOn.localeCompare(a.completedOn)),
        };
    }, [rows]);

    const open = [...groups.overdue, ...groups.upcoming];
    const thisWeek = open.filter((r) => r.milestone.dueDate <= weekEnd);
    const sideList = selectedDay ? rows.filter((r) => r.milestone.dueDate === selectedDay) : thisWeek;
    const canCreate = projects.some((p) => canManageProject(user, p));

    return (
        <div className="page">
            <PageHeader
                title={t.title}
                lead={t.lead}
                aside={
                    <>
                        <select className="control" aria-label={text.common.project} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                            <option value="">{t.allProjects}</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {canCreate && (
                            <button type="button" className="app-btn app-btn--primary app-btn--lg" onClick={() => setEditing("new")}>
                                <PlusIcon aria-hidden="true" /> {t.create}
                            </button>
                        )}
                    </>
                }
            />

            <StatGrid label={text.dashboard.statsLabel}>
                <StatCard label={t.statWeek} value={thisWeek.length} Icon={CalendarIcon} />
                <StatCard label={t.statMonth} value={open.filter((r) => r.milestone.dueDate.slice(0, 7) === today.slice(0, 7)).length} Icon={CalendarIcon} tone="pink" />
                <StatCard label={t.statDone} value={groups.completed.length} Icon={CheckIcon} tone="success" />
                <StatCard label={t.statOverdue} value={groups.overdue.length} Icon={FlagIcon} tone={groups.overdue.length ? "danger" : "neutral"} hint={t.statOverdueHint(groups.overdue.length)} />
            </StatGrid>

            <div className="page-columns">
                <div className="stack">
                    {groups.overdue.length > 0 && (
                        <Panel title={t.overdueTitle} flush className="panel--alert">
                            <MilestoneTable rows={groups.overdue} onEdit={setEditing} />
                        </Panel>
                    )}
                    <Panel title={t.upcomingTitle} flush>
                        {groups.upcoming.length === 0
                            ? <EmptyState Icon={FlagIcon} title={t.empty} compact />
                            : <MilestoneTable rows={groups.upcoming} onEdit={setEditing} />}
                    </Panel>
                    <Panel
                        title={t.completedTitle}
                        flush
                        action={groups.completed.length > COMPLETED_PREVIEW && (
                            <button type="button" className="link-arrow" onClick={() => setShowAllCompleted((v) => !v)}>
                                {showAllCompleted ? t.showFewerCompleted : t.showAllCompleted}
                            </button>
                        )}
                    >
                        {groups.completed.length === 0
                            ? <EmptyState Icon={CheckIcon} title={t.empty} compact />
                            : <MilestoneTable rows={showAllCompleted ? groups.completed : groups.completed.slice(0, COMPLETED_PREVIEW)} variant="completed" onEdit={setEditing} />}
                    </Panel>
                </div>

                <div className="side-column">
                    <Panel>
                        <MiniCalendar
                            markers={rows.map((r) => ({ date: r.milestone.dueDate, color: r.info.state === "OVERDUE" ? "var(--tone-danger)" : r.info.state === "COMPLETED" ? "var(--tone-success)" : "var(--accent)" }))}
                            selected={selectedDay}
                            onSelect={setSelectedDay}
                            labels={{
                                previous: text.dates.previousMonth,
                                next: text.dates.nextMonth,
                                weekdays: text.dates.weekdaysShort,
                                markersOn: (date, count) => t.markersOn(formatDate(date), count),
                            }}
                        />
                    </Panel>
                    <Panel
                        title={selectedDay ? t.selectedDay(formatDate(selectedDay, false)) : t.thisWeekTitle}
                        action={selectedDay && <button type="button" className="link-arrow" onClick={() => setSelectedDay(null)}>{t.clearDay}</button>}
                    >
                        {sideList.length === 0 ? (
                            <p className="muted small">{selectedDay ? t.noneOnDay : t.noneThisWeek}</p>
                        ) : (
                            <ul className="list">
                                {sideList.map((r) => (
                                    <li key={r.milestone.id} className="list-row week-milestone">
                                        <span className="milestone-icon" style={{ "--milestone-color": colors.get(r.project.id) } as CSSProperties} aria-hidden="true"><FlagIcon /></span>
                                        <div className="cell-text">
                                            <Link to={`${APP_ROUTES.project(r.project.id)}?tab=milestones`} className="cell-title truncate">{r.milestone.title}</Link>
                                            <span className="cell-sub truncate">{r.project.name}</span>
                                        </div>
                                        <span className={`small nowrap ${r.info.state === "OVERDUE" ? "text-danger" : "text-secondary"}`}>
                                            {r.info.state === "OVERDUE" && <AlertIcon className="inline-icon" aria-hidden="true" />} {formatDate(r.milestone.dueDate, false)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </div>

            {editing && (
                <MilestoneFormModal
                    milestone={editing === "new" ? undefined : editing}
                    projectId={projectId || undefined}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

export default MilestonesPage;
