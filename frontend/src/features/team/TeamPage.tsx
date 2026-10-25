import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CreatedUser, Role } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import StatCard, { StatGrid } from "../../components/ui/StatCard";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import { Avatar } from "../../components/ui/Avatar";
import { Pill } from "../../components/ui/Badges";
import { EmptyState } from "../../components/ui/States";
import { useFeedback } from "../../components/ui/Feedback";
import { BriefcaseIcon, EditIcon, EyeIcon, FolderIcon, PlusIcon, SearchIcon, UsersIcon } from "../../components/icons/AppIcons";
import { MailIcon } from "../../components/icons/Icons";
import { canManageTeam } from "../auth/permissions";
import { useActiveProjects } from "../workspace/hooks";
import { visibleTasks } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import EmployeeDrawer, { type EmployeeTab } from "./EmployeeDrawer";
import TemporaryPasswordModal from "./TemporaryPasswordModal";
import { workloadOf } from "./teamStats";
import "./team.css";
import "../time/time.css";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

function TeamPage() {
    const text = useAppText();
    const t = text.team;
    const me = useCurrentUser();
    const { data } = useWorkspaceData();
    const projects = useActiveProjects();
    const [params] = useSearchParams();
    const admin = canManageTeam(me);
    const [query, setQuery] = useState(() => params.get("q") ?? "");
    const [department, setDepartment] = useState("");
    const [role, setRole] = useState<Role | "">("");
    const [status, setStatus] = useState<StatusFilter>(admin ? "ALL" : "ACTIVE");
    const [open, setOpen] = useState<{ userId: string | null; tab: EmployeeTab } | null>(null);
    const [created, setCreated] = useState<{ name: string; password: string } | null>(null);
    const { toast } = useFeedback();

    const tasks = useMemo(() => visibleTasks(data), [data]);
    const projectsOf = (userId: string) => projects.filter((p) => p.managerId === userId || data.members.some((m) => m.projectId === p.id && m.userId === userId));
    // Employees only see active colleagues; administrators also manage deactivated accounts
    const people = admin ? data.users : data.users.filter((u) => u.active);
    const activeCount = people.filter((u) => u.active).length;
    const departments = [...new Set(people.map((u) => u.department).filter((d): d is string => Boolean(d)))].sort();

    const q = query.trim().toLowerCase();
    const members = people
        .filter((u) => status === "ALL" || u.active === (status === "ACTIVE"))
        .filter((u) => !department || u.department === department)
        .filter((u) => !role || u.role === role)
        .filter((u) => !q || `${u.name} ${u.email} ${u.title} ${u.department ?? ""}`.toLowerCase().includes(q))
        .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "da"));

    const openUser = open?.userId ? data.users.find((u) => u.id === open.userId) : undefined;

    function handleCreated(result: CreatedUser) {
        setOpen(null);
        if (result.temporaryPassword) setCreated({ name: result.user.name, password: result.temporaryPassword });
        else if (result.invitationSent) toast("success", t.access.invitationSent(result.user.email));
    }

    return (
        <div className="page">
            <PageHeader
                title={t.title}
                lead={admin ? t.leadAdmin : t.lead}
                aside={admin && (
                    <button type="button" className="app-btn app-btn--primary" onClick={() => setOpen({ userId: null, tab: "general" })}>
                        <PlusIcon aria-hidden="true" /> {t.create}
                    </button>
                )}
            />

            <StatGrid label={text.dashboard.statsLabel} columns={3}>
                <StatCard label={t.statEmployees} value={people.length} Icon={UsersIcon} hint={admin ? t.statEmployeesHint(activeCount, people.length - activeCount) : undefined} />
                <StatCard label={t.statDepartments} value={departments.length} Icon={FolderIcon} tone="pink" hint={departments.join(" · ") || undefined} />
                <StatCard label={t.statActiveInProjects} value={people.filter((u) => u.active && projectsOf(u.id).length > 0).length} Icon={BriefcaseIcon} tone="danger" hint={t.statActiveInProjectsHint} />
            </StatGrid>

            <div className="toolbar">
                {admin && (
                    <PillTabs
                        label={t.status}
                        value={status}
                        onChange={setStatus}
                        options={[
                            { value: "ALL", label: text.common.all, count: people.length },
                            { value: "ACTIVE", label: t.filterActive, count: activeCount },
                            { value: "INACTIVE", label: t.filterInactive, count: people.length - activeCount },
                        ]}
                    />
                )}
                <div className="search-field">
                    <SearchIcon aria-hidden="true" />
                    <input type="search" className="control" placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <select className="control" aria-label={t.department} value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">{t.allDepartments}</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="control" aria-label={t.role} value={role} onChange={(e) => setRole(e.target.value as Role | "")}>
                    <option value="">{t.allRoles}</option>
                    <option value="ADMIN">{text.roles.ADMIN}</option>
                    <option value="EMPLOYEE">{text.roles.EMPLOYEE}</option>
                </select>
            </div>

            <Panel flush>
                {members.length === 0 ? (
                    <EmptyState Icon={UsersIcon} title={t.noMembersFound} compact />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="table team-table">
                                <thead>
                                    <tr>
                                        <th scope="col">{t.name}</th>
                                        <th scope="col">{t.jobTitle}</th>
                                        <th scope="col">{t.department}</th>
                                        <th scope="col">{t.role}</th>
                                        <th scope="col">{t.status}</th>
                                        <th scope="col" className="num">{t.projects}</th>
                                        <th scope="col" className="num">{t.openTasks}</th>
                                        <th scope="col" className="col-actions">{t.colActions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => {
                                        const workload = workloadOf(member.id, tasks);
                                        return (
                                            <tr key={member.id} className={`is-clickable ${member.active ? "" : "is-inactive"}`} onClick={() => setOpen({ userId: member.id, tab: "general" })}>
                                                <td>
                                                    <span className="cell-main">
                                                        <Avatar user={member} size="sm" showTitle={false} />
                                                        <span className="cell-text">
                                                            <span className="cell-title">{member.name}{member.id === me.id && <span className="muted"> ({t.you})</span>}</span>
                                                            <span className="cell-sub truncate">{member.email}</span>
                                                        </span>
                                                    </span>
                                                </td>
                                                <td>{member.title}</td>
                                                <td>{member.department ?? <span className="muted">–</span>}</td>
                                                <td><Pill tone={member.role === "ADMIN" ? "accent" : "neutral"}>{text.roles[member.role]}</Pill></td>
                                                <td>
                                                    <span className="status-dot-label">
                                                        <span className={`dot ${member.active ? "dot--success" : "dot--muted"}`} aria-hidden="true" />
                                                        {member.active ? t.active : t.inactive}
                                                    </span>
                                                </td>
                                                <td className="num">{projectsOf(member.id).length}</td>
                                                <td className="num" title={t.remainingHint}>{workload.openTasks}</td>
                                                <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                                                    <span className="row-actions">
                                                        <button
                                                            type="button"
                                                            className="icon-btn icon-btn--sm"
                                                            onClick={() => setOpen({ userId: member.id, tab: "general" })}
                                                            aria-label={admin ? t.editName(member.name) : t.viewName(member.name)}
                                                            title={admin ? t.edit : text.common.details}
                                                        >
                                                            {admin ? <EditIcon /> : <EyeIcon />}
                                                        </button>
                                                        <a href={`mailto:${member.email}`} className="icon-btn icon-btn--sm" aria-label={t.sendMail(member.name)} title={member.email}>
                                                            <MailIcon />
                                                        </a>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="table-footer">{text.common.showing(members.length, people.length, t.noun)}</p>
                    </>
                )}
            </Panel>

            {open && (open.userId === null || openUser) && (
                <EmployeeDrawer
                    key={open.userId ?? "new"}
                    user={openUser}
                    admin={admin}
                    initialTab={open.tab}
                    onClose={() => setOpen(null)}
                    onCreated={handleCreated}
                />
            )}
            {created && <TemporaryPasswordModal name={created.name} password={created.password} onClose={() => setCreated(null)} />}
        </div>
    );
}

export default TeamPage;
