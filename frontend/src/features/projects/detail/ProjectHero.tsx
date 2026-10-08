import { formatDate } from "../../../utils/date";
import { useAppText } from "../../../i18n/app/useAppText";
import ProjectThumb from "../../../components/ui/ProjectThumb";
import ProgressBar from "../../../components/ui/ProgressBar";
import { Pill, ProjectStatePill } from "../../../components/ui/Badges";
import { ArchiveIcon, EditIcon, RefreshIcon } from "../../../components/icons/AppIcons";
import { canAdministerProject, canManageProject } from "../../auth/permissions";
import { useProjectColors } from "../../workspace/hooks";
import type { ProjectSummary } from "../../workspace/selectors";
import { useCurrentUser } from "../../workspace/WorkspaceContext";
import { useArchiveProject } from "../useArchiveProject";

function ProjectHero({ summary, onEdit }: { summary: ProjectSummary; onEdit: () => void }) {
    const text = useAppText();
    const t = text.projects;
    const user = useCurrentUser();
    const colors = useProjectColors();
    const archive = useArchiveProject();
    const { project, progress, schedule, elapsed } = summary;

    return (
        <section className="project-hero" aria-label={project.name}>
            <ProjectThumb project={project} size="xl" color={colors.get(project.id)} />
            <div className="cell-text">
                <h1 className="project-hero-title">{project.name}</h1>
                <p className="project-hero-meta">
                    <ProjectStatePill status={project.status} schedule={schedule} />
                    {project.archived && <Pill>{t.archived}</Pill>}
                    <span>{project.client}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
                </p>
            </div>
            <div className="project-hero-progress">
                <span className="small text-secondary">{t.projectCompletion}</span>
                <ProgressBar
                    value={progress.value}
                    label={t.projectCompletion}
                    size="lg"
                    marker={project.status === "ACTIVE" ? elapsed : undefined}
                    markerLabel={`${t.timeElapsed}: ${elapsed} %`}
                    tone={schedule === "DELAYED" ? "danger" : "brand"}
                />
            </div>
            {canManageProject(user, project) && (
                <div className="project-hero-actions">
                    <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={onEdit}>
                        <EditIcon aria-hidden="true" /> {text.common.edit}
                    </button>
                    {canAdministerProject(user) && (
                        <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => void archive(project)}>
                            {project.archived ? <RefreshIcon aria-hidden="true" /> : <ArchiveIcon aria-hidden="true" />}
                            {project.archived ? text.common.restore : text.common.archive}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}

export default ProjectHero;
