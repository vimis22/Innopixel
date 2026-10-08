import { useState } from "react";
import type { User } from "../../../types/domain";
import { useAppText } from "../../../i18n/app/useAppText";
import { Avatar } from "../../../components/ui/Avatar";
import { Pill } from "../../../components/ui/Badges";
import { EmptyState } from "../../../components/ui/States";
import { useFeedback, useRunAction } from "../../../components/ui/Feedback";
import { PlusIcon, UsersIcon } from "../../../components/icons/AppIcons";
import { canManageProject } from "../../auth/permissions";
import type { ProjectSummary } from "../../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../../workspace/WorkspaceContext";

function ProjectTeamTab({ summary }: { summary: ProjectSummary }) {
    const text = useAppText();
    const t = text.projects;
    const user = useCurrentUser();
    const { data, actions } = useWorkspaceData();
    const { confirm } = useFeedback();
    const run = useRunAction();
    const [adding, setAdding] = useState("");

    const { project } = summary;
    const canManage = canManageProject(user, project);
    const members = data.users.filter((u) => summary.memberIds.includes(u.id));
    const candidates = data.users.filter((u) => u.active && !summary.memberIds.includes(u.id));
    const openTasksOf = (member: User) => summary.tasks.filter((x) => x.assigneeId === member.id && x.status !== "DONE").length;

    async function add() {
        if (adding && (await run(() => actions.addProjectMember(project.id, adding), t.memberAdded))) setAdding("");
    }

    async function remove(member: User) {
        const yes = await confirm({ title: t.removeMemberTitle, message: t.removeMemberMessage(member.name, openTasksOf(member)), confirmLabel: t.removeMember, danger: true });
        if (yes) await run(() => actions.removeProjectMember(project.id, member.id), t.memberRemoved);
    }

    return (
        <div className="stack">
            {canManage && (
                <div className="tab-toolbar">
                    {candidates.length === 0 ? (
                        <p className="small muted">{t.allMembersAdded}</p>
                    ) : (
                        <>
                            <select className="control team-add-select" aria-label={t.addMember} value={adding} onChange={(e) => setAdding(e.target.value)}>
                                <option value="">{t.addMember}…</option>
                                {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} – {u.title}</option>)}
                            </select>
                            <button type="button" className="app-btn app-btn--primary app-btn--sm" onClick={() => void add()} disabled={!adding}>
                                <PlusIcon aria-hidden="true" /> {t.addMember}
                            </button>
                        </>
                    )}
                </div>
            )}

            {members.length === 0 ? (
                <EmptyState Icon={UsersIcon} title={t.noMembers} compact />
            ) : (
                <ul className="member-grid">
                    {members.map((member) => {
                        const isManager = member.id === project.managerId;
                        return (
                            <li key={member.id} className="member-card">
                                <Avatar user={member} size="md" />
                                <div className="member-card-body">
                                    <strong>{member.name}</strong>
                                    <span className="small muted">{member.title}</span>
                                    <span className="member-card-tags">
                                        {isManager && <Pill tone="accent">{t.isManager}</Pill>}
                                        <Pill>{t.openTasks}: {openTasksOf(member)}</Pill>
                                    </span>
                                </div>
                                {canManage && !isManager && (
                                    <button type="button" className="app-btn app-btn--danger-ghost app-btn--sm" onClick={() => void remove(member)}>
                                        {t.removeMember}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default ProjectTeamTab;
