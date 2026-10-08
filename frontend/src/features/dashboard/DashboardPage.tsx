import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import DateGreeting from "../../components/ui/DateGreeting";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import Panel from "../../components/ui/Panel";
import { EmptyState } from "../../components/ui/States";
import { AlertIcon, ArrowRightIcon, CalendarIcon, CheckSquareIcon, FlagIcon, FolderIcon } from "../../components/icons/AppIcons";
import ActivityFeed from "../activity/ActivityFeed";
import { useCurrentUser } from "../workspace/WorkspaceContext";
import ProjectProgressList from "./ProjectProgressList";
import TaskQuickList from "./TaskQuickList";
import DeadlineList from "./DeadlineList";
import TaskStatusDonut from "./TaskStatusDonut";
import { useDashboardData } from "./useDashboardData";
import "./dashboard.css";

function SeeAll({ to, label }: { to: string; label: string }) {
    return <Link to={to} className="link-arrow">{label}<ArrowRightIcon aria-hidden="true" /></Link>;
}

function DashboardPage() {
    const text = useAppText();
    const t = text.dashboard;
    const user = useCurrentUser();
    const { admin, stats, projects, tasks, deadlines, ringTasks, activity } = useDashboardData();

    return (
        <div className="page">
            <PageHeader
                title={t.welcomePrefix}
                highlight={user.name.split(" ")[0]}
                lead={admin ? t.adminLeadShort : t.lead}
                aside={<DateGreeting greeting={text.common.greeting} />}
            />

            <StatGrid label={t.statsLabel}>
                <StatCard label={t.activeProjectsTitle} value={stats.activeProjects} Icon={FolderIcon} hint={admin ? t.allProjectsHint : undefined} to={APP_ROUTES.projects} />
                {admin ? (
                    <StatCard label={text.projects.statDelayed} value={stats.delayedProjects} Icon={AlertIcon} tone={stats.delayedProjects ? "danger" : "neutral"} hint={t.delayedHint(stats.delayedProjects)} to={APP_ROUTES.projects} />
                ) : (
                    <StatCard label={t.myOpenTasks} value={stats.openTasks} Icon={CheckSquareIcon} tone="danger" hint={t.openTasksHint(stats.overdueTasks)} to={APP_ROUTES.tasks} />
                )}
                <StatCard label={t.deadlinesNext14} value={stats.upcomingDeadlines} Icon={CalendarIcon} hint={t.next14Days} />
                <StatCard label={t.milestonesThisWeek} value={stats.milestonesThisWeek} Icon={FlagIcon} tone="pink" hint={t.thisWeek} to={APP_ROUTES.milestones} />
            </StatGrid>

            <div className="page-columns page-columns--even">
                <Panel title={admin ? t.activeProjectsTitle : t.myProjects} action={<SeeAll to={APP_ROUTES.projects} label={t.seeAllProjects} />}>
                    {projects.length === 0 ? <EmptyState Icon={FolderIcon} title={t.noProjects} compact /> : <ProjectProgressList projects={projects} />}
                </Panel>
                <Panel title={t.myOpenTasks} action={<SeeAll to={APP_ROUTES.tasks} label={t.seeAllTasks} />}>
                    {tasks.length === 0 ? <EmptyState Icon={CheckSquareIcon} title={t.noOpenTasks} compact /> : <TaskQuickList tasks={tasks} />}
                </Panel>
            </div>

            <div className="page-columns page-columns--even">
                <Panel title={t.upcomingDeadlines} action={<SeeAll to={APP_ROUTES.milestones} label={t.seeAllDeadlines} />}>
                    {deadlines.length === 0 ? <EmptyState Icon={CalendarIcon} title={t.noDeadlines} compact /> : <DeadlineList items={deadlines} />}
                </Panel>
                <Panel title={admin ? t.orgProgress : t.personalProgress}>
                    {ringTasks.length === 0 ? <EmptyState Icon={CheckSquareIcon} title={text.tasks.emptyNone} compact /> : <TaskStatusDonut tasks={ringTasks} />}
                </Panel>
            </div>

            {admin && (
                <Panel title={t.recentActivity}>
                    <ActivityFeed entries={activity} />
                </Panel>
            )}
        </div>
    );
}

export default DashboardPage;
