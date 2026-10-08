import { formatLongDate, todayISO } from "../../utils/date";

// "Torsdag d. 24. april 2025 · God arbejdslyst!" shown in page headers without primary actions
function DateGreeting({ greeting }: { greeting: string }) {
    return (
        <p className="date-greeting">
            <span>{formatLongDate(todayISO())}</span>
            <span>{greeting}</span>
        </p>
    );
}

export default DateGreeting;
