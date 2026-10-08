import type { ISODate } from "../../types/domain";
import { diffDays, formatDate, todayISO } from "../../utils/date";
import { useAppText } from "../../i18n/app/useAppText";

interface DueLabelProps {
    date: ISODate;
    done?: boolean;              // finished work is never shown as overdue
    withRelative?: boolean;      // add "om 6 dage" below the date
}

// Deadline text: "I dag" / "I morgen" / "25. apr.", red when overdue
function DueLabel({ date, done = false, withRelative = false }: DueLabelProps) {
    const text = useAppText();
    const days = diffDays(todayISO(), date);
    const overdue = !done && days < 0;

    let label = formatDate(date, false);
    if (!withRelative && days === 0) label = text.dates.today;
    if (!withRelative && days === 1) label = text.dates.tomorrow;

    return (
        <span className="due-label" title={formatDate(date)}>
            <span className={overdue || (!done && days === 0 && !withRelative) ? "text-danger" : ""}>{withRelative ? formatDate(date) : label}</span>
            {withRelative && !done && (
                <span className={`due-label-relative ${overdue ? "text-danger" : ""}`}>
                    {days === 0 ? text.dates.today : days > 0 ? text.dates.inDays(days).toLowerCase() : text.dates.daysAgo(-days)}
                </span>
            )}
        </span>
    );
}

export default DueLabel;
