import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { APP_ROUTES } from "../../../config/routes";
import { useAppText } from "../../../i18n/app/useAppText";
import { EmptyState } from "../../../components/ui/States";
import Tabs, { TabPanel } from "../../../components/ui/Tabs";
import { ArrowLeftIcon, FolderIcon } from "../../../components/icons/AppIcons";
import { useTaskDialog } from "../../tasks/TaskDialog";
import { useWorkspaceData } from "../../workspace/WorkspaceContext";
import ActivityFeed from "../../activity/ActivityFeed";
import ProjectTimeline from "../../gantt/ProjectTimeline";
import Panel from "../../../components/ui/Panel";
import ProjectFormModal from "../ProjectFormModal";
import ProjectHero from "./ProjectHero";
import OverviewTab from "./OverviewTab";
import ProjectTasksTab from "./ProjectTasksTab";
import ProjectMilestonesTab from "./ProjectMilestonesTab";
import ProjectTeamTab from "./ProjectTeamTab";
import "../projects.css";
import "../../tasks/tasks.css";
import "../../milestones/milestones.css";

const TABS = ["overview", "tasks", "timeline", "milestones", "team", "activity"] as const;
type Tab = (typeof TABS)[number];

function ProjectDetailPage() {
    const text = useAppText();
    const t = text.projects;
    const { projectId = "" } = useParams();
    const [params, setParams] = useSearchParams();
    const { data, summaries } = useWorkspaceData();
    const { showTask } = useTaskDialog();
    const [editing, setEditing] = useState(false);

    const summary = summaries.get(projectId);
    const requestedTab = params.get("tab") as Tab | null;
    const tab: Tab = requestedTab && TABS.includes(requestedTab) ? requestedTab : "overview";

    // Deep link from search and dashboard: ?task=<id> opens that task in the drawer
    const linkedTask = params.get("task");
    useEffect(() => {
        if (!linkedTask || !data.tasks.some((x) => x.id === linkedTask)) return;
        showTask(linkedTask);
        setParams((p) => {
            p.delete("task");
            return p;
        }, { replace: true });
    }, [linkedTask, data.tasks, showTask, setParams]);

    if (!summary) {
        return (
            <div className="page">
                <EmptyState Icon={FolderIcon} title={t.notFound} action={<Link to={APP_ROUTES.projects} className="app-btn app-btn--primary">{t.back}</Link>} />
            </div>
        );
    }

    const { project } = summary;

    function selectTab(next: Tab) {
        setParams(next === "overview" ? {} : { tab: next }, { replace: true });
    }

    const counts: Partial<Record<Tab, number>> = {
        tasks: summary.tasks.length,
        milestones: summary.milestones.length,
        team: summary.memberIds.length,
    };

    return (
        <div className="page">
            <Link to={APP_ROUTES.projects} className="back-link"><ArrowLeftIcon aria-hidden="true" /> {t.back}</Link>

            <ProjectHero summary={summary} onEdit={() => setEditing(true)} />

            <Tabs
                id="project"
                label={project.name}
                value={tab}
                onChange={selectTab}
                options={TABS.map((key) => ({ value: key, label: t.tabs[key], count: counts[key] }))}
            />

            <TabPanel id="project" value={tab}>
                {tab === "overview" && <OverviewTab summary={summary} />}
                {tab === "tasks" && <ProjectTasksTab summary={summary} />}
                {tab === "timeline" && <ProjectTimeline projectIds={[project.id]} grouping="phase" />}
                {tab === "milestones" && <ProjectMilestonesTab summary={summary} />}
                {tab === "team" && <ProjectTeamTab summary={summary} />}
                {tab === "activity" && (
                    <Panel>
                        <ActivityFeed entries={data.activity.filter((a) => a.projectId === project.id)} showProject={false} emptyText={t.noActivity} />
                    </Panel>
                )}
            </TabPanel>

            {editing && <ProjectFormModal project={project} onClose={() => setEditing(false)} />}
        </div>
    );
}

export default ProjectDetailPage;
