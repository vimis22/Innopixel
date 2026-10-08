import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import Panel from "../../components/ui/Panel";
import { AvatarStack } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/States";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import type { MenuAction } from "../../components/ui/ActionMenu";
import { BriefcaseIcon, CheckSquareIcon, EditIcon, FolderIcon, LockIcon, PlusIcon, RefreshIcon, SearchIcon, UsersIcon } from "../../components/icons/AppIcons";
import { canManageTeam } from "../auth/permissions";
import { useActiveProjects, useProjectColors } from "../workspace/hooks";
import { visibleTasks } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import AssignmentsModal from "./AssignmentsModal";
import TeamMemberRow from "./TeamMemberRow";
import UserFormModal from "./UserFormModal";
import { workloadOf } from "./teamStats";
import "./team.css";

function TeamPage() {
    const text = useAppText();
    const t = text.team;
    const me = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const projects = useActiveProjects();
    const colors = useProjectColors();
    const { confirm } = useFeedback();
    const run = useRunAction();
    const [params] = useSearchParams();
    const [query, setQuery] = useState(() => params.get("q") ?? "");
    const [department, setDepartment] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [editing, setEditing] = useState<User | "new" | null>(null);
    const [assigning, setAssigning] = useState<User | null>(null);
    const admin = canManageTeam(me);

    const tasks = useMemo(() => visibleTasks(data), [data]);
    const projectsOf = (userId: string) => projects.filter((p) => data.members.some((m) => m.projectId === p.id && m.userId === userId));
    const activeUsers = data.users.filter((u) => u.active);
    const departments = [...new Set(activeUsers.map((u) => u.department).filter((d): d is string => Boolean(d)))].sort();

    const members = data.users
        .filter((u) => (showInactive && admin) || u.active)
        .filter((u) => !department || u.department === department)
        .filter((u) => {
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return `${u.name} ${u.title} ${u.department ?? ""} ${projectsOf(u.id).map((p) => p.name).join(" ")}`.toLowerCase().includes(q);
        })
        .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "da"));

    async function toggleActive(user: User) {
        if (user.active) {
            const yes = await confirm({ title: t.deactivateTitle, message: t.deactivateMessage(user.name), confirmLabel: t.deactivate, danger: true });
            if (!yes) return;
        }
        await run(() => actions.setUserActive(user.id, !user.active), t.updated_toast);
    }

    // Administration actions are only offered to administrators (and enforced again in the repository)
    function actionsFor(user: User): MenuAction[] {
        if (!admin) return [];
        const list: MenuAction[] = [{ label: text.common.edit, Icon: EditIcon, onSelect: () => setEditing(user) }];
        if (user.active) list.push({ label: t.manageAssignments, Icon: FolderIcon, onSelect: () => setAssigning(user) });
        if (user.id !== me.id) {
            list.push(user.active
                ? { label: t.deactivate, Icon: LockIcon, onSelect: () => void toggleActive(user), danger: true }
                : { label: t.activate, Icon: RefreshIcon, onSelect: () => void toggleActive(user) });
        }
        return list;
    }

    const distribution = projects
        .filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED")
        .map((p) => ({ project: p, users: activeUsers.filter((u) => data.members.some((m) => m.projectId === p.id && m.userId === u.id)) }))
        .sort((a, b) => b.users.length - a.users.length);
    const maxMembers = Math.max(1, ...distribution.map((d) => d.users.length));

    return (
        <div className="page">
            <PageHeader
                title={t.title}
                lead={t.lead}
                aside={admin && (
                    <button type="button" className="app-btn app-btn--primary app-btn--lg" onClick={() => setEditing("new")}>
                        <PlusIcon aria-hidden="true" /> {t.create}
                    </button>
                )}
            />

            <StatGrid label={text.dashboard.statsLabel}>
                <StatCard label={t.statMembers} value={activeUsers.length} Icon={UsersIcon} />
                <StatCard label={t.statActiveInProjects} value={activeUsers.filter((u) => projectsOf(u.id).length > 0).length} Icon={BriefcaseIcon} tone="danger" />
                <StatCard label={t.statOpenTasks} value={tasks.filter((x) => x.status !== "DONE").length} Icon={CheckSquareIcon} hint={t.statOpenTasksHint} />
                <StatCard label={t.statDepartments} value={departments.length} Icon={FolderIcon} tone="pink" hint={departments.join(", ")} />
            </StatGrid>

            <div className="page-columns">
                <Panel
                    title={t.membersTitle}
                    action={
                        <div className="toolbar">
                            <div className="search-field">
                                <SearchIcon aria-hidden="true" />
                                <input type="search" className="control" placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
                            </div>
                            <select className="control" aria-label={t.department} value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <option value="">{t.allDepartments}</option>
                                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {admin && (
                                <label className="labelled-control">
                                    <input type="checkbox" className="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                                    {t.showInactive}
                                </label>
                            )}
                        </div>
                    }
                >
                    {members.length === 0 ? (
                        <EmptyState Icon={UsersIcon} title={t.noMembersFound} compact />
                    ) : (
                        <ul className="list">
                            {members.map((member) => (
                                <TeamMemberRow
                                    key={member.id}
                                    member={member}
                                    projects={projectsOf(member.id)}
                                    workload={workloadOf(member.id, tasks)}
                                    actions={actionsFor(member)}
                                />
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title={t.distribution} subtitle={t.distributionHint}>
                    <ul className="distribution">
                        {distribution.map(({ project, users }) => (
                            <li key={project.id}>
                                <div className="distribution-head">
                                    <span className="truncate">{project.name}</span>
                                    <span className="small text-secondary">{t.membersCount(users.length)}</span>
                                </div>
                                <div className="distribution-bar">
                                    <span className="distribution-track" aria-hidden="true">
                                        <span style={{ width: `${(users.length / maxMembers) * 100}%`, background: colors.get(project.id) }} />
                                    </span>
                                    <AvatarStack users={users} max={3} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            </div>

            {editing && <UserFormModal user={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
            {assigning && <AssignmentsModal user={assigning} onClose={() => setAssigning(null)} />}
        </div>
    );
}

export default TeamPage;
