import { useMemo, useState } from "react";
import type { ISODate } from "../../types/domain";
import { addDays, formatMonth, isWeekend, startOfMonth, startOfWeek, todayISO } from "../../utils/date";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/AppIcons";

export interface CalendarMarker {
    date: ISODate;
    color: string;
}

interface MiniCalendarProps {
    markers: CalendarMarker[];
    selected: ISODate | null;
    onSelect: (date: ISODate | null) => void;
    labels: { previous: string; next: string; weekdays: string[]; markersOn: (date: ISODate, count: number) => string };
}

// Month grid (Monday first) with dots on days that have events. Clicking a day selects it; clicking again clears.
function MiniCalendar({ markers, selected, onSelect, labels }: MiniCalendarProps) {
    const [month, setMonth] = useState(() => startOfMonth(todayISO()));
    const today = todayISO();

    const days = useMemo(() => {
        const first = startOfWeek(month);
        const nextMonth = startOfMonth(addDays(month, 32));
        const result: ISODate[] = [];
        for (let day = first; day < nextMonth || result.length % 7 !== 0; day = addDays(day, 1)) result.push(day);
        return result;
    }, [month]);

    const byDate = useMemo(() => {
        const map = new Map<ISODate, string[]>();
        for (const marker of markers) map.set(marker.date, [...(map.get(marker.date) ?? []), marker.color]);
        return map;
    }, [markers]);

    function shift(months: number) {
        setMonth(startOfMonth(addDays(month, months > 0 ? 32 : -1)));
    }

    return (
        <div className="calendar">
            <div className="calendar-head">
                <h2 className="calendar-title" aria-live="polite">{formatMonth(month)}</h2>
                <div>
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => shift(-1)} aria-label={labels.previous}><ChevronLeftIcon /></button>
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => shift(1)} aria-label={labels.next}><ChevronRightIcon /></button>
                </div>
            </div>
            <div className="calendar-grid" role="grid">
                {labels.weekdays.map((weekday) => <span key={weekday} className="calendar-weekday" role="columnheader">{weekday}</span>)}
                {days.map((day) => {
                    const dots = byDate.get(day) ?? [];
                    const classes = [
                        "calendar-day",
                        day.slice(0, 7) !== month.slice(0, 7) ? "is-outside" : "",
                        isWeekend(day) ? "is-weekend" : "",
                        day === today ? "is-today" : "",
                        day === selected ? "is-selected" : "",
                    ].join(" ");
                    return (
                        <button
                            key={day}
                            type="button"
                            role="gridcell"
                            className={classes}
                            aria-pressed={day === selected}
                            aria-label={dots.length ? labels.markersOn(day, dots.length) : day}
                            onClick={() => onSelect(day === selected ? null : day)}
                        >
                            {Number(day.slice(8))}
                            {dots.length > 0 && (
                                <span className="calendar-day-dots" aria-hidden="true">
                                    {dots.slice(0, 3).map((color, i) => <span key={i} className="dot" style={{ background: color }} />)}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default MiniCalendar;
