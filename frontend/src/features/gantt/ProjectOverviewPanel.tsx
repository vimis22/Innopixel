import { Link } from "react-router-dom";
import type { Project } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { formatDate } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import ProjectThumb from "../../components/ui/ProjectThumb";
import ProgressBar from "../../components/ui/ProgressBar";
import { DuePill, ProjectStatePill } from "../../components/ui/Badges";
import { ArrowRightIcon, CalendarIcon, CheckSquareIcon, ChevronRightIcon } from "../../components/icons/AppIcons";
import { daysUntil } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

// Summary of the project selected in the Gantt chart
function ProjectOverviewPanel({ project, color }: { project: Project; color?: string }) {
    const text = useAppText();
    const t = text.gantt;
    const { summaries } = useWorkspaceData();
    const summary = summaries.get(project.id);
    if (!summary) return null;

    const { tasks, progress, schedule, nextMilestone } = summary;
    const done = tasks.filter((task) => task.status === "DONE").length;
    const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "IN_REVIEW").length;
    const facts = [
        { label: t.startDate, value: formatDate(project.startDate), Icon: CalendarIcon },
        { label: t.endDate, value: formatDate(project.endDate), Icon: CalendarIcon },
        { label: t.totalTasks, value: tasks.length, Icon: CheckSquareIcon },
    ];
    const counts = [
        { label: t.doneTasks, value: done, color: "var(--status-done)" },
        { label: t.inProgressTasks, value: inProgress, color: "var(--status-progress)" },
        { label: t.notStartedTasks, value: tasks.length - done - inProgress, color: "var(--status-todo)" },
    ];

    return (
        <aside className="panel detail-panel" aria-labelledby={`overview-${project.id}`}>
            <h2 id={`overview-${project.id}`} className="panel-title">{t.overview}</h2>

            <div className="overview-project">
                <ProjectThumb project={project} size="lg" color={color} />
                <div className="cell-text">
                    <strong className="cell-title">{project.name}</strong>
                    <span><ProjectStatePill status={project.status} schedule={schedule} /></span>
                    <span className="cell-sub overview-desc">{project.description}</span>
                </div>
            </div>

            <div>
                <div className="overview-progress-label"><span>{text.common.progress}</span><strong>{progress.value === null ? "–" : `${progress.value}%`}</strong></div>
                <ProgressBar value={progress.value} label={text.common.progress} size="lg" showValue={false} />
            </div>

            {nextMilestone && (
                <Link to={`${APP_ROUTES.project(project.id)}?tab=milestones`} className="next-milestone">
                    <CalendarIcon aria-hidden="true" />
                    <span className="cell-text">
                        <strong className="small">{text.projects.nextMilestone}</strong>
                        <span className="small">{nextMilestone.title}</span>
                        <span className="next-milestone-date">
                            <span className="xsmall muted">{formatDate(nextMilestone.dueDate)}</span>
                            <DuePill days={daysUntil(nextMilestone.dueDate)} />
                        </span>
                    </span>
                    <ChevronRightIcon className="next-milestone-chevron" aria-hidden="true" />
                </Link>
            )}

            <dl className="overview-facts">
                {facts.map(({ label, value, Icon }) => (
                    <div key={label}><dt><Icon aria-hidden="true" />{label}</dt><dd>{value}</dd></div>
                ))}
                {counts.map(({ label, value, color: dotColor }) => (
                    <div key={label}><dt><span className="dot" style={{ background: dotColor }} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>
                ))}
            </dl>

            <Link to={APP_ROUTES.project(project.id)} className="app-btn app-btn--outline app-btn--block">
                {t.goToProject} <ArrowRightIcon aria-hidden="true" />
            </Link>
        </aside>
    );
}

export default ProjectOverviewPanel;
