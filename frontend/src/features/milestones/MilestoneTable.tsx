import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { formatDate } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import ProgressBar from "../../components/ui/ProgressBar";
import ActionMenu from "../../components/ui/ActionMenu";
import { AvatarStack } from "../../components/ui/Avatar";
import { MilestoneBadge } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { CheckIcon, FlagIcon } from "../../components/icons/AppIcons";
import { useProjectColors } from "../workspace/hooks";
import { useMilestoneActions } from "./useMilestoneActions";
import type { MilestoneRow } from "./useMilestoneRows";

interface MilestoneTableProps {
    rows: MilestoneRow[];
    showProject?: boolean;
    onOpen: (row: MilestoneRow) => void;     // opens the milestone drawer
    onEdit: (row: MilestoneRow) => void;
}

// Open milestones show their deadline, completed ones the day they were completed
function MilestoneTable({ rows, showProject = true, onOpen, onEdit }: MilestoneTableProps) {
    const text = useAppText();
    const t = text.milestones;
    const colors = useProjectColors();
    const actionsFor = useMilestoneActions(onEdit);

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">{t.colMilestone}</th>
                        <th scope="col">{t.colDue}</th>
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
                            <tr key={milestone.id} className="is-clickable" onClick={() => onOpen(row)}>
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
                                            <button
                                                type="button"
                                                className="cell-title milestone-title"
                                                onClick={(e) => { e.stopPropagation(); onOpen(row); }}
                                            >
                                                {milestone.title}
                                            </button>
                                            {showProject ? (
                                                <Link to={`${APP_ROUTES.project(project.id)}?tab=milestones`} className="cell-sub truncate milestone-project" onClick={(e) => e.stopPropagation()}>
                                                    {project.name}
                                                </Link>
                                            ) : <span className="cell-sub truncate milestone-desc">{milestone.description}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="nowrap">
                                    {info.state === "COMPLETED" ? (
                                        <span className="due-label">
                                            <span>{formatDate(row.completedOn)}</span>
                                            <span className="due-label-relative">{t.colCompleted}</span>
                                        </span>
                                    ) : <DueLabel date={milestone.dueDate} withRelative />}
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
                                <td className="col-actions" onClick={(e) => e.stopPropagation()}>
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
