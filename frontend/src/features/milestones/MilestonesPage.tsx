import { useMemo, useState, type CSSProperties } from "react";
import type { ISODate } from "../../types/domain";
import type { MilestoneState } from "../workspace/progress";
import { addDays, formatDate, startOfWeek, todayISO } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import MiniCalendar from "../../components/ui/MiniCalendar";
import { EmptyState } from "../../components/ui/States";
import { AlertIcon, FlagIcon, FolderIcon, PlusIcon } from "../../components/icons/AppIcons";
import { canManageProject } from "../auth/permissions";
import { useActiveProjects, useProjectColors } from "../workspace/hooks";
import { useCurrentUser } from "../workspace/WorkspaceContext";
import MilestoneDrawer from "./MilestoneDrawer";
import MilestoneFormModal from "./MilestoneFormModal";
import MilestoneTable from "./MilestoneTable";
import { useMilestoneActions } from "./useMilestoneActions";
import { useMilestoneRows, type MilestoneRow } from "./useMilestoneRows";
import "./milestones.css";

type StateFilter = MilestoneState | "ALL";

// What needs attention first: overdue, then upcoming by date, then the most recently completed
const ORDER: Record<MilestoneState, number> = { OVERDUE: 0, UPCOMING: 1, COMPLETED: 2 };
function compareRows(a: MilestoneRow, b: MilestoneRow): number {
    return ORDER[a.info.state] - ORDER[b.info.state]
        || (a.info.state === "COMPLETED"
            ? b.completedOn.localeCompare(a.completedOn)
            : a.milestone.dueDate.localeCompare(b.milestone.dueDate));
}

function MilestonesPage() {
    const text = useAppText();
    const t = text.milestones;
    const user = useCurrentUser();
    const projects = useActiveProjects();
    const colors = useProjectColors();
    const [projectId, setProjectId] = useState("");
    const [state, setState] = useState<StateFilter>("ALL");
    const [editing, setEditing] = useState<MilestoneRow | "new" | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<ISODate | null>(null);
    const rows = useMilestoneRows(projectId || undefined);
    const actionsFor = useMilestoneActions(setEditing);

    const today = todayISO();
    const weekEnd = addDays(startOfWeek(today), 6);
    const sorted = useMemo(() => [...rows].sort(compareRows), [rows]);
    const shown = sorted.filter((r) => (state === "ALL" || r.info.state === state) && (!selectedDay || r.milestone.dueDate === selectedDay));
    const count = (s: MilestoneState) => rows.filter((r) => r.info.state === s).length;
    const thisWeek = sorted.filter((r) => r.info.state !== "COMPLETED" && r.milestone.dueDate <= weekEnd);
    // The drawer follows the data, so it closes by itself when the milestone is deleted
    const opened = rows.find((r) => r.milestone.id === openId);
    const canCreate = projects.some((p) => canManageProject(user, p));

    const tabs = [
        { value: "ALL" as StateFilter, label: text.common.all, count: rows.length },
        { value: "UPCOMING" as StateFilter, label: t.tabUpcoming, count: count("UPCOMING") },
        { value: "COMPLETED" as StateFilter, label: t.tabCompleted, count: count("COMPLETED") },
        { value: "OVERDUE" as StateFilter, label: t.tabOverdue, count: count("OVERDUE") },
    ];

    return (
        <div className="page">
            <PageHeader
                title={t.title}
                lead={t.lead}
                aside={canCreate && (
                    <button type="button" className="app-btn app-btn--primary" onClick={() => setEditing("new")}>
                        <PlusIcon aria-hidden="true" /> {t.create}
                    </button>
                )}
            />

            <div className="page-columns">
                <div className="stack">
                    <div className="toolbar">
                        <span className="control-with-icon">
                            <FolderIcon aria-hidden="true" />
                            <select className="control" aria-label={text.common.project} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                                <option value="">{t.allProjects}</option>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </span>
                        <PillTabs label={text.common.status} options={tabs} value={state} onChange={setState} />
                    </div>

                    {selectedDay && (
                        <p className="filter-note">
                            {t.selectedDay(formatDate(selectedDay))}
                            <button type="button" className="link-arrow" onClick={() => setSelectedDay(null)}>{t.clearDay}</button>
                        </p>
                    )}

                    <Panel flush>
                        {shown.length === 0 ? (
                            <EmptyState Icon={FlagIcon} title={t.empty} compact />
                        ) : (
                            <>
                                <MilestoneTable rows={shown} onOpen={(row) => setOpenId(row.milestone.id)} onEdit={setEditing} />
                                <p className="table-footer">{text.common.showing(shown.length, rows.length, t.noun)}</p>
                            </>
                        )}
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
                                markersOn: (date, n) => t.markersOn(formatDate(date), n),
                            }}
                        />
                    </Panel>
                    <Panel title={t.thisWeekTitle}>
                        {thisWeek.length === 0 ? (
                            <p className="muted small">{t.noneThisWeek}</p>
                        ) : (
                            <ul className="list">
                                {thisWeek.map((r) => (
                                    <li key={r.milestone.id} className="list-row week-milestone">
                                        <span className="milestone-icon" style={{ "--milestone-color": colors.get(r.project.id) } as CSSProperties} aria-hidden="true"><FlagIcon /></span>
                                        <div className="cell-text">
                                            <button type="button" className="cell-title truncate milestone-title" onClick={() => setOpenId(r.milestone.id)}>{r.milestone.title}</button>
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

            {opened && <MilestoneDrawer row={opened} actions={actionsFor(opened)} onClose={() => setOpenId(null)} />}
            {editing && (
                <MilestoneFormModal
                    milestone={editing === "new" ? undefined : editing.milestone}
                    projectId={projectId || undefined}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

export default MilestonesPage;
