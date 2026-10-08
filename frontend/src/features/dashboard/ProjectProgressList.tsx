import { Link, useNavigate } from "react-router-dom";
import type { Project } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import ProjectThumb from "../../components/ui/ProjectThumb";
import ProgressBar from "../../components/ui/ProgressBar";
import ActionMenu from "../../components/ui/ActionMenu";
import { ProjectStatePill } from "../../components/ui/Badges";
import { FolderIcon, GanttIcon } from "../../components/icons/AppIcons";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

// Compact project rows: image, name, state, short description and progress
function ProjectProgressList({ projects }: { projects: Project[] }) {
    const text = useAppText();
    const { summaries } = useWorkspaceData();
    const navigate = useNavigate();

    return (
        <ul className="list">
            {projects.map((project) => {
                const summary = summaries.get(project.id);
                if (!summary) return null;
                return (
                    <li key={project.id} className="list-row project-row">
                        <ProjectThumb project={project} size="lg" />
                        <div className="project-row-body">
                            <div className="project-row-head">
                                <Link to={APP_ROUTES.project(project.id)} className="cell-title">{project.name}</Link>
                                <ProjectStatePill status={project.status} schedule={summary.schedule} />
                            </div>
                            <p className="cell-sub truncate">{project.description}</p>
                            <ProgressBar value={summary.progress.value} label={`${text.common.progress}: ${project.name}`} />
                        </div>
                        <ActionMenu
                            label={text.common.actionsFor(project.name)}
                            actions={[
                                { label: text.common.open, Icon: FolderIcon, onSelect: () => navigate(APP_ROUTES.project(project.id)) },
                                { label: text.nav.gantt, Icon: GanttIcon, onSelect: () => navigate(`${APP_ROUTES.project(project.id)}?tab=timeline`) },
                            ]}
                        />
                    </li>
                );
            })}
        </ul>
    );
}

export default ProjectProgressList;
