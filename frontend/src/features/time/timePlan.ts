import type { ISODate } from "../../types/domain";
import type { TimeRegistration } from "../../types/time";
import { addDays } from "../../utils/date";
import { weekdayIndex } from "./timeFormat";

/*
 * Planned working time, calculated exactly as the backend does (TimeCalculations.cs): the weekly hours
 * spread evenly over Monday–Friday. There are no individual shifts in the system yet, so this standard
 * plan is the "planned" side of every comparison; registrations are the actual side.
 */

export function isWorkday(date: ISODate): boolean {
    return weekdayIndex(date) < 5;
}

export function plannedMinutes(date: ISODate, weeklyHours: number): number {
    return isWorkday(date) ? Math.round((weeklyHours * 60) / 5) : 0;
}

export function daysBetween(from: ISODate, to: ISODate): ISODate[] {
    const days: ISODate[] = [];
    for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
    return days;
}

export function plannedMinutesIn(from: ISODate, to: ISODate, weeklyHours: number): number {
    return daysBetween(from, to).reduce((sum, day) => sum + plannedMinutes(day, weeklyHours), 0);
}

// Workdays from `from` to `to` (inclusive) without any registration: "manglende stemplinger"
export function missingWorkdays(from: ISODate, to: ISODate, registrations: Pick<TimeRegistration, "date">[]): ISODate[] {
    if (to < from) return [];
    const registered = new Set(registrations.map((r) => r.date));
    return daysBetween(from, to).filter((day) => isWorkday(day) && !registered.has(day));
}

// Worked minutes of finished registrations per project name ("Uden projekt" when none)
export function minutesByProject(registrations: TimeRegistration[], noProject: string): { name: string; minutes: number }[] {
    const totals = new Map<string, number>();
    for (const r of registrations) {
        const name = r.projectName ?? noProject;
        totals.set(name, (totals.get(name) ?? 0) + r.workedMinutes);
    }
    return [...totals].map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes);
}
