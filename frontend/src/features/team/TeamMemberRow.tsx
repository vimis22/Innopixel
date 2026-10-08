import type { Project, User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { Avatar } from "../../components/ui/Avatar";
import { Pill } from "../../components/ui/Badges";
import ActionMenu, { type MenuAction } from "../../components/ui/ActionMenu";
import { MailIcon } from "../../components/icons/Icons";
import type { Workload } from "./teamStats";

interface TeamMemberRowProps {
    member: User;
    projects: Project[];         // the member's active projects
    workload: Workload;
    actions: MenuAction[];       // empty for employees
}

function TeamMemberRow({ member, projects, workload, actions }: TeamMemberRowProps) {
    const text = useAppText();
    const t = text.team;

    return (
        <li className={`list-row team-row ${member.active ? "" : "is-inactive"}`}>
            <Avatar user={member} size="lg" />
            <div className="team-row-main">
                <div className="team-row-name">
                    <strong>{member.name}</strong>
                    <span className="text-secondary">{member.title}</span>
                    {member.role === "ADMIN" && <Pill tone="accent">{text.roles.ADMIN}</Pill>}
                    {!member.active && <Pill>{t.inactive}</Pill>}
                </div>
                <ul className="tag-list">
                    {projects.map((p) => <li key={p.id} className={`tag ${p.managerId === member.id ? "tag--accent" : ""}`} title={p.managerId === member.id ? text.projects.isManager : undefined}>{p.name}</li>)}
                </ul>
            </div>
            <div className="team-row-load" title={t.remainingHint}>
                <strong>{t.openTasksCount(workload.openTasks)}</strong>
                <span className="small text-secondary">{t.remainingHours(workload.remainingHours)}</span>
            </div>
            <a href={`mailto:${member.email}`} className="icon-btn icon-btn--bordered" aria-label={t.sendMail(member.name)} title={member.email}>
                <MailIcon />
            </a>
            <ActionMenu label={text.common.actionsFor(member.name)} actions={actions} />
        </li>
    );
}

export default TeamMemberRow;
