import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { formatDate } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import Drawer from "../../components/ui/Drawer";
import ProgressBar from "../../components/ui/ProgressBar";
import { AvatarStack } from "../../components/ui/Avatar";
import { MilestoneBadge, TaskStatusBadge } from "../../components/ui/Badges";
import DueLabel from "../../components/ui/DueLabel";
import { FolderIcon, InfoIcon } from "../../components/icons/AppIcons";
import { useTaskDialog } from "../tasks/TaskDialog";
import type { MilestoneRow } from "./useMilestoneRows";
import type { MenuAction } from "../../components/ui/ActionMenu";

interface MilestoneDrawerProps {
    row: MilestoneRow;
    actions: MenuAction[];       // the permitted actions (from useMilestoneActions)
    onClose: () => void;
}

/*
 * A milestone is a target date with a deliverable; the related tasks are the work towards it.
 * Phases (task groups) are shown on the tasks, not merged into the milestone.
 */
function MilestoneDrawer({ row, actions, onClose }: MilestoneDrawerProps) {
    const text = useAppText();
    const t = text.milestones;
    const { showTask } = useTaskDialog();
    const { milestone, info, project, responsible, percent } = row;

    return (
        <Drawer
            open
            title={milestone.title}
            onClose={onClose}
            closeLabel={text.common.close}
            subtitle={
                <>
                    <Link to={`${APP_ROUTES.project(project.id)}?tab=milestones`} className="drawer-link" onClick={onClose}>
                        <FolderIcon aria-hidden="true" />{project.name}
                    </Link>
                    <MilestoneBadge state={info.state} />
                </>
            }
            footer={actions.length > 0 && actions.map(({ label, Icon, onSelect, danger }) => (
                <button
                    key={label}
                    type="button"
                    className={`app-btn ${danger ? "app-btn--danger-ghost app-btn--left" : "app-btn--ghost"}`}
                    onClick={onSelect}
                >
                    {Icon && <Icon aria-hidden="true" />} {label}
                </button>
            ))}
        >
            <dl className="detail-facts">
                <div><dt>{t.colDue}</dt><dd><DueLabel date={milestone.dueDate} done={info.state === "COMPLETED"} withRelative /></dd></div>
                {info.state === "COMPLETED" && <div><dt>{t.colCompleted}</dt><dd>{formatDate(row.completedOn)}</dd></div>}
                <div><dt>{t.colResponsible}</dt><dd><AvatarStack users={responsible} max={5} /><span className="small">{responsible.map((u) => u.name).join(", ")}</span></dd></div>
                <div className="detail-facts-wide">
                    <dt>{text.common.progress}</dt>
                    <dd>
                        {percent === null
                            ? <span className="small text-secondary">{t.noRelatedTasks}</span>
                            : <ProgressBar value={percent} label={text.common.progress} tone={info.state === "OVERDUE" ? "danger" : info.state === "COMPLETED" ? "success" : "brand"} />}
                    </dd>
                </div>
            </dl>

            <section className="detail-section">
                <h3 className="detail-section-title">{text.common.description}</h3>
                <p className="prose small">{milestone.description || text.common.noDescription}</p>
            </section>

            <section className="detail-section">
                <h3 className="detail-section-title">{t.relatedTasks}</h3>
                {info.related.length === 0 ? (
                    <p className="small muted">{t.noRelatedTasks}</p>
                ) : (
                    <>
                        <p className="notice"><InfoIcon aria-hidden="true" />{t.relatedTasksHint}</p>
                        <ul className="list">
                            {info.related.map((task) => (
                                <li key={task.id} className="list-row milestone-task">
                                    <button type="button" className="cell-title truncate milestone-task-title" onClick={() => showTask(task.id)}>{task.title}</button>
                                    <span className="small text-secondary nowrap">{task.group}</span>
                                    <TaskStatusBadge status={task.status} />
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>
        </Drawer>
    );
}

export default MilestoneDrawer;
