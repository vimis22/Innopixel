import { Link } from "react-router-dom";
import type { ActivityLog } from "../../types/domain";
import { APP_ROUTES } from "../../config/routes";
import { formatDateTime, formatTimeAgo } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";
import { Avatar } from "../../components/ui/Avatar";
import { userById } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";
import "./activity.css";

interface ActivityFeedProps {
    entries: ActivityLog[];
    showProject?: boolean;
    emptyText?: string;
}

function ActivityFeed({ entries, showProject = true, emptyText }: ActivityFeedProps) {
    const text = useAppText();
    const { data } = useWorkspaceData();

    if (entries.length === 0) return <p className="muted small">{emptyText ?? text.dashboard.noActivity}</p>;

    return (
        <ol className="activity-feed">
            {entries.map((entry) => {
                const actor = userById(data, entry.actorId);
                const project = showProject ? data.projects.find((p) => p.id === entry.projectId) : undefined;
                return (
                    <li key={entry.id} className="activity-item">
                        <Avatar user={actor} size="sm" />
                        <div className="activity-body">
                            <p><strong>{actor?.name ?? "?"}</strong> {entry.message}</p>
                            <p className="activity-meta">
                                <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)}>{formatTimeAgo(entry.createdAt)}</time>
                                {project && <>{" · "}<Link to={APP_ROUTES.project(project.id)}>{project.name}</Link></>}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export default ActivityFeed;
