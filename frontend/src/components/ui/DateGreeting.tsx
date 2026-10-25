import { useEffect, useState } from "react";
import { formatLongDate, todayISO } from "../../utils/date";

const clockFormat = new Intl.DateTimeFormat("da-DK", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// The device's current time, refreshed every few seconds so the minute changes on time
function useClock(enabled: boolean): Date {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        if (!enabled) return;
        const timer = setInterval(() => setNow(new Date()), 5000);
        return () => clearInterval(timer);
    }, [enabled]);
    return now;
}

// "14:35 · Torsdag d. 24. april 2025 · God arbejdslyst!" shown in page headers without primary actions
function DateGreeting({ greeting, withClock = false }: { greeting: string; withClock?: boolean }) {
    const now = useClock(withClock);
    return (
        <p className="date-greeting">
            {withClock && <time className="date-greeting-clock" dateTime={now.toISOString()}>{clockFormat.format(now).replace(".", ":")}</time>}
            <span>{formatLongDate(todayISO())}</span>
            <span>{greeting}</span>
        </p>
    );
}

export default DateGreeting;
