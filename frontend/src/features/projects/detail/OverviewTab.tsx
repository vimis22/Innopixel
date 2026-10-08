import type { ReactNode } from "react";
import { formatDate, formatDateTime } from "../../../utils/date";
import { useAppText } from "../../../i18n/app/useAppText";
import Panel from "../../../components/ui/Panel";
import ProgressBar from "../../../components/ui/ProgressBar";
import { UserChip } from "../../../components/ui/Avatar";
import { ProjectStatusBadge } from "../../../components/ui/Badges";
import { AT_RISK_THRESHOLD } from "../../workspace/progress";
import { userById, type ProjectSummary } from "../../workspace/selectors";
import { useWorkspaceData } from "../../workspace/WorkspaceContext";

function Metric({ title, value, children }: { title: string; value: string; children?: ReactNode }) {
    return (
        <div className="panel metric-card">
            <span className="metric-title">{title}</span>
            <span className="metric-value">{value}</span>
            {children}
        </div>
    );
}

const percentOf = (done: number, total: number) => (total ? Math.round((done / total) * 100) : null);

// Four separate measures, so task completion, project progress, schedule and milestones are never confused
function OverviewTab({ summary }: { summary: ProjectSummary }) {
    const text = useAppText();
    const t = text.projects;
    const { data } = useWorkspaceData();
    const { project, progress, completion, milestoneCompletion, schedule, elapsed, overdueTasks, nextMilestone } = summary;
    const history = data.statusHistory.filter((h) => h.projectId === project.id).sort((a, b) => b.changedAt.localeCompare(a.changedAt));

    return (
        <div className="stack">
            <div className="metric-grid">
                <Metric title={t.projectCompletion} value={progress.value === null ? "–" : `${progress.value} %`}>
                    <ProgressBar value={progress.value} label={t.projectCompletion} size="sm" showValue={false} />
                    <p className="metric-hint">{t.progressExplain[progress.method]}</p>
                </Metric>
                <Metric title={t.taskCompletion} value={`${completion.done}/${completion.total}`}>
                    <ProgressBar value={percentOf(completion.done, completion.total)} label={t.taskCompletion} size="sm" showValue={false} tone="success" />
                    {overdueTasks > 0 && <p className="metric-hint text-danger">{text.dashboard.overdueCount(overdueTasks)}</p>}
                </Metric>
                <Metric title={t.scheduleStatus} value={text.schedule[schedule]}>
                    <p className="metric-hint">
                        {t.timeElapsed}: {elapsed} %{project.status === "ACTIVE" && ` · ${t.atRiskRule(AT_RISK_THRESHOLD)}`}
                    </p>
                </Metric>
                <Metric title={t.milestoneCompletion} value={`${milestoneCompletion.done}/${milestoneCompletion.total}`}>
                    <ProgressBar value={percentOf(milestoneCompletion.done, milestoneCompletion.total)} label={t.milestoneCompletion} size="sm" showValue={false} tone="success" />
                </Metric>
            </div>

            <div className="page-columns page-columns--even">
                <Panel title={text.common.description}>
                    <p className="prose">{project.description || text.common.noDescription}</p>
                    <dl className="detail-list">
                        <div><dt>{t.client}</dt><dd>{project.client}</dd></div>
                        <div><dt>{t.manager}</dt><dd><UserChip user={userById(data, project.managerId)} fallback={text.common.unassigned} /></dd></div>
                        <div><dt>{text.common.start}</dt><dd>{formatDate(project.startDate)}</dd></div>
                        <div><dt>{text.common.end}</dt><dd>{formatDate(project.endDate)}</dd></div>
                        <div><dt>{t.nextMilestone}</dt><dd>{nextMilestone ? `${nextMilestone.title} · ${formatDate(nextMilestone.dueDate)}` : t.noMilestone}</dd></div>
                    </dl>
                </Panel>
                <Panel title={t.statusHistory}>
                    {history.length === 0 ? (
                        <p className="muted small">{t.noHistory}</p>
                    ) : (
                        <ol className="history-list">
                            {history.map((h) => (
                                <li key={h.id}>
                                    <ProjectStatusBadge status={h.to} />
                                    <span>{h.from ? `${text.projectStatus[h.from]} → ${text.projectStatus[h.to]}` : text.projectStatus[h.to]} · {userById(data, h.changedBy)?.name ?? "?"}</span>
                                    <time className="muted" dateTime={h.changedAt}>{formatDateTime(h.changedAt)}</time>
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>
            </div>
        </div>
    );
}

export default OverviewTab;
