import { Link, useNavigate } from "react-router-dom";
import type { Project } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import ProjectThumb from "../../components/ui/ProjectThumb";
import ProgressBar from "../../components/ui/ProgressBar";
import ActionMenu, { type MenuAction } from "../../components/ui/ActionMenu";
import { AvatarStack } from "../../components/ui/Avatar";
import { Pill, ProjectStatePill } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { SortHeader, type SortState } from "../../components/ui/Table";
import { ArchiveIcon, CalendarIcon, EditIcon, FolderIcon, RefreshIcon } from "../../components/icons/AppIcons";
import { canAdministerProject, canManageProject } from "../auth/permissions";
import type { ProjectSummary } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import type { ProjectSortKey } from "./projectFilters";

interface ProjectsTableProps {
    rows: ProjectSummary[];
    sort: SortState<ProjectSortKey>;
    onSort: (sort: SortState<ProjectSortKey>) => void;
    onEdit: (project: Project) => void;
    onArchive: (project: Project) => void;
}

function ProjectsTable({ rows, sort, onSort, onEdit, onArchive }: ProjectsTableProps) {
    const text = useAppText();
    const t = text.projects;
    const user = useCurrentUser();
    const { data } = useWorkspaceData();
    const navigate = useNavigate();

    function actionsFor(project: Project): MenuAction[] {
        const actions: MenuAction[] = [{ label: text.common.open, Icon: FolderIcon, onSelect: () => navigate(APP_ROUTES.project(project.id)) }];
        if (canManageProject(user, project)) actions.push({ label: text.common.edit, Icon: EditIcon, onSelect: () => onEdit(project) });
        if (canAdministerProject(user)) {
            actions.push(project.archived
                ? { label: text.common.restore, Icon: RefreshIcon, onSelect: () => onArchive(project) }
                : { label: text.common.archive, Icon: ArchiveIcon, onSelect: () => onArchive(project), danger: true });
        }
        return actions;
    }

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <SortHeader sortKey="name" sort={sort} onSort={onSort}>{t.colProject}</SortHeader>
                        <SortHeader sortKey="status" sort={sort} onSort={onSort}>{text.common.status}</SortHeader>
                        <SortHeader sortKey="progress" sort={sort} onSort={onSort} className="col-progress">{t.colProgress}</SortHeader>
                        <SortHeader sortKey="deadline" sort={sort} onSort={onSort}>{t.colDeadline}</SortHeader>
                        <SortHeader sortKey="team" sort={sort} onSort={onSort}>{t.colTeam}</SortHeader>
                        <th scope="col" className="col-actions"><span className="sr-only">{text.common.details}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ project, progress, schedule, memberIds }) => (
                        // The name is the keyboard-accessible link; the rest of the row is a mouse shortcut
                        <tr key={project.id} className={`is-clickable ${project.archived ? "is-muted" : ""}`} onClick={() => navigate(APP_ROUTES.project(project.id))}>
                            <td>
                                <div className="cell-main">
                                    <ProjectThumb project={project} />
                                    <div className="cell-text">
                                        <Link to={APP_ROUTES.project(project.id)} className="cell-title" onClick={(e) => e.stopPropagation()}>
                                            {project.name}
                                        </Link>
                                        <span className="cell-sub truncate project-desc">{project.description || project.client}</span>
                                    </div>
                                </div>
                            </td>
                            <td>{project.archived ? <Pill>{t.archived}</Pill> : <ProjectStatePill status={project.status} schedule={schedule} />}</td>
                            <td className="col-progress">
                                <ProgressBar
                                    value={progress.value}
                                    label={`${t.colProgress}: ${project.name}`}
                                    tone={schedule === "DELAYED" ? "danger" : "brand"}
                                />
                            </td>
                            <td>
                                <span className="cell-date">
                                    <CalendarIcon aria-hidden="true" />
                                    <DueLabel date={project.endDate} done={project.status === "COMPLETED" || project.status === "CANCELLED"} withRelative />
                                </span>
                            </td>
                            <td><AvatarStack users={data.users.filter((u) => memberIds.includes(u.id))} max={3} /></td>
                            <td className="col-actions">
                                <ActionMenu label={text.common.actionsFor(project.name)} actions={actionsFor(project)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProjectsTable;
