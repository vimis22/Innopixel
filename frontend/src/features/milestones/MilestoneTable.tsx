import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Milestone } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { formatDate } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import ProjectThumb from "../../components/ui/ProjectThumb";
import ProgressBar from "../../components/ui/ProgressBar";
import ActionMenu, { type MenuAction } from "../../components/ui/ActionMenu";
import { AvatarStack } from "../../components/ui/Avatar";
import { MilestoneBadge } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { CheckIcon, EditIcon, FlagIcon, RefreshIcon, TrashIcon } from "../../components/icons/AppIcons";
import { canManageProject } from "../auth/permissions";
import { useProjectColors } from "../workspace/hooks";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import type { MilestoneRow } from "./useMilestoneRows";

interface MilestoneTableProps {
    rows: MilestoneRow[];
    variant?: "open" | "completed";
    showProject?: boolean;
    onEdit: (milestone: Milestone) => void;
}

function MilestoneTable({ rows, variant = "open", showProject = true, onEdit }: MilestoneTableProps) {
    const text = useAppText();
    const t = text.milestones;
    const user = useCurrentUser();
    const { actions } = useWorkspaceData();
    const colors = useProjectColors();
    const { confirm } = useFeedback();
    const run = useRunAction();

    function actionsFor({ milestone, info, project }: MilestoneRow): MenuAction[] {
        if (!canManageProject(user, project)) return [];
        const list: MenuAction[] = [{ label: text.common.edit, Icon: EditIcon, onSelect: () => onEdit(milestone) }];
        // Milestones with related tasks complete themselves; only manual ones can be toggled
        if (!info.automatic) {
            const completing = info.state !== "COMPLETED";
            list.push({
                label: completing ? t.markComplete : t.markIncomplete,
                Icon: completing ? CheckIcon : RefreshIcon,
                onSelect: () => void run(() => actions.setMilestoneCompleted(milestone.id, completing), completing ? t.completed_toast : t.reopened_toast),
            });
        }
        list.push({
            label: text.common.delete,
            Icon: TrashIcon,
            danger: true,
            onSelect: async () => {
                const yes = await confirm({ title: t.deleteTitle, message: t.deleteMessage(milestone.title), confirmLabel: text.common.delete, danger: true });
                if (yes) await run(() => actions.deleteMilestone(milestone.id), t.deleted_toast);
            },
        });
        return list;
    }

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">{t.colMilestone}</th>
                        {showProject && <th scope="col">{text.common.project}</th>}
                        <th scope="col">{variant === "completed" ? t.colCompleted : t.colDue}</th>
                        <th scope="col">{t.colResponsible}</th>
                        <th scope="col">{text.common.status}</th>
                        <th scope="col">{text.common.progress}</th>
                        <th scope="col" className="col-actions"><span className="sr-only">{text.common.details}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const { milestone, info, project, responsible, percent } = row;
                        return (
                            <tr key={milestone.id}>
                                <td>
                                    <div className="cell-main">
                                        <span
                                            className={`milestone-icon milestone-icon--${info.state.toLowerCase()}`}
                                            style={{ "--milestone-color": colors.get(project.id) } as CSSProperties}
                                            aria-hidden="true"
                                        >
                                            {info.state === "COMPLETED" ? <CheckIcon /> : <FlagIcon />}
                                        </span>
                                        <div className="cell-text">
                                            <span className="cell-title">{milestone.title}</span>
                                            <span className="cell-sub truncate milestone-desc">{milestone.description}</span>
                                        </div>
                                    </div>
                                </td>
                                {showProject && (
                                    <td>
                                        <Link to={`${APP_ROUTES.project(project.id)}?tab=milestones`} className="cell-main milestone-project">
                                            <ProjectThumb project={project} size="sm" />
                                            <span className="truncate">{project.name}</span>
                                        </Link>
                                    </td>
                                )}
                                <td className="nowrap">
                                    {variant === "completed"
                                        ? formatDate(row.completedOn)
                                        : <DueLabel date={milestone.dueDate} withRelative />}
                                </td>
                                <td><AvatarStack users={responsible} max={3} /></td>
                                <td><MilestoneBadge state={info.state} /></td>
                                <td>
                                    {percent === null ? (
                                        <span className="muted small">{t.manual}</span>
                                    ) : (
                                        <div className="milestone-progress">
                                            <ProgressBar value={percent} label={`${text.common.progress}: ${milestone.title}`} size="sm" showValue={false} tone={info.state === "COMPLETED" ? "success" : info.state === "OVERDUE" ? "danger" : "brand"} />
                                            <span className="small text-secondary">{info.done}/{info.related.length}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="col-actions">
                                    <ActionMenu label={text.common.actionsFor(milestone.title)} actions={actionsFor(row)} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default MilestoneTable;
