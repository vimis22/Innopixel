import { useEffect, useMemo, useState } from "react";
import type { User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import ProjectThumb from "../../components/ui/ProjectThumb";
import { Pill } from "../../components/ui/Badges";
import { useRunAction } from "../../components/ui/Feedback";
import { EmptyState } from "../../components/ui/States";
import { FolderIcon } from "../../components/icons/AppIcons";
import { activeProjects } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

interface EmployeeProjectsTabProps {
    user: User;
    editable: boolean;           // administrators
    onDirtyChange: (dirty: boolean) => void;
}

/*
 * "Projekter": which projects the employee works on, their role there and their open tasks.
 * The project manager role comes from the project itself and can't be removed here.
 */
function EmployeeProjectsTab({ user, editable, onDirtyChange }: EmployeeProjectsTabProps) {
    const text = useAppText();
    const t = text.team;
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();
    const projects = useMemo(() => activeProjects(data), [data]);
    const isMember = (projectId: string) => data.members.some((m) => m.projectId === projectId && m.userId === user.id);
    const initial = projects.filter((p) => isMember(p.id)).map((p) => p.id);
    const [selected, setSelected] = useState<string[]>(initial);
    const [saving, setSaving] = useState(false);

    const dirty = selected.length !== initial.length || selected.some((id) => !initial.includes(id));
    useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

    const shown = editable ? projects : projects.filter((p) => p.managerId === user.id || isMember(p.id));

    async function save() {
        setSaving(true);
        // Memberships of archived projects are not shown here, so keep them unchanged
        const archived = data.projects.filter((p) => p.archived && isMember(p.id)).map((p) => p.id);
        await run(() => actions.setUserProjects(user.id, [...selected, ...archived]), t.assignmentsSaved);
        setSaving(false);
    }

    if (shown.length === 0) return <EmptyState Icon={FolderIcon} title={editable ? t.noActiveProjects : t.noAssignments} compact />;

    return (
        <div className="stack">
            {editable && <p className="small text-secondary">{t.projectsLead}</p>}
            <ul className="list">
                {shown.map((project) => {
                    const manager = project.managerId === user.id;
                    const checked = manager || selected.includes(project.id);
                    const openTasks = data.tasks.filter((x) => x.projectId === project.id && x.assigneeId === user.id && x.status !== "DONE").length;
                    return (
                        <li key={project.id} className="list-row employee-project">
                            {editable && (
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={checked}
                                    disabled={manager || saving}
                                    aria-label={`${t.assignTo} ${project.name}`}
                                    onChange={() => setSelected((s) => (s.includes(project.id) ? s.filter((id) => id !== project.id) : [...s, project.id]))}
                                />
                            )}
                            <ProjectThumb project={project} size="sm" />
                            <div className="cell-text">
                                <span className="cell-title truncate">{project.name}</span>
                                <span className="cell-sub">
                                    {checked ? (manager ? t.accessFull : t.accessMember) : text.projectStatus[project.status]}
                                    {checked && ` · ${t.activeTasks(openTasks)}`}
                                </span>
                                {!checked && openTasks > 0 && <span className="xsmall text-danger">{t.unassignWarning(openTasks)}</span>}
                            </div>
                            {checked && <Pill tone={manager ? "accent" : "neutral"}>{manager ? t.projectRoleManager : t.projectRoleMember}</Pill>}
                        </li>
                    );
                })}
            </ul>
            {editable && (
                <div className="form-actions">
                    <button type="button" className="app-btn app-btn--ghost" disabled={!dirty || saving} onClick={() => setSelected(initial)}>{text.common.cancel}</button>
                    <button type="button" className="app-btn app-btn--primary" disabled={!dirty || saving} onClick={() => void save()}>
                        {saving ? text.common.saving : t.saveProjects}
                    </button>
                </div>
            )}
        </div>
    );
}

export default EmployeeProjectsTab;
