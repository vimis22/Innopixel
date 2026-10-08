import { Link } from "react-router-dom";
import type { ISODate } from "../../types/domain";
import { formatMonthShort } from "../../utils/date";
import { DuePill } from "../../components/ui/Badges";
import { daysUntil } from "../workspace/selectors";

export interface DeadlineItem {
    key: string;
    date: ISODate;
    title: string;
    subtitle: string;
    to: string;
}

// Upcoming tasks and milestones as a date-ordered list with a calendar block
function DeadlineList({ items }: { items: DeadlineItem[] }) {
    return (
        <ul className="list">
            {items.map((item) => (
                <li key={item.key} className="list-row deadline-row">
                    <span className={`date-block ${daysUntil(item.date) <= 0 ? "is-urgent" : ""}`} aria-hidden="true">
                        <span className="date-block-day">{Number(item.date.slice(8))}</span>
                        <span className="date-block-month">{formatMonthShort(item.date)}</span>
                    </span>
                    <div className="cell-text deadline-row-body">
                        <Link to={item.to} className="cell-title truncate">{item.title}</Link>
                        <span className="cell-sub truncate">{item.subtitle}</span>
                    </div>
                    <DuePill days={daysUntil(item.date)} />
                </li>
            ))}
        </ul>
    );
}

export default DeadlineList;
