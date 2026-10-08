import { useMemo, useState } from "react";
import { useAppText } from "../../i18n/app/useAppText";
import { todayISO } from "../../utils/date";
import PageHeader from "../../components/ui/PageHeader";
import DateGreeting from "../../components/ui/DateGreeting";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/States";
import { CheckSquareIcon, FlagIcon, FolderIcon, GanttIcon, TrendIcon } from "../../components/icons/AppIcons";
import { useActiveProjects } from "../workspace/hooks";
import { getMilestoneInfo } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import ProjectTimeline from "./ProjectTimeline";

// Completed and cancelled projects are hidden by default to keep the chart readable
const shownByDefault = (status: string) => status !== "COMPLETED" && status !== "CANCELLED";

function GanttPage() {
    const text = useAppText();
    const t = text.gantt;
    const { data, summaries } = useWorkspaceData();
    const projects = useActiveProjects();
    const [selectedIds, setSelectedIds] = useState<string[]>(() => projects.filter((p) => shownByDefault(p.status)).map((p) => p.id));

    const stats = useMemo(() => {
        const today = todayISO();
        const selected = new Set(selectedIds);
        const active = projects.filter((p) => selected.has(p.id) && p.status === "ACTIVE");
        const measurable = active.map((p) => summaries.get(p.id)?.progress.value).filter((v): v is number => v !== null && v !== undefined);
        return {
            active: active.length,
            progress: measurable.length ? Math.round(measurable.reduce((a, b) => a + b, 0) / measurable.length) : null,
            milestones: data.milestones.filter((m) => selected.has(m.projectId) && m.dueDate >= today && m.dueDate.slice(0, 7) === today.slice(0, 7) && getMilestoneInfo(data, m).state !== "COMPLETED").length,
            inProgress: data.tasks.filter((task) => selected.has(task.projectId) && task.status === "IN_PROGRESS").length,
        };
    }, [projects, selectedIds, summaries, data]);

    return (
        <div className="page">
            <PageHeader title={t.title} lead={t.lead} aside={<DateGreeting greeting={text.common.greeting} />} />

            <StatGrid label={text.dashboard.statsLabel}>
                <StatCard label={t.statActive} value={stats.active} Icon={FolderIcon} />
                <StatCard label={t.statProgress} value={stats.progress === null ? "–" : `${stats.progress} %`} Icon={TrendIcon} tone="success" hint={t.statProgressHint} />
                <StatCard label={t.statMilestones} value={stats.milestones} Icon={FlagIcon} tone="danger" hint={t.statMilestonesHint} />
                <StatCard label={t.statInProgress} value={stats.inProgress} Icon={CheckSquareIcon} tone="pink" />
            </StatGrid>

            {projects.length === 0 ? (
                <EmptyState Icon={GanttIcon} title={text.projects.emptyEmployee} />
            ) : (
                <ProjectTimeline
                    projectIds={selectedIds}
                    grouping="project"
                    projectFilter={{ options: projects, selected: selectedIds, onChange: setSelectedIds }}
                />
            )}
        </div>
    );
}

export default GanttPage;
